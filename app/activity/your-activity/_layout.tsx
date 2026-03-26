import { Stack } from 'expo-router';
import React from 'react';
import { HeaderBackButton } from '@react-navigation/elements';
import { useTheme } from '@/contexts/theme-context';
import { useSettings } from '@/contexts/settings-context';

export default function YourActivityLayout() {
  const { colors } = useTheme();
  const { t, language } = useSettings();
  return (
    <Stack
      key={`your-activity-stack-${language}`}
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { color: colors.text },
      }}
    >
      <Stack.Screen 
        name="index" 
        options={({ navigation }) => ({
          title: t('YourActivity'),
          headerLeft: () => (
            <HeaderBackButton
              style={{ marginLeft: -8 }}
              tintColor={colors.text}
              onPress={() => {
                // Prefer normal back; if none, go to Activity index under the same segment
                // @ts-ignore canGoBack available on native stack
                if (navigation.canGoBack && navigation.canGoBack()) navigation.goBack();
                else navigation.navigate('/activity');
              }}
            />
          ),
        })}
      />
      <Stack.Screen name="viewed-coins" options={{ title: 'Viewed coins' }} />
      <Stack.Screen name="saved-history" options={{ title: 'Saved history' }} />
      <Stack.Screen name="interactions/likes" options={{ title: t('Likes') }} />
      <Stack.Screen name="interactions/comments" options={{ title: t('Comments') }} />
      <Stack.Screen name="interactions/reposts" options={{ title: t('Reposts') }} />
      <Stack.Screen name="usage/watched-stocks" options={{ title: 'Viewed coins' }} />
      <Stack.Screen name="usage/account-history" options={{ title: 'Account history' }} />
      <Stack.Screen name="usage/recent-searches" options={{ title: 'Search history' }} />
    </Stack>
  );
}
