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
        eyebrow={t('Notifications')}
        title={t('PlaceholderNotificationsTitle')}
        description={t('NotificationsDescription')}
        bullets={[
          t('PlaceholderNotificationsBullet1'),
          t('PlaceholderNotificationsBullet2'),
          t('PlaceholderNotificationsBullet3'),
        ]}
      />
    </SafeAreaView>
  );
}
