import { SafeAreaView } from 'react-native-safe-area-context';

import { PlaceholderScreen } from '@/components/ui/placeholder-screen';
import { useSettings } from '@/contexts/settings-context';
import { useTheme } from '@/contexts/theme-context';

export default function SettingsIndexScreen() {
  const { colors } = useTheme();
  const { t } = useSettings();
  return (
    <SafeAreaView edges={["top","left","right"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <PlaceholderScreen
        icon="gearshape.fill"
        eyebrow="Settings"
        title="Choose a setting to edit"
        description={t('SelectASetting')}
        bullets={[
          'Appearance controls for light, dark, and system theme',
          'Language, currency, and notification preferences',
          'Subscription and account-level options as they become available',
        ]}
      />
    </SafeAreaView>
  );
}
