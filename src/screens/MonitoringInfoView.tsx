import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import Header from 'src/components/common/Header'
import { Colors, Typography } from 'src/utils/constants'
import YoutubePlayer from "react-native-youtube-iframe";

const MonitoringInfoView = () => {
    return (
        <SafeAreaView style={styles.container}>
            <Header label='Monitoring Plots' />
            <ScrollView>
                <View style={styles.headerSection}>
                    <View style={styles.backDrop}></View>
                    <Text style={styles.headerNote}>
                        How do I set up a monitoring plot?
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
                        We recommend working in a team of two; one person to measure, one person to record in TreeMapper. Together it should take you about four hours per plot.
                        {'\n'} {'\n'}
                        Once set up, the plots have to be remeasured at the same time every year.
                        {'\n'} {'\n'}
                        In seasonally dry forests, the ideal time to set up the plot is at the beginning of the wet season.
                        {'\n'}
                    </Text>
                    <Text style={styles.h1Label}>
                        What do I need for a standard 25m by 2m plot?
                        {'\n'}
                    </Text>
                    <Text style={styles.h3Label}>
                        1. ca. 300 metal tree-tags (ca. €30){'\n'}
                        2. 10 meters of 3mm wire{'\n'}
                        3. Wire clippers{'\n'}
                        4. Two 50m measuring tapes{'\n'}
                    </Text>
                    <Text style={styles.h1Label}>
                        How many plots do I need?
                    </Text>
                    <Text style={styles.h2Label}>
                        You should set up 5 plots plus 1 for every 5 hectares. A project restoring 10 ha would have 7 plots.  {'\n'}  {'\n'}
                    </Text>
                    <Text style={styles.h1Label}>
                        How do I choose the locations?
                    </Text>
                    <Text style={styles.h2Label}>
                        Plot locations need to be chosen at random, including plots near and at the edge of the site. But you do not need to worry about that, since TreeMapper suggests optimal plot locations.
                        {'\n'}  {'\n'}
                    </Text>
                    <Text style={styles.h1Label}>
                        What are control plots?
                    </Text>
                    <Text style={styles.h2Label}>
                        Control plots allow you to understand how your site would have developed if you had not planted trees. Therefore we purposefully keep a few sites "unplanted", register them as control sites and measure what naturally grows there. About 5% of your monitoring plots should have a paired control plot.
                        {'\n'}  {'\n'}
                        This process is based on XYZ et al. 2022.
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
        width:'100%',
        height:'100%',
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