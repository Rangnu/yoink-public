import { SafeAreaView } from 'react-native-safe-area-context';

import { PlaceholderScreen } from '@/components/ui/placeholder-screen';
import { useSettings } from '@/contexts/settings-context';
import { useTheme } from '@/contexts/theme-context';

export default function HelpCenterScreen() {
  const { colors } = useTheme();
  const { t } = useSettings();
  return (
    <SafeAreaView edges={["top","left","right"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <PlaceholderScreen
        icon="questionmark.circle"
        eyebrow="Help Center"
        title="Help content will live here"
        description="This area will host quick-start guides, account help, and explanations of how lists, charts, and scouters work."
        bullets={[
          'How AI Highlights and Explore lists are calculated',
          'How to save, track, and revisit coins',
          'How to use admin/tester flows safely during QA',
        ]}
        note={t('HelpCenter')}
      />
    </SafeAreaView>
  );
}
