import React from 'react'
import {View, StyleSheet} from 'react-native'
import {BottomTabBarProps} from '@react-navigation/bottom-tabs'
import CurveTab from 'assets/images/svg/CurveTab.svg'
import BottomTabIcon from './BottomTabIcon'

const TabBar = ({state, descriptors, navigation}: BottomTabBarProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.wrapper}>
        <CurveTab />
      </View>
      <View style={styles.tabIconContainer}>
        {state.routes.map((route, index) => {
          const {options} = descriptors[route.key]
          const label = options.tabBarLabel || options.title || route.name

          const isFocused = state.index === index

          const onPress = () => {
            navigation.navigate('Plots')
          }

          return (
            <BottomTabIcon
              label={label}
              index={index}
              onPress={onPress}
              key={route.key}
              isFocused={isFocused}
            />
          )
        })}
      </View>
    </View>
  )
}

export default TabBar

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 60,
  },
  wrapper: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  tabIconContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
})
