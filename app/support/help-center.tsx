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
        eyebrow={t('HelpCenter')}
        title={t('PlaceholderHelpTitle')}
        description={t('PlaceholderHelpBody')}
        bullets={[
          t('PlaceholderHelpBullet1'),
          t('PlaceholderHelpBullet2'),
          t('PlaceholderHelpBullet3'),
        ]}
        note={t('HelpCenter')}
      />
    </SafeAreaView>
  );
}
