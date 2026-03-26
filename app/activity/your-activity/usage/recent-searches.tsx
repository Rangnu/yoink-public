import { ActivityEventList } from '@/components/activity-event-list';
import { useActivity } from '@/contexts/activity-context';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/theme-context';

export default function RecentSearchesScreen() {
  const { colors } = useTheme();
  const { events } = useActivity();
  const searchEvents = events.filter((event) => event.eventType === 'view_coin' && event.meta?.source === 'search');

  return (
    <SafeAreaView edges={["top","left","right"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <ActivityEventList
        title="Search history"
        subtitle="This will populate once a real coin search flow is added."
        events={searchEvents}
        emptyTitle="No searches yet"
        emptyBody="Search isn’t implemented as a first-class feature yet, so there is nothing to show here right now."
      />
    </SafeAreaView>
  );
}
