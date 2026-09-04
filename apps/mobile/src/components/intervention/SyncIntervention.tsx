import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
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
import { getMobileHealth, getPersonalProject, mobileInterventionImageUplaod, presingedUrl, recordPlannedIntervention, remeasuremenMobile, uploadAllIntervention } from 'src/api/api.fetch';
import { updateLastSyncData, updateNewIntervention } from 'src/store/slice/appStateSlice';
import { useNetInfo } from "@react-native-community/netinfo";
import { FIX_REQUIRED } from 'src/types/type/app.type';
import i18next from 'src/locales/index';
import { formatRelativeTimeCustom } from 'src/utils/helpers/appHelper/dataAndTimeHelper';
import useLogManagement from 'src/hooks/realm/useLogManagement';
import {
    AnalyticsEvents,
    incrementSessionCounter,
    trackEvent,
    trackFirstTimeEvent,
} from 'src/utils/analytics';

interface Props {
    isLoggedIn: boolean
    tokenValid?: boolean
}

interface SyncItemStatus {
    type: string
    index: number
    status: 'pending' | 'syncing' | 'done' | 'error' | 'quarantined'
}

// Outcome of one upload attempt:
// - retryable: network/server hiccup, the item stays queued and a later sync can succeed
// - quarantined: the data itself is the problem (corrupt local record or a payload the
//   server rejected with 4xx). Retrying the same bytes can never succeed, so the record
//   is taken out of the queue via fix_required until the user edits it.
type UploadOutcome = 'success' | 'retryable' | 'quarantined'

