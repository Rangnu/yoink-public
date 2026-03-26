import { ActivityEventList } from '@/components/activity-event-list';
import { useActivity } from '@/contexts/activity-context';
import { useTheme } from '@/contexts/theme-context';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ViewedCoinsScreen() {
  const { colors } = useTheme();
  const { events } = useActivity();

  const viewedEvents = events.filter((event) => event.eventType === 'view_coin');

  return (
    <SafeAreaView edges={["top","left","right"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <ActivityEventList
        title="Viewed coins"
        subtitle="This is captured when you open a coin detail screen."
        events={viewedEvents}
        emptyTitle="No viewed coins yet"
        emptyBody="Open any coin from Home, Explore, Markets, Top 100, or Scouters and it will appear here."
      />
    </SafeAreaView>
  );
}
