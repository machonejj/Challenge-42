import { useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '@challenge42/config';
import { ScreenScaffold } from '@/components/ui/ScreenScaffold';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { CommunityCounters } from '@/components/community/CommunityCounters';
import { useMealBoard, deleteMealPost, type MealPost } from '@/features/board/mealBoard';
import { useAuthStore } from '@/features/auth/authStore';

function timeAgo(iso: string, nowMs: number): string {
  const diff = Math.max(nowMs - new Date(iso).getTime(), 0);
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

function PostCard({
  post,
  width,
  mine,
  onDelete,
}: {
  post: MealPost;
  width: number;
  mine: boolean;
  onDelete: () => void;
}) {
  return (
    <Card padded={false} style={styles.post}>
      <View style={styles.postHead}>
        <Avatar name={post.authorName ?? 'Challenger'} uri={post.authorAvatar} size={36} />
        <View style={{ flex: 1 }}>
          <Text variant="labelMd" numberOfLines={1}>
            {post.authorName ?? 'Challenger'}
          </Text>
          <Text variant="labelSm" color="tertiary">
            {timeAgo(post.createdAt, Date.now())}
          </Text>
        </View>
        {mine ? (
          <Ionicons
            name="trash-outline"
            size={18}
            color={colors.text.tertiary}
            onPress={onDelete}
            suppressHighlighting
          />
        ) : null}
      </View>
      {post.kind === 'photo' && post.imageUrl ? (
        <Image
          source={{ uri: post.imageUrl }}
          style={{ width, height: width }}
          contentFit="cover"
          transition={150}
        />
      ) : null}
      {post.caption ? (
        <Text
          variant={post.kind === 'tip' ? 'bodyLg' : 'bodyMd'}
          style={post.kind === 'tip' ? styles.tipBody : styles.caption}
        >
          {post.caption}
        </Text>
      ) : null}
    </Card>
  );
}

export default function CommunityScreen(): React.JSX.Element {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { posts, loading, reload } = useMealBoard();
  const userId = useAuthStore((s) => s.session?.user.id ?? null);

  // Refresh the board whenever we return to this tab (e.g. after posting).
  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const imgWidth = Math.min(width, 460) - spacing.lg * 2 - 2; // card ~full width minus gutters

  return (
    <>
      <StatusBar style="dark" />
      <ScreenScaffold refreshing={loading} onRefresh={() => reload()}>
        <Text variant="labelSm" color="gold">
          COMMUNITY
        </Text>
        <Text variant="titleLg" style={styles.title}>
          The kitchen table
        </Text>
        <Text variant="bodyMd" color="secondary" style={styles.subtitle}>
          Meal photos, prep ideas, and the tips that keep everyone going — pulled up a chair.
        </Text>

        <View style={styles.counters}>
          <CommunityCounters />
        </View>

        <Button
          label="Share a photo or tip"
          icon="add"
          onPress={() => router.push('/post-meal')}
          style={styles.shareBtn}
        />

        <Text variant="labelSm" color="tertiary" style={styles.sectionLabel}>
          THE BOARD
        </Text>

        {loading && posts.length === 0 ? (
          <Card style={styles.centered}>
            <ActivityIndicator color={colors.brand.pine} />
          </Card>
        ) : posts.length === 0 ? (
          <Card style={styles.centered}>
            <Ionicons name="images-outline" size={26} color={colors.brand.pine} />
            <Text variant="titleMd" align="center" style={{ marginTop: spacing.md }}>
              Nothing shared yet
            </Text>
            <Text
              variant="bodyMd"
              color="secondary"
              align="center"
              style={{ marginTop: spacing.xs }}
            >
              Be the first — share a meal photo or a tip that’s working for you.
            </Text>
          </Card>
        ) : (
          <View style={{ gap: spacing.lg }}>
            {posts.map((p) => (
              <PostCard
                key={p.id}
                post={p}
                width={imgWidth}
                mine={p.userId === userId}
                onDelete={() => {
                  void deleteMealPost(p.id).then(reload);
                }}
              />
            ))}
          </View>
        )}
      </ScreenScaffold>
    </>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.xs },
  subtitle: { marginTop: spacing.sm },
  counters: { marginTop: spacing.xl },
  shareBtn: { marginTop: spacing.xl },
  sectionLabel: { marginTop: spacing['2xl'], marginBottom: spacing.sm },
  centered: { alignItems: 'center', paddingVertical: spacing.xl },
  post: { overflow: 'hidden' },
  postHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  caption: { padding: spacing.lg },
  tipBody: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
});
