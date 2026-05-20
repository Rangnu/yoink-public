import { SafeAreaView } from 'react-native-safe-area-context';

import { PlaceholderScreen } from '@/components/ui/placeholder-screen';
import { useTheme } from '@/contexts/theme-context';

export default function SupportIndexScreen() {
  const { colors } = useTheme();
  return (
    <SafeAreaView edges={["top","left","right"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <PlaceholderScreen
        icon="questionmark.circle"
        eyebrow="Support"
        title="Support hub"
        description="Use the support section for help, privacy and security guidance, or to report a product issue."
        bullets={[
          'Help Center for FAQs and walkthrough content',
          'Privacy & Security for account and data questions',
          'Report Problem for bugs, broken flows, or incorrect market behavior',
        ]}
      />
    </SafeAreaView>
  );
}
