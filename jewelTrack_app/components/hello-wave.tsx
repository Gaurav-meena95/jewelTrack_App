import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';

export function HelloWave() {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withSequence(
        withTiming(25, { duration: 150 }),
        withTiming(0, { duration: 150 })
      ),
      4 // Run the animation 4 times
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Ionicons name="hand-left" size={28} color="#f1c40f" />
    </Animated.View>
  );
}
