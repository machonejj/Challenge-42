/**
 * Admin + access-control calls. All privileged actions go through admin-only SECURITY DEFINER RPCs
 * (see migration 0015), so no service-role key is ever needed on the client. No-ops / safe defaults
 * when Supabase isn't configured.
 */
import { supabase } from '@/services/supabase/client';

export interface Member {
  userId: string;
  email: string | null;
  displayName: string | null;
  state: string | null;
  disabled: boolean;
  isAdmin: boolean;
  createdAt: string;
}

export interface AllowlistEntry {
  email: string;
  note: string | null;
  createdAt: string;
}

export interface Access {
  disabled: boolean;
  isAdmin: boolean;
}

/** Whether an email may create an account. Defaults to allowed when Supabase is off (local dev). */
export async function isEmailAllowed(email: string): Promise<boolean> {
  if (!supabase) return true;
  const { data, error } = await supabase.rpc('is_email_allowed', { p_email: email });
  if (error) return true; // RPC not deployed yet → don't block signups
  return Boolean(data);
}

/** The signed-in user's access flags. Null when unknown/unconfigured. */
export async function myAccess(): Promise<Access | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('my_access');
  if (error || !data || !Array.isArray(data) || data.length === 0) return null;
  const row = data[0] as { disabled: boolean; is_admin: boolean };
  return { disabled: Boolean(row.disabled), isAdmin: Boolean(row.is_admin) };
}

export async function listMembers(): Promise<Member[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc('admin_list_members');
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map((r) => ({
    userId: r.user_id as string,
    email: (r.email as string) ?? null,
    displayName: (r.display_name as string) ?? null,
    state: (r.state as string) ?? null,
    disabled: Boolean(r.disabled),
    isAdmin: Boolean(r.is_admin),
    createdAt: r.created_at as string,
  }));
}

export async function setDisabled(userId: string, disabled: boolean): Promise<string | null> {
  if (!supabase) return null;
  const { error } = await supabase.rpc('admin_set_disabled', { target: userId, val: disabled });
  return error ? error.message : null;
}

export async function listAllowlist(): Promise<AllowlistEntry[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc('admin_list_allowlist');
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map((r) => ({
    email: r.email as string,
    note: (r.note as string) ?? null,
    createdAt: r.created_at as string,
  }));
}

export async function addAllowlist(email: string, note?: string): Promise<string | null> {
  if (!supabase) return null;
  const { error } = await supabase.rpc('admin_add_allowlist', {
    p_email: email,
    p_note: note ?? null,
  });
  return error ? error.message : null;
}

export async function removeAllowlist(email: string): Promise<string | null> {
  if (!supabase) return null;
  const { error } = await supabase.rpc('admin_remove_allowlist', { p_email: email });
  return error ? error.message : null;
}
