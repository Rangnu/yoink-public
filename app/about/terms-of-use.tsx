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
        eyebrow="Legal"
        title="Terms of use"
        description="A fuller terms document will live here as the product moves beyond the current tester-focused phase."
        bullets={[
          'Usage rules for app data, signals, and alerts',
          'Tester/admin responsibilities for internal environments',
          'Future subscription and account terms',
        ]}
        note={t('TermsOfUse')}
      />
    </SafeAreaView>
  );
}
