import React from 'react';
import { GestureResponderEvent, StyleSheet, TouchableOpacity, Vibration } from 'react-native';
import FA5Icon from 'react-native-vector-icons/FontAwesome5';
import { Colors } from '../../styles';

interface IDragHandleProps {
  onLongPress: any;
}

const DragHandle = ({ onLongPress }: IDragHandleProps) => {
  const startDrag = (e: GestureResponderEvent) => {
    Vibration.vibrate(100);
    onLongPress(e);
  };
  return (
    <TouchableOpacity onLongPress={startDrag} style={{ marginRight: 8 }}>
      <FA5Icon
        name="grip-vertical"
        size={20}
        color={Colors.LIGHT_BORDER_COLOR}
        style={styles.icon}
      />
    </TouchableOpacity>
  );
};

export default DragHandle;

const styles = StyleSheet.create({
  icon: {
    padding: 8,
  },
});
