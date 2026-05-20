import { SafeAreaView } from 'react-native-safe-area-context';

import { PlaceholderScreen } from '@/components/ui/placeholder-screen';
import { useSettings } from '@/contexts/settings-context';
import { useTheme } from '@/contexts/theme-context';

export default function ReportProblemScreen() {
  const { colors } = useTheme();
  const { t } = useSettings();
  return (
    <SafeAreaView edges={["top","left","right"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <PlaceholderScreen
        icon="exclamationmark.bubble"
        eyebrow="Report a problem"
        title="Bug reporting flow"
        description="This screen will become the structured path for reporting broken UI, incorrect market data, or auth/admin issues."
        bullets={[
          'UI layout issues across Home, Explore, and detail pages',
          'Incorrect prices, stale signals, or ingest-related errors',
          'Tester/admin access problems and recovery details',
        ]}
        note={t('ReportProblem')}
      />
    </SafeAreaView>
  );
}
