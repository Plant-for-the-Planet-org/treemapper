import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useRef, useState } from 'react'
import { useQuery, useRealm } from '@realm/react'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { useToast } from 'react-native-toast-notifications'
import { useNetInfo } from '@react-native-community/netinfo'
import UnSyncIcon from 'assets/images/svg/UnSyncIcon.svg'
import SyncIcon from 'assets/images/svg/CloudSyncIcon.svg'
import RefreshIcon from 'assets/images/svg/RefreshIcon.svg'
import InfoIcon from 'assets/images/svg/BlueInfoIcon.svg'
import { Colors, Typography } from 'src/utils/constants'
import { RealmSchema } from 'src/types/enum/db.enum'
import { MonitoringPlot } from 'src/types/interface/slice.interface'
import { RootStackParamList } from 'src/types/type/navigation.type'
import RotatingView from '../common/RotatingView'
import useMonitoringPlotManagement from 'src/hooks/realm/useMonitoringPlotManagement'
import useLogManagement from 'src/hooks/realm/useLogManagement'
import { getMobileHealth, getPersonalProject, uploadMonitoringPlot, uploadPlotRemeasurement, addPlotPlants, addPlotObservations, addPlotImages } from 'src/api/api.fetch'
import { convertPlotToUploadBody, buildPlotRemeasurementBody, buildPlotNewPlantsBody, buildPlotObservationsBody, buildPlotImagesBody, PlotImageRecord } from 'src/utils/helpers/monitoringPlotHelper/monitoringPlotSyncHelper'

interface Props {
    isLoggedIn: boolean
    tokenValid?: boolean
}

interface PlotSyncStatus {
    plotId: string
    name: string
    status: 'pending' | 'syncing' | 'done' | 'error' | 'rejected'
}

// Just what the queue and the modal need of a synced plot whose photos are still
// on the device. Photos are their own Realm collection, so these are stitched
// together rather than read off a plot query.
interface PlotWithPendingImages {
    plot_id: string
    name: string
    project_id: string
    pending: number
}

// Outcome of one plot upload:
// - success: server accepted it, the plot is marked SYNCED locally
// - retryable: network/server hiccup, the plot stays queued for a later sync
// - rejected: the data itself is the problem (no boundary, or a payload the
//   server rejected with 4xx). Retrying the same bytes can't succeed, so we
//   skip it for the rest of this sync and tell the user to fix it.
type PlotUploadOutcome = 'success' | 'retryable' | 'rejected'

// A 4xx (except auth/timeout/rate-limit) means the server read the payload and
// rejected it; the same data fails forever. 5xx and network errors (customFetch
// reports those as 500) are transient and worth retrying later.
const isRejectedByServer = (status?: number) =>
    typeof status === 'number' && status >= 400 && status < 500 &&
    status !== 401 && status !== 408 && status !== 429

