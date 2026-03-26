import { ActivityEventList } from '@/components/activity-event-list';
import { useActivity } from '@/contexts/activity-context';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/theme-context';

export default function AccountHistoryScreen() {
  const { colors } = useTheme();
  const { events } = useActivity();
  const accountEvents = events.filter((event) =>
    ['signed_in', 'signed_out', 'save_coin', 'unsave_coin'].includes(event.eventType)
  );

  return (
    <SafeAreaView edges={["top","left","right"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <ActivityEventList
        title="Account history"
        subtitle="Session changes and watchlist changes on this device."
        events={accountEvents}
        emptyTitle="No account history yet"
        emptyBody="Sign in or save a coin to start building account activity."
      />
    </SafeAreaView>
  );
}
