import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/theme-context';
import { ThemedText } from '@/components/themed-text';
import { View } from 'react-native';
import { useSettings } from '@/contexts/settings-context';

export default function NotificationsSettingsScreen() {
  const { colors } = useTheme();
  const { t } = useSettings();
  return (
    <SafeAreaView edges={["top","left","right"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 0, paddingBottom: 16 }}>
        <ThemedText style={{ color: colors.textSecondary }}>{t('NotificationsDescription')}</ThemedText>
      </View>
    </SafeAreaView>
  );
}
