import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import Modal from 'react-native-modal'
import { Colors, Typography } from 'src/utils/constants'
import BouncyCheckbox from "react-native-bouncy-checkbox";
import { INTERVENTION_FILTER } from 'src/types/type/app.type';
import { TouchableOpacity } from '@gorhom/bottom-sheet';


interface Props {
    isVisible: boolean
    toggleModal: (b: boolean) => void
    changeInterventionFilter: (e: string) => void
    selectedFilter: INTERVENTION_FILTER
}

const InterventionTimeModal = (props: Props) => {
    const { isVisible, toggleModal, selectedFilter, changeInterventionFilter } = props
    const handleClose = () => {
        toggleModal(!isVisible)
    }
    const data = [
        {
            label: '30 days',
            index: 0,
            selected: false,
            key: 'days'
        },
        {
            label: '6 months',
            index: 1,
            selected: false,
            key: 'months'
        },
        {
            label: '1 year',
            index: 2,
            selected: false,
            key: 'year'

        },
        {
            label: 'Always',
            index: 3,
            selected: false,
            key: 'always'
        },
    ]

    const renderCheckBox = () => {
        return data.map(el => {
            return (
                <TouchableOpacity style={[styles.tileWrapper, { borderBottomWidth: el.index === 3 ? 0 : 0.5 }]} key={el.index} onPress={() => {
                    changeInterventionFilter(el.key)
                }}>
                    <Text style={styles.tileLabel}>{el.label}</Text>
                    <View style={styles.divider} />
                    <BouncyCheckbox
                        size={25}
                        fillColor={Colors.NEW_PRIMARY}
                        unFillColor={Colors.WHITE}
                        innerIconStyle={{ borderWidth: 2, borderColor: selectedFilter === el.key ? Colors.NEW_PRIMARY : Colors.TEXT_LIGHT, borderRadius: 5, margin: 0 }}
                        iconStyle={{ borderWidth: 2, borderRadius: 5, margin: 0 }}
                        onPress={() => {
                            changeInterventionFilter(el.key)
                        }}
                        style={{ width: 30 }}
                        isChecked={selectedFilter === el.key}
                    />
                </TouchableOpacity>
            )
        })
    }
    return (
        <Modal
            style={styles.container}
            isVisible={isVisible}
            onBackdropPress={handleClose}>
            <View style={styles.sectionWrapper}>
                {renderCheckBox()}
            </View>
        </Modal>
    )
}

export default InterventionTimeModal

const styles = StyleSheet.create({
    container: {
        flex: 1,
        margin: 0,
        justifyContent: 'center',
        alignItems: 'center'
    },
    sectionWrapper: {
        width: '80%',
        position: 'absolute',
        backgroundColor: Colors.WHITE,
        borderRadius: 20,
        alignItems: 'center',
        paddingVertical: 20
    },
    tileWrapper: {
        width: "90%",
        height: 50,
        alignItems: 'center',
        borderBottomWidth: 0.5,
        borderBottomColor: Colors.GRAY_LIGHT,
        flexDirection: 'row',
    },
    tileLabel: {
        fontSize: 16,
        fontFamily: Typography.FONT_FAMILY_BOLD,
        color: Colors.TEXT_COLOR
    },
    divider: {
        flex: 1
    }
})