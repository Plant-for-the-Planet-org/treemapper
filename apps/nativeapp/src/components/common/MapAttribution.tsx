import {Pressable, StyleSheet, Text, View } from 'react-native'
import React, { useState } from 'react'
import InfoIcon from 'assets/images/svg/InfoIcon.svg'
import Modal from 'react-native-modal'
import { Colors, Typography } from 'src/utils/constants'
import CustomButton from './CustomButton'
import i18next from 'src/locales/index'



const MapAttribution = () => {
    const [showInfo, setShowInfo] = useState(false)
    const toggleInfo=()=>{
        setShowInfo(prev=>!prev)
    }
    return (
        <View style={styles.container}>
            <Pressable style={{ opacity: 0.5 }} onPress={toggleInfo}>
                <InfoIcon/>
            </Pressable>
            <Modal
                style={styles.mainContainer}
                isVisible={showInfo}
                onBackdropPress={toggleInfo}>
                <View style={styles.sectionWrapper}>
                    <Text style={styles.header}>
                    {i18next.t('label.map_credits')}
                    </Text>
                    <Text style={styles.mapLabels}>
                        Maplibre SDK
                    </Text>
                    <Text style={styles.mapLabels}>
                        ESRI
                    </Text>
                    <Text style={styles.mapLabels}>
                    {i18next.t('label.openstreet_contributors')}
                    </Text>
                    <CustomButton label={'Close'} pressHandler={toggleInfo} 
                    containerStyle={{width:'100%',height:70, marginTop:'5%'}}    
                    hideFadeIn
                />
                </View>

            </Modal>
        </View>
    )
}

export default MapAttribution

const styles = StyleSheet.create({
    container: {
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        bottom: 120,
        left: 20,
    },
    mainContainer: {
        flex: 1,
        margin: 0,
        padding: 0
    },
    sectionWrapper: {
        width: 400,
        height: 300,
        backgroundColor: Colors.WHITE,
        position: 'absolute',
        bottom: 0,
        margin: 0,
        padding: 0,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 35
    },
    header: {
        fontSize: 20,
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        color: Colors.DARK_TEXT,
        marginLeft: '5%',
        marginTop: '5%'
    },
    mapLabels:{
        fontSize: 18,
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        color: Colors.TEXT_COLOR,
        marginLeft: '5%',
        marginTop: '5%'
    }
})