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
        eyebrow={t('About')}
        title={t('PlaceholderAboutTitle')}
        description={t('PlaceholderAboutBody')}
        bullets={[
          t('PlaceholderAboutBullet1'),
          t('PlaceholderAboutBullet2'),
          t('PlaceholderAboutBullet3'),
        ]}
        note={t('About')}
      />
    </SafeAreaView>
  );
}
