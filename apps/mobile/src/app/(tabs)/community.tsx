import { PlaceholderScreen } from '@/features/placeholders/PlaceholderScreen';

export default function CommunityScreen(): React.JSX.Element {
  return (
    <PlaceholderScreen
      eyebrow="COMMUNITY"
      title="You're not doing this alone"
      description="Share wins, meals, and recipes. Cheer each other on. Rally your team. A supportive community — not a noisy feed."
      phaseLabel="Arriving Phase 7"
      features={[
        {
          icon: 'trophy-outline',
          label: 'Wins & progress',
          description: 'Celebrate milestones and share progress with people on the same journey.',
        },
        {
          icon: 'fast-food-outline',
          label: 'Meal ideas & recipes',
          description: 'Share what worked, save others’ recipes, and build your rotation.',
        },
        {
          icon: 'people-outline',
          label: 'My Team',
          description: 'A dedicated feed for your team, with size-normalized goals and standings.',
        },
        {
          icon: 'heart-outline',
          label: 'Cheers & reactions',
          description: 'Lightweight encouragement — 🔥 💪 👏 🚀 — right when it matters.',
        },
      ]}
    />
  );
}
