import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import React from 'react'
import { Colors, Typography } from 'src/utils/constants'
import { Metadata } from 'src/types/interface/app.interface'

interface Props{
  data: Metadata
  handleSelection: (e:Metadata)=>void
}


const MetaDataElement = (props:Props) => {
  const {data, handleSelection} = props
  const editDetails = ()=>{
    handleSelection(data)
  }
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.wrapper} onPress={editDetails}>
        <View style={styles.sectionWrapper}>
          <Text style={styles.keyLabel}>{data.key}</Text>
          <Text style={styles.keyValue}>{data.value}</Text>
        </View>
      </TouchableOpacity>
    </View>
  )
}

export default MetaDataElement

const styles = StyleSheet.create({
  container: {
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