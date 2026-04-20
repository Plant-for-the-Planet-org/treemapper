import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useMemo, useState } from 'react'
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
import { getPersonalProject, mobileInterventionImageUplaod, presingedUrl, remeasuremenMobile, skipRemeasurement, uploadAllIntervention } from 'src/api/api.fetch';
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
}

const SyncIntervention = ({ isLoggedIn, tokenValid }: Props) => {
    const [uploadData, setUploadData] = useState<QuaeBody[]>([])
    const [moreUpload, setMoreUpload] = useState(false)
    const [retryCount, setRetryCount] = useState(10)
    const [showFullSync, setShowFullSync] = useState(false)
    const [showSyncModal, setShowSyncModal] = useState(false)
    const [syncStatuses, setSyncStatuses] = useState<SyncItemStatus[]>([])

    const { syncRequired, isSyncing } = useSelector((state: RootState) => state.syncState)
    const realm = useRealm()
    const toast = useToast()
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
    const { updateInterventionStatus, updateTreeStatus, updateTreeImageStatus, updateRemeasurementStatus, updateInterventionsWithEmptyProjectIdWithCount } = useInterventionManagement()
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

    useEffect(() => {
        if (uploadData.length > 0 && moreUpload) {
            if (!tokenValid) {
                addNewLog({
                    logType: 'DATA_SYNC',
                    message: 'Token Invalid during data sync',
                    logLevel: 'error',
                    statusCode: '',
                })
            } else {
                syncUploaded()
            }
        }
    }, [uploadData, tokenValid])

    const showLogin = () => {
        setRetryCount(10)
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


    const startSyncingData = async () => {
        if (!isLoggedIn) {
            showLogin()
            return
        }

        const projectPass = await checkForProjectId();
        if (!projectPass) return;
        if (!isSyncing) {
            dispatch(updateSyncDetails(true))
            dispatch(updateLastSyncData(Date.now()))
        }
        if (retryCount > 1) {
            setRetryCount(prev => prev - 1)
        } else {
            dispatch(updateSyncDetails(false))
            setMoreUpload(false)
            toast.show("Syncing Failed, Please try again")
            return
        }
        const qData = postDataConvertor(JSON.parse(JSON.stringify(interventionData)))
        const prioritizeData = [...qData].sort((a, b) => a.priority - b.priority);
        if (prioritizeData.length > 0) {
            setSyncStatuses(prioritizeData.map((item, idx) => ({ type: item.type, index: idx, status: 'pending' })))
            setMoreUpload(true)
            setUploadData(() => prioritizeData)
        } else {
            dispatch(updateSyncDetails(false))
            setMoreUpload(false)
            setShowFullSync(true)
            dispatch(updateNewIntervention())
            toast.show("All data is synced")
        }
    }

    const syncUploaded = () => {
        setMoreUpload(false)
        uploadObjectsSequentially(uploadData);
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

    const handleMobileRemeasurement = async (el: QuaeBody): Promise<boolean> => {
        try {
            const { pData, historyID, treeID } = await getRemeasurementBody(el, true) as any;
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

    const handleSkipRemeasurement = async (el: QuaeBody): Promise<boolean> => {
        try {
            const dData = await getRemeasurementBody(el, true) as any;
            if (!dData) throw new Error("Not able to convert body");
            const { success } = await skipRemeasurement(dData.treeID ?? '', { "type": "skip-measurement" });
            if (success) {
                await updateRemeasurementStatus(el.p1Id, el.p2Id, '', true);
                return true
            }
            addNewLog({ logType: 'DATA_SYNC', message: 'Remeasurement SKIP API response error', logLevel: 'error', statusCode: '' })
            return false
        } catch (error) {
            addNewLog({ logType: 'DATA_SYNC', message: 'Remeasurement SKIP error', logLevel: 'error', statusCode: '', logStack: JSON.stringify(error) })
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

    const uploadObjectsSequentially = async (d: QuaeBody[]) => {
        for (let i = 0; i < d.length; i++) {
            const el = d[i]
            if (!isConnected) {
                dispatch(updateSyncDetails(false))
                setMoreUpload(false)
                toast.show("Network call failed \nPlease check your internet connection", { textStyle: { textAlign: 'center' } })
                return;
            }
            setSyncStatuses(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'syncing' } : s))
            let success = false
            switch (el.type) {
                case 'intervention': success = await handleIntervention(el); break;
                case 'singleTree': success = await handleSingleTree(el); break;
                case 'sampleTree': success = await handleSampleTree(el); break;
                case 'treeImage': success = await handleTreeImage(el); break;
                case 'remeasurementData': success = await handleMobileRemeasurement(el); break;
                case 'remeasurementStatus': success = await handleMobileRemeasurement(el); break;
                case 'skipRemeasurement': success = await handleSkipRemeasurement(el); break;
                default: break;
            }

            setSyncStatuses(prev => prev.map((s, idx) => idx === i ? { ...s, status: success ? 'done' : 'error' } : s))
        }
        startSyncingData();
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
