import { FlatList, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import PlotPlantRemeasureHeader from 'src/components/monitoringPlot/PlotPlantRemeasureHeader'
import { Colors, Typography } from 'src/utils/constants'
import { BACKDROP_COLOR } from 'src/utils/constants/colors'
import CustomButton from 'src/components/common/CustomButton'
import PlantedIcon from 'assets/images/svg/PlantedIcon.svg'


const dummyData = [1, 2, 3, 4, 5]

const AddRemeasurmentView = () => {
    const renderCard = (item: any, index: number) => {
        return (
            <View style={styles.cardContainer}>
                <View style={styles.iconWrapper}>
                    <View style={styles.icon}>
                        <PlantedIcon />
                    </View>
                    {index < dummyData.length - 1 && <View style={styles.divider} />}
                </View>
                <View style={styles.cardSection}>
                    <Text style={styles.cardHeader}>
                        October 8, 2019
                    </Text>
                    <Text style={styles.cardLabel}>
                        Tree planted
                    </Text>
                </View>
            </View>
        )
    }
    return (
        <SafeAreaView style={styles.cotnainer}>
            <PlotPlantRemeasureHeader />
            <View style={styles.wrapper}>
                <View style={styles.sectionWrapper}>
                    <FlatList
                        showsVerticalScrollIndicator={false}
                        ListHeaderComponent={() => {
                            return <View style={styles.imageWrapper}></View>
                        }}
                        style={styles.flatlistWrapper}
                        ListFooterComponent={() => (<View style={styles.footerWrapper} />)}
                        renderItem={({ item, index }) => { return renderCard(item, index) }}
                        data={dummyData} />
                </View>
            </View>
            <CustomButton
                label="Add Remeasurment"
                containerStyle={styles.btnContainer}
                pressHandler={() => { }}
                hideFadein
            />
        </SafeAreaView>
    )
}

export default AddRemeasurmentView

const styles = StyleSheet.create({
    cotnainer: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: Colors.WHITE
    },
    wrapper: {
        backgroundColor: BACKDROP_COLOR,
        width: '100%',
        alignItems: 'center',
        flex: 1
    },
    btnContainer: {
        width: '100%',
        height: 70,
        position: 'absolute',
        bottom: 20,
    },
    imageWrapper: {
        backgroundColor: Colors.SAPPHIRE_BLUE,
        borderRadius: 20,
        marginBottom: 20,
        width: '100%',
        height: 240,
        marginTop:20
    },
    sectionWrapper: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
    },
    footerWrapper: {
        height: 100,
        width: '100%'
    },
    flatlistWrapper: {
        width: '90%',
    },
    cardContainer: {
        width: '90%',
        height: 90,
        flexDirection: 'row',
        justifyContent: 'flex-start'
    },
    icon: {
        width: 35, height: 35,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.NEW_PRIMARY + '1A',
        borderRadius: 10
    },
    iconWrapper: {
        width: 50,
        height: '100%',
        alignItems: 'center'
    },
    cardSection: {
        flex: 1,
        marginLeft: 10,
        height: '100%',
        justifyContent: 'flex-start'
    },
    divider: {
        flex: 1,
        width: 2,
        backgroundColor: Colors.TEXT_LIGHT
    },
    cardHeader: {
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        color: Colors.DARK_TEXT_COLOR,
        fontSize: 18,
    },
    cardLabel: {
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        color: Colors.TEXT_COLOR,
        fontSize: 14,
    }
})