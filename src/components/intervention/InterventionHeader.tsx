import { StyleSheet, View, TouchableOpacity } from 'react-native'
import React from 'react'
import FreeUpSpaceButton from './FreeUpSpaceButton'
import Icon from '@expo/vector-icons/MaterialIcons';

import { Colors } from 'src/utils/constants'
import { useQuery } from '@realm/react';
import { RealmSchema } from 'src/types/enum/db.enum';
import { deleteImageFile, exportAllInterventionData } from 'src/utils/helpers/fileManagementHelper';
import { InterventionData, SampleTree } from 'src/types/interface/slice.interface';
import { useToast } from 'react-native-toast-notifications';
import useLogManagement from 'src/hooks/realm/useLogManagement';
import InventoryMigration from '../common/InventoryMigration';
import { RootState } from 'src/store';
import { useSelector } from 'react-redux';


const InterventionHeader = () => {
    const data = useQuery<InterventionData>(RealmSchema.Intervention, el => {
        return el.filtered('status != "SYNCED"')
    })
    const toast = useToast()
    const handleNav = () => {
        exportAllInterventionData([...data])
    }
    const { addNewLog } = useLogManagement()
    const dataMigrated = useSelector((state: RootState) => state.appState.dataMigrated)


    const handleCleanup = async () => {
        const syncedImagesData: SampleTree[] = []
        data.forEach(el => {
            el.sample_trees.forEach(tree => {
                if (tree.status === 'SYNCED' && tree.cdn_image_url.length > 0) {
                    syncedImagesData.push(JSON.parse(JSON.stringify(tree)))
                }
            })
        });

        syncedImagesData.forEach(async d => {
            const result = await deleteImageFile(d.image_url)
            if (result) {
                addNewLog({
                    logType: 'DATA_SYNC',
                    message: 'Image cleaned up for tree id ' + d.tree_id,
                    logLevel: 'info',
                    statusCode: ''
                })
            } else {
                addNewLog({
                    logType: 'DATA_SYNC',
                    message: 'Error ocurred while cleaning Image data for tree id ' + d.tree_id,
                    logLevel: 'error',
                    statusCode: ''
                })
            }
        });
        toast.show("Space Cleared")
    }

    return (
        <View style={styles.container}>
            <FreeUpSpaceButton handleCleanup={handleCleanup} />
            {data.length > 0 && dataMigrated ? <TouchableOpacity
                onPress={handleNav}
                style={styles.wrapper}><Icon name={'import-export'} size={30} color={Colors.TEXT_COLOR} /></TouchableOpacity> : null}
            {!dataMigrated && <InventoryMigration />}
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
    },
    wrapper: {
        width: 50,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 20
    }

})