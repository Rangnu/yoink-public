import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSettings } from '@/contexts/settings-context';
import { useTheme } from '@/contexts/theme-context';
import { useRouter } from 'expo-router';
import { TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function YourActivityScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { t } = useSettings();
  return (
    <SafeAreaView edges={["top","left","right"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 0, paddingBottom: 16, gap: 12 }}>
        <ThemedText style={{ color: colors.text, fontSize: 12, opacity: 0.8 }}>{t('YourActivityIntro')}</ThemedText>
        <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, overflow: 'hidden' }}>
          {[
            { label: t('Likes'), icon: 'heart.fill', to: '/activity/your-activity/interactions/likes' },
            { label: t('Comments'), icon: 'text.bubble.fill', to: '/activity/your-activity/interactions/comments' },
            { label: t('Reposts'), icon: 'arrow.2.squarepath', to: '/activity/your-activity/interactions/reposts' },
          ].map((item, idx, arr) => (
            <TouchableOpacity key={item.label} onPress={() => router.push(item.to as any)} style={{ padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: idx < arr.length - 1 ? 1 : 0, borderBottomColor: colors.border }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <IconSymbol name={item.icon as any} size={18} color={colors.text} />
                <ThemedText style={{ color: colors.text }}>{item.label}</ThemedText>
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, overflow: 'hidden' }}>
          {[
            { label: t('WatchedStocks'), icon: 'bookmark.fill', to: '/activity/your-activity/usage/watched-stocks' },
            { label: t('AccountHistory'), icon: 'clock.fill', to: '/activity/your-activity/usage/account-history' },
            { label: t('RecentSearches'), icon: 'magnifyingglass', to: '/activity/your-activity/usage/recent-searches' },
          ].map((item, idx, arr) => (
            <TouchableOpacity key={item.label} onPress={() => router.push(item.to as any)} style={{ padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: idx < arr.length - 1 ? 1 : 0, borderBottomColor: colors.border }}>
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
