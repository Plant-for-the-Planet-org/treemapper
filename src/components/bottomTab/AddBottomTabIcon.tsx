import {StyleSheet, Text, View, TouchableOpacity} from 'react-native'
import React, {useState} from 'react'
import AddOptionModal from './AddOptionModal'
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated'

import AddTabIcon from 'assets/images/svg/AddTabIcon.svg'
import {Colors, Typography} from 'src/utils/constants'
import {scaleFont, scaleSize} from 'src/utils/constants/mixins'
import TabsShape from '../CurveIcon'
import { ctaHaptic } from 'src/utils/helpers/hapticFeedbackHelper'



const AddBottomTabIcon = () => {
  const [open, setOpen] = useState(false)

  const rotation = useDerivedValue(() => {
    return withTiming(open ? '135deg' : '0deg')
  }, [open])

  const rotationStyle = useAnimatedStyle(() => ({
    transform: [{rotate: rotation.value}],
  }))

  const onAddPress = () => {
    ctaHaptic()
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
      <TabsShape/>
      <View style={styles.labelContainer}>
        <Text
          style={[
            styles.labelStyle,
            {color: open ? Colors.NEW_PRIMARY : Colors.TEXT_LIGHT},
          ]}>
          Add
        </Text>
      </View>
      <View style={styles.bottomBar}/>

    </TouchableOpacity>
  )
}

export default AddBottomTabIcon

const styles = StyleSheet.create({
  container: {
    height: 80,
    width: '100%',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  iconWrapper: {
    position: 'absolute',
    backgroundColor: 'white',
    height: scaleSize(58),
    width: scaleSize(58),
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 100,
    top: -scaleSize(38),
    left: scaleSize(11) ,
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
    bottom:16,
    left: '30%',
  },
  labelStyle: {
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: scaleFont(13),
  },
  bottomBar:{
    position:'absolute',
    bottom:-30,
    height:30,
    width:'100%',
    backgroundColor:Colors.WHITE
  }
})
