import {StyleSheet, Text, View} from 'react-native'
import React from 'react'
import { scaleFont, scaleSize } from 'src/utils/constants/mixins'
import { Colors, Typography } from 'src/utils/constants'

interface Props {
  lat: number
  long: number
  id: string
}

const DispalyCurrentPolygonMarker = (props: Props) => {
  const {id} = props
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Corner {id}</Text>
      <Text style={styles.note}>Please select the next corner</Text>
    </View>
  )
}

export default DispalyCurrentPolygonMarker

const styles = StyleSheet.create({
    container:{
        width:'100%',
        height:scaleSize(50),
        backgroundColor:Colors.WHITE,
        paddingHorizontal:20
    },
    label:{
        fontSize:scaleFont(18),
        fontFamily:Typography.FONT_FAMILY_BOLD
    },
    note:{
      fontSize:scaleFont(14),
      fontFamily:Typography.FONT_FAMILY_REGULAR
    }
})
