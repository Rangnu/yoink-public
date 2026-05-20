import { SafeAreaView } from 'react-native-safe-area-context';

import { PlaceholderScreen } from '@/components/ui/placeholder-screen';
import { useSettings } from '@/contexts/settings-context';
import { useTheme } from '@/contexts/theme-context';

export default function PortfolioScreen() {
  const { colors } = useTheme();
  const { t } = useSettings();
  return (
    <SafeAreaView edges={["top","left","right"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <PlaceholderScreen
        icon="chart.line.uptrend.xyaxis"
        eyebrow={t('Portfolio')}
        title={t('PlaceholderPortfolioTitle')}
        description={t('PlaceholderPortfolioBody')}
        bullets={[
          t('PlaceholderPortfolioBullet1'),
          t('PlaceholderPortfolioBullet2'),
          t('PlaceholderPortfolioBullet3'),
        ]}
        note={t('PlaceholderPortfolioNote')}
      />
    </SafeAreaView>
  );
}
