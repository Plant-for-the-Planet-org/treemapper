import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Colors, Typography } from 'src/utils/constants'
import { LogDetails } from 'src/types/interface/slice.interface'
import { activityLogTime } from 'src/utils/helpers/appHelper/dataAndTimeHelper'

interface Props {
    data: LogDetails
}

const LogCard = (props: Props) => {
    const {data} = props
    return (
        <View style={styles.container}>
            <Text style={styles.timeLable}>{activityLogTime(data.timestamp)} : {data.message}</Text>
        </View>
    )
}

export default LogCard

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 10,
        marginVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap'
    },
    timeLable: {
        fontSize: 12,
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        color: Colors.DARK_TEXT_COLOR,
        marginHorizontal: 10,
        lineHeight: 20
    }

})