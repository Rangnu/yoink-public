import { SafeAreaView } from 'react-native-safe-area-context';

import { PlaceholderScreen } from '@/components/ui/placeholder-screen';
import { useSettings } from '@/contexts/settings-context';
import { useTheme } from '@/contexts/theme-context';

export default function SubscriptionScreen() {
  const { colors } = useTheme();
  const { t } = useSettings();
  return (
    <SafeAreaView edges={["top","left","right"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <PlaceholderScreen
        icon="creditcard"
        eyebrow={t('Subscription')}
        title={t('PlaceholderSubscriptionTitle')}
        description={t('SubscriptionDescription')}
        bullets={[
          t('PlaceholderSubscriptionBullet1'),
          t('PlaceholderSubscriptionBullet2'),
          t('PlaceholderSubscriptionBullet3'),
        ]}
      />
    </SafeAreaView>
  );
}
