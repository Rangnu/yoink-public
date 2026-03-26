import { useRouter } from 'expo-router';
import { TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-context';

export default function ActivityIndexScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView edges={["top","left","right"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: 16, gap: 12 }}>
        <ThemedText type="title" style={{ color: colors.text, fontSize: 24 }}>
          Activity
        </ThemedText>
        <ThemedText style={{ color: colors.textSecondary }}>
          Review your saved coins and your personal activity history.
        </ThemedText>

        <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, overflow: 'hidden' }}>
          {[
            { label: 'Saved coins', icon: 'bookmark.fill', to: '/activity/saved' },
            { label: 'Your activity', icon: 'clock.fill', to: '/activity/your-activity' },
          ].map((item, idx, arr) => (
            <TouchableOpacity
              key={item.label}
              onPress={() => router.push(item.to as any)}
              style={{
                padding: 14,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottomWidth: idx < arr.length - 1 ? 1 : 0,
                borderBottomColor: colors.border,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <IconSymbol name={item.icon as any} size={18} color={colors.text} />
                <ThemedText style={{ color: colors.text }}>{item.label}</ThemedText>
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}
