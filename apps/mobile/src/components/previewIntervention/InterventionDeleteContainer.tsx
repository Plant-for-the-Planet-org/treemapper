import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useState } from 'react'
import { Colors, Typography } from 'src/utils/constants'
import DeleteIcon from 'assets/images/svg/BinIcon.svg'
import useInterventionManagement from 'src/hooks/realm/useInterventionManagement'
import DeleteModal from '../common/DeleteModal'
import i18next from 'src/locales/index'

interface Props {
    interventionId: string
    resetData: () => void
}

const InterventionDeleteContainer = (props: Props) => {
    const { interventionId, resetData } = props;
    const { deleteIntervention } = useInterventionManagement()
    const [deleteData, setDeleteData] = useState(null)

    const pressHandler = () => {
        resetData()
        deleteIntervention(interventionId)
    }

    return (
        <View style={styles.container}>
            <DeleteModal isVisible={deleteData !== null} toggleModal={setDeleteData} removeFavSpecie={pressHandler} headerLabel={i18next.t("label.delete_intervention")} noteLabel={i18next.t("label.delete_note")} primeLabel={i18next.t("label.delete")} secondaryLabel={'Cancel'} extra={deleteData} />
            <TouchableOpacity style={styles.wrapper} onPress={() => { setDeleteData('') }}>
                <Text style={styles.label}>{i18next.t("label.delete")}</Text>
                <DeleteIcon width={15} height={15} fill={Colors.TEXT_COLOR} />
            </TouchableOpacity>
        </View>
    )
}

export default InterventionDeleteContainer

const styles = StyleSheet.create({
    container: {
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: '5%'
    },
    wrapper: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: Colors.GRAY_LIGHT,
        flexDirection: 'row'
    },
    label: {
        fontFamily: Typography.FONT_FAMILY_BOLD,
        color: Colors.TEXT_COLOR,
        paddingRight: 10
    }
})