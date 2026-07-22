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
import { createMealPost } from '@/features/board/mealBoard';

export default function PostMeal(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const userId = useAuthStore((s) => s.session?.user.id ?? null);
  const authorName = useProfileStore((s) => s.firstName ?? s.displayName ?? 'Challenger');
  const authorAvatar = useProfileStore((s) => s.avatarUrl);

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

  const share = async (): Promise<void> => {
    if (!file || !userId) return;
    setBusy(true);
    setError(null);
    const url = await uploadImage('meal-photos', userId, file);
    if (!url) {
      setError('Upload failed. Please try again.');
      setBusy(false);
      return;
    }
    const err = await createMealPost({
      userId,
      imageUrl: url,
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
        <Text variant="titleMd">Share a meal</Text>
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
        {!canPickImage() ? (
          <View style={styles.notice}>
            <Text variant="bodyMd" color="secondary">
              Photo posting is available on the web app for now. Open the challenge in your browser
              to share a meal.
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

            {error ? (
              <Text
                variant="labelSm"
                style={{ color: colors.status.danger, marginTop: spacing.sm }}
              >
                {error}
              </Text>
            ) : null}

            <Button
              label="Share to the board"
              onPress={share}
              disabled={!file}
              loading={busy}
              style={{ marginTop: spacing.xl }}
            />
          </>
        )}
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
