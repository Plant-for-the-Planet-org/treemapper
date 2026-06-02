import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useMemo, useRef, useState } from 'react'
import { Colors, Typography } from 'src/utils/constants'
import UnSyncIcon from 'assets/images/svg/UnSyncIcon.svg';
import SyncIcon from 'assets/images/svg/CloudSyncIcon.svg';
import RefreshIcon from 'assets/images/svg/RefreshIcon.svg';
import InfoIcon from 'assets/images/svg/BlueInfoIcon.svg';
import { useQuery, useRealm } from '@realm/react';
import { RealmSchema } from 'src/types/enum/db.enum';
import { InterventionData, QuaeBody } from 'src/types/interface/slice.interface';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from 'src/types/type/navigation.type';
import { useToast } from 'react-native-toast-notifications';
import useInterventionManagement from 'src/hooks/realm/useInterventionManagement';
import RotatingView from '../common/RotatingView';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'src/store';
import { updateSyncDetails } from 'src/store/slice/syncStateSlice';
import { getPostBody, getRemeasurementBody, postDataConvertor } from 'src/utils/helpers/syncHelper';
import { getPersonalProject, mobileInterventionImageUplaod, presingedUrl, recordPlannedIntervention, remeasuremenMobile, skipRemeasurement, uploadAllIntervention } from 'src/api/api.fetch';
import { updateLastSyncData, updateNewIntervention } from 'src/store/slice/appStateSlice';
import { useNetInfo } from "@react-native-community/netinfo";
import i18next from 'src/locales/index';
import { formatRelativeTimeCustom } from 'src/utils/helpers/appHelper/dataAndTimeHelper';
import useLogManagement from 'src/hooks/realm/useLogManagement';

interface Props {
    isLoggedIn: boolean
    tokenValid?: boolean
}

interface SyncItemStatus {
    type: string
    index: number
    status: 'pending' | 'syncing' | 'done' | 'error'
}

const TYPE_LABELS: Record<string, string> = {
    intervention: 'Intervention',
    singleTree: 'Single Tree',
    sampleTree: 'Sample Tree',
    treeImage: 'Tree Image',
    remeasurementData: 'Remeasurement',
    remeasurementStatus: 'Remeasurement Status',
    skipRemeasurement: 'Skip Remeasurement',
    plannedTree: 'Planned Tree',
}

