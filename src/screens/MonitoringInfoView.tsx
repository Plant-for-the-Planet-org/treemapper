import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import Header from 'src/components/common/Header'
import { Colors, Typography } from 'src/utils/constants'
import YoutubePlayer from "react-native-youtube-iframe";
import i18next from 'src/locales/index'

const MonitoringInfoView = () => {
    return (
        <SafeAreaView style={styles.container}>
            <Header label='Monitoring Plots' />
            <ScrollView>
                <View style={styles.headerSection}>
                    <View style={styles.backDrop}></View>
                    <Text style={styles.headerNote}>
                        {i18next.t('label.m_info_h1')}
                    </Text>
                    <View style={styles.videoWrapper}>
                        <View style={styles.loaderWrapper}>
                            <ActivityIndicator size='small' />
                        </View>
                        <YoutubePlayer
                            height={300}
                            play={true}
                            videoId={"8UPHyT_oakM"}
                        />
                    </View>
                </View>
                <View style={styles.sectionWrapper}>
                    <Text style={styles.h2Label}>
                    {i18next.t('label.m_info_n1')}
                    </Text>
                    <Text style={styles.h1Label}>
                    {i18next.t('label.m_info_h2')}
                    </Text>
                    <Text style={styles.h3Label}>
                    {i18next.t('label.m_info_n2')}
                    </Text>
                    <Text style={styles.h1Label}>
                    {i18next.t('label.m_info_h3')}
                    </Text>
                    <Text style={styles.h2Label}>
                    {i18next.t('label.m_info_n3')}
                    </Text>
                    <Text style={styles.h1Label}>
                    {i18next.t('label.m_info_h4')}
                    </Text>
                    <Text style={styles.h2Label}>
                    {i18next.t('label.m_info_n4')}
                    </Text>
                    <Text style={styles.h1Label}>
                    {i18next.t('label.m_info_h5')}
                    </Text>
                    <Text style={styles.h2Label}>
                    {i18next.t('label.m_info_n5')}
                    </Text>
                </View>
                <View style={styles.divider}></View>
            </ScrollView>
        </SafeAreaView>
    )
}

export default MonitoringInfoView

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.WHITE
    },
    wrapper: {
        paddingBottom: 100
    },
    headerSection: {
        width: '100%',
        alignItems: 'center',
    },
    backDrop: {
        width: '100%',
        height: 140,
        backgroundColor: Colors.NEW_PRIMARY + '1A',
        position: 'absolute'
    },
    headerNote: {
        fontFamily: Typography.FONT_FAMILY_BOLD,
        fontSize: 14,
        color: Colors.DARK_TEXT_COLOR,
        marginVertical: 20
    },
    videoWrapper: {
        width: '80%',
        height: 180,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: Colors.GRAY_LIGHT,
    },
    loaderWrapper: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        zIndex: -1
    },
    sectionWrapper: {
        paddingHorizontal: 20,
        paddingTop: 20
    },
    h2Label: {
        fontSize: 16,
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        color: Colors.TEXT_COLOR,
        letterSpacing: 0.2
    },
    h1Label: {
        fontSize: 16,
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        color: Colors.DARK_TEXT_COLOR,
        letterSpacing: 0.2
    },
    h3Label: {
        fontSize: 15,
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        color: Colors.TEXT_COLOR,
        letterSpacing: 0.2,
        lineHeight: 24,
        marginLeft: 5
    },
    divider: {
        height: 100,
        width: 100
    }
})