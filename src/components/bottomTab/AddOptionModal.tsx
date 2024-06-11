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

import { StackNavigationProp } from '@react-navigation/stack'
import React, { useMemo } from 'react'
import i18next from 'src/locales'
import * as Colors from 'src/utils/constants/colors'
import * as Typography from 'src/utils/constants/typography'
import { scaleFont, scaleSize } from 'src/utils/constants/mixins'
import { useNavigation } from '@react-navigation/native'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { SCALE_24 } from 'src/utils/constants/spacing'

import SingleTreeIcon from 'assets/images/svg/RoundTreeIcon.svg'
import MultipleTreeIcon from 'assets/images/svg/MultipleTreeIcon.svg'
import Intervention from 'assets/images/svg/InterventionIcon.svg'
import ChartIcon from 'assets/images/svg/ChartIcon.svg'
import CrossArrow from 'assets/images/svg/CrossArrowIcon.svg'

const { width, height } = Dimensions.get('screen')

interface Props {
  visible: boolean
  setVisible: (val: boolean) => void
}

const AddOptionModal = (props: Props) => {
  const heightValue = useDerivedValue(() => {
    return withTiming(props.visible ? 0 : 600, { duration: 500 })
  }, [props.visible])

  const opacity = useDerivedValue(() => {
    return withTiming(props.visible ? 1 : 0, {
      duration: props.visible ? 700 : 100,
    })
  }, [props.visible])

  const animatedStyles = useAnimatedStyle(() => ({
    transform: [{ translateY: heightValue.value }],
    opacity: opacity.value,
  }))

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

  const addOptions = [
    {
      svgIcon: <ChartIcon width={SCALE_24} height={SCALE_24} />,
      title: i18next.t('label.monitoring_plot'),
      coming_soon: false,
      onPress: () => {
        navigation.navigate('CreatePlot')
        props.setVisible(false)
      },
      disabled: false,
    },
    {
      svgIcon: <CrossArrow width={SCALE_24} height={SCALE_24} />,
      title: i18next.t('label.project_sites'),
      coming_soon: true,
      onPress: () => {
        // navigation.navigate('InterventionForm', {id: 'UNKOWN'})
        props.setVisible(false)
      },
      disabled: true,
    },
    {
      svgIcon: <Intervention width={SCALE_24} height={SCALE_24} />,
      title: i18next.t('label.intervention'),
      coming_soon: false,
      onPress: () => {
        navigation.navigate('InterventionForm')
        props.setVisible(false)
      },
      disabled: false,
    },
    {
      svgIcon: <SingleTreeIcon width={SCALE_24} height={SCALE_24} />,
      title: i18next.t('label.single_tree'),
      coming_soon: false,
      onPress: () => {
        navigation.navigate('InterventionForm', {
          id: 'single-tree-registration',
        })
        props.setVisible(false)
      },
      disabled: false,
    },
    {
      svgIcon: <MultipleTreeIcon width={SCALE_24} height={SCALE_24} />,
      title: i18next.t('label.multiple_trees'),
      coming_soon: false,
      onPress: () => {
        navigation.navigate('AddPlotDetails')
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
              <Text style={styles.coming_soon}>{i18next.t('label.coming_soon')}</Text>
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
            zIndex: 10,
            left: -width + 100,
            top: -height + 100
          }}
        />
      )}
      <Animated.View
        style={[
          {
            overflow: 'hidden',
            position: 'absolute',
            right: scaleSize(20),
            bottom: scaleSize(120),
            backgroundColor: 'white',
            borderRadius: 12,
            elevation: 4,
            paddingLeft: scaleSize(15),
            paddingRight: scaleSize(15),
            paddingVertical: scaleSize(10),
            width: scaleSize(220),
            zIndex: 10,
          },
          animatedStyles,
        ]}>
        <Animated.View style={{ zIndex: 10 }}>{calcComponents}</Animated.View>
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
    height: scaleSize(45),
    alignItems: 'center',
    borderRadius: 8,
  },
  icon: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 15,
    marginRight: 10,
  },
  text: {
    fontFamily: Typography.FONT_FAMILY_EXTRA_BOLD,
    fontSize: scaleFont(14),
    color: Colors.TEXT_COLOR,
  },
  coming_soon: {
    fontSize: scaleFont(8),
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.NEW_PRIMARY,
  },
})