const SyncIntervention = ({ isLoggedIn, tokenValid }: Props) => {
    const [showFullSync, setShowFullSync] = useState(false)
    const [showSyncModal, setShowSyncModal] = useState(false)
    const [syncStatuses, setSyncStatuses] = useState<SyncItemStatus[]>([])
    // Synchronous re-entrancy guard. The redux `isSyncing` flag is read from a
    // stale closure within the same render, so rapid taps could slip past it
    // during the async project-check before the spinner turned on. This ref
    // blocks a second start the instant the first one begins.
    const isStartingRef = useRef(false)

    const { syncRequired, isSyncing } = useSelector((state: RootState) => state.syncState)
    const realm = useRealm()
    const toast = useToast()
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
    const { updateInterventionStatus, updateTreeStatus, updateTreeImageStatus, updateRemeasurementStatus, updateInterventionsWithEmptyProjectIdWithCount, markPlannedInterventionSynced } = useInterventionManagement()
    const dispatch = useDispatch()
    const { addNewLog } = useLogManagement()
    const { isConnected } = useNetInfo();
    const lastSyncDate = useSelector((state: RootState) => state.appState.lastSyncDate)

    const interventionData = useQuery<InterventionData>(
        RealmSchema.Intervention,
        data => data.filtered('status != "SYNCED" AND is_complete == true')
    )
    const preSyncSummary = useMemo(() => {
        const qData = postDataConvertor(JSON.parse(JSON.stringify(interventionData)))
        const counts: Record<string, number> = {}
        qData.forEach(item => { counts[item.type] = (counts[item.type] || 0) + 1 })
        return counts
    }, [interventionData])

    const showLogin = () => {
        if (!isLoggedIn) {
            navigation.navigate("HomeSideDrawer")
            toast.show("Please login to start syncing data")
        } else {
            startSyncingData()
        }
    }


    const checkForProjectId = async () => {
        const invWithoutProjectId = realm.objects(RealmSchema.Intervention).filtered('status == "PENDING_DATA_UPLOAD" AND project_id == ""');
        if (invWithoutProjectId.length === 0) return true;
        const { response, success } = await getPersonalProject();
        if (!success || !response?.data?.properties?.uid) {
            addNewLog({ logType: 'DATA_SYNC', message: 'Failed to fetch personal project uid for sync', logLevel: 'error', statusCode: '' });
            toast.show(`${invWithoutProjectId.length} of the intervention don't have project assigned. Please assign them project from intervention tab.`)
            await updateInterventionsWithEmptyProjectIdWithCount()
            return false;
        }
        const projectUid = response.data.properties.uid;
        realm.write(() => {
            for (const intervention of invWithoutProjectId) {
                (intervention as any).project_id = projectUid;
            }
        });
        return true;
    }


    // Single entry point. Uploads run in dependency order across repeated passes:
    // each successful upload writes its server id to Realm, which makes the next
    // dependent item eligible on the following pass. We stop when the queue is
    // empty or a full pass makes no progress (nothing left we can resolve).
    const startSyncingData = async () => {
        if (!isLoggedIn) {
            showLogin()
            return
        }
        // Block re-entry the instant a start begins, before any await. Without
        // this the redux `isSyncing` check below can be stale and a fast second
        // tap slips through.
        if (isStartingRef.current || isSyncing) return
        if (!tokenValid) {
            addNewLog({ logType: 'DATA_SYNC', message: 'Token Invalid during data sync', logLevel: 'error', statusCode: '' })
            toast.show("Preparing your session. Please wait a moment and try again.")
            return
        }

        isStartingRef.current = true
        // Turn the spinner on immediately so the tap has visible feedback while
        // the project check (a network call) runs. Previously this only fired
        // after checkForProjectId resolved, so early taps felt like no-ops.
        dispatch(updateSyncDetails(true))

        let totalUploaded = 0
        let totalFailed = 0
        try {
            const projectPass = await checkForProjectId();
            if (!projectPass) return;

            dispatch(updateLastSyncData(Date.now()))

            while (true) {
                const { uploaded, failed, remaining } = await runSyncPass()
                if (remaining === 0) break          // nothing left to upload
                totalUploaded += uploaded
                totalFailed += failed
                if (uploaded === 0) break            // no progress, only unresolvable items remain
            }

            // Source of truth for "done" is the same query the tile uses, not just
            // an empty queue, so we never claim "synced" while records remain.
            const remaining = realm.objects(RealmSchema.Intervention)
                .filtered('status != "SYNCED" AND is_complete == true').length

            if (remaining === 0) {
                setShowFullSync(true)
                dispatch(updateNewIntervention())
                toast.show("All data is synced")
            } else if (totalFailed > 0) {
                toast.show(`${totalUploaded} uploaded, ${totalFailed} failed. Please try again.`)
            } else {
                toast.show(`${remaining} intervention${remaining !== 1 ? 's' : ''} still need attention.`)
            }
        } catch (error) {
            addNewLog({ logType: 'DATA_SYNC', message: 'Sync aborted (network)', logLevel: 'error', statusCode: '', logStack: JSON.stringify(error) })
            toast.show("Network call failed \nPlease check your internet connection", { textStyle: { textAlign: 'center' } })
        } finally {
            dispatch(updateSyncDetails(false))
            isStartingRef.current = false
        }
    }

    // Build the prioritized queue from current Realm state and upload each item
    // in turn. Returns counts so the caller can decide whether to run again.
    const runSyncPass = async (): Promise<{ uploaded: number; failed: number; remaining: number }> => {
        const qData = postDataConvertor(JSON.parse(JSON.stringify(interventionData)))
        const queue = [...qData].sort((a, b) => a.priority - b.priority)
        if (queue.length === 0) return { uploaded: 0, failed: 0, remaining: 0 }

        setSyncStatuses(queue.map((item, idx) => ({ type: item.type, index: idx, status: 'pending' })))

        let uploaded = 0
        let failed = 0
        for (let i = 0; i < queue.length; i++) {
            if (!isConnected) throw new Error('No network connection')
            setSyncStatuses(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'syncing' } : s))
            const success = await handleItem(queue[i])
            if (success) uploaded++; else failed++
            setSyncStatuses(prev => prev.map((s, idx) => idx === i ? { ...s, status: success ? 'done' : 'error' } : s))
        }
        return { uploaded, failed, remaining: queue.length }
    }

    const handleItem = async (el: QuaeBody): Promise<boolean> => {
        switch (el.type) {
            case 'intervention': return handleIntervention(el)
            case 'singleTree': return handleSingleTree(el)
            case 'plannedTree': return handlePlantingIntervention(el)
            case 'sampleTree': return handleSampleTree(el)
            case 'treeImage': return handleTreeImage(el)
            case 'remeasurementData': return handleMobileRemeasurement(el)
            case 'remeasurementStatus': return handleMobileRemeasurement(el)
            case 'skipRemeasurement': return handleSkipRemeasurement(el)
            default: return false
        }
    }

    // Skip remeasurement has no upload (the legacy v3 API was removed). It only
    // resolves the tree locally to SYNCED so its parent intervention can finish.
    const handleSkipRemeasurement = async (el: QuaeBody): Promise<boolean> => {
        try {
            await updateRemeasurementStatus(el.p1Id, el.p2Id, '', true);
            return true
        } catch (error) {
            addNewLog({ logType: 'DATA_SYNC', message: 'Skip remeasurement local update error', logLevel: 'error', statusCode: '', logStack: JSON.stringify(error) })
            return false
        }
    }

    const handleIntervention = async (el: QuaeBody): Promise<boolean> => {
        try {
            const { pData } = await getPostBody(el) as any;
            if (!pData) throw new Error("Not able to convert body");
            const { responseData, responseError } = await uploadAllIntervention(pData);
            if (!responseError && responseData && responseData.parentHid && responseData.parentId) {
                await updateInterventionStatus(el.p1Id, responseData.parentHid, responseData.parentId, el.nextStatus);
                return true
            }
            addNewLog({ logType: 'DATA_SYNC', message: 'Intervention API response error', logLevel: 'error', statusCode: '' })
            return false
        } catch (error) {
            addNewLog({ logType: 'DATA_SYNC', message: 'Intervention API response error(Inside Catch)', logLevel: 'error', statusCode: '', logStack: JSON.stringify(error) })
            return false
        }
    };

    const handleSingleTree = async (el: QuaeBody): Promise<boolean> => {
        try {
            const { pData } = await getPostBody(el) as any;
            if (!pData) throw new Error("Not able to convert body");
            const { responseData, responseError } = await uploadAllIntervention(pData);
            if (!responseError && responseData && responseData.treeId && responseData.parentId) {
                const result = await updateInterventionStatus(el.p1Id, responseData.parentHid, responseData.parentId, el.nextStatus);
                if (result) {
                    await updateTreeStatus(el.p2Id, responseData.treeHid, responseData.treeId, el.nextStatus, responseData.parentId, responseData.coordinates);
                }
                return true
            }
            addNewLog({ logType: 'DATA_SYNC', message: 'Single Tree API response error', logLevel: 'error', statusCode: '' })
            return false
        } catch (error) {
            addNewLog({ logType: 'DATA_SYNC', message: 'Single Tree API response error(Inside Catch)', logLevel: 'error', statusCode: '', logStack: JSON.stringify(error) })
            return false
        }
    };

    const handlePlantingIntervention = async (el: QuaeBody): Promise<boolean> => {
        try {
            const { pData } = await getPostBody(el) as any;
            if (!pData) throw new Error("Not able to convert body");
            if (!pData.projectId || !pData.interventionId) throw new Error("Missing project or intervention id");

            // Upload the tree image first (if captured), then attach its filename to the record.
            let imageFilename: string | undefined = undefined;
            if (pData.imageFile) {
                try {
                    const presignedResponse = await presingedUrl({
                        fileName: String(new Date().getTime()),
                        fileType: 'image/jpg',
                        folder: 'tree'
                    });
                    if (presignedResponse.success && presignedResponse.response?.code === 'success') {
                        const signedUrl = presignedResponse.response.data.data.uploadUrl;
                        const fileName = presignedResponse.response.data.data.fileName;
                        const uploadResponse = await fetch(signedUrl, {
                            method: 'PUT',
                            body: { uri: pData.imageFile, type: 'image/jpg', name: fileName || 'image.jpg' } as any,
                            headers: { 'Content-Type': 'image/jpg' },
                        });
                        if (uploadResponse.ok) imageFilename = fileName;
                    }
                } catch (_) {
                    // continue without image
                }
            }

            const requestBody: any = {
                geometry: pData.geometry,
                measurements: pData.measurements,
                metadata: pData.metadata || {},
                plantingDate: pData.plantingDate,
            };
            if (pData.tag) requestBody.tag = pData.tag;
            if (pData.deviceLocation) requestBody.deviceLocation = pData.deviceLocation;
            if (imageFilename) requestBody.image = { filename: imageFilename, mimeType: 'image/jpg' };
            const { response, success } = await recordPlannedIntervention(pData.projectId, pData.interventionId, requestBody);
            // The server wraps the result one level deep: response.data holds { success, data, tree }.
            const result = response?.data;
            addNewLog({ logType: 'DATA_SYNC', message: `Planned record response success=${success} serverSuccess=${result?.success} tree=${JSON.stringify(result?.tree)}`, logLevel: 'info', statusCode: '' })

            if (success && result && result.success) {
                const treeResult = result.tree || {};
                const persisted = await markPlannedInterventionSynced(el.p1Id, el.p2Id, treeResult.treeHid || '', treeResult.treeUid || '', imageFilename);
                addNewLog({ logType: 'DATA_SYNC', message: `Planned markSynced persisted=${persisted} p1Id=${el.p1Id} p2Id=${el.p2Id}`, logLevel: persisted ? 'info' : 'error', statusCode: '' })
                if (!persisted) return false
                return true
            }
            addNewLog({ logType: 'DATA_SYNC', message: 'Planned intervention record API response error', logLevel: 'error', statusCode: '' })
            return false
        } catch (error) {
            addNewLog({ logType: 'DATA_SYNC', message: 'Planned intervention record error(Inside Catch)', logLevel: 'error', statusCode: '', logStack: JSON.stringify(error) })
            return false
        }
    };

    const handleMobileRemeasurement = async (el: QuaeBody): Promise<boolean> => {
        try {
            const { pData, historyID, treeID } = await getRemeasurementBody(el) as any;
            if (!pData) throw new Error("Not able to convert body");

            let requestBody: any = { type: pData.type, metadata: pData.metadata || {} };
            if (pData.eventDate) requestBody.eventDate = pData.eventDate;

            let imageFilename: string | undefined = undefined;
            if (pData.imageFile) {
                try {
                    const presignedResponse = await presingedUrl({
                        fileName: String(new Date().getTime()),
                        fileType: 'image/jpg',
                        folder: 'tree'
                    });
                    if (presignedResponse.success && presignedResponse.response?.code === 'success') {
                        const signedUrl = presignedResponse.response.data.data.uploadUrl;
                        const fileName = presignedResponse.response.data.data.fileName;
                        const uploadResponse = await fetch(signedUrl, {
                            method: 'PUT',
                            body: { uri: pData.imageFile, type: 'image/jpg', name: fileName || 'image.jpg' } as any,
                            headers: { 'Content-Type': 'image/jpg' },
                        });
                        if (uploadResponse.ok) imageFilename = fileName;
                    }
                } catch (_) {
                    // continue without image
                }
            }

            if (pData.type === 'measurement') {
                if (pData.measurements?.height !== undefined) requestBody.height = pData.measurements.height;
                if (pData.measurements?.width !== undefined) requestBody.width = pData.measurements.width;
            } else if (pData.type === 'status') {
                requestBody.status = pData.status;
                if (pData.statusReason) requestBody.statusReason = pData.statusReason;
            }

            if (imageFilename) requestBody.imageFilename = imageFilename;

            const response = await remeasuremenMobile(treeID ?? '', requestBody);
            if (response?.success) {
                await updateRemeasurementStatus(el.p1Id, el.p2Id, historyID ?? '');
                return true
            }
            addNewLog({ logType: 'DATA_SYNC', message: 'Remeasurement Tree API response error', logLevel: 'error', statusCode: '' })
            return false
        } catch (error) {
            addNewLog({ logType: 'DATA_SYNC', message: 'Remeasurement error(Inside Catch)', logLevel: 'error', statusCode: '', logStack: JSON.stringify(error) })
            return false
        }
    };

    const handleSampleTree = async (el: QuaeBody): Promise<boolean> => {
        try {
            const { pData } = await getPostBody(el) as any;
            if (!pData) throw new Error("Not able to convert body");
            const { responseData, responseError } = await uploadAllIntervention(pData);
            if (!responseError && responseData && responseData.parentHid && responseData.parentId) {
                await updateTreeStatus(el.p2Id, responseData.parentHid, responseData.parentId, el.nextStatus, pData.parent, responseData.coordinates);
                return true
            }
            addNewLog({ logType: 'DATA_SYNC', message: 'Sample Tree API response error', logLevel: 'error', statusCode: '' })
            return false
        } catch (error) {
            addNewLog({ logType: 'DATA_SYNC', message: 'Sample Tree API response error(Inside Catch)', logLevel: 'error', statusCode: '', logStack: JSON.stringify(error) })
            return false
        }
    };

    const handleTreeImage = async (el: QuaeBody): Promise<boolean> => {
        try {
            const { pData } = await getPostBody(el) as any;
            if (!pData) throw new Error("Not able to convert body");
            const presignedResponse = await presingedUrl({
                fileName: String(new Date().getMilliseconds()),
                fileType: 'image/jpg',
                folder: 'tree'
            });
            if (presignedResponse.response.code !== 'success') throw new Error('Failed to get upload URL');
            const signedUrl = presignedResponse.response.data.data.uploadUrl;
            const fileName = presignedResponse.response.data.data.fileName;
            const uploadResponse = await fetch(signedUrl, {
                method: 'PUT',
                body: { uri: pData.imageFile, type: 'image/jpg', name: fileName || 'image.jpg' } as any,
                headers: { 'Content-Type': 'image/jpg' },
            });
            if (!uploadResponse.ok) throw new Error(`Upload failed with status: ${uploadResponse.status}`);
            await mobileInterventionImageUplaod({ treeUid: pData.treeServerId, filename: fileName, mimeType: 'image/jpg' });
            await updateTreeImageStatus(el.p2Id, el.p1Id, fileName);
            return true
        } catch (error) {
            addNewLog({ logType: 'DATA_SYNC', message: 'Image Upload API response error (Inside Catch)', logLevel: 'error', statusCode: '', logStack: JSON.stringify(error) });
            return false
        }
    };

    const totalSyncItems = Object.values(preSyncSummary).reduce((a, b) => a + b, 0)
    const doneCount = syncStatuses.filter(s => s.status === 'done' || s.status === 'error').length
    const errorCount = syncStatuses.filter(s => s.status === 'error').length

    const renderSyncModal = () => {
        const isActivelySyncing = isSyncing && syncStatuses.length > 0
        return (
            <Modal
                visible={showSyncModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowSyncModal(false)}>
                <Pressable style={styles.modalBackdrop} onPress={() => setShowSyncModal(false)}>
                    <Pressable style={styles.modalCard} onPress={() => { }}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {isActivelySyncing ? i18next.t("label.syncing") : 'Upload Details'}
                            </Text>
                            <TouchableOpacity onPress={() => setShowSyncModal(false)}>
                                <Text style={styles.modalClose}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        {isActivelySyncing ? (
                            <>
                                <View style={styles.progressRow}>
                                    <Text style={styles.progressText}>
                                        {doneCount} of {syncStatuses.length} uploaded
                                    </Text>
                                    {errorCount > 0 && (
                                        <Text style={styles.errorBadge}>{errorCount} failed</Text>
                                    )}
                                </View>
                                <ScrollView style={styles.statusList} showsVerticalScrollIndicator={false}>
                                    {syncStatuses.map((item, idx) => (
                                        <View key={idx} style={styles.statusRow}>
                                            <Text style={[
                                                styles.statusDot,
                                                item.status === 'done' && styles.dotDone,
                                                item.status === 'error' && styles.dotError,
                                                item.status === 'syncing' && styles.dotSyncing,
                                            ]}>
                                                {item.status === 'done' ? '✓' : item.status === 'error' ? '✗' : item.status === 'syncing' ? '⟳' : '○'}
                                            </Text>
                                            <Text style={[
                                                styles.statusLabel,
                                                item.status === 'error' && { color: Colors.ALERT },
                                                item.status === 'done' && { color: Colors.SUCCESS },
                                            ]}>
                                                {TYPE_LABELS[item.type] || item.type}
                                            </Text>
                                            {item.status === 'syncing' && (
                                                <Text style={styles.uploadingTag}>uploading...</Text>
                                            )}
                                        </View>
                                    ))}
                                </ScrollView>
                            </>
                        ) : (
                            <>
                                <Text style={styles.modalSubtitle}>
                                    {totalSyncItems > 0
                                        ? `${totalSyncItems} item${totalSyncItems !== 1 ? 's' : ''} ready to upload`
                                        : 'Nothing to upload'}
                                </Text>
                                <ScrollView style={styles.statusList} showsVerticalScrollIndicator={false}>
                                    {Object.entries(preSyncSummary).map(([type, count]) => (
                                        <View key={type} style={styles.statusRow}>
                                            <Text style={styles.countBadge}>{count}</Text>
                                            <Text style={styles.statusLabel}>{TYPE_LABELS[type] || type}</Text>
                                        </View>
                                    ))}
                                </ScrollView>
                                {totalSyncItems > 0 && (
                                    <Text style={styles.hintText}>Tap the sync button to start uploading</Text>
                                )}
                            </>
                        )}
                    </Pressable>
                </Pressable>
            </Modal>
        )
    }

    const renderSyncView = () => (
        <View style={styles.container}>
            <RotatingView isClockwise={true}>
                <RefreshIcon />
            </RotatingView>
            <Text style={styles.label}>{i18next.t("label.syncing")} • {interventionData.length} left</Text>
            <TouchableOpacity style={styles.infoIconWrapper} onPress={() => setShowSyncModal(true)}>
                <InfoIcon width={18} height={18} />
            </TouchableOpacity>
        </View>
    )

    const renderUnSyncView = () => (
        <View style={styles.container}>
            <Pressable style={styles.syncPressable} onPress={showLogin}>
                <UnSyncIcon width={20} height={20} />
                <Text style={styles.label}>{lastSyncDate ? formatRelativeTimeCustom(lastSyncDate) : i18next.t("label.sync_data")}{interventionData.length ? ` • ${interventionData.length} left` : ""}</Text>
            </Pressable>
            <TouchableOpacity style={styles.infoIconWrapper} onPress={() => setShowSyncModal(true)}>
                <InfoIcon width={18} height={18} />
            </TouchableOpacity>
        </View>
    )

    const renderFullySyncView = () => (
        <View style={styles.container}>
            <SyncIcon width={20} height={20} />
            <Text style={styles.label}>{i18next.t("label.fully_synced")}</Text>
        </View>
    )

    const renderTile = () => {
        if (isSyncing && !syncRequired) return renderSyncView()
        if (!isSyncing && interventionData.length > 0) return renderUnSyncView()
        if (showFullSync) return renderFullySyncView()
        return null
    }

    return (
        <View>
            {renderTile()}
            {renderSyncModal()}
        </View>
    )
}

