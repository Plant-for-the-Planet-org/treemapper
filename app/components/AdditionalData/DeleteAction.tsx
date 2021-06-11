import React from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  add,
  cond,
  divide,
  interpolate,
  lessThan,
  multiply,
  sub,
} from 'react-native-reanimated';
import { Colors, Typography } from '../../styles';

const styles = StyleSheet.create({
  remove: {
    color: Colors.WHITE,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_14,
  },
});

interface IActionProps {
  x: Animated.Node<number>;
  deleteOpacity: Animated.Node<number>;
  height: number;
}

const DeleteAction = ({ x, deleteOpacity, height }: IActionProps) => {
  const size = cond(lessThan(x, height), x, add(x, sub(x, height)));
  const translateX = cond(lessThan(x, height), 0, divide(sub(x, height), 2));

  const textOpacity = interpolate(size, {
    inputRange: [Number(height) - 10, Number(height) + 10],
    outputRange: [0, 1],
  });
  return (
    <Animated.View
      style={{
        backgroundColor: Colors.ALERT,
        justifyContent: 'center',
        alignItems: 'center',
        height: height,
        width: size,
        transform: [{ translateX }],
      }}>
      <Animated.View
        style={{
          ...StyleSheet.absoluteFillObject,
          justifyContent: 'center',
          alignItems: 'center',
          opacity: multiply(textOpacity, deleteOpacity),
        }}>
        <Text style={styles.remove}>Remove</Text>
      </Animated.View>
    </Animated.View>
  );
};

export default DeleteAction;
