import { ActivityIndicator, SafeAreaView, StyleSheet, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import Header from 'src/components/common/Header'
import ActivityLogsTab from 'src/components/activityLogs/ActivityLogsTab'
import { Colors } from 'src/utils/constants'
import { useRealm } from '@realm/react'
import { View } from 'moti'
import Share from 'react-native-share';
import { RealmSchema } from 'src/types/enum/db.enum'
import { toBase64 } from 'src/utils/constants/base64'
import ShareIcon from 'assets/images/svg/ShareIcon.svg';

const ActivityLogsView = () => {
    const [loading, showLoading] = useState(false)
    const realm = useRealm();

    const getAllLogs = async () => {
        showLoading(true)
        const allLogs = realm
            .objects(RealmSchema.ActivityLogs)
        shareLogs(allLogs)
    }

    const shareLogs = async (logs: any) => {
        const options = {
            url: 'data:application/json;base64,' + toBase64(JSON.stringify(logs)),
            message: "All user logs for TreeMapper app",
            title: "Activity Logs",
            filename: `TreeMapper GeoJSON`,
            saveToFiles: true,
        };
        Share.open(options)
            .then(() => {
                showLoading(false)
            })
            .catch(err => {
                showLoading(false)
                // shows error if occurred and not canceled by the user
                if (err?.error?.code != 'ECANCELLED500' && err?.message !== 'User did not share') {
                    // iOS cancel button pressed
                    console.log("iOS cancel button pressed")
                }
            });
    }

    const renderShareIcon = () => {
        return (<TouchableOpacity onPress={getAllLogs} style={styles.rightContainer}>
            <ShareIcon width={20} height={20} />
        </TouchableOpacity>)
    }

    return (
        <SafeAreaView style={styles.container}>
            <Header label="Activity Logs" rightComponet={renderShareIcon()} />
            <ActivityLogsTab />
            {loading && <View style={styles.modal} ><ActivityIndicator size='small' color={Colors.NEW_PRIMARY}></ActivityIndicator></View>}
        </SafeAreaView>
    )
}

export default ActivityLogsView

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.WHITE,
        paddingTop: 20
    },
    modal: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: "rgba(0,0,0,0.5)",
        zIndex: 1,
        position: 'absolute'
    },
    rightContainer: {
        width: 80,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center'
    }
})