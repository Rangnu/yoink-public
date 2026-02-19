import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/theme-context';
import { ThemedText } from '@/components/themed-text';
import { View } from 'react-native';

export default function PortfolioScreen() {
  const { colors } = useTheme();
  return (
    <SafeAreaView edges={["top","left","right"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 0, paddingBottom: 16 }}>
      </View>
    </SafeAreaView>
  );
}
