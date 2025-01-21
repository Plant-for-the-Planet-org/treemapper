import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Colors, Typography } from 'src/utils/constants'


//Uploading Intervention 
const SyncInfo = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.textLabel}>Info</Text>
      <View style={styles.connector}/>
    </View>
  )
}

export default SyncInfo

const styles = StyleSheet.create({
    container:{
        position:'absolute',
        top:50,
        backgroundColor:Colors.GRAY_BACKDROP,
        justifyContent:'center',
        alignItems:'center',
        borderRadius:12,
        width:'150%'
    },
    connector:{
        position:'absolute',
        width:15,
        height:15,
        backgroundColor:Colors.GRAY_BACKDROP,
        right:'40%',
        top:-8,
        transform: [{ rotate: '45deg'}],
        borderRadius:2,
        zIndex:-1
    },
    textLabel:{
        width:'90%',
        fontSize:14,
        fontFamily:Typography.FONT_FAMILY_SEMI_BOLD,
        color:Colors.WHITE,
        paddingVertical:10,
        paddingHorizontal:10
    },

})