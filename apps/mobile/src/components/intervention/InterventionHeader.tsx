import { StyleSheet, View, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import NetInfo from '@react-native-community/netinfo';
import FreeUpSpaceButton from './FreeUpSpaceButton'
import RefreshIcon from 'assets/images/svg/RefreshIcon.svg';
import RotatingView from '../common/RotatingView';
import { useQuery } from '@realm/react';
import { RealmSchema } from 'src/types/enum/db.enum';
import { deleteImageFile } from 'src/utils/helpers/fileManagementHelper';
import { InterventionData, SampleTree } from 'src/types/interface/slice.interface';
import { useToast } from 'react-native-toast-notifications';
import useLogManagement from 'src/hooks/realm/useLogManagement';
import useInterventionManagement from 'src/hooks/realm/useInterventionManagement';
import InventoryMigration from '../common/InventoryMigration';
import { RootState } from 'src/store';
import { useDispatch, useSelector } from 'react-redux';
import { clearImageSize, updateNewIntervention } from 'src/store/slice/appStateSlice';
import { updateFilePath } from 'src/utils/helpers/fileSystemHelper';
import { getMobileInterventions } from 'src/api/api.fetch';
import { convertInventoryToIntervention } from 'src/utils/helpers/interventionHelper/legacyInventoryIntervention';


const InterventionHeader = () => {
    const data = useQuery<InterventionData>(RealmSchema.Intervention, el => {
        return el.filtered('status != "SYNCED"')
    })
    const toast = useToast()
    const { addNewLog } = useLogManagement()
    const { refreshSyncedIntervention } = useInterventionManagement()
    const { dataMigrated, imageSize } = useSelector((state: RootState) => state.appState)
    const dispatch = useDispatch()
    const [isRefreshing, setIsRefreshing] = useState(false)
    const convertBytesToMb = () => {
        if (imageSize === 0) {
            return ''
        }
        let finalSize = 0
        finalSize = imageSize / 1048576
        return `${String(finalSize.toFixed(2))}MB`

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
            const result = await deleteImageFile(updateFilePath(d.image_url))
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

    // Pulls every intervention from the server and reconciles it with the local
    // Realm copy. New interventions are added, already-synced ones are updated
    // (so edits made on the web show up here), and interventions with pending
    // local changes are left untouched.
    const handleRefresh = async () => {
        if (isRefreshing) {
            return
        }
        const netInfo = await NetInfo.fetch()
        if (!netInfo.isConnected) {
            toast.show('No internet connection')
            return
        }
        setIsRefreshing(true)
        const pageSize = 6
        let page = 1
        let added = 0
        let updated = 0
        try {
            while (true) {
                const { response, success } = await getMobileInterventions(page.toString())
                const items = response?.data?.items
                if (!success || !items || items.length === 0) {
                    break
                }
                for (let index = 0; index < items.length; index++) {
                    const element = convertInventoryToIntervention(items[index])
                    if (!element) {
                        addNewLog({
                            logType: 'DATA_SYNC',
                            message: `Skipped intervention that failed to convert: ${items[index]?.id || 'unknown id'}`,
                            logLevel: 'warn',
                            statusCode: '000',
                        })
                        continue
                    }
                    const result = await refreshSyncedIntervention(element)
                    if (result === 'added') {
                        added += 1
                    } else if (result === 'updated') {
                        updated += 1
                    }
                }
                if (items.length < pageSize) {
                    break
                }
                page += 1
            }
            if (added > 0 || updated > 0) {
                dispatch(updateNewIntervention())
            }
            toast.show(`Refreshed: ${added} added, ${updated} updated`)
            addNewLog({
                logType: 'DATA_SYNC',
                message: `Refresh complete: ${added} added, ${updated} updated`,
                logLevel: 'info',
                statusCode: '000',
            })
        } catch (error) {
            toast.show('Could not refresh interventions')
            addNewLog({
                logType: 'DATA_SYNC',
                message: 'Error while refreshing interventions',
                logLevel: 'error',
                statusCode: '000',
                logStack: JSON.stringify(error),
            })
        } finally {
            setIsRefreshing(false)
        }
    }



    return (
        <View style={styles.container}>
            <FreeUpSpaceButton handleCleanup={handleCleanup} imageSize={convertBytesToMb()} />
            {!dataMigrated && <InventoryMigration />}
            <TouchableOpacity style={styles.refreshWrapper} onPress={handleRefresh} disabled={isRefreshing}>
                {isRefreshing ? (
                    <RotatingView isClockwise={true}>
                        <RefreshIcon />
                    </RotatingView>
                ) : (
                    <RefreshIcon />
                )}
            </TouchableOpacity>
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
    },
    refreshWrapper: {
        width: 50,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    }
})