import React, { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { BottomTabBarProps } from '@react-navigation/bottom-tabs'

import * as Colors from 'src/utils/constants/colors'
import { Typography } from 'src/utils/constants'
import BottomTabIcon from './BottomTabIcon'
import AddBottomTabIcon from './AddBottomTabIcon'
import TabBarBackground from './TabBarBackground'
import { getTabBarGeometry } from './tabBarGeometry'

/** The last tab is the "+" button, not a screen. */
const ADD_ROUTE = 'Add'

const resolveLabel = (label: unknown, fallback: string) =>
  typeof label === 'string' ? label : fallback

/**
 * Custom tab bar.
 *
 * It replaces a per-tab `tabBarIcon` plus a `tabBarButton` that each painted
 * their own slice of white and their own piece of the curve. The bar is now
 * one shape and one row of cells, measured from live window width and the
 * safe-area inset, so it holds up on a small phone, a tablet and after a
 * rotation instead of only on the device it was tuned for.
 *
 * The container is taller than the visible bar by the button's overhang, and
 * `box-none` so taps above the bar still reach the map. Keeping the button
 * inside those bounds -- rather than hanging it off a negative offset the way
 * the old `tabBarButton` did -- is what lets the bar be laid out by one set of
 * numbers instead of one per piece.
 */
const BottomTabBar = (props: BottomTabBarProps) => {
  const { state, descriptors, navigation, insets } = props
  const { width, fontScale } = useWindowDimensions()
  const [addOpen, setAddOpen] = useState(false)

  const geometry = useMemo(
    () =>
      getTabBarGeometry({
        width,
        bottomInset: insets.bottom,
        tabCount: state.routes.length,
        fontScale,
      }),
    [width, insets.bottom, state.routes.length, fontScale],
  )

  const onTabPress = (
    routeKey: string,
    routeName: string,
    isFocused: boolean,
  ) => {
    const event = navigation.emit({
      type: 'tabPress',
      target: routeKey,
      canPreventDefault: true,
    })
    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(routeName)
    }
  }

  return (
    <View
      pointerEvents="box-none"
      style={[styles.container, { height: geometry.containerHeight }]}>
      <TabBarBackground geometry={geometry} />
      <View
        style={[
          styles.row,
          { top: geometry.barTop, height: geometry.barHeight },
        ]}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index
          const label = resolveLabel(
            descriptors[route.key]?.options?.tabBarLabel,
            route.name,
          )
          const cellStyle = [
            styles.cell,
            { width: geometry.tabWidth, paddingBottom: geometry.bottomInset },
          ]

          if (route.name === ADD_ROUTE) {
            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityLabel={label}
                style={cellStyle}
                onPress={() => setAddOpen(!addOpen)}>
                {/* Empty slot where the "+" button floats, so "Add" sits on
                    the same baseline as the other three labels. */}
                <View style={{ height: geometry.iconSize }} />
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                  style={[
                    styles.labelStyle,
                    {
                      color: addOpen ? Colors.NEW_PRIMARY : Colors.TEXT_LIGHT,
                      fontSize: geometry.labelFontSize,
                      paddingTop: geometry.labelGap,
                      transform: [{ translateX: geometry.addLabelOffset }],
                    },
                  ]}>
                  {label}
                </Text>
              </Pressable>
            )
          }

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={label}
              style={cellStyle}
              onPress={() => onTabPress(route.key, route.name, isFocused)}>
              <BottomTabIcon
                label={label}
                index={index}
                isFocused={isFocused}
                size={geometry.iconSize}
                fontSize={geometry.labelFontSize}
                labelGap={geometry.labelGap}
              />
            </Pressable>
          )
        })}
      </View>
      <AddBottomTabIcon
        geometry={geometry}
        open={addOpen}
        setOpen={setAddOpen}
      />
    </View>
  )
}

export default BottomTabBar

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  row: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  cell: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelStyle: {
    fontFamily: Typography.FONT_FAMILY_BOLD,
    textAlign: 'center',
    paddingHorizontal: 2,
  },
})
