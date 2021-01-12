import React, { useState, useEffect } from 'react';
import { Animated, Easing } from 'react-native';

export default function RotatingView({ children }) {
  const [spinValue, setSpinValue] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.loop(
      Animated.timing(
        spinValue, // The animated value to drive
        {
          toValue: 1, // Animate to 360/value
          duration: 2000, // Make it take a while
          easing: Easing.linear,
          useNativeDriver: true,
        },
      ),
    ).start();
  }, []);

  // Next, interpolate beginning and end values (in this case 0 and 1)
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['360deg', '0deg'],
  });

  return (
    <Animated.View
      style={{
        transform: [{ rotate: spin }], // Bind rotation to animated value
      }}>
      {children}
    </Animated.View>
  );
}