const SyncMonitoringPlot = ({ isLoggedIn, tokenValid }: Props) => {
    const [isSyncing, setIsSyncing] = useState(false)
    const [showSyncModal, setShowSyncModal] = useState(false)
    const [showFullSync, setShowFullSync] = useState(false)
    const [syncStatuses, setSyncStatuses] = useState<PlotSyncStatus[]>([])
    // Synchronous re-entry guard: blocks a second start the instant the first
    // begins, before any await can let a fast double-tap slip through.
    const isStartingRef = useRef(false)

    const realm = useRealm()
    const toast = useToast()
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
    const { isConnected } = useNetInfo()
    const { markMonitoringPlotSynced, markRemeasurementsSynced, markPlotPlantsSynced, markPlotObservationsSynced, markPlotImagesSynced } = useMonitoringPlotManagement()
    const { addNewLog } = useLogManagement()

    // Only complete, not-yet-synced plots are uploadable.
    const plotData = useQuery<MonitoringPlot>(
        RealmSchema.MonitoringPlot,
        data => data.filtered('status != "SYNCED" AND is_complete == true'),
    )

    // Already-synced plots that gained new plants (added after the plot was
    // synced, so they have no server tree id yet). These upload through the
    // add-plants endpoint.
    const newPlantsData = useQuery<MonitoringPlot>(
        RealmSchema.MonitoringPlot,
        data => data.filtered('status == "SYNCED" AND plot_plants.server_tree_id == ""'),
    )

    // Already-synced plots that gained new observations (added after the plot was
    // synced, so still NOT_SYNCED). These upload through the add-observations
    // endpoint.
    const newObservationsData = useQuery<MonitoringPlot>(
        RealmSchema.MonitoringPlot,
        data => data.filtered('status == "SYNCED" AND observations.sync_status == "NOT_SYNCED"'),
    )

    // Already-synced plots that have a synced plant and a pending timeline entry.
    // This is a coarse filter (the two conditions may be met by different plants);
    // the exact "synced plant with a pending measurement" check is done in JS when
    // building the remeasure work-list, so a brand-new plant doesn't trigger a
    // no-op remeasure.
    const remeasureData = useQuery<MonitoringPlot>(
        RealmSchema.MonitoringPlot,
        data => data.filtered('status == "SYNCED" AND plot_plants.server_tree_id != "" AND plot_plants.timeline.sync_status == "NOT_SYNCED"'),
    )

    // Plot photos live in their own collection (ImageData) with no link to the
    // plot, so they are matched back by parent_id.
    const pendingImageRows = useQuery<{ image_id: string; parent_id: string }>(
        RealmSchema.ImageData,
        data => data.filtered('type == "monitoring_plot" AND status != "SYNCED"'),
    )

    // One plot's photos, oldest first, as plain objects (the convertor awaits
    // uploads, so live-Realm rows must not be read across them).
    const galleryFor = (plotId: string): PlotImageRecord[] =>
        realm.objects<PlotImageRecord>(RealmSchema.ImageData)
            .filtered('parent_id == $0 AND type == $1 SORT(date_taken ASC)', plotId, 'monitoring_plot')
            .map(r => ({
                image_id: r.image_id,
                local_uri: r.local_uri,
                cdn_url: r.cdn_url,
                date_taken: r.date_taken,
                status: r.status,
            }))

    // Already-synced plots that gained photos afterwards. A plot that has not
    // synced yet sends its photos with the plot itself, so it is excluded here.
    const plotIdsWithPendingImages = (): string[] =>
        Array.from(new Set(realm.objects<{ parent_id: string }>(RealmSchema.ImageData)
            .filtered('type == "monitoring_plot" AND status != "SYNCED"')
            .map(r => r.parent_id)))
            .filter(id => realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, id)?.status === 'SYNCED')

    const newImagesData: PlotWithPendingImages[] = Array.from(new Set(pendingImageRows.map(r => r.parent_id)))
        .map(id => realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, id))
        .filter(plot => plot?.status === 'SYNCED')
        .map(plot => ({
            plot_id: plot!.plot_id,
            name: plot!.name,
            project_id: plot!.project_id,
            pending: pendingImageRows.filter(r => r.parent_id === plot!.plot_id).length,
        }))

    // A plot needs a remeasure upload only if the SAME plant is synced and has a
    // pending timeline entry.
    const plotNeedsRemeasure = (plot: MonitoringPlot) =>
        (plot.plot_plants || []).some(pl => !!pl.server_tree_id && (pl.timeline || []).some(t => t.sync_status !== 'SYNCED'))

    // Distinct plots awaiting any kind of sync (full upload + new plants +
    // new observations + remeasure + new photos).
    const pendingCount = new Set<string>([
        ...plotData.map(p => p.plot_id),
        ...newPlantsData.map(p => p.plot_id),
        ...newObservationsData.map(p => p.plot_id),
        ...remeasureData.map(p => p.plot_id),
        ...newImagesData.map(p => p.plot_id),
    ]).size

    const showLogin = () => {
        if (!isLoggedIn) {
            navigation.navigate('HomeSideDrawer')
            toast.show('Please login to start syncing plots')
        } else {
            startSyncingPlots()
        }
    }

    // Upload one plot: convert (uploading its images), POST, and on success mark
    // it SYNCED. All failures are caught and classified so a single bad plot
    // never aborts the run.
    const handlePlot = async (plotId: string, projectUid: string): Promise<PlotUploadOutcome> => {
        try {
            const plot = realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, plotId)
            if (!plot) return 'retryable'
            // Plain snapshot so live-Realm access doesn't break across the awaited
            // image uploads inside the convertor.
            const snapshot = JSON.parse(JSON.stringify(plot)) as MonitoringPlot

            const { body, error, uploadedImages } = await convertPlotToUploadBody(snapshot, galleryFor(plotId))
            if (!body) {
                addNewLog({ logType: 'DATA_SYNC', message: `Plot upload blocked: ${error}. Marked for user fix.`, logLevel: 'error', statusCode: '' })
                return 'rejected'
            }

            const { response, success, status } = await uploadMonitoringPlot(projectUid, body)
            const result = response?.data
            if (success && result?.id) {
                // The plot carried its photos, so they are stored too. A photo whose
                // upload failed is not in this list and stays pending.
                if (uploadedImages.length > 0) await markPlotImagesSynced(uploadedImages)
                const persisted = await markMonitoringPlotSynced(plotId, result.hid || '', result.id, result.plants || [])
                if (!persisted) {
                    addNewLog({ logType: 'DATA_SYNC', message: `Plot uploaded but local mark-synced failed (plot ${plotId})`, logLevel: 'error', statusCode: '' })
                    return 'retryable'
                }
                return 'success'
            }
            if (isRejectedByServer(status)) {
                addNewLog({ logType: 'DATA_SYNC', message: `Server rejected monitoring plot payload (HTTP ${status})`, logLevel: 'error', statusCode: `${status}` })
                return 'rejected'
            }
            addNewLog({ logType: 'DATA_SYNC', message: 'Monitoring plot API response error', logLevel: 'error', statusCode: `${status ?? ''}` })
            return 'retryable'
        } catch (error) {
            addNewLog({ logType: 'DATA_SYNC', message: 'Monitoring plot upload error (Inside Catch)', logLevel: 'error', statusCode: '', logStack: JSON.stringify(error) })
            return 'retryable'
        }
    }

    // Upload one plot's pending remeasurements (new timeline entries) to the
    // remeasure endpoint, then mark the accepted entries SYNCED. The plot itself
    // is already on the server, so this never re-uploads the plot.
    const handleRemeasure = async (plotId: string, projectUid: string): Promise<PlotUploadOutcome> => {
        try {
            const plot = realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, plotId)
            if (!plot) return 'retryable'
            const snapshot = JSON.parse(JSON.stringify(plot)) as MonitoringPlot

            const { body, syncedRef } = await buildPlotRemeasurementBody(snapshot)
            // Nothing actually pending (e.g. entries without a server tree id) -> done.
            if (!body) return 'success'

            const { response, success, status } = await uploadPlotRemeasurement(projectUid, body)
            const result = response?.data
            if (success && result) {
                // Mark synced only the trees the server actually resolved.
                const okTrees = new Set<string>((result.results || []).filter((r: any) => r.found).map((r: any) => r.treeUid))
                const toMark = syncedRef.filter(s => okTrees.has(s.treeUid))
                if (toMark.length > 0) {
                    const persisted = await markRemeasurementsSynced(plotId, toMark)
                    if (!persisted) {
                        addNewLog({ logType: 'DATA_SYNC', message: `Remeasurement uploaded but local mark-synced failed (plot ${plotId})`, logLevel: 'error', statusCode: '' })
                        return 'retryable'
                    }
                }
                // A tree the server could not find will never resolve on retry.
                const allOk = syncedRef.every(s => okTrees.has(s.treeUid))
                return allOk ? 'success' : 'rejected'
            }
            if (isRejectedByServer(status)) {
                addNewLog({ logType: 'DATA_SYNC', message: `Server rejected remeasurement payload (HTTP ${status})`, logLevel: 'error', statusCode: `${status}` })
                return 'rejected'
            }
            addNewLog({ logType: 'DATA_SYNC', message: 'Remeasurement API response error', logLevel: 'error', statusCode: `${status ?? ''}` })
            return 'retryable'
        } catch (error) {
            addNewLog({ logType: 'DATA_SYNC', message: 'Remeasurement upload error (Inside Catch)', logLevel: 'error', statusCode: '', logStack: JSON.stringify(error) })
            return 'retryable'
        }
    }

    // Upload plants added to an already-synced plot. Each becomes a new tree on
    // the existing plot; on success we store the server tree id and mark the
    // plant's timeline SYNCED so it can then be remeasured.
    const handleNewPlants = async (plotId: string, projectUid: string): Promise<PlotUploadOutcome> => {
        try {
            const plot = realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, plotId)
            if (!plot) return 'retryable'
            const snapshot = JSON.parse(JSON.stringify(plot)) as MonitoringPlot

            const { body, error } = await buildPlotNewPlantsBody(snapshot)
            if (!body) {
                // No new plants to send, or the plot has no server id to target.
                if (error) {
                    addNewLog({ logType: 'DATA_SYNC', message: `New-plant upload blocked: ${error} (plot ${plotId})`, logLevel: 'error', statusCode: '' })
                    return 'rejected'
                }
                return 'success'
            }

            const { response, success, status } = await addPlotPlants(projectUid, body)
            const result = response?.data
            if (success && result?.plants) {
                const persisted = await markPlotPlantsSynced(plotId, result.plants)
                if (!persisted) {
                    addNewLog({ logType: 'DATA_SYNC', message: `New plants uploaded but local mark-synced failed (plot ${plotId})`, logLevel: 'error', statusCode: '' })
                    return 'retryable'
                }
                return 'success'
            }
            if (isRejectedByServer(status)) {
                addNewLog({ logType: 'DATA_SYNC', message: `Server rejected new-plant payload (HTTP ${status})`, logLevel: 'error', statusCode: `${status}` })
                return 'rejected'
            }
            addNewLog({ logType: 'DATA_SYNC', message: 'New-plant API response error', logLevel: 'error', statusCode: `${status ?? ''}` })
            return 'retryable'
        } catch (error) {
            addNewLog({ logType: 'DATA_SYNC', message: 'New-plant upload error (Inside Catch)', logLevel: 'error', statusCode: '', logStack: JSON.stringify(error) })
            return 'retryable'
        }
    }

    // Upload observations added to an already-synced plot. The plot itself is
    // already on the server, so this never re-uploads the plot; on success we
    // mark the accepted observations SYNCED.
    const handleObservations = async (plotId: string, projectUid: string): Promise<PlotUploadOutcome> => {
        try {
            const plot = realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, plotId)
            if (!plot) return 'retryable'
            const snapshot = JSON.parse(JSON.stringify(plot)) as MonitoringPlot

            const { body, syncedRef, error } = await buildPlotObservationsBody(snapshot)
            if (!body) {
                // No new observations to send, or the plot has no server id to target.
                if (error) {
                    addNewLog({ logType: 'DATA_SYNC', message: `Observation upload blocked: ${error} (plot ${plotId})`, logLevel: 'error', statusCode: '' })
                    return 'rejected'
                }
                return 'success'
            }

            const { response, success, status } = await addPlotObservations(projectUid, body)
            const result = response?.data
            if (success && result?.observations) {
                const syncedIds = (result.observations as { clientId: string }[]).map(o => o.clientId).filter(Boolean)
                // Fall back to the full ref if the server echoed nothing usable.
                const persisted = await markPlotObservationsSynced(plotId, syncedIds.length ? syncedIds : syncedRef)
                if (!persisted) {
                    addNewLog({ logType: 'DATA_SYNC', message: `Observations uploaded but local mark-synced failed (plot ${plotId})`, logLevel: 'error', statusCode: '' })
                    return 'retryable'
                }
                return 'success'
            }
            if (isRejectedByServer(status)) {
                addNewLog({ logType: 'DATA_SYNC', message: `Server rejected observation payload (HTTP ${status})`, logLevel: 'error', statusCode: `${status}` })
                return 'rejected'
            }
            addNewLog({ logType: 'DATA_SYNC', message: 'Observation API response error', logLevel: 'error', statusCode: `${status ?? ''}` })
            return 'retryable'
        } catch (error) {
            addNewLog({ logType: 'DATA_SYNC', message: 'Observation upload error (Inside Catch)', logLevel: 'error', statusCode: '', logStack: JSON.stringify(error) })
            return 'retryable'
        }
    }

    // Upload photos added to an already-synced plot. The plot itself is already on
    // the server, so this only attaches photos; on success we mark exactly the ones
    // that landed as synced.
    const handleImages = async (plotId: string, projectUid: string): Promise<PlotUploadOutcome> => {
        try {
            const plot = realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, plotId)
            if (!plot) return 'retryable'
            const snapshot = JSON.parse(JSON.stringify(plot)) as MonitoringPlot

            const { body, uploaded, error } = await buildPlotImagesBody(snapshot, galleryFor(plotId))
            if (!body) {
                // No photo to send, or the plot has no server id to target.
                if (error) {
                    addNewLog({ logType: 'DATA_SYNC', message: `Plot image upload blocked: ${error} (plot ${plotId})`, logLevel: 'error', statusCode: '' })
                    return 'rejected'
                }
                // Every photo upload failed: keep them queued for the next sync.
                return 'retryable'
            }

            const { response, success, status } = await addPlotImages(projectUid, body)
            const result = response?.data
            if (success && result) {
                // Only the filenames the server confirmed are marked synced.
                const stored = new Set<string>((result.images || []).map((i: any) => i.filename).filter(Boolean))
                const toMark = uploaded.filter(u => stored.has(u.filename))
                if (toMark.length > 0) {
                    const persisted = await markPlotImagesSynced(toMark)
                    if (!persisted) {
                        addNewLog({ logType: 'DATA_SYNC', message: `Plot images uploaded but local mark-synced failed (plot ${plotId})`, logLevel: 'error', statusCode: '' })
                        return 'retryable'
                    }
                }
                return toMark.length === uploaded.length ? 'success' : 'retryable'
            }
            if (isRejectedByServer(status)) {
                addNewLog({ logType: 'DATA_SYNC', message: `Server rejected plot image payload (HTTP ${status})`, logLevel: 'error', statusCode: `${status}` })
                return 'rejected'
            }
            addNewLog({ logType: 'DATA_SYNC', message: 'Plot image API response error', logLevel: 'error', statusCode: `${status ?? ''}` })
            return 'retryable'
        } catch (error) {
            addNewLog({ logType: 'DATA_SYNC', message: 'Plot image upload error (Inside Catch)', logLevel: 'error', statusCode: '', logStack: JSON.stringify(error) })
            return 'retryable'
        }
    }

    // Single entry point. Plots have no inter-dependencies, so one pass over all
    // complete unsynced plots is enough (no until-empty loop like interventions).
    const startSyncingPlots = async () => {
        if (!isLoggedIn) { showLogin(); return }
        if (isStartingRef.current || isSyncing) return
        if (!tokenValid) {
            addNewLog({ logType: 'DATA_SYNC', message: 'Token invalid during plot sync', logLevel: 'error', statusCode: '' })
            toast.show('Preparing your session. Please wait a moment and try again.')
            return
        }

        isStartingRef.current = true
        setIsSyncing(true)

        let uploaded = 0
        let failed = 0
        let rejected = 0
        try {
            // Don't start a sync we can't finish. Offline is the user's connection;
            // a failed /health is the server. In both cases plots stay queued.
            if (!isConnected) {
                toast.show('Network call failed \nPlease check your internet connection', { textStyle: { textAlign: 'center' } })
                return
            }
            const health = await getMobileHealth()
            if (!health.success) {
                addNewLog({ logType: 'DATA_SYNC', message: 'Plot sync skipped: server health check failed', logLevel: 'error', statusCode: `${health.status}` })
                Alert.alert(
                    'Server under maintenance',
                    'Our servers are temporarily down. Your plots are saved and will upload automatically once maintenance is done.',
                )
                return
            }

            // Each plot now carries the project it was created for. Older plots
            // created before project selection have an empty project_id; they fall
            // back to the user's personal project (fetched once, only when needed),
            // matching the previous behaviour and the intervention fallback.
            let personalProjectUid: string | null = null
            const needsPersonalFallback = [...plotData, ...newPlantsData, ...newObservationsData, ...remeasureData, ...newImagesData]
                .some(p => !p.project_id)
            if (needsPersonalFallback) {
                const { response, success } = await getPersonalProject()
                personalProjectUid = response?.data?.properties?.uid || null
                if (!success || !personalProjectUid) {
                    addNewLog({ logType: 'DATA_SYNC', message: 'Failed to fetch personal project uid for plot sync fallback', logLevel: 'error', statusCode: '' })
                    toast.show('Could not find a project to upload plots to. Please try again.')
                    return
                }
            }
            const projectUidFor = (plot: { project_id: string }) => plot.project_id || personalProjectUid || ''

            // Snapshot the queue up front so it stays stable while we mark plots
            // SYNCED (which removes them from the live query). Order matters: full
            // uploads, then new plants on synced plots, then remeasurements (which
            // read fresh state, so a just-uploaded plant is already excluded). Each
            // item carries its own target project so plots in different projects
            // upload to the right one.
            const uploadQueue = plotData.map(p => ({ plotId: p.plot_id, name: p.name || 'Untitled plot', kind: 'upload' as const, projectUid: projectUidFor(p) }))
            const newPlantsQueue = newPlantsData.map(p => ({ plotId: p.plot_id, name: `${p.name || 'Untitled plot'} (new plants)`, kind: 'newPlants' as const, projectUid: projectUidFor(p) }))
            const newObservationsQueue = newObservationsData.map(p => ({ plotId: p.plot_id, name: `${p.name || 'Untitled plot'} (observations)`, kind: 'newObservations' as const, projectUid: projectUidFor(p) }))
            const remeasureQueue = remeasureData.filter(plotNeedsRemeasure).map(p => ({ plotId: p.plot_id, name: `${p.name || 'Untitled plot'} (remeasure)`, kind: 'remeasure' as const, projectUid: projectUidFor(p) }))
            const newImagesQueue = newImagesData.map(p => ({ plotId: p.plot_id, name: `${p.name || 'Untitled plot'} (photos)`, kind: 'newImages' as const, projectUid: projectUidFor(p) }))
            const queue = [...uploadQueue, ...newPlantsQueue, ...newObservationsQueue, ...remeasureQueue, ...newImagesQueue]
            if (queue.length === 0) { setShowFullSync(true); return }

            setSyncStatuses(queue.map(q => ({ plotId: q.plotId, name: q.name, status: 'pending' })))

            const handlerByKind = {
                upload: handlePlot,
                newPlants: handleNewPlants,
                newObservations: handleObservations,
                remeasure: handleRemeasure,
                newImages: handleImages,
            }

            for (let i = 0; i < queue.length; i++) {
                if (!isConnected) throw new Error('No network connection')
                setSyncStatuses(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'syncing' } : s))
                const outcome = await handlerByKind[queue[i].kind](queue[i].plotId, queue[i].projectUid)
                if (outcome === 'success') uploaded++
                else if (outcome === 'rejected') rejected++
                else failed++
                setSyncStatuses(prev => prev.map((s, idx) => idx === i
                    ? { ...s, status: outcome === 'success' ? 'done' : outcome === 'rejected' ? 'rejected' : 'error' }
                    : s))
            }

            const remainingUploads = realm.objects(RealmSchema.MonitoringPlot)
                .filtered('status != "SYNCED" AND is_complete == true').length
            const remainingNewPlants = realm.objects(RealmSchema.MonitoringPlot)
                .filtered('status == "SYNCED" AND plot_plants.server_tree_id == ""').length
            const remainingNewObservations = realm.objects(RealmSchema.MonitoringPlot)
                .filtered('status == "SYNCED" AND observations.sync_status == "NOT_SYNCED"').length
            const remainingRemeasure = realm.objects<MonitoringPlot>(RealmSchema.MonitoringPlot)
                .filtered('status == "SYNCED" AND plot_plants.server_tree_id != "" AND plot_plants.timeline.sync_status == "NOT_SYNCED"')
                .filter(plotNeedsRemeasure).length
            const remainingImages = plotIdsWithPendingImages().length
            const remaining = remainingUploads + remainingNewPlants + remainingNewObservations + remainingRemeasure + remainingImages

            if (remaining === 0) {
                setShowFullSync(true)
                toast.show('All plots are synced')
            } else if (rejected > 0) {
                toast.show(`${uploaded} uploaded, ${rejected} could not be accepted. Open them, fix and try again.`)
            } else {
                toast.show(`${uploaded} uploaded, ${failed} failed. Please try again.`)
            }
        } catch (error) {
            addNewLog({ logType: 'DATA_SYNC', message: 'Plot sync aborted (network)', logLevel: 'error', statusCode: '', logStack: JSON.stringify(error) })
            toast.show('Network call failed \nPlease check your internet connection', { textStyle: { textAlign: 'center' } })
        } finally {
            setIsSyncing(false)
            isStartingRef.current = false
        }
    }

    const doneCount = syncStatuses.filter(s => s.status === 'done' || s.status === 'error' || s.status === 'rejected').length
    const errorCount = syncStatuses.filter(s => s.status === 'error').length
    const rejectedCount = syncStatuses.filter(s => s.status === 'rejected').length

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
                            <Text style={styles.modalTitle}>{isActivelySyncing ? 'Syncing plots' : 'Plot Upload Details'}</Text>
                            <TouchableOpacity onPress={() => setShowSyncModal(false)}>
                                <Text style={styles.modalClose}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        {isActivelySyncing ? (
                            <>
                                <View style={styles.progressRow}>
                                    <Text style={styles.progressText}>{doneCount} of {syncStatuses.length} uploaded</Text>
                                    {errorCount > 0 && <Text style={styles.errorBadge}>{errorCount} failed</Text>}
                                    {rejectedCount > 0 && <Text style={styles.errorBadge}>{rejectedCount} need fix</Text>}
                                </View>
                                <ScrollView style={styles.statusList} showsVerticalScrollIndicator={false}>
                                    {syncStatuses.map((item, idx) => (
                                        <View key={idx} style={styles.statusRow}>
                                            <Text style={[
                                                styles.statusDot,
                                                item.status === 'done' && styles.dotDone,
                                                (item.status === 'error' || item.status === 'rejected') && styles.dotError,
                                                item.status === 'syncing' && styles.dotSyncing,
                                            ]}>
                                                {item.status === 'done' ? '✓' : item.status === 'error' ? '✗' : item.status === 'rejected' ? '!' : item.status === 'syncing' ? '⟳' : '○'}
                                            </Text>
                                            <Text style={[
                                                styles.statusLabel,
                                                (item.status === 'error' || item.status === 'rejected') && { color: Colors.ALERT },
                                                item.status === 'done' && { color: Colors.SUCCESS },
                                            ]}>
                                                {item.name}
                                            </Text>
                                            {item.status === 'syncing' && <Text style={styles.uploadingTag}>uploading...</Text>}
                                            {item.status === 'rejected' && <Text style={styles.needsFixTag}>needs fix</Text>}
                                        </View>
                                    ))}
                                </ScrollView>
                            </>
                        ) : (
                            <>
                                <Text style={styles.modalSubtitle}>
                                    {pendingCount > 0
                                        ? `${pendingCount} plot${pendingCount !== 1 ? 's' : ''} ready to sync`
                                        : 'Nothing to upload'}
                                </Text>
                                <ScrollView style={styles.statusList} showsVerticalScrollIndicator={false}>
                                    {plotData.map((plot, idx) => (
                                        <View key={`u-${idx}`} style={styles.statusRow}>
                                            <Text style={styles.countBadge}>{plot.plot_plants?.length ?? 0}</Text>
                                            <Text style={styles.statusLabel}>{plot.name || 'Untitled plot'}</Text>
                                        </View>
                                    ))}
                                    {newPlantsData.map((plot, idx) => (
                                        <View key={`n-${idx}`} style={styles.statusRow}>
                                            <Text style={styles.countBadge}>{plot.plot_plants?.length ?? 0}</Text>
                                            <Text style={styles.statusLabel}>{plot.name || 'Untitled plot'} (new plants)</Text>
                                        </View>
                                    ))}
                                    {newObservationsData.map((plot, idx) => (
                                        <View key={`o-${idx}`} style={styles.statusRow}>
                                            <Text style={styles.countBadge}>{plot.observations?.length ?? 0}</Text>
                                            <Text style={styles.statusLabel}>{plot.name || 'Untitled plot'} (observations)</Text>
                                        </View>
                                    ))}
                                    {remeasureData.map((plot, idx) => (
                                        <View key={`r-${idx}`} style={styles.statusRow}>
                                            <Text style={styles.countBadge}>{plot.plot_plants?.length ?? 0}</Text>
                                            <Text style={styles.statusLabel}>{plot.name || 'Untitled plot'} (remeasure)</Text>
                                        </View>
                                    ))}
                                    {newImagesData.map((plot, idx) => (
                                        <View key={`i-${idx}`} style={styles.statusRow}>
                                            <Text style={styles.countBadge}>{plot.pending}</Text>
                                            <Text style={styles.statusLabel}>{plot.name || 'Untitled plot'} (photos)</Text>
                                        </View>
                                    ))}
                                </ScrollView>
                                {pendingCount > 0 && <Text style={styles.hintText}>Tap the sync button to start uploading</Text>}
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
            <Text style={styles.label}>Syncing plots • {pendingCount} left</Text>
            <TouchableOpacity style={styles.infoIconWrapper} onPress={() => setShowSyncModal(true)}>
                <InfoIcon width={18} height={18} />
            </TouchableOpacity>
        </View>
    )

    const renderUnSyncView = () => (
        <View style={styles.container}>
            <Pressable style={styles.syncPressable} onPress={showLogin}>
                <UnSyncIcon width={20} height={20} />
                <Text style={styles.label}>Sync plots{pendingCount ? ` • ${pendingCount} left` : ''}</Text>
            </Pressable>
            <TouchableOpacity style={styles.infoIconWrapper} onPress={() => setShowSyncModal(true)}>
                <InfoIcon width={18} height={18} />
            </TouchableOpacity>
        </View>
    )

    const renderFullySyncView = () => (
        <View style={styles.container}>
            <SyncIcon width={20} height={20} />
            <Text style={styles.label}>Plots synced</Text>
        </View>
    )

    const renderTile = () => {
        if (isSyncing) return renderSyncView()
        if (pendingCount > 0) return renderUnSyncView()
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

export default SyncMonitoringPlot

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 10,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        backgroundColor: Colors.WHITE,
        borderRadius: 10,
    },
    syncPressable: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    label: {
        fontSize: 14,
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        color: Colors.TEXT_COLOR,
        marginLeft: 8,
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
