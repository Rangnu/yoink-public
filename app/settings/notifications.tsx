import { SafeAreaView } from 'react-native-safe-area-context';

import { PlaceholderScreen } from '@/components/ui/placeholder-screen';
import { useSettings } from '@/contexts/settings-context';
import { useTheme } from '@/contexts/theme-context';

export default function NotificationsSettingsScreen() {
  const { colors } = useTheme();
  const { t } = useSettings();
  return (
    <SafeAreaView edges={["top","left","right"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <PlaceholderScreen
        icon="bell.fill"
        eyebrow="Notifications"
        title="Notification preferences"
        description={t('NotificationsDescription')}
        bullets={[
          'Price movement and momentum alerts',
          'Watchlist and scouter notifications',
          'Important account and security messages',
        ]}
      />
    </SafeAreaView>
  );
}
