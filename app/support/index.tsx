import { SafeAreaView } from 'react-native-safe-area-context';

import { PlaceholderScreen } from '@/components/ui/placeholder-screen';
import { useSettings } from '@/contexts/settings-context';
import { useTheme } from '@/contexts/theme-context';

export default function SupportIndexScreen() {
  const { colors } = useTheme();
  const { t } = useSettings();
  return (
    <SafeAreaView edges={["top","left","right"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <PlaceholderScreen
        icon="questionmark.circle"
        eyebrow={t('Support')}
        title={t('PlaceholderSupportTitle')}
        description={t('PlaceholderSupportBody')}
        bullets={[
          t('PlaceholderSupportBullet1'),
          t('PlaceholderSupportBullet2'),
          t('PlaceholderSupportBullet3'),
        ]}
      />
    </SafeAreaView>
  );
}
