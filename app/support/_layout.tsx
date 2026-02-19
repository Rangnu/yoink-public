import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/theme-context';
import { useSettings } from '@/contexts/settings-context';

export default function SupportLayout() {
  const { colors } = useTheme();
  const { t, language } = useSettings();
  return (
    <Stack
      key={`support-stack-${language}`}
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { color: colors.text },
      }}
    >
      <Stack.Screen name="index" options={{ title: t('Support') }} />
      <Stack.Screen name="report-problem" options={{ title: t('ReportProblem') }} />
      <Stack.Screen name="privacy-security" options={{ title: t('PrivacySecurityHelp') }} />
      <Stack.Screen name="help-center" options={{ title: t('HelpCenter') }} />
    </Stack>
  );
}
