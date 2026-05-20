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
        eyebrow="Subscription"
        title="Subscription plans"
        description={t('SubscriptionDescription')}
        bullets={[
          'Future access to richer charting and advanced monitoring',
          'Expanded alerts, layouts, and premium signal surfaces',
          'Account-level billing and plan management',
        ]}
      />
    </SafeAreaView>
  );
}
