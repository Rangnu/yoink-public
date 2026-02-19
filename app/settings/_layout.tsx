import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/theme-context';
import { useSettings } from '@/contexts/settings-context';

export default function SettingsLayout() {
  const { colors } = useTheme();
  const { t, language } = useSettings();
  return (
    <Stack
      key={`settings-stack-${language}`}
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { color: colors.text },
      }}
    >
      <Stack.Screen name="index" options={{ title: t('Settings') }} />
      <Stack.Screen name="appearance" options={{ title: t('Appearance') }} />
      <Stack.Screen name="language" options={{ title: t('Language') }} />
      <Stack.Screen name="currency" options={{ title: t('Currency') }} />
      <Stack.Screen name="subscription" options={{ title: t('Subscription') }} />
      <Stack.Screen name="notifications" options={{ title: t('Notifications') }} />
    </Stack>
  );
}
