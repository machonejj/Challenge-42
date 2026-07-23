/**
 * The shared meal photo board. Posts live in the `meal_posts` table (readable by any signed-in
 * challenger, writable only by the author) with the image in the `meal-photos` Storage bucket. No-op
 * / empty when Supabase isn't configured.
 */
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/services/supabase/client';

export type PostKind = 'photo' | 'tip';

export interface MealPost {
  id: string;
  userId: string;
  kind: PostKind;
  imageUrl: string | null;
  caption: string | null;
  authorName: string | null;
  authorAvatar: string | null;
  createdAt: string;
}

export async function listMealPosts(limit = 50): Promise<MealPost[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('meal_posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map((r) => ({
    id: r.id as string,
    userId: r.user_id as string,
    kind: ((r.kind as string) === 'tip' ? 'tip' : 'photo') as PostKind,
    imageUrl: (r.image_url as string) ?? null,
    caption: (r.caption as string) ?? null,
    authorName: (r.author_name as string) ?? null,
    authorAvatar: (r.author_avatar as string) ?? null,
    createdAt: r.created_at as string,
  }));
}

export async function createMealPost(input: {
  userId: string;
  kind: PostKind;
  imageUrl: string | null;
  caption: string | null;
  authorName: string | null;
  authorAvatar: string | null;
}): Promise<string | null> {
  if (!supabase) return 'Sharing needs the cloud backend.';
  const { error } = await supabase.from('meal_posts').insert({
    user_id: input.userId,
    kind: input.kind,
    image_url: input.imageUrl,
    caption: input.caption,
    author_name: input.authorName,
    author_avatar: input.authorAvatar,
  });
  return error ? error.message : null;
}

export async function deleteMealPost(id: string): Promise<void> {
  if (supabase) await supabase.from('meal_posts').delete().eq('id', id);
}

export function useMealBoard(): {
  posts: MealPost[];
  loading: boolean;
  reload: () => Promise<void>;
} {
  const [posts, setPosts] = useState<MealPost[]>([]);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    setLoading(true);
    setPosts(await listMealPosts());
    setLoading(false);
  }, []);
  useEffect(() => {
    void reload();
  }, [reload]);
  return { posts, loading, reload };
}
