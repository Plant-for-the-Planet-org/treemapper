import { StyleSheet, Text, View, Dimensions, Pressable } from 'react-native'
import React, { useState } from 'react'
import AddOptionModal from './AddOptionModal'
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated'

import AddTabIcon from 'assets/images/svg/AddTabIcon.svg'
import { Colors, Typography } from 'src/utils/constants'
import { ctaHaptic } from 'src/utils/helpers/hapticFeedbackHelper'
import { Svg, Defs, Rect, Mask, Circle } from 'react-native-svg';
import i18next from 'i18next'
const windowWidth = Dimensions.get('window').width;

const WrappedSvg = () => (
  <View style={{
    aspectRatio: 1, borderTopRightRadius: 10,
    overflow: "hidden"
  }}>
    <Svg>
      <Defs>
        <Mask id="mask" x="0" y="0" height="100%" width="100%">
          <Rect height="100%" width="100%" fill="#fff" />
          <Circle r={windowWidth / 9} cx={windowWidth / 9} cy="-2 " />
        </Mask>
      </Defs>
      <Rect height="100%" width="100%" fill="white" mask="url(#mask)" fill-opacity="0" />
    </Svg>
  </View>
);


const AddBottomTabIcon = () => {
  const [open, setOpen] = useState(false)

  const rotation = useDerivedValue(() => {
    return withTiming(open ? '135deg' : '0deg')
  }, [open])

  const rotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: rotation.value }],
  }))

  const onAddPress = () => {
    ctaHaptic()
    setOpen(prev => !prev)
  }
  return (
    <View style={{ flex: 1, justifyContent: "center" }}>
      {open && <Pressable
        onPress={() => { setOpen(false) }}
        style={styles.bakDrop}
      />}
      <View style={{ width: windowWidth / 4, height: '100%', position: 'absolute' }}>
        <WrappedSvg />
      </View>
      <Pressable
        style={styles.addIconContainer}
        onPress={() => onAddPress()}>
        <View style={styles.iconWrapper}>
          <Animated.View style={[rotationStyle]}>
            <AddTabIcon />
          </Animated.View>
        </View>
        <AddOptionModal setVisible={setOpen} visible={open} />
      </Pressable>
      <View style={styles.labelContainer}>
        <Text
          style={[
            styles.labelStyle,
            { color: open ? Colors.NEW_PRIMARY : Colors.TEXT_LIGHT },
          ]}>
          {i18next.t("label.add")}
        </Text>
      </View>
      <View style={styles.bottomBar}></View>
    </View>
  );
}

export default AddBottomTabIcon;


const styles = StyleSheet.create({
  container: {
    height: '100%',
    backgroundColor: "white"
  },
  addIconContainer: {
    width: windowWidth / 5.5,
    height: windowWidth / 5.5,
    backgroundColor: Colors.WHITE,
    borderRadius: windowWidth / 6,
    justifyContent: 'center',
    alignItems: "center",
    position: 'absolute',
    top: -windowWidth / 10,
    left: '8%',
    shadowColor: Colors.GRAY_DARK,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 0.5,
    zIndex:10
  },
  iconWrapper: {
    // marginBottom:5
  },
  labelContainer: {
    width: '100%',
    paddingTop: '40%',
    paddingLeft: '6.5%'
  },
  labelStyle: {
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: 13,
    textAlign: 'center',
    paddingRight: '15%',
  },
  bottomBar: {
    position: 'absolute',
    bottom: -20,
    height: 30,
    width: '100%',
    backgroundColor: 'white',
    zIndex: -1
  },
  bakDrop: {
    position: 'absolute',
    zIndex: 1,
    width: Dimensions.get('screen').width,
    height: Dimensions.get('screen').height+100,
    top: -Dimensions.get('screen').height,
    left: -Dimensions.get('screen').width + 100,
  }
})
