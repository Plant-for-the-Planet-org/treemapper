import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import React from 'react'
import { Colors, Typography } from 'src/utils/constants'
import { scaleFont } from 'src/utils/constants/mixins'
import CleanerPhone from 'assets/images/svg/ClearPhone.svg';

const FreeUpSaceButton = () => {
  return (
    <TouchableOpacity style={styles.container}>
     <View style={styles.wrapper}>
        <CleanerPhone width={25} height={25}/>
        <Text style={styles.lable}>Free up space</Text>
     </View>
    </TouchableOpacity>
  )
}

export default FreeUpSaceButton

const styles = StyleSheet.create({
    container:{
        width:'35%',
        height:'100%',
        justifyContent:"center",
        alignItems:'center',
        marginRight:15,
    },
    wrapper:{
        backgroundColor:Colors.NEW_PRIMARY + '1A',
        height:'70%',
        width:'100%',
        borderRadius:8,
        flexDirection:'row',
        alignItems:'center',
        justifyContent:'space-around'
    },
    lable:{
        fontSize:scaleFont(12),
        fontFamily:Typography.FONT_FAMILY_BOLD,
        marginRight:10
    }
})