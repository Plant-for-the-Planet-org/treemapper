import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { Colors, Typography } from 'src/utils/constants'
import DeletIcon from 'assets/images/svg/BinIcon.svg'
import useInterventionManagement from 'src/hooks/realm/useInterventionManagement'

interface Props {
    interventionId: string
    resetData:()=>void
}

const InterventionDeleteContainer = (props: Props) => {
    const { interventionId, resetData } = props;
    const { deleteIntervention } = useInterventionManagement()

    const pressHandler = () => {
        resetData()
        deleteIntervention(interventionId)
    }

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.wrapper} onPress={pressHandler}>
                <Text style={styles.label}>Delete</Text>
                <DeletIcon width={15} height={15} fill={Colors.TEXT_COLOR} />
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
        marginHorizontal: 10
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