import { SafeAreaView } from 'react-native-safe-area-context';

import { PlaceholderScreen } from '@/components/ui/placeholder-screen';
import { useTheme } from '@/contexts/theme-context';

export default function PortfolioScreen() {
  const { colors } = useTheme();
  return (
    <SafeAreaView edges={["top","left","right"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <PlaceholderScreen
        icon="chart.line.uptrend.xyaxis"
        eyebrow="Portfolio"
        title="Portfolio tracking is coming next"
        description="This screen will become your owned-position dashboard once portfolio ingestion and PnL tracking are wired into the product."
        bullets={[
          'Holdings summary, allocation, and daily portfolio movement',
          'Entry prices, unrealized profit/loss, and performance history',
          'Quick jumps from positions into coin detail charts and scouters',
        ]}
        note="For now, use Saved and Explore to track ideas while the portfolio layer is being built."
      />
    </SafeAreaView>
  );
}
