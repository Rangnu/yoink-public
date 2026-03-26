import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useActivity } from '@/contexts/activity-context';
import { useTheme } from '@/contexts/theme-context';
import { useRouter } from 'expo-router';
import { TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function YourActivityScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { events } = useActivity();

  const viewedCount = events.filter((event) => event.eventType === 'view_coin').length;
  const savedCount = events.filter((event) => event.eventType === 'save_coin' || event.eventType === 'unsave_coin').length;
  const accountCount = events.filter((event) => event.eventType === 'signed_in' || event.eventType === 'signed_out').length;

  return (
    <SafeAreaView edges={["top","left","right"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 0, paddingBottom: 16, gap: 12 }}>
        <ThemedText style={{ color: colors.text, fontSize: 12, opacity: 0.8 }}>
          Review what you’ve actually done in the app so far: viewed coins, saved changes, and account events.
        </ThemedText>
        <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, overflow: 'hidden' }}>
          {[
            { label: 'Viewed coins', icon: 'chart.line.uptrend.xyaxis', to: '/activity/your-activity/viewed-coins', count: viewedCount },
            { label: 'Saved history', icon: 'bookmark.fill', to: '/activity/your-activity/saved-history', count: savedCount },
            { label: 'Account history', icon: 'clock.fill', to: '/activity/your-activity/usage/account-history', count: accountCount },
          ].map((item, idx, arr) => (
            <TouchableOpacity key={item.label} onPress={() => router.push(item.to as any)} style={{ padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: idx < arr.length - 1 ? 1 : 0, borderBottomColor: colors.border }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <IconSymbol name={item.icon as any} size={18} color={colors.text} />
                <View>
                  <ThemedText style={{ color: colors.text }}>{item.label}</ThemedText>
                  <ThemedText style={{ color: colors.textTertiary, fontSize: 12, marginTop: 2 }}>{item.count} events</ThemedText>
                </View>
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, overflow: 'hidden' }}>
          {[
            { label: 'Search history', icon: 'magnifyingglass', to: '/activity/your-activity/usage/recent-searches', caption: 'Ready when search is implemented' },
            { label: 'Viewed coins (legacy route)', icon: 'bookmark.fill', to: '/activity/your-activity/usage/watched-stocks', caption: 'Same live history, alternate route' },
          ].map((item, idx, arr) => (
            <TouchableOpacity key={item.label} onPress={() => router.push(item.to as any)} style={{ padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: idx < arr.length - 1 ? 1 : 0, borderBottomColor: colors.border }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <IconSymbol name={item.icon as any} size={18} color={colors.text} />
                <View>
                  <ThemedText style={{ color: colors.text }}>{item.label}</ThemedText>
                  <ThemedText style={{ color: colors.textTertiary, fontSize: 12, marginTop: 2 }}>{item.caption}</ThemedText>
                </View>
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14 }}>
          <ThemedText style={{ color: colors.text, fontWeight: '600' }}>Not in this version</ThemedText>
          <ThemedText style={{ color: colors.textSecondary, marginTop: 6, lineHeight: 20 }}>
            Social actions like likes, comments, and reposts are not active features in the current product, so they are not shown as primary activity yet.
          </ThemedText>
        </View>
      </View>
    </SafeAreaView>
  );
}