// A 4xx (except auth/timeout/rate-limit) means the server read the payload and
// rejected it; the same data will fail forever. 5xx and network errors
// (customFetch reports those as 500) are transient and worth retrying.
const isRejectedByServer = (status?: number) =>
    typeof status === 'number' && status >= 400 && status < 500 &&
    status !== 401 && status !== 408 && status !== 429

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
    const { updateInterventionStatus, updateTreeStatus, updateTreeImageStatus, updateRemeasurementStatus, updateInterventionsWithEmptyProjectIdWithCount, markPlannedInterventionSynced, updateFixRequireIntervention } = useInterventionManagement()
    const dispatch = useDispatch()
    const { addNewLog } = useLogManagement()
    const { isConnected } = useNetInfo();
    const lastSyncDate = useSelector((state: RootState) => state.appState.lastSyncDate)

    // Only records that can actually upload. Quarantined records
    // (fix_required != "NO") are excluded so the tile never counts data that
    // will never sync without a user fix.
    const interventionData = useQuery<InterventionData>(
        RealmSchema.Intervention,
        data => data.filtered('status != "SYNCED" AND is_complete == true AND fix_required == "NO"')
    )
    // Records that failed permanently (corrupt body or server-rejected
    // payload). Shown in the upload details modal and as a "Fix Required"
    // badge in the intervention list; editing resets fix_required to "NO"
    // which makes them syncable again.
    const quarantinedData = useQuery<InterventionData>(
        RealmSchema.Intervention,
        data => data.filtered('status != "SYNCED" AND is_complete == true AND fix_required != "NO"')
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
        // Interventions pointing to a project that is not in Realm don't belong
        // to the logged-in user (e.g. recorded under another account before a
        // re-login). Instead of letting their upload fail, strip the foreign
        // project + site and move them to the personal project. Planned
        // interventions are excluded: they upload against a specific server-side
        // intervention, so reassigning the project cannot fix them.
        const invWithUnknownProject = realm.objects(RealmSchema.Intervention)
            .filtered('status == "PENDING_DATA_UPLOAD" AND project_id != "" AND is_planned == false')
            .filter(intervention => !realm.objectForPrimaryKey(RealmSchema.Projects, (intervention as any).project_id));
        if (invWithoutProjectId.length === 0 && invWithUnknownProject.length === 0) return true;
        const { response, success } = await getPersonalProject();
        if (!success || !response?.data?.properties?.uid) {
            addNewLog({ logType: 'DATA_SYNC', message: 'Failed to fetch personal project uid for sync', logLevel: 'error', statusCode: '' });
            toast.show(`${invWithoutProjectId.length + invWithUnknownProject.length} of the intervention don't have project assigned. Please assign them project from intervention tab.`)
            await updateInterventionsWithEmptyProjectIdWithCount()
            return false;
        }
        const projectUid = response.data.properties.uid;
        let reassignedCount = 0;
        realm.write(() => {
            for (const intervention of invWithoutProjectId) {
                (intervention as any).project_id = projectUid;
            }
            for (const intervention of invWithUnknownProject) {
                // The personal project itself is not stored in Realm Projects,
                // so it shows up as "unknown" here. Skip it: it is already the
                // target, nothing to reassign.
                if ((intervention as any).project_id === projectUid) continue;
                (intervention as any).project_id = projectUid;
                (intervention as any).project_name = '';
                (intervention as any).site_id = '';
                (intervention as any).site_name = '';
                reassignedCount++;
            }
        });
        if (reassignedCount > 0) {
            addNewLog({ logType: 'DATA_SYNC', message: `Reassigned ${reassignedCount} intervention(s) with unknown project to personal project`, logLevel: 'info', statusCode: '' });
        }
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

        // Start of the sync funnel. The queue size is captured here, before
        // anything uploads, so "sync completed" can be read against what the
        // user was actually asking the app to send.
        const queuedAtStart = interventionData.length
        const startedAt = Date.now()
        incrementSessionCounter('syncs_started')
        trackEvent(AnalyticsEvents.SYNC_STARTED, {
            queued_interventions: queuedAtStart,
            quarantined_interventions: quarantinedData.length,
            trigger: 'manual',
        })

        let totalUploaded = 0
        let totalFailed = 0
        let totalQuarantined = 0
        try {
            // Don't start a sync we can't finish. If the device is offline, that's
            // the user's connection, not the server. If the device is online but
            // /health doesn't come back OK, the server is down/in maintenance. In
            // both cases the data stays queued in Realm and uploads on a later sync.
            if (!isConnected) {
                // Not a failure: the user tapped sync with no signal. Kept
                // separate so "sync failure rate" is not dominated by the
                // normal condition of working in the field.
                trackEvent(AnalyticsEvents.SYNC_BLOCKED, {
                    reason: 'offline',
                    queued_interventions: queuedAtStart,
                })
                toast.show("Network call failed \nPlease check your internet connection", { textStyle: { textAlign: 'center' } })
                return
            }
            const health = await getMobileHealth()
            if (!health.success) {
                trackEvent(AnalyticsEvents.SYNC_BLOCKED, {
                    reason: 'server_unhealthy',
                    status_code: health.status ?? null,
                    queued_interventions: queuedAtStart,
                })
                addNewLog({ logType: 'DATA_SYNC', message: 'Sync skipped: server health check failed', logLevel: 'error', statusCode: `${health.status}` })
                Alert.alert(
                    "Server under maintenance",
                    "Our servers are temporarily down. Your data is saved and will upload automatically once maintenance is done."
                )
                return
            }

            const projectPass = await checkForProjectId();
            if (!projectPass) {
                trackEvent(AnalyticsEvents.SYNC_BLOCKED, {
                    reason: 'missing_project_assignment',
                    queued_interventions: queuedAtStart,
                })
                return;
            }

            dispatch(updateLastSyncData(Date.now()))

            while (true) {
                const { uploaded, failed, quarantined, remaining } = await runSyncPass()
                if (remaining === 0) break          // nothing left to upload
                totalUploaded += uploaded
                totalFailed += failed
                totalQuarantined += quarantined
                if (uploaded === 0) break            // no progress, only unresolvable items remain
            }

            // Source of truth for "done" is the same query the tile uses, not just
            // an empty queue, so we never claim "synced" while records remain.
            const remaining = realm.objects(RealmSchema.Intervention)
                .filtered('status != "SYNCED" AND is_complete == true AND fix_required == "NO"').length
            const needsFix = realm.objects(RealmSchema.Intervention)
                .filtered('status != "SYNCED" AND is_complete == true AND fix_required != "NO"').length

            // One row per sync attempt that actually ran. `is_fully_synced`
            // is the number to watch: a sync can upload plenty and still
            // leave the user with data on the device.
            trackEvent(AnalyticsEvents.SYNC_COMPLETED, {
                uploaded: totalUploaded,
                failed: totalFailed,
                quarantined: totalQuarantined,
                queued_at_start: queuedAtStart,
                remaining_after: remaining,
                needs_fix_after: needsFix,
                is_fully_synced: remaining === 0 && needsFix === 0,
                duration_ms: Date.now() - startedAt,
            })
            incrementSessionCounter('syncs_completed')
            incrementSessionCounter('trees_synced', totalUploaded)

            if (remaining === 0 && needsFix === 0) {
                // Section 10: the point a new user's data first reaches the
                // server, which is the real end of onboarding.
                trackFirstTimeEvent(AnalyticsEvents.FIRST_SYNC_COMPLETED, {
                    uploaded: totalUploaded,
                })
                setShowFullSync(true)
                dispatch(updateNewIntervention())
                toast.show("All data is synced")
            } else if (totalQuarantined > 0 || needsFix > 0) {
                toast.show(`${needsFix} item${needsFix !== 1 ? 's' : ''} could not be uploaded. Open them from the intervention list, edit and save to retry.`)
            } else if (totalFailed > 0) {
                toast.show(`${totalUploaded} uploaded, ${totalFailed} failed. Please try again.`)
            } else {
                toast.show(`${remaining} intervention${remaining !== 1 ? 's' : ''} still need attention.`)
            }
        } catch (error) {
            // The connection dropped mid-upload, which is the sync failure
            // that actually hurts: some items are through and some are not.
            trackEvent(AnalyticsEvents.SYNC_FAILED, {
                reason: 'connection_lost',
                uploaded_before_failure: totalUploaded,
                queued_at_start: queuedAtStart,
                duration_ms: Date.now() - startedAt,
            })
            addNewLog({ logType: 'DATA_SYNC', message: 'Sync aborted (network)', logLevel: 'error', statusCode: '', logStack: JSON.stringify(error) })
            toast.show("Network call failed \nPlease check your internet connection", { textStyle: { textAlign: 'center' } })
        } finally {
            dispatch(updateSyncDetails(false))
            isStartingRef.current = false
        }
    }

    // Build the prioritized queue from current Realm state and upload each item
    // in turn. Returns counts so the caller can decide whether to run again.
    const runSyncPass = async (): Promise<{ uploaded: number; failed: number; quarantined: number; remaining: number }> => {
        const qData = postDataConvertor(JSON.parse(JSON.stringify(interventionData)))
        const queue = [...qData].sort((a, b) => a.priority - b.priority)
        if (queue.length === 0) return { uploaded: 0, failed: 0, quarantined: 0, remaining: 0 }

        setSyncStatuses(queue.map((item, idx) => ({ type: item.type, index: idx, status: 'pending' })))

        let uploaded = 0
        let failed = 0
        let quarantined = 0
        for (let i = 0; i < queue.length; i++) {
            if (!isConnected) throw new Error('No network connection')
            setSyncStatuses(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'syncing' } : s))
            const outcome = await handleItem(queue[i])
            if (outcome === 'success') uploaded++
            else if (outcome === 'quarantined') quarantined++
            else failed++
            if (outcome !== 'success') {
                // Which kind of upload goes wrong, and whether it can ever
                // recover. "retryable" is a hiccup the next sync fixes;
                // "quarantined" means the user has to go and edit the record,
                // which is the one worth chasing.
                trackEvent(AnalyticsEvents.SYNC_ITEM_FAILED, {
                    item_type: queue[i].type,
                    outcome,
                })
            }
            setSyncStatuses(prev => prev.map((s, idx) => idx === i ? { ...s, status: outcome === 'success' ? 'done' : outcome === 'quarantined' ? 'quarantined' : 'error' } : s))
        }
        return { uploaded, failed, quarantined, remaining: queue.length }
    }

    const handleItem = async (el: QuaeBody): Promise<UploadOutcome> => {
        switch (el.type) {
            case 'intervention': return handleIntervention(el)
            case 'singleTree': return handleSingleTree(el)
            case 'plannedTree': return handlePlantingIntervention(el)
            case 'sampleTree': return handleSampleTree(el)
            case 'treeImage': return handleTreeImage(el)
            case 'remeasurementData': return handleMobileRemeasurement(el)
            case 'remeasurementStatus': return handleMobileRemeasurement(el)
            case 'skipRemeasurement': return handleSkipRemeasurement(el)
            default: return 'retryable'
        }
    }

    // Take a permanently-failing record out of the sync queue so the tile
    // stops counting it as pending. It shows up as "Fix Required" in the
    // intervention list; editing it resets fix_required and re-queues it.
    const quarantineItem = async (el: QuaeBody, reason: FIX_REQUIRED, detail: string): Promise<UploadOutcome> => {
        await updateFixRequireIntervention(el.p1Id, reason)
        addNewLog({ logType: 'DATA_SYNC', message: `Upload blocked (${el.type}): ${detail}. Marked for user fix.`, logLevel: 'error', statusCode: '' })
        return 'quarantined'
    }

    // Body conversion returned no payload. fixRequired != "NO" marks corrupt
    // or missing local data (quarantine); otherwise a dependency is simply
    // not uploaded yet and a later pass resolves it (retryable).
    const handleUnconvertedBody = async (el: QuaeBody, converted: any): Promise<UploadOutcome> => {
        if (converted?.fixRequired && converted.fixRequired !== 'NO') {
            return quarantineItem(el, 'UNKNOWN', converted?.message || 'Body conversion failed')
        }
        return 'retryable'
    }

    // Skip remeasurement has no upload (the legacy v3 API was removed). It only
    // resolves the tree locally to SYNCED so its parent intervention can finish.
    const handleSkipRemeasurement = async (el: QuaeBody): Promise<UploadOutcome> => {
        try {
            await updateRemeasurementStatus(el.p1Id, el.p2Id, '', true);
            return 'success'
        } catch (error) {
            addNewLog({ logType: 'DATA_SYNC', message: 'Skip remeasurement local update error', logLevel: 'error', statusCode: '', logStack: JSON.stringify(error) })
            return 'retryable'
        }
    }

    const handleIntervention = async (el: QuaeBody): Promise<UploadOutcome> => {
        try {
            const converted = await getPostBody(el) as any;
            if (!converted?.pData) return handleUnconvertedBody(el, converted)
            const { responseData, responseError, status } = await uploadAllIntervention(converted.pData);
            if (!responseError && responseData && responseData.parentHid && responseData.parentId) {
                await updateInterventionStatus(el.p1Id, responseData.parentHid, responseData.parentId, el.nextStatus);
                return 'success'
            }
            if (isRejectedByServer(status)) {
                return quarantineItem(el, 'SERVER_REJECTED', `Server rejected intervention payload (HTTP ${status})`)
            }
            addNewLog({ logType: 'DATA_SYNC', message: 'Intervention API response error', logLevel: 'error', statusCode: `${status ?? ''}` })
            return 'retryable'
        } catch (error) {
            addNewLog({ logType: 'DATA_SYNC', message: 'Intervention API response error(Inside Catch)', logLevel: 'error', statusCode: '', logStack: JSON.stringify(error) })
            return 'retryable'
        }
    };

    const handleSingleTree = async (el: QuaeBody): Promise<UploadOutcome> => {
        try {
            const converted = await getPostBody(el) as any;
            if (!converted?.pData) return handleUnconvertedBody(el, converted)
            const { responseData, responseError, status } = await uploadAllIntervention(converted.pData);
            if (!responseError && responseData && responseData.treeId && responseData.parentId) {
                const result = await updateInterventionStatus(el.p1Id, responseData.parentHid, responseData.parentId, el.nextStatus);
                if (result) {
                    await updateTreeStatus(el.p2Id, responseData.treeHid, responseData.treeId, el.nextStatus, responseData.parentId, responseData.coordinates);
                }
                return 'success'
            }
            if (isRejectedByServer(status)) {
                return quarantineItem(el, 'SERVER_REJECTED', `Server rejected single tree payload (HTTP ${status})`)
            }
            addNewLog({ logType: 'DATA_SYNC', message: 'Single Tree API response error', logLevel: 'error', statusCode: `${status ?? ''}` })
            return 'retryable'
        } catch (error) {
            addNewLog({ logType: 'DATA_SYNC', message: 'Single Tree API response error(Inside Catch)', logLevel: 'error', statusCode: '', logStack: JSON.stringify(error) })
            return 'retryable'
        }
    };

    const handlePlantingIntervention = async (el: QuaeBody): Promise<UploadOutcome> => {
        try {
            const converted = await getPostBody(el) as any;
            if (!converted?.pData) return handleUnconvertedBody(el, converted)
            const pData = converted.pData;
            // Planned interventions record against a specific server-side
            // intervention, so missing routing ids cannot heal on retry.
            if (!pData.projectId || !pData.interventionId) {
                return quarantineItem(el, 'UNKNOWN', 'Planned record missing project or intervention id')
            }

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
            const { response, success, status } = await recordPlannedIntervention(pData.projectId, pData.interventionId, requestBody);
            // The server wraps the result one level deep: response.data holds { success, data, tree }.
            const result = response?.data;
            addNewLog({ logType: 'DATA_SYNC', message: `Planned record response success=${success} serverSuccess=${result?.success} tree=${JSON.stringify(result?.tree)}`, logLevel: 'info', statusCode: '' })

            if (success && result && result.success) {
                const treeResult = result.tree || {};
                const persisted = await markPlannedInterventionSynced(el.p1Id, el.p2Id, treeResult.treeHid || '', treeResult.treeUid || '', imageFilename);
                addNewLog({ logType: 'DATA_SYNC', message: `Planned markSynced persisted=${persisted} p1Id=${el.p1Id} p2Id=${el.p2Id}`, logLevel: persisted ? 'info' : 'error', statusCode: '' })
                if (!persisted) return 'retryable'
                return 'success'
            }
            if (isRejectedByServer(status)) {
                return quarantineItem(el, 'SERVER_REJECTED', `Server rejected planned record payload (HTTP ${status})`)
            }
            addNewLog({ logType: 'DATA_SYNC', message: 'Planned intervention record API response error', logLevel: 'error', statusCode: `${status ?? ''}` })
            return 'retryable'
        } catch (error) {
            addNewLog({ logType: 'DATA_SYNC', message: 'Planned intervention record error(Inside Catch)', logLevel: 'error', statusCode: '', logStack: JSON.stringify(error) })
            return 'retryable'
        }
    };

    const handleMobileRemeasurement = async (el: QuaeBody): Promise<UploadOutcome> => {
        try {
            const converted = await getRemeasurementBody(el) as any;
            if (!converted?.pData) return handleUnconvertedBody(el, converted)
            const { pData, historyID, treeID } = converted;
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

            const apiResult = await remeasuremenMobile(treeID ?? '', requestBody);
            if (apiResult?.success) {
                await updateRemeasurementStatus(el.p1Id, el.p2Id, historyID ?? '');
                return 'success'
            }
            if (isRejectedByServer(apiResult?.status)) {
                return quarantineItem(el, 'SERVER_REJECTED', `Server rejected remeasurement payload (HTTP ${apiResult?.status})`)
            }
            addNewLog({ logType: 'DATA_SYNC', message: 'Remeasurement Tree API response error', logLevel: 'error', statusCode: `${apiResult?.status ?? ''}` })
            return 'retryable'
        } catch (error) {
            addNewLog({ logType: 'DATA_SYNC', message: 'Remeasurement error(Inside Catch)', logLevel: 'error', statusCode: '', logStack: JSON.stringify(error) })
            return 'retryable'
        }
    };

    const handleSampleTree = async (el: QuaeBody): Promise<UploadOutcome> => {
        try {
            const converted = await getPostBody(el) as any;
            if (!converted?.pData) return handleUnconvertedBody(el, converted)
            const pData = converted.pData;
            const { responseData, responseError, status } = await uploadAllIntervention(pData);
            if (!responseError && responseData && responseData.parentHid && responseData.parentId) {
                await updateTreeStatus(el.p2Id, responseData.parentHid, responseData.parentId, el.nextStatus, pData.parent, responseData.coordinates);
                return 'success'
            }
            if (isRejectedByServer(status)) {
                return quarantineItem(el, 'SERVER_REJECTED', `Server rejected sample tree payload (HTTP ${status})`)
            }
            addNewLog({ logType: 'DATA_SYNC', message: 'Sample Tree API response error', logLevel: 'error', statusCode: `${status ?? ''}` })
            return 'retryable'
        } catch (error) {
            addNewLog({ logType: 'DATA_SYNC', message: 'Sample Tree API response error(Inside Catch)', logLevel: 'error', statusCode: '', logStack: JSON.stringify(error) })
            return 'retryable'
        }
    };

    const handleTreeImage = async (el: QuaeBody): Promise<UploadOutcome> => {
        try {
            const converted = await getPostBody(el) as any;
            if (!converted?.pData) return handleUnconvertedBody(el, converted)
            const pData = converted.pData;
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
            const attachResult = await mobileInterventionImageUplaod({ treeUid: pData.treeServerId, filename: fileName, mimeType: 'image/jpg' });
            if (!attachResult.success) {
                if (isRejectedByServer(attachResult.status)) {
                    return quarantineItem(el, 'SERVER_REJECTED', `Server rejected tree image (HTTP ${attachResult.status})`)
                }
                throw new Error(`Image attach failed with status: ${attachResult.status}`)
            }
            await updateTreeImageStatus(el.p2Id, el.p1Id, fileName);
            return 'success'
        } catch (error) {
            addNewLog({ logType: 'DATA_SYNC', message: 'Image Upload API response error (Inside Catch)', logLevel: 'error', statusCode: '', logStack: JSON.stringify(error) });
            return 'retryable'
        }
    };

    const totalSyncItems = Object.values(preSyncSummary).reduce((a, b) => a + b, 0)
    const doneCount = syncStatuses.filter(s => s.status === 'done' || s.status === 'error' || s.status === 'quarantined').length
    const errorCount = syncStatuses.filter(s => s.status === 'error').length
    const quarantinedCount = syncStatuses.filter(s => s.status === 'quarantined').length

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
                                    {quarantinedCount > 0 && (
                                        <Text style={styles.errorBadge}>{quarantinedCount} need fix</Text>
                                    )}
                                </View>
                                <ScrollView style={styles.statusList} showsVerticalScrollIndicator={false}>
                                    {syncStatuses.map((item, idx) => (
                                        <View key={idx} style={styles.statusRow}>
                                            <Text style={[
                                                styles.statusDot,
                                                item.status === 'done' && styles.dotDone,
                                                (item.status === 'error' || item.status === 'quarantined') && styles.dotError,
                                                item.status === 'syncing' && styles.dotSyncing,
                                            ]}>
                                                {item.status === 'done' ? '✓' : item.status === 'error' ? '✗' : item.status === 'quarantined' ? '!' : item.status === 'syncing' ? '⟳' : '○'}
                                            </Text>
                                            <Text style={[
                                                styles.statusLabel,
                                                (item.status === 'error' || item.status === 'quarantined') && { color: Colors.ALERT },
                                                item.status === 'done' && { color: Colors.SUCCESS },
                                            ]}>
                                                {TYPE_LABELS[item.type] || item.type}
                                            </Text>
                                            {item.status === 'syncing' && (
                                                <Text style={styles.uploadingTag}>uploading...</Text>
                                            )}
                                            {item.status === 'quarantined' && (
                                                <Text style={styles.needsFixTag}>needs fix</Text>
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
                                {quarantinedData.length > 0 && (
                                    <View style={styles.attentionBox}>
                                        <Text style={styles.attentionTitle}>
                                            {quarantinedData.length} item{quarantinedData.length !== 1 ? 's' : ''} need your attention
                                        </Text>
                                        <Text style={styles.attentionText}>
                                            These could not be uploaded because the data was not accepted. Open them from the intervention list, edit and save to retry.
                                        </Text>
                                    </View>
                                )}
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
        // Quarantined records don't count as pending ("N left" only counts
        // syncable items), but keep the tile so the info icon still opens the
        // upload details modal where they are explained.
        if (!isSyncing && (interventionData.length > 0 || quarantinedData.length > 0)) return renderUnSyncView()
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
    needsFixTag: {
        fontSize: 12,
        color: Colors.ALERT,
    },
    attentionBox: {
        marginTop: 12,
        padding: 10,
        borderRadius: 10,
        backgroundColor: Colors.ALERT + '14',
    },
    attentionTitle: {
        fontSize: 13,
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        color: Colors.ALERT,
        marginBottom: 4,
    },
    attentionText: {
        fontSize: 12,
        color: Colors.TEXT_COLOR,
        lineHeight: 17,
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
