import { SafeAreaView, StyleSheet} from 'react-native'
import React from 'react'
import Header from 'src/components/common/Header'
import ActivityLogsTab from 'src/components/activityLogs/ActivityLogsTab'
import { Colors } from 'src/utils/constants'

const ActivityLogsView = () => {
    return (
        <SafeAreaView style={styles.container}>
            <Header label="Activity Logs" />
            <ActivityLogsTab />
        </SafeAreaView>
    )
}

export default ActivityLogsView

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.WHITE
    }
})