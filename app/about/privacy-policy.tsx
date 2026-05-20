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
        eyebrow="Legal"
        title="Privacy policy"
        description="A fuller privacy policy document will live here before broader public rollout."
        bullets={[
          'What market data and account data Yoink stores',
          'What remains device-local vs synced to Supabase',
          'How tester/admin access is controlled and audited',
        ]}
        note={t('PrivacyPolicy')}
      />
    </SafeAreaView>
  );
}
