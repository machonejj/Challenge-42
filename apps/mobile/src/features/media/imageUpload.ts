/**
 * Photo selection + upload. On the web build (what the pilot runs on), we open the browser's native
 * file picker and upload the chosen image to a public Supabase Storage bucket under the user's own
 * folder. Returns the public URL. No-ops off web / without Supabase, so callers degrade gracefully.
 */
import { Platform } from 'react-native';
import { supabase } from '@/services/supabase/client';

export function canPickImage(): boolean {
  return Platform.OS === 'web' && typeof document !== 'undefined';
}

/** Open a file dialog and resolve with the chosen image File, or null if cancelled/unavailable. */
export function pickImageFile(): Promise<File | null> {
  if (!canPickImage()) return Promise.resolve(null);
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    let settled = false;
    const done = (f: File | null): void => {
      if (settled) return;
      settled = true;
      resolve(f);
    };
    input.onchange = () => done(input.files && input.files[0] ? input.files[0] : null);
    input.oncancel = () => done(null);
    input.click();
  });
}

/** Upload an image to a public bucket under `${userId}/…`; returns the public URL (or null on error). */
export async function uploadImage(
  bucket: string,
  userId: string,
  file: File,
): Promise<string | null> {
  if (!supabase) return null;
  const ext =
    (file.name.split('.').pop() ?? 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const path = `${userId}/${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: false, contentType: file.type || 'image/jpeg' });
  if (error) return null;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl ?? null;
}
