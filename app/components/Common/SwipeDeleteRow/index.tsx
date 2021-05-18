import React, { useState } from 'react';
import { Dimensions, LayoutAnimation, StyleSheet, View } from 'react-native';
import { PanGestureHandler, State, TouchableWithoutFeedback } from 'react-native-gesture-handler';
import Animated, {
  abs,
  add,
  call,
  clockRunning,
  cond,
  eq,
  not,
  set,
  useCode,
} from 'react-native-reanimated';
import {
  clamp,
  minus,
  snapPoint,
  timing,
  useClock,
  usePanGestureHandler,
  useValue,
} from 'react-native-redash/lib/module/v1';
import { Colors } from '../../../styles';
import DeleteAction from '../../AdditionalData/DeleteAction';
import DragHandle from '../../AdditionalData/DragHandle';

interface ISwipeDeleteRowProps {
  drag?: any;
  dragging?: boolean;
  setDragging?: React.Dispatch<React.SetStateAction<boolean>>;
  onSwipe: () => void;
  children: Element;
  isDraggable?: boolean;
  style?: any;
}

const { width } = Dimensions.get('window');
const snapPoints = [-width, -100, 0];

const HEIGHT = 60;

export default function SwipeDeleteRow({
  drag,
  dragging,
  setDragging,
  onSwipe,
  children,
  isDraggable = false,
  style = {},
}: ISwipeDeleteRowProps): JSX.Element {
  const [containerHeight, setContainerHeight] = useState<number>(0);
  const { gestureHandler, translation, velocity, state } = usePanGestureHandler();
  const translateX = useValue(0);
  const offsetX = useValue(0);
  const height = useValue(0);
  const deleteOpacity = useValue(1);
  const clock = useClock();
  const to = snapPoint(translateX, velocity.x, snapPoints);
  const shouldRemove = useValue(0);

  const onDeleteSwipe = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    onSwipe();
  };

  useCode(
    () => [
      cond(
        eq(state, State.ACTIVE),
        set(translateX, add(offsetX, clamp(translation.x, -9999, minus(offsetX)))),
      ),
      cond(eq(state, State.END), [
        set(translateX, timing({ clock, from: translateX, to })),
        set(offsetX, translateX),
        cond(eq(to, -width), set(shouldRemove, 1)),
      ]),
      cond(shouldRemove, [
        set(height, timing({ from: HEIGHT, to: 0 })),
        set(deleteOpacity, 0),
        cond(not(clockRunning(clock)), call([], onDeleteSwipe)),
      ]),
    ],
    [onDeleteSwipe],
  );

  return (
    <Animated.View
      style={[styles.flex1, style]}
      onLayout={({
        nativeEvent: {
          layout: { height: layoutHeight },
        },
      }) => {
        setContainerHeight(layoutHeight);
      }}>
      <View style={styles.background}>
        <TouchableWithoutFeedback onPress={() => shouldRemove.setValue(1)}>
          <DeleteAction x={abs(translateX)} {...{ deleteOpacity }} height={containerHeight} />
        </TouchableWithoutFeedback>
      </View>

      <PanGestureHandler {...gestureHandler} enabled={!dragging}>
        <Animated.View style={{ transform: [{ translateX }] }}>
          <View style={[styles.contentContainer]}>
            {isDraggable ? (
              <DragHandle
                onLongPress={() => {
                  setDragging(true);
                  drag();
                }}
              />
            ) : (
              []
            )}
            <View style={styles.flex1}>{children}</View>
          </View>
        </Animated.View>
      </PanGestureHandler>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: Colors.WHITE,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.ALERT,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    overflow: 'hidden',
  },
});
