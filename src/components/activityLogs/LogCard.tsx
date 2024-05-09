import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Colors, Typography } from 'src/utils/constants'

const LogCard = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.timeLable}>20 Dec-10:30 AM : LogCard Log  jkla aidj CardLog LogCard CardLogCard LogCard LogCard</Text>
        </View>
    )
}

export default LogCard

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 10,
        marginVertical: 10,
        flexDirection:'row',
        alignItems:'center',
        flexWrap:'wrap'
    },
    timeLable:{
        fontSize: 12,
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        color: Colors.DARK_TEXT_COLOR,
        marginHorizontal:10,
        lineHeight:20
    }

})