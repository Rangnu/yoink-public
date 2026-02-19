import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/theme-context';
import { useSettings } from '@/contexts/settings-context';

export default function WatchlistsLayout() {
  const { colors } = useTheme();
  const { t, language } = useSettings();
  return (
    <Stack
      key={`watchlists-stack-${language}`}
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { color: colors.text },
      }}
    >
      <Stack.Screen name="index" options={{ title: t('Watchlists') }} />
    </Stack>
  );
}
