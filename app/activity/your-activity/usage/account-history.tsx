import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/theme-context';
import { ThemedText } from '@/components/themed-text';
import { View } from 'react-native';

export default function AccountHistoryScreen() {
  const { colors } = useTheme();
  return (
    <SafeAreaView edges={["top","left","right"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: 16 }}>
        <ThemedText type="title" style={{ color: colors.text, fontSize: 18 }}>Account History</ThemedText>
      </View>
    </SafeAreaView>
  );
}
