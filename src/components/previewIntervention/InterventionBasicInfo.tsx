import {StyleSheet, Text, View} from 'react-native'
import React from 'react'
import { Colors } from 'src/utils/constants'

const InterventionBasicInfo = () => {
  return (
    <View style={styles.container}>
      <View style={styles.wrapper}>
        <View style={styles.cardWrapper}>
          <Text style={styles.cardTitle}>Intervention Date</Text>
          <Text style={styles.cardLabel}>26 Jan, 2012</Text>
        </View>
        <View style={styles.cardWrapper}>
          <Text style={styles.cardTitle}>Type</Text>
          <Text style={styles.cardLabel}>Direct Seeding</Text>
        </View>
        <View style={styles.cardWrapper}>
          <Text style={styles.cardTitle}>Project</Text>
          <Text style={styles.cardLabel}>Yucatan Reforestaiton</Text>
        </View>
        <View style={styles.cardWrapper}>
          <Text style={styles.cardTitle}>Site</Text>
          <Text style={styles.cardLabel}>Las Americas 7</Text>
        </View>
      </View>
    </View>
  )
}

export default InterventionBasicInfo

const styles = StyleSheet.create({
  container: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wrapper: {
    width: '90%',
    borderRadius: 20,
    backgroundColor: 'white',
    paddingVertical: 20,
    borderColor:Colors.GRAY_BACKDROP,
  },
  cardWrapper: {
    width: '100%',
    height: 55,
    paddingHorizontal:20
  },
  cardTitle: {
    fontSize: 16,
    color: 'lightgray',
  },
  cardLabel: {
    fontSize: 14,
    color: 'gray',
    fontWeight:'500'
  },
})
