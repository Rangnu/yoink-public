import { SavedCoinsContent } from '@/components/saved-coins-content';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/contexts/theme-context';

export default function SavedScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <SavedCoinsContent showHeader={false} title="Saved coins" subtitle="Your default watchlist lives here." />
    </SafeAreaView>
  );
}
