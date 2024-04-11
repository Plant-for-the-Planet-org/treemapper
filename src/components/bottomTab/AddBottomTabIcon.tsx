import {StyleSheet, Text, View} from 'react-native'
import React, {useState} from 'react'
import CurveTabPlaceholder from 'assets/images/svg/CurveTab.svg'
import AddOptionModal from './AddOptionModal'
import {TouchableOpacity} from 'react-native'
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated'

import AddTabIcon from 'assets/images/svg/AddtabIcon.svg'
import {Colors} from 'src/utils/constants'

const AddBottomTabIcon = () => {
  const [open, setOpen] = useState(false)

  const rotation = useDerivedValue(() => {
    return withTiming(open ? '135deg' : '0deg')
  }, [open])

  const rotationStyle = useAnimatedStyle(() => ({
    transform: [{rotate: rotation.value}],
  }))

  const onAddPress = () => {
    setOpen(prev => !prev)
  }

  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={1}
      style={styles.container}
      onPress={() => onAddPress()}>
      <View style={styles.iconWrapper}>
        <Animated.View style={[rotationStyle]}>
          <AddTabIcon />
        </Animated.View>
      </View>
      <AddOptionModal setVisible={setOpen} visible={open} />
      <CurveTabPlaceholder />
      <View style={styles.labelContainer}>
        <Text
          style={[
            styles.labelStyle,
            {color: open ? Colors.PRIMARY_DARK : Colors.TEXT_LIGHT},
          ]}>
          Add
        </Text>
      </View>
    </TouchableOpacity>
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
  iconWrapper: {
    position: 'absolute',
    backgroundColor: 'white',
    height: 60,
    width: 60,
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 100,
    top: '-45%',
    left: '8%',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4.62,
    elevation: 5,
  },
  labelContainer: {
    position: 'absolute',
    bottom: '18%',
    left: '28%',
  },
  labelStyle: {},
})
