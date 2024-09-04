import { StyleSheet, View } from 'react-native'
import React from 'react'
import FreeUpSpaceButton from './FreeUpSpaceButton'
import { useQuery } from '@realm/react';
import { RealmSchema } from 'src/types/enum/db.enum';
import { deleteImageFile } from 'src/utils/helpers/fileManagementHelper';
import { InterventionData, SampleTree } from 'src/types/interface/slice.interface';
import { useToast } from 'react-native-toast-notifications';
import useLogManagement from 'src/hooks/realm/useLogManagement';
import InventoryMigration from '../common/InventoryMigration';
import { RootState } from 'src/store';
import { useDispatch, useSelector } from 'react-redux';
import { clearImageSize } from 'src/store/slice/appStateSlice';


const InterventionHeader = () => {
    const data = useQuery<InterventionData>(RealmSchema.Intervention, el => {
        return el.filtered('status != "SYNCED"')
    })
    const toast = useToast()
    const { addNewLog } = useLogManagement()
    const { dataMigrated, imageSize } = useSelector((state: RootState) => state.appState)
    const dispatch = useDispatch()
    const convertBytesToMb = () => {
        if (imageSize === 0) {
            return ''
        }
        let finalSize = 0
        finalSize = imageSize / 1048576
        return `${String(finalSize.toFixed(2)) }MB`

    }

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

        toast.show(`${convertBytesToMb()} space cleared`)
        dispatch(clearImageSize())
    }



    return (
        <View style={styles.container}>
            <FreeUpSpaceButton handleCleanup={handleCleanup} imageSize={convertBytesToMb()} />
            {!dataMigrated && <InventoryMigration />}
        </View>
    )
}

export default InterventionHeader

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: 70,
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