import React from 'react'
import { StyleSheet, View } from 'react-native'
import Svg, { Path } from 'react-native-svg'

import * as Colors from 'src/utils/constants/colors'
import { buildTabBarPath, TabBarGeometry } from './tabBarGeometry'

interface Props {
  geometry: TabBarGeometry
}

/**
 * The white bar and the bite under the "+" button, drawn as a single path.
 *
 * It used to be one white View per tab plus a masked square SVG in the last
 * one, which meant the curve was stitched together from pieces that each
 * scaled differently and only lined up on the phone it was written on.
 */
const TabBarBackground = (props: Props) => {
  const { geometry } = props
  // The plain View carries pointerEvents, not the Svg: taps on the ring and
  // on the empty space above the bar have to reach the map underneath.
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg
        width={geometry.width}
        height={geometry.containerHeight}
        viewBox={`0 0 ${geometry.width} ${geometry.containerHeight}`}>
        <Path
          d={buildTabBarPath(geometry)}
          fill={Colors.WHITE}
          fillRule="evenodd"
        />
      </Svg>
    </View>
  )
}

export default React.memo(TabBarBackground)