export default SyncIntervention

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 10,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        backgroundColor: Colors.WHITE,
        borderRadius: 10
    },
    syncPressable: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    label: {
        fontSize: 14,
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        color: Colors.TEXT_COLOR,
        marginLeft: 8
    },
    infoIconWrapper: {
        marginLeft: 8,
        padding: 4,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCard: {
        width: '85%',
        maxHeight: '70%',
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    modalTitle: {
        fontSize: 16,
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        color: Colors.TEXT_COLOR,
    },
    modalClose: {
        fontSize: 16,
        color: Colors.GRAY_LIGHTEST,
        paddingHorizontal: 4,
    },
    modalSubtitle: {
        fontSize: 13,
        color: Colors.GRAY_LIGHTEST,
        marginBottom: 12,
    },
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 10,
    },
    progressText: {
        fontSize: 13,
        color: Colors.GRAY_LIGHTEST,
        flex: 1,
    },
    errorBadge: {
        fontSize: 12,
        color: Colors.WHITE,
        backgroundColor: Colors.ALERT,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    statusList: {
        maxHeight: 300,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 7,
        borderBottomWidth: 1,
        borderBottomColor: Colors.GRAY_MEDIUM,
    },
    statusDot: {
        fontSize: 14,
        width: 22,
        color: Colors.GRAY_LIGHTEST,
    },
    dotDone: {
        color: Colors.SUCCESS,
    },
    dotError: {
        color: Colors.ALERT,
    },
    dotSyncing: {
        color: Colors.PRIMARY,
    },
    statusLabel: {
        flex: 1,
        fontSize: 14,
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        color: Colors.TEXT_COLOR,
    },
    uploadingTag: {
        fontSize: 12,
        color: Colors.PRIMARY,
    },
    countBadge: {
        fontSize: 13,
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        color: Colors.WHITE,
        backgroundColor: Colors.PRIMARY,
        minWidth: 22,
        textAlign: 'center',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        marginRight: 10,
    },
    hintText: {
        fontSize: 12,
        color: Colors.GRAY_LIGHTEST,
        marginTop: 12,
        textAlign: 'center',
    },
})
