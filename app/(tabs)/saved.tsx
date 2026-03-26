import { SavedCoinsContent } from '@/components/saved-coins-content';
import { useTheme } from '@/contexts/theme-context';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SavedScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <SavedCoinsContent />
    </SafeAreaView>
  );
}
