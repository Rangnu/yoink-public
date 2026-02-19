import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/theme-context';
import { ThemedText } from '@/components/themed-text';
import { View } from 'react-native';
import { useSettings } from '@/contexts/settings-context';

export default function LikesScreen() {
  const { colors } = useTheme();
  const { t } = useSettings();
  return (
    <SafeAreaView edges={["top","left","right"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: 16 }}>
        <ThemedText type="title" style={{ color: colors.text, fontSize: 18 }}>{t('Likes')}</ThemedText>
      </View>
    </SafeAreaView>
  );
}
