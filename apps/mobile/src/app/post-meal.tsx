import { useState } from 'react';
import { View, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, layout } from '@challenge42/config';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { useAuthStore } from '@/features/auth/authStore';
import { useProfileStore } from '@/features/profile/profileStore';
import { pickImageFile, uploadImage, canPickImage } from '@/features/media/imageUpload';
import { createMealPost, type PostKind } from '@/features/board/mealBoard';

export default function PostMeal(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const userId = useAuthStore((s) => s.session?.user.id ?? null);
  const authorName = useProfileStore((s) => s.firstName ?? s.displayName ?? 'Challenger');
  const authorAvatar = useProfileStore((s) => s.avatarUrl);

  const [mode, setMode] = useState<PostKind>('photo');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const choose = async (): Promise<void> => {
    setError(null);
    const picked = await pickImageFile();
    if (picked) {
      setFile(picked);
      setPreview(URL.createObjectURL(picked));
    }
  };

  const canShare = mode === 'photo' ? Boolean(file) : caption.trim().length > 0;

  const share = async (): Promise<void> => {
    if (!userId || !canShare) return;
    setBusy(true);
    setError(null);

    let imageUrl: string | null = null;
    if (mode === 'photo') {
      imageUrl = await uploadImage('meal-photos', userId, file as File);
      if (!imageUrl) {
        setError('Upload failed. Please try again.');
        setBusy(false);
        return;
      }
    }
    const err = await createMealPost({
      userId,
      kind: mode,
      imageUrl,
      caption: caption.trim() || null,
      authorName,
      authorAvatar,
    });
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text variant="titleMd">Share to the board</Text>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={styles.close}
          accessibilityLabel="Close"
        >
          <Ionicons name="close" size={20} color={colors.text.secondary} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <View style={styles.segmented}>
          {[
            { v: 'photo' as PostKind, label: 'Photo', icon: 'camera-outline' as const },
            { v: 'tip' as PostKind, label: 'Tip', icon: 'bulb-outline' as const },
          ].map((o) => {
            const on = mode === o.v;
            return (
              <Pressable
                key={o.v}
                onPress={() => setMode(o.v)}
                style={[styles.seg, on && styles.segOn]}
              >
                <Ionicons
                  name={o.icon}
                  size={16}
                  color={on ? colors.text.onPine : colors.text.secondary}
                />
                <Text
                  variant="labelSm"
                  style={{ color: on ? colors.text.onPine : colors.text.secondary }}
                >
                  {o.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {mode === 'photo' ? (
          !canPickImage() ? (
            <View style={styles.notice}>
              <Text variant="bodyMd" color="secondary">
                Photo posting is available on the web app for now. Switch to “Tip” to share a
                written idea, or open the challenge in your browser to post a photo.
              </Text>
            </View>
          ) : (
            <>
              <Pressable style={styles.dropZone} onPress={choose} accessibilityRole="button">
                {preview ? (
                  <Image source={{ uri: preview }} style={styles.preview} contentFit="cover" />
                ) : (
                  <View style={styles.dropInner}>
                    <Ionicons name="camera-outline" size={30} color={colors.brand.pine} />
                    <Text variant="labelMd" color="secondary" style={{ marginTop: spacing.sm }}>
                      Choose a photo
                    </Text>
                  </View>
                )}
              </Pressable>
              {preview ? (
                <Pressable onPress={choose} style={styles.replace}>
                  <Text variant="labelSm" color="secondary">
                    Choose a different photo
                  </Text>
                </Pressable>
              ) : null}
              <View style={{ marginTop: spacing.lg }}>
                <TextField
                  label="CAPTION (OPTIONAL)"
                  value={caption}
                  onChangeText={setCaption}
                  placeholder="What is it? Any wins to share?"
                />
              </View>
            </>
          )
        ) : (
          <View style={{ marginTop: spacing.xs }}>
            <TextField
              label="YOUR TIP"
              value={caption}
              onChangeText={setCaption}
              placeholder="Share a meal-prep idea, cooking steps, or a niche thing that worked for you…"
              multiline
              numberOfLines={6}
            />
            <Text variant="labelSm" color="tertiary" style={{ marginTop: spacing.sm }}>
              Recipes, batch-cooking hacks, swaps, restaurant orders — anything that helps the crew.
            </Text>
          </View>
        )}

        {error ? (
          <Text variant="labelSm" style={{ color: colors.status.danger, marginTop: spacing.sm }}>
            {error}
          </Text>
        ) : null}

        <Button
          label="Share to the board"
          onPress={share}
          disabled={!canShare}
          loading={busy}
          style={{ marginTop: spacing.xl }}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenGutter,
    paddingBottom: spacing.md,
  },
  close: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surface.sunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { paddingHorizontal: layout.screenGutter },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.surface.sunken,
    borderRadius: radius.pill,
    padding: 3,
    gap: 2,
    marginBottom: spacing.lg,
  },
  seg: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  segOn: { backgroundColor: colors.brand.pine },
  notice: {
    backgroundColor: colors.surface.sunken,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  dropZone: {
    aspectRatio: 1,
    borderRadius: radius.lg,
    backgroundColor: colors.surface.sunken,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border.strong,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  dropInner: { alignItems: 'center' },
  preview: { width: '100%', height: '100%' },
  replace: { alignSelf: 'center', paddingVertical: spacing.md },
});
