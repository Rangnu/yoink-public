import { SafeAreaView } from 'react-native-safe-area-context';

import { PlaceholderScreen } from '@/components/ui/placeholder-screen';
import { useSettings } from '@/contexts/settings-context';
import { useTheme } from '@/contexts/theme-context';

export default function PrivacySecurityHelpScreen() {
  const { colors } = useTheme();
  const { t } = useSettings();
  return (
    <SafeAreaView edges={["top","left","right"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <PlaceholderScreen
        icon="lock.fill"
        eyebrow={t('PrivacySecurityHelp')}
        title={t('PlaceholderSecurityTitle')}
        description={t('PlaceholderSecurityBody')}
        bullets={[
          t('PlaceholderSecurityBullet1'),
          t('PlaceholderSecurityBullet2'),
          t('PlaceholderSecurityBullet3'),
        ]}
        note={t('PrivacySecurityHelp')}
      />
    </SafeAreaView>
  );
}
