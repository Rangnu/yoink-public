import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/theme-context';
import { useSettings } from '@/contexts/settings-context';

export default function ActivityLayout() {
  const { colors } = useTheme();
  const { t, language } = useSettings();
  return (
    <Stack
      key={`activity-stack-${language}`}
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { color: colors.text },
      }}
    >
      <Stack.Screen name="index" options={{ title: t('Activity') }} />
      <Stack.Screen name="saved" options={{ title: t('Saved') }} />
      <Stack.Screen name="your-activity" options={{ headerShown: false }} />
    </Stack>
  );
}
