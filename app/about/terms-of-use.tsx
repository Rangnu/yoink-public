import { SafeAreaView } from 'react-native-safe-area-context';

import { PlaceholderScreen } from '@/components/ui/placeholder-screen';
import { useSettings } from '@/contexts/settings-context';
import { useTheme } from '@/contexts/theme-context';

export default function TermsOfUseScreen() {
  const { colors } = useTheme();
  const { t } = useSettings();
  return (
    <SafeAreaView edges={["top","left","right"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <PlaceholderScreen
        icon="doc.text"
        eyebrow={t('PlaceholderLegalEyebrow')}
        title={t('PlaceholderTermsTitle')}
        description={t('PlaceholderTermsBody')}
        bullets={[
          t('PlaceholderTermsBullet1'),
          t('PlaceholderTermsBullet2'),
          t('PlaceholderTermsBullet3'),
        ]}
        note={t('TermsOfUse')}
      />
    </SafeAreaView>
  );
}
