import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import i18next from 'src/locales/index'
import { Typography } from 'src/utils/constants'
import CustomButton from '../common/CustomButton'

interface Props {
    closeModal: () => void
}

const GpsAccuracyInfoContent = (props: Props) => {
    const { closeModal } = props;
    return (
        <View style={styles.contentContainer}>
            <Text
                style={{
                    color: '#000000',
                    fontFamily: Typography.FONT_FAMILY_BOLD,
                    fontSize: Typography.FONT_SIZE_18,
                    paddingBottom: 18,
                }}>
                {i18next.t('label.gps_accuracy')}
            </Text>
            <Text style={[styles.accuracyModalText, { marginBottom: 16 }]}>
                {i18next.t('label.accuracy_info')}
            </Text>
            <Text style={styles.accuracyModalText}>
                <Text style={{ color: '#87B738', fontFamily: Typography.FONT_FAMILY_BOLD }}>
                    {i18next.t('label.green')}
                </Text>{' '}
                {i18next.t('label.green_info')}
            </Text>
            <Text style={styles.accuracyModalText}>
                <Text style={{ color: '#CBBB03', fontFamily: Typography.FONT_FAMILY_BOLD }}>
                    {i18next.t('label.yellow')}
                </Text>{' '}
                {i18next.t('label.yellow_info')}
            </Text>
            <Text style={styles.accuracyModalText}>
                <Text style={{ color: '#FF0000', fontFamily: Typography.FONT_FAMILY_BOLD }}>
                    {i18next.t('label.red')}
                </Text>{' '}
                {i18next.t('label.red_info')}
            </Text>
            <CustomButton
                hideFadeIn
                label={i18next.t('label.close')} pressHandler={closeModal}
                containerStyle={{ width: '100%', height: 70, bottom: 0, marginTop: 20 }}
            />
        </View>
    )
}

export default GpsAccuracyInfoContent

const styles = StyleSheet.create({
    contentContainer: {
        borderRadius: 10,
        justifyContent: "center",
        alignItems: 'center'
    },
    accuracyModalText: {
        color: '#000000',
        lineHeight: Typography.LINE_HEIGHT_20,
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        fontSize: Typography.FONT_SIZE_14,
        width: '100%',
        paddingLeft: '5%'
    },
})