import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/theme-context';
import { useSettings } from '@/contexts/settings-context';

export default function AboutLayout() {
  const { colors } = useTheme();
  const { t, language } = useSettings();
  return (
    <Stack
      key={`about-stack-${language}`}
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { color: colors.text },
      }}
    >
      <Stack.Screen name="index" options={{ title: t('About') }} />
      <Stack.Screen name="privacy-policy" options={{ title: t('PrivacyPolicy') }} />
      <Stack.Screen name="terms-of-use" options={{ title: t('TermsOfUse') }} />
    </Stack>
  );
}
