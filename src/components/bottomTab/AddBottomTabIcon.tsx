import {StyleSheet, View} from 'react-native'
import React, {useState} from 'react'

import AddOptionModal from './AddOptionModal'
import {TouchableOpacity} from 'react-native'
import Animated, { useAnimatedStyle, useDerivedValue, withTiming } from 'react-native-reanimated'
const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity)

import AddTabIcon from 'assets/images/svg/AddtabIcon.svg'

const AddBottomTabIcon = () => {
  const [open, setOpen] = useState(false)

  const rotation = useDerivedValue(() => {
    return withTiming(open ? '135deg' : '0deg');
  }, [open]);

  const rotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: rotation.value }],
  }));

  const onAddPress = () => {
    setOpen(prev => !prev)
  }

  return (
    <View style={styles.container}>
      <View style={styles.iconWrapper}>
        <TouchableOpacity
          accessibilityRole="button"
          activeOpacity={1}
          onPress={() => onAddPress()}>
          <AnimatedTouchableOpacity
            style={[rotationStyle]}
            onPress={() => onAddPress()}>
            <AddTabIcon />
          </AnimatedTouchableOpacity>
        </TouchableOpacity>
      </View>
      <AddOptionModal
        setVisible={setOpen}
        visible={open}
      />
    </View>
  )
}

export default AddBottomTabIcon

const styles = StyleSheet.create({
  container: {
    height: '100%',
    width: '100%',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  iconWrapper: {},
  labelStyle: {
    marginTop: 5,
  },
})
