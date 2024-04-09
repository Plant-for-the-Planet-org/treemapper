import {FlatList, StyleSheet, Text, View} from 'react-native'
import React from 'react'
import CtaArrow from 'assets/images/svg/CtaArrow.svg'
import { Colors } from 'src/utils/constants'

const CoordinatesList = () => {
  const renderCard = () => {
    return (
      <View style={styles.wrapper}>
        <View style={styles.card}>
          <View style={styles.metaWrapper}>
            <Text>Coordinate</Text>
            <Text>1298021,120938123809</Text>
          </View>
          <View style={styles.divider}/>
          <CtaArrow style={styles.ctaWrapper}/>
        </View>
      </View>
    )
  }
  return (
    <View style={styles.container}>
      <FlatList data={[1]} renderItem={() => renderCard()} />
    </View>
  )
}

export default CoordinatesList

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 10,
  },
  wrapper: {
    width: '70%',
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '90%',
    height: '100%',
    backgroundColor: Colors.GRAY_LIGHT,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider:{
    flex:1
  },
  ctaWrapper:{
    margin:10,
    marginLeft:10
  },
  metaWrapper:{
    marginLeft:10
  },
  coordinateTitle:{
    fontSize:16,
  },
  coordinatesLabel:{
    fontSize:14
  }
})
