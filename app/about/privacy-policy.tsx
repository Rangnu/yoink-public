import { SafeAreaView } from 'react-native-safe-area-context';

import { PlaceholderScreen } from '@/components/ui/placeholder-screen';
import { useSettings } from '@/contexts/settings-context';
import { useTheme } from '@/contexts/theme-context';

export default function PrivacyPolicyScreen() {
  const { colors } = useTheme();
  const { t } = useSettings();
  return (
    <SafeAreaView edges={["top","left","right"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <PlaceholderScreen
        icon="lock.fill"
        eyebrow={t('PlaceholderLegalEyebrow')}
        title={t('PlaceholderPrivacyTitle')}
        description={t('PlaceholderPrivacyBody')}
        bullets={[
          t('PlaceholderPrivacyBullet1'),
          t('PlaceholderPrivacyBullet2'),
          t('PlaceholderPrivacyBullet3'),
        ]}
        note={t('PrivacyPolicy')}
      />
    </SafeAreaView>
  );
}
