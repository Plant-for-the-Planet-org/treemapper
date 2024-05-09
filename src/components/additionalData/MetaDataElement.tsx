import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Colors, Typography } from 'src/utils/constants'




const MetaDataElement = () => {
  return (
    <View style={styles.cotnainer}>
      <View style={styles.wrapper}>
        <View style={styles.sectionWrapper}>
          <Text style={styles.keyLabel}>Hello wored</Text>
          <Text style={styles.keyValue}>Hello wored</Text>
        </View>
      </View>
    </View>
  )
}

export default MetaDataElement

const styles = StyleSheet.create({
  cotnainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: "center"
  },
  wrapper: {
    width: "90%",
    paddingVertical: 10,
  },
  sectionWrapper: {
    backgroundColor: Colors.NEW_PRIMARY + '1A',
    paddingBottom: 20,
    paddingLeft: 10,
    borderRadius: 8
  },
  keyLabel: {
    fontSize: 16,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.TEXT_COLOR,
    marginVertical: 10
  },
  keyValue: {
    fontSize: 16,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.TEXT_COLOR,
    width: "90%",
    backgroundColor: Colors.WHITE,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10
  },
})