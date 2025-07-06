import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  useSharedValue,
  cancelAnimation,
} from 'react-native-reanimated';
import { Colors } from 'src/utils/constants';

interface Props {
  color: string,
  trackingPaused: boolean,
  size: number
}

const RecordingIndicator = ({ size = 16, color = Colors.NEW_PRIMARY, trackingPaused }: Props) => {
  // Create shared value for opacity
  const opacity = useSharedValue(1);

  // Create animated style
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  // Function to start the blinking animation
  const startBlinking = () => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.2, { duration: 800 }),
        withTiming(1, { duration: 800 })
      ),
      -1,
      false
    );
  };

  // Function to pause the animation
  const pauseAnimation = () => {
    cancelAnimation(opacity);
    opacity.value = withTiming(1, { duration: 300 });
  };

  // Effect to handle animation based on trackingPaused state
  React.useEffect(() => {
    if (trackingPaused) {
      pauseAnimation();
    } else {
      startBlinking();
    }

    // Cleanup animation when component unmounts
    return () => {
      cancelAnimation(opacity);
    };
  }, [trackingPaused]); // Re-run effect when trackingPaused changes

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.dot,
          animatedStyle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    elevation: 3, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default RecordingIndicator;