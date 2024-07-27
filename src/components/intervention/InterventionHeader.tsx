import { StyleSheet, View, TouchableOpacity } from 'react-native'
import React from 'react'
import FreeUpSaceButton from './FreeUpSaceButton'
import Icon from '@expo/vector-icons/MaterialIcons';

import { Colors } from 'src/utils/constants'
import { useQuery } from '@realm/react';
import { RealmSchema } from 'src/types/enum/db.enum';
import { exportAllInterventionData } from 'src/utils/helpers/fileManagementHelper';


const InterventionHeader = () => {
    const data = useQuery(RealmSchema.Intervention, data => {
        return data.filtered('status != "SYNCED"')
    })
    const handleNav = () => {
        exportAllInterventionData(data)
    }

    return (
        <View style={styles.container}>
            <FreeUpSaceButton />
            {data.length > 0 && <TouchableOpacity
                onPress={handleNav}
                style={styles.wrapper}><Icon name={'import-export'} size={30} color={Colors.TEXT_COLOR} /></TouchableOpacity>}
        </View>
    )
}

export default InterventionHeader

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20
    },
    wrapper: {
        width: 50,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    }

})