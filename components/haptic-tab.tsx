import React, { useRef } from 'react';
import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';
import { Animated } from 'react-native';

export function HapticTab(props: BottomTabBarButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current; // 0..1 -> -4deg..0deg wiggle
  const translateX = useRef(new Animated.Value(0)).current;

  const runPressAnim = () => {
    // Quick tap feedback: scale up a bit, move up slightly, small wiggle, then settle
    translateX.setValue(0);
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
      Animated.sequence([
        Animated.timing(translateX, { toValue: 3, duration: 60, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: -3, duration: 60, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: 2, duration: 50, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: 0, duration: 80, useNativeDriver: true }),
      ]),
    ]).start();
  };

  const rotation = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-4deg'] });

  return (
    <PlatformPressable
      {...props}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        runPressAnim();
        props.onPressIn?.(ev);
      }}
    >
      <Animated.View
        style={{
          transform: [
            { scale },
            { translateY },
            { translateX },
            { rotate: rotation },
          ],
        }}
      >
        {props.children}
      </Animated.View>
    </PlatformPressable>
  );
}
