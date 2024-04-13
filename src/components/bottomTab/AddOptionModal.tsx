import {
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  Dimensions,
} from 'react-native'
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated'

import SingleTreeIcon from 'assets/images/svg/SingleTreeIcon.svg'
import MultipleTreeIcon from 'assets/images/svg/MultipleTreeIcon.svg'
import Intervention from 'assets/images/svg/InterventionIcon.svg'
import ChartIcon from 'assets/images/svg/ChartIcon.svg'
import CrossArrow from 'assets/images/svg/CrossArrowIcon.svg'
import {StackNavigationProp} from '@react-navigation/stack'
import React, {useMemo} from 'react'
import i18next from 'src/locales'
import * as Colors from 'src/utils/constants/colors'
import * as Typography from 'src/utils/constants/typography'
import {scaleFont, scaleSize} from 'src/utils/constants/mixins'
import {useNavigation} from '@react-navigation/native'
import {RootStackParamList} from 'src/types/type/navigation.type'

const {width, height} = Dimensions.get('screen')

interface Props {
  visible: boolean
  setVisible: (val: boolean) => void
}

const AddOptionModal = (props: Props) => {
  const heightValue = useDerivedValue(() => {
    return withTiming(props.visible ? 0 : 600, {duration: 500})
  }, [props.visible])

  const opacity = useDerivedValue(() => {
    return withTiming(props.visible ? 1 : 0, {
      duration: props.visible ? 700 : 100,
    })
  }, [props.visible])

  const animatedStyles = useAnimatedStyle(() => ({
    transform: [{translateY: heightValue.value}],
    opacity: opacity.value,
  }))

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

  const addOptions = [
    {
      svgIcon: <ChartIcon width={25} height={25} />,
      title: 'Monitoring Plot',
      coming_soon: true,
      onPress: () => {
        navigation.navigate('InterventionForm', {id: 'UNKOWN'})
        props.setVisible(false)
      },
      disabled: false,
    },
    {
      svgIcon: <CrossArrow width={25} height={25} />,
      title: 'Project Site',
      coming_soon: true,
      onPress: () => {
        navigation.navigate('InterventionForm', {id: 'UNKOWN'})
        props.setVisible(false)
      },
      disabled: true,
    },
    {
      svgIcon: <Intervention width={25} height={25} />,
      title: 'Intervention',
      coming_soon: false,
      onPress: () => {
        navigation.navigate('InterventionForm', {id: 'UNKOWN'})
        props.setVisible(false)
      },
      disabled: false,
    },
    {
      svgIcon: <SingleTreeIcon width={25} height={25} />,
      title: 'label.tree_registration_type_1',
      coming_soon: false,
      onPress: () => {
        navigation.navigate('InterventionForm', {id: 'SINGLE_TREE'})
        props.setVisible(false)
      },
      disabled: false,
    },
    {
      svgIcon: <MultipleTreeIcon width={25} height={25} />,
      title: 'label.tree_registration_type_2',
      coming_soon: false,
      onPress: () => {
        navigation.navigate('InterventionForm', {id: 'MULTI_TREE'})
        props.setVisible(false)
      },
      disabled: false,
    },
  ]

  const calcComponents = useMemo(() => {
    return addOptions.map((option, index) => (
      <TouchableOpacity
        key={`addOption${index}`}
        style={styles.addButtonOptionWrap}
        disabled={option.disabled}
        onPress={option.onPress}>
        <View style={styles.addButtonOption}>
          <View style={styles.icon}>{option.svgIcon}</View>
          <View>
            <Text style={styles.text}>{i18next.t(option.title)}</Text>
            {option.coming_soon && (
              <Text style={styles.coming_soon}>Coming Soon</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    ))
  }, [addOptions])

  return (
    <>
      {props.visible && (
        <TouchableOpacity
          onPress={() => props.setVisible(false)}
          style={{
            height,
            width,
            position: 'absolute',
          }}
          activeOpacity={1}
        />
      )}
      <Animated.View
        style={[
          {
            overflow: 'hidden',
            position: 'absolute',
            right: 10,
            bottom: scaleSize(110),
            backgroundColor: 'white',
            borderRadius: 12,
            elevation: 4,
            paddingLeft: scaleSize(15),
            paddingRight: scaleSize(15),
            paddingVertical: scaleSize(10),
            width: scaleSize(210),
            zIndex: 10,
          },
          animatedStyles,
        ]}>
        <Animated.View style={{zIndex: 100}}>{calcComponents}</Animated.View>
      </Animated.View>
    </>
  )
}

export default AddOptionModal

const styles = StyleSheet.create({
  addButtonOptionWrap: {
    borderRadius: 8,
    marginVertical: scaleFont(5),
  },
  addButtonOption: {
    backgroundColor: Colors.PRIMARY + '1A',
    flexDirection: 'row',
    height: 40,
    alignItems: 'center',
    paddingVertical: scaleFont(3),
    paddingHorizontal: scaleFont(5),
    borderRadius: 8,
    borderWidth: 1,
    paddingLeft: scaleFont(6),
    borderColor: Colors.PRIMARY + '1A',
    flexWrap: 'wrap',
  },
  icon: {
    marginRight: 6,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  text: {
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: scaleFont(14),
    color: Colors.TEXT_COLOR,
  },
  coming_soon: {
    fontSize: scaleFont(8),
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
  },
})
