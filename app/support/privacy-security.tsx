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
        eyebrow="Privacy & Security"
        title="Security guidance"
        description="This section will collect account-safety guidance, privacy details, and recovery instructions for Yoink users and testers."
        bullets={[
          'Password, reset, and account recovery guidance',
          'What data is stored locally vs synced to your account',
          'How protected admin access is gated and audited',
        ]}
        note={t('PrivacySecurityHelp')}
      />
    </SafeAreaView>
  );
}
