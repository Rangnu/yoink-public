import { ActivityEventList } from '@/components/activity-event-list';
import { useActivity } from '@/contexts/activity-context';
import { useTheme } from '@/contexts/theme-context';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SavedHistoryScreen() {
  const { colors } = useTheme();
  const { events } = useActivity();

  const savedEvents = events.filter(
    (event) => event.eventType === 'save_coin' || event.eventType === 'unsave_coin'
  );

  return (
    <SafeAreaView edges={["top","left","right"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <ActivityEventList
        title="Saved history"
        subtitle="Tracks when you add or remove coins from your watchlist."
        events={savedEvents}
        emptyTitle="No saved actions yet"
        emptyBody="Bookmark a coin anywhere in the app to build your saved history."
      />
    </SafeAreaView>
  );
}
