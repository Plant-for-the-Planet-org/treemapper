import { FlatList, Image, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import PlotPlantRemeasureHeader from 'src/components/monitoringPlot/PlotPlantRemeasureHeader'
import { Colors, Typography } from 'src/utils/constants'
import { BACKDROP_COLOR } from 'src/utils/constants/colors'
import CustomButton from 'src/components/common/CustomButton'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'

import PlantedIcon from 'assets/images/svg/PlantedIcon.svg'
import DeceasedTreeIcon from 'assets/images/svg/DeceasedTreeIcon.svg'
import RemeasurmentIcon from 'assets/images/svg/RemeasurmentIcon.svg'

const DummyImage = require('assets/images/intervention/DummyImage.png')

const dummyData = [{
    date: "October 8, 2019",
    label: "Tree Planted",
    type: "planted"
},
{
    date: "October 10, 2020",
    label: "Measurment 1: 0.38m high, 0.3cm wide",
    type: "remeausre"
},
{
    date: "July 11, 2021",
    label: "Measurment 1: 1.18m high, 1.3cm wide",
    type: "remeausre"
},
{
    date: "April 16, 2022",
    label: "Deceased",
    type: "deceased"
}
]

const AddRemeasurmentView = () => {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
    const handleSelection = () => {
        navigation.navigate('PlotPlantRemeasure')
    }


    const renderCard = (item: any, index: number) => {
        const renderIcon = () => {
            switch (item.type) {
                case 'remeausre':
                    return <RemeasurmentIcon />
                case 'deceased':
                    return <DeceasedTreeIcon />
                default:
                    return <PlantedIcon />
            }
        }
        return (
            <View style={styles.cardContainer}>
                <View style={styles.iconWrapper}>
                    <View style={[styles.icon, {backgroundColor:item.type === 'deceased' ? Colors.GRAY_BACKDROP : Colors.NEW_PRIMARY + '1A'}]}>
                        {renderIcon()}
                    </View>
                    {index < dummyData.length - 1 && <View style={styles.divider} />}
                </View>
                <View style={styles.cardSection}>
                    <Text style={styles.cardHeader}>
                        {item.date}
                    </Text>
                    <Text style={styles.cardLabel}>
                        {item.label}
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
                            return <Image source={DummyImage} style={styles.imageWrapper}/>
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
                pressHandler={handleSelection}
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
        bottom: 50,
    },
    imageWrapper: {
        backgroundColor: Colors.SAPPHIRE_BLUE,
        borderRadius: 20,
        marginBottom: 20,
        width: '100%',
        height: 240,
        marginTop: 20
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
        width: 40, height: 40,
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
        color: Colors.TEXT_LIGHT,
        fontSize: 14,
        letterSpacing:0.2
    }
})