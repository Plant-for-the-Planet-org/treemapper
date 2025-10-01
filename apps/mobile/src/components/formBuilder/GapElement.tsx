import { StyleSheet, View } from 'react-native'
import React from 'react'
import { Colors } from 'src/utils/constants'

const GapElement = () => {
  return (
    <View style={styles.container}>
        <View style={styles.wrapper}/>
    </View>
  )
}

export default GapElement

const styles = StyleSheet.create({
    container:{
        width:'100%',
        height:1,
        marginTop:10,
        marginBottom:15,
        justifyContent:'center',
        alignItems:'center'
    },
    wrapper:{
        width:'90%',
        height:'100%',
        backgroundColor:Colors.TEXT_COLOR,
    }
})