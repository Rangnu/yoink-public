import { Tabs } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SaturnIcon } from '@/components/ui/saturn-icon';
import { useTheme } from '@/contexts/theme-context';
import { useSettings } from '@/contexts/settings-context';

export default function TabLayout() {
  const { colors } = useTheme();
  const { t, language } = useSettings();

  return (
    <Tabs
      key={`tabs-${language}`}
      screenOptions={{
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
        tabBarShowLabel: false,
        tabBarLabelStyle: { textDecorationLine: 'none' },
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('Home'),
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon name="house.fill" size={26} color={focused ? colors.text : color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="scouters"
        options={{
          title: t('Scouters'),
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon name="scope" size={26} color={focused ? colors.text : color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: t('Explore'),
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon name="saturn" size={26} color={focused ? colors.text : color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: t('Saved'),
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon name="bookmark.fill" size={26} color={focused ? colors.text : color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: t('Menu'),
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon name="ellipsis.circle" size={26} color={focused ? colors.text : color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

type AnimatedTabIconProps = { name: any; size: number; color: string; focused: boolean };
function AnimatedTabIcon({ name, size, color, focused }: AnimatedTabIconProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (focused) {
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.12, duration: 110, useNativeDriver: true }),
          Animated.spring(scale, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(translateY, { toValue: -2, duration: 110, useNativeDriver: true }),
          Animated.spring(translateY, { toValue: 0, friction: 6, tension: 120, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(rotate, { toValue: 1, duration: 90, useNativeDriver: true }),
          Animated.timing(rotate, { toValue: 0, duration: 90, useNativeDriver: true }),
        ]),
      ]).start();
    }
  }, [focused, scale, translateY, rotate]);

  const rotation = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-4deg'] });

  return (
    <Animated.View style={{ transform: [{ scale }, { translateY }, { rotate: rotation }] }}>
      {name === 'saturn' ? (
        <SaturnIcon size={size} color={color} />
      ) : (
        <IconSymbol size={size} name={name} color={color} />
      )}
    </Animated.View>
  );
}
