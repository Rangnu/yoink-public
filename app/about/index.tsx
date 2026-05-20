import { SafeAreaView } from 'react-native-safe-area-context';

import { PlaceholderScreen } from '@/components/ui/placeholder-screen';
import { useSettings } from '@/contexts/settings-context';
import { useTheme } from '@/contexts/theme-context';

export default function AboutIndexScreen() {
  const { colors } = useTheme();
  const { t } = useSettings();
  return (
    <SafeAreaView edges={["top","left","right"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <PlaceholderScreen
        icon="info.circle"
        eyebrow="About"
        title="About Yoink"
        description="Yoink is a signal-first crypto discovery app focused on fast scanning, live lists, and high-conviction drill-downs."
        bullets={[
          'AI Highlights for quick market-aware ideas',
          'Explore for dense live market boards and rankings',
          'Protected admin tooling for ingest health and ops visibility',
        ]}
        note={t('About')}
      />
    </SafeAreaView>
  );
}
