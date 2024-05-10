import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Colors, Typography } from 'src/utils/constants'


interface Props {
    data: any
}

const AddDataElement = (props:Props) => {
    const {data} = props
    const renderBody=()=>{
     switch (data) {
        case "input":
        return (
            <Text style={styles.inputWrapper}>
                Heell
            </Text>
        )
        case "yes_no":
            return (
                <View style={styles.yesNoWrapper}>
                    <Text>Yes no</Text>
                </View>
            )
         
        default:
            return (
                <View ></View>
            )
     }
    }

  return (
    <View style={styles.cotnainer}>
      <View style={styles.wrapper}>
        <View style={styles.sectionWrapper}>
          <Text style={styles.keyLabel}>Input Element</Text>
          <View style={styles.bodyWrapper}>
          {renderBody()}
            </View>
        </View>
      </View>
    </View>
  )
}

export default AddDataElement

const styles = StyleSheet.create({
  cotnainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: "center",
  },
  wrapper: {
    width: "90%",
    paddingVertical: 10,
  },
  sectionWrapper: {
    paddingBottom: 20,
    paddingLeft: 10,
    borderRadius: 8,
    borderWidth:0.8,
    borderColor:Colors.GRAY_LIGHT
  },
  keyLabel: {
    fontSize: 16,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.TEXT_COLOR,
    marginVertical: 10
  },
  bodyWrapper:{
    width: "90%",
    backgroundColor: Colors.WHITE,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    alignItems:'center',
    flexDirection:'row',
    borderWidth:1,
    borderColor:Colors.TEXT_COLOR,
    borderStyle:'dotted'
  },
  inputWrapper:{
    fontSize:18,
    fontFamily:Typography.FONT_FAMILY_SEMI_BOLD,
    color:Colors.TEXT_COLOR,
    marginLeft:10
  },
  yesNoWrapper:{
    width:'100%',
    height:'100%',
    alignItems:"center",
    paddingLeft:10
  }
})