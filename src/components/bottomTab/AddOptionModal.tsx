import {
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  Dimensions,
  Pressable,
} from 'react-native'
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated'

import { StackNavigationProp } from '@react-navigation/stack'
import React, { useEffect, useMemo } from 'react'
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
import { useToast } from 'react-native-toast-notifications'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/store'
import EyeIcon from 'assets/images/svg/EyeIcon.svg'
import DropDownIcon from 'assets/images/svg/DownIcon.svg'
import { updateProjectModal } from 'src/store/slice/displayMapSlice'
import useLocationPermission from 'src/hooks/useLocationPermission'


interface Props {
  visible: boolean
  setVisible: (val: boolean) => void
}

const AddOptionModal = (props: Props) => {
  const heightValue = useDerivedValue(() => {
    return withTiming(props.visible ? 0 : 600, { duration: 500 })
  }, [props.visible])
  const { userCurrentLocation } = useLocationPermission()
  const currentProject = useSelector((state: RootState) => state.projectState.currentProject)
  const userType = useSelector((state: RootState) => state.userState.type)
  const GPSLocation = useSelector((state: RootState) => state.gpsState.user_location)

  const dispatch = useDispatch()
  const opacity = useDerivedValue(() => {
    return withTiming(props.visible ? 1 : 0, {
      duration: props.visible ? 700 : 100,
    })
  }, [props.visible])

  const animatedStyles = useAnimatedStyle(() => ({
    transform: [{ translateY: heightValue.value }],
    opacity: opacity.value,
  }))
  const toast = useToast()

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

  useEffect(() => {
    checkWhetherProjectIsSelected()
  }, [props.visible])

  const checkWhetherProjectIsSelected = () => {
    if (userType === 'tpo' && currentProject.projectId === '' && props.visible) {
      toggleModal()
      return false
    }
    return true;
  }

  const provideLocation = () => {
      if (GPSLocation[0] === 0) {
        userCurrentLocation().catch((error) => { // Use .catch() to handle errors
          console.log("Error:", error); 
        });
      }
  };

  const addOptions = [
    {
      svgIcon: <ChartIcon width={SCALE_24} height={SCALE_24} />,
      title: i18next.t('label.monitoring_plot'),
      coming_soon: true,
      onPress: () => {
        toast.hideAll()
        toast.show(i18next.t('label.coming_soon'))
        props.setVisible(false)
      },
      disabled: false,
    },
    {
      svgIcon: <CrossArrow width={SCALE_24} height={SCALE_24} />,
      title: i18next.t('label.project_sites'),
      coming_soon: false,
      onPress: () => {
        if (userType !== 'tpo') {
          toast.hideAll()
          toast.show("Please login from RO account")
          props.setVisible(false)
        } else {
          provideLocation()
          navigation.navigate('ProjectSites')
          props.setVisible(false)
        }
      },
      disabled: false,
    },
    {
      svgIcon: <Intervention width={SCALE_24} height={SCALE_24} />,
      title: i18next.t('label.intervention'),
      coming_soon: false,
      onPress: () => {
        if (checkWhetherProjectIsSelected()) {
          provideLocation()
          navigation.navigate('InterventionForm')
          props.setVisible(false)
        }
      },
      disabled: false,
    },
    {
      svgIcon: <SingleTreeIcon width={SCALE_24} height={SCALE_24} />,
      title: i18next.t('label.single_tree'),
      coming_soon: false,
      onPress: () => {
        if (checkWhetherProjectIsSelected()) {
          provideLocation()
          navigation.navigate('InterventionForm', {
            id: 'single-tree-registration',
          })
          props.setVisible(false)
        }
      },
      disabled: false,
    },
    {
      svgIcon: <MultipleTreeIcon width={SCALE_24} height={SCALE_24} />,
      title: i18next.t('label.multiple_trees'),
      coming_soon: false,
      onPress: () => {
        if (checkWhetherProjectIsSelected()) {
          provideLocation()
          navigation.navigate('InterventionForm', {
            id: 'multi-tree-registration',
          })
          props.setVisible(false)
        }
      },
      disabled: false,
    },
  ]

  const toggleModal = () => {
    dispatch(updateProjectModal(true))
  }

  const calcComponents = useMemo(() => {
    return addOptions.map((option) => {
      return (
        (
          <TouchableOpacity
            key={String(option.title)}
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
        )
      )
    })
  }, [addOptions])
  const ProjectName = currentProject.projectName || ''
  return (
    <Animated.View
      style={[
        styles.container,
        animatedStyles,
      ]}>
      <Animated.View style={{ zIndex: 10 }}><>
        <View style={[styles.projectContainer, { paddingVertical: ProjectName ? 3 : 8 }]}>
          {!!ProjectName && <Pressable style={styles.projectWrapper} onPress={toggleModal}>
            <View style={styles.eyeIconWrapper}>
              <EyeIcon />
            </View>
            <View style={styles.projectSection}>
              <Text style={styles.projectLabel}>
                {i18next.t('label.project')}
              </Text>
              <Text style={styles.projectName}>{ProjectName}</Text>
            </View>
            <View style={styles.projectDown}>
              <View style={styles.divider} />
              <DropDownIcon />
            </View>
          </Pressable>
          }</View>
        {calcComponents}</></Animated.View>
    </Animated.View>
  )
}

export default AddOptionModal

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'absolute',
    right: 10,
    bottom: 90,
    paddingBottom: 10,
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 4,
    width: Dimensions.get('window').width / 1.5,
    zIndex: 2,
  },
  addButtonOptionWrap: {
    borderRadius: 8,
    marginVertical: scaleFont(5),
    paddingLeft: 15,
    paddingRight: 15,
  },
  addButtonOption: {
    backgroundColor: '#E5F2ED',
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
  projectContainer: {
    width: "100%", justifyContent: 'center', alignItems: 'center'
  },
  projectWrapper: {
    width: '98%', height: 50, backgroundColor: '#E5F2ED', borderTopLeftRadius: 10, borderTopRightRadius: 10, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20
  },
  eyeIconWrapper: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  projectSection: {
    flex: 1,
    paddingHorizontal: 10
  },
  projectLabel: {
    fontSize: 12,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.NEW_PRIMARY,
  },
  projectName: {
    fontSize: 12,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
  },
  divider: {
    flex: 1
  },
  projectDown: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15
  }
})
