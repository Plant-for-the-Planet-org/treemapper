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
import { FIX_REQUIRED } from 'src/types/type/app.type'
import i18next from 'src/locales/index'
import { RootStackParamList } from 'src/types/type/navigation.type'
import RotatingView from '../common/RotatingView'
import useMonitoringPlotManagement from 'src/hooks/realm/useMonitoringPlotManagement'
import useLogManagement from 'src/hooks/realm/useLogManagement'
import { getMobileHealth, getPersonalProject, uploadMonitoringPlot, uploadPlotRemeasurement, addPlotPlants, addPlotObservations, addPlotImages } from 'src/api/api.fetch'
import { snapshotPlot } from 'src/utils/helpers/monitoringPlotHelper/monitoringRealmHelper'
import { convertPlotToUploadBody, buildPlotRemeasurementBody, buildPlotNewPlantsBody, buildPlotObservationsBody, buildPlotImagesBody, PlotImageRecord } from 'src/utils/helpers/monitoringPlotHelper/monitoringPlotSyncHelper'

interface Props {
    isLoggedIn: boolean
    tokenValid?: boolean
}

interface PlotSyncStatus {
    plotId: string
    name: string
    status: 'pending' | 'syncing' | 'done' | 'error' | 'rejected'
    /** Why it will not upload. Shown under the row so the run explains itself. */
    detail?: string
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
// - success:   server accepted it, the plot is marked SYNCED locally
// - retryable: network/server hiccup, the plot stays queued for a later sync
// - rejected:  the server read the payload and refused it (4xx)
// - unusable:  the payload could not be built at all (no boundary, no server id)
//
// The last two are permanent for this data: retrying the same bytes can never
// succeed. Both quarantine the plot with fix_required, which takes it out of the
// queue and shows it as "Fix required" in the plot list until the user edits it.
// Before this, a rejection lasted only as long as the app session, so a broken
// plot came back on every sync and failed forever with nothing marking it.
type PlotUploadOutcome = 'success' | 'retryable' | 'rejected' | 'unusable'

// The outcome plus, when it failed for good, what was wrong in words. The reason
// is written onto the plot so the user can read it later; before this it only
// reached the debug log, and the plot list just said "Fix required".
type PlotUploadResult = { outcome: PlotUploadOutcome; detail?: string }

/**
 * A sentence the user can act on, pulled out of the server's rejection.
 *
 * The envelope carries `message` (a string, or an array when class-validator
 * rejected several fields) and sometimes `error`. Anything unreadable falls back
 * to the status code, which at least tells support where to look.
 */
const rejectionDetail = (response: any, status?: number): string => {
    const raw = response?.message ?? response?.error
    if (Array.isArray(raw) && raw.length > 0) {
        const shown = raw.filter(Boolean).slice(0, 3).join('. ')
        return raw.length > 3 ? `${shown}. (+${raw.length - 3} more)` : shown
    }
    if (typeof raw === 'string' && raw.trim()) return raw.trim()
    return status ? `The server refused this upload (error ${status}).` : 'The server refused this upload.'
}

// Which quarantine reason a permanent failure maps to.
const FIX_REASON: Record<'rejected' | 'unusable', FIX_REQUIRED> = {
    rejected: 'SERVER_REJECTED',
    unusable: 'UNKNOWN',
}

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
    const { markMonitoringPlotSynced, markRemeasurementsSynced, markPlotPlantsSynced, markPlotObservationsSynced, markPlotImagesSynced, updateFixRequiredPlot, repairPlot } = useMonitoringPlotManagement()
    // Which stuck plot is being repaired, so only its own row shows a spinner.
    const [fixingPlotId, setFixingPlotId] = useState('')
    const { addNewLog } = useLogManagement()

    // Only complete, not-yet-synced plots are uploadable. Quarantined plots
    // (fix_required != "NO") are left out of every queue below: they cannot
    // succeed as they are, so counting them as pending would promise a sync that
    // can never happen.
    const plotData = useQuery<MonitoringPlot>(
        RealmSchema.MonitoringPlot,
        data => data.filtered('status != "SYNCED" AND is_complete == true AND fix_required == "NO"'),
    )

    // Plots that failed permanently and need the user to change something.
    // Surfaced in the upload details modal and as a badge in the plot list.
    const quarantinedPlots = useQuery<MonitoringPlot>(
        RealmSchema.MonitoringPlot,
        data => data.filtered('fix_required != "NO"'),
    )

    // Already-synced plots that gained new plants (added after the plot was
    // synced, so they have no server tree id yet). These upload through the
    // add-plants endpoint.
    const newPlantsData = useQuery<MonitoringPlot>(
        RealmSchema.MonitoringPlot,
        data => data.filtered('status == "SYNCED" AND plot_plants.server_tree_id == "" AND fix_required == "NO"'),
    )

    // Already-synced plots that gained new observations (added after the plot was
    // synced, so still NOT_SYNCED). These upload through the add-observations
    // endpoint.
    const newObservationsData = useQuery<MonitoringPlot>(
        RealmSchema.MonitoringPlot,
        data => data.filtered('status == "SYNCED" AND observations.sync_status == "NOT_SYNCED" AND fix_required == "NO"'),
    )

    // Already-synced plots that have a synced plant and a pending timeline entry.
    // This is a coarse filter (the two conditions may be met by different plants);
    // the exact "synced plant with a pending measurement" check is done in JS when
    // building the remeasure work-list, so a brand-new plant doesn't trigger a
    // no-op remeasure.
    const remeasureData = useQuery<MonitoringPlot>(
        RealmSchema.MonitoringPlot,
        data => data.filtered('status == "SYNCED" AND plot_plants.server_tree_id != "" AND plot_plants.timeline.sync_status == "NOT_SYNCED" AND fix_required == "NO"'),
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
            .filter(id => {
                const plot = realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, id)
                return plot?.status === 'SYNCED' && plot?.fix_required === 'NO'
            })

    const newImagesData: PlotWithPendingImages[] = Array.from(new Set(pendingImageRows.map(r => r.parent_id)))
        .map(id => realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, id))
        .filter(plot => plot?.status === 'SYNCED' && plot?.fix_required === 'NO')
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

    // Repair one stuck plot from the sync sheet. The plot's own reason line
    // updates in place, because quarantinedPlots is a live Realm query.
    const handleFixPlot = async (plotId: string) => {
        if (fixingPlotId) return
        setFixingPlotId(plotId)
        const result = await repairPlot(plotId)
        setFixingPlotId('')
        toast.show(
            !result.requeued
                ? i18next.t('label.plot_fix_needs_you')
                : result.repaired.length > 0
                    ? i18next.t('label.plot_fix_requeued')
                    : i18next.t('label.plot_fix_nothing_found'),
            { textStyle: { textAlign: 'center' } },
        )
    }

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
    const handlePlot = async (plotId: string, projectUid: string): Promise<PlotUploadResult> => {
        try {
            const plot = realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, plotId)
            if (!plot) return { outcome: 'retryable' }
            // Plain snapshot so live-Realm access doesn't break across the awaited
            // image uploads inside the convertor.
            const snapshot = snapshotPlot(plot)
            // The group link is a Realm backlink, so it is read here off the live
            // object rather than the snapshot. A LOCAL_ONLY group was never
            // uploaded and has no server row to join, so it is left out.
            const group = plot.plot_group?.[0]
            const groupUid = group && group.sync_status !== 'LOCAL_ONLY' ? group.group_id : ''

            const { body, error, uploadedImages } = await convertPlotToUploadBody(snapshot, galleryFor(plotId), groupUid)
            if (!body) {
                addNewLog({ logType: 'DATA_SYNC', message: `Plot upload blocked: ${error}. Marked for user fix.`, logLevel: 'error', statusCode: '' })
                return { outcome: 'unusable', detail: error || 'This plot is missing something it needs before it can upload.' }
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
                    return { outcome: 'retryable' }
                }
                return { outcome: 'success' }
            }
            if (isRejectedByServer(status)) {
                addNewLog({ logType: 'DATA_SYNC', message: `Server rejected monitoring plot payload (HTTP ${status})`, logLevel: 'error', statusCode: `${status}` })
                return { outcome: 'rejected', detail: rejectionDetail(response, status) }
            }
            addNewLog({ logType: 'DATA_SYNC', message: 'Monitoring plot API response error', logLevel: 'error', statusCode: `${status ?? ''}` })
            return { outcome: 'retryable' }
        } catch (error) {
            addNewLog({ logType: 'DATA_SYNC', message: 'Monitoring plot upload error (Inside Catch)', logLevel: 'error', statusCode: '', logStack: JSON.stringify(error) })
            return { outcome: 'retryable' }
        }
    }

    // Upload one plot's pending remeasurements (new timeline entries) to the
    // remeasure endpoint, then mark the accepted entries SYNCED. The plot itself
    // is already on the server, so this never re-uploads the plot.
    const handleRemeasure = async (plotId: string, projectUid: string): Promise<PlotUploadResult> => {
        try {
            const plot = realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, plotId)
            if (!plot) return { outcome: 'retryable' }
            const snapshot = snapshotPlot(plot)

            const { body, syncedRef } = await buildPlotRemeasurementBody(snapshot)
            // Nothing actually pending (e.g. entries without a server tree id) -> done.
            if (!body) return { outcome: 'success' }

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
                        return { outcome: 'retryable' }
                    }
                }
                // A tree the server could not find will never resolve on retry.
                const allOk = syncedRef.every(s => okTrees.has(s.treeUid))
                if (allOk) return { outcome: 'success' }
                const missing = syncedRef.filter(s => !okTrees.has(s.treeUid)).length
                return {
                    outcome: 'rejected',
                    detail: `${missing} tree${missing === 1 ? '' : 's'} in this plot no longer exist on the server, so their measurements cannot be saved.`,
                }
            }
            if (isRejectedByServer(status)) {
                addNewLog({ logType: 'DATA_SYNC', message: `Server rejected remeasurement payload (HTTP ${status})`, logLevel: 'error', statusCode: `${status}` })
                return { outcome: 'rejected', detail: rejectionDetail(response, status) }
            }
            addNewLog({ logType: 'DATA_SYNC', message: 'Remeasurement API response error', logLevel: 'error', statusCode: `${status ?? ''}` })
            return { outcome: 'retryable' }
        } catch (error) {
            addNewLog({ logType: 'DATA_SYNC', message: 'Remeasurement upload error (Inside Catch)', logLevel: 'error', statusCode: '', logStack: JSON.stringify(error) })
            return { outcome: 'retryable' }
        }
    }

    // Upload plants added to an already-synced plot. Each becomes a new tree on
    // the existing plot; on success we store the server tree id and mark the
    // plant's timeline SYNCED so it can then be remeasured.
    const handleNewPlants = async (plotId: string, projectUid: string): Promise<PlotUploadResult> => {
        try {
            const plot = realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, plotId)
            if (!plot) return { outcome: 'retryable' }
            const snapshot = snapshotPlot(plot)

            const { body, error } = await buildPlotNewPlantsBody(snapshot)
            if (!body) {
                // No new plants to send, or the plot has no server id to target.
                if (error) {
                    addNewLog({ logType: 'DATA_SYNC', message: `New-plant upload blocked: ${error} (plot ${plotId})`, logLevel: 'error', statusCode: '' })
                    return { outcome: 'unusable', detail: `New plants could not be prepared: ${error}` }
                }
                return { outcome: 'success' }
            }

            const { response, success, status } = await addPlotPlants(projectUid, body)
            const result = response?.data
            if (success && result?.plants) {
                const persisted = await markPlotPlantsSynced(plotId, result.plants)
                if (!persisted) {
                    addNewLog({ logType: 'DATA_SYNC', message: `New plants uploaded but local mark-synced failed (plot ${plotId})`, logLevel: 'error', statusCode: '' })
                    return { outcome: 'retryable' }
                }
                return { outcome: 'success' }
            }
            if (isRejectedByServer(status)) {
                addNewLog({ logType: 'DATA_SYNC', message: `Server rejected new-plant payload (HTTP ${status})`, logLevel: 'error', statusCode: `${status}` })
                return { outcome: 'rejected', detail: rejectionDetail(response, status) }
            }
            addNewLog({ logType: 'DATA_SYNC', message: 'New-plant API response error', logLevel: 'error', statusCode: `${status ?? ''}` })
            return { outcome: 'retryable' }
        } catch (error) {
            addNewLog({ logType: 'DATA_SYNC', message: 'New-plant upload error (Inside Catch)', logLevel: 'error', statusCode: '', logStack: JSON.stringify(error) })
            return { outcome: 'retryable' }
        }
    }

    // Upload observations added to an already-synced plot. The plot itself is
    // already on the server, so this never re-uploads the plot; on success we
    // mark the accepted observations SYNCED.
    const handleObservations = async (plotId: string, projectUid: string): Promise<PlotUploadResult> => {
        try {
            const plot = realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, plotId)
            if (!plot) return { outcome: 'retryable' }
            const snapshot = snapshotPlot(plot)

            const { body, syncedRef, error } = await buildPlotObservationsBody(snapshot)
            if (!body) {
                // No new observations to send, or the plot has no server id to target.
                if (error) {
                    addNewLog({ logType: 'DATA_SYNC', message: `Observation upload blocked: ${error} (plot ${plotId})`, logLevel: 'error', statusCode: '' })
                    return { outcome: 'unusable', detail: `Observations could not be prepared: ${error}` }
                }
                return { outcome: 'success' }
            }

            const { response, success, status } = await addPlotObservations(projectUid, body)
            const result = response?.data
            if (success && result?.observations) {
                const syncedIds = (result.observations as { clientId: string }[]).map(o => o.clientId).filter(Boolean)
                // Fall back to the full ref if the server echoed nothing usable.
                const persisted = await markPlotObservationsSynced(plotId, syncedIds.length ? syncedIds : syncedRef)
                if (!persisted) {
                    addNewLog({ logType: 'DATA_SYNC', message: `Observations uploaded but local mark-synced failed (plot ${plotId})`, logLevel: 'error', statusCode: '' })
                    return { outcome: 'retryable' }
                }
                return { outcome: 'success' }
            }
            if (isRejectedByServer(status)) {
                addNewLog({ logType: 'DATA_SYNC', message: `Server rejected observation payload (HTTP ${status})`, logLevel: 'error', statusCode: `${status}` })
                return { outcome: 'rejected', detail: rejectionDetail(response, status) }
            }
            addNewLog({ logType: 'DATA_SYNC', message: 'Observation API response error', logLevel: 'error', statusCode: `${status ?? ''}` })
            return { outcome: 'retryable' }
        } catch (error) {
            addNewLog({ logType: 'DATA_SYNC', message: 'Observation upload error (Inside Catch)', logLevel: 'error', statusCode: '', logStack: JSON.stringify(error) })
            return { outcome: 'retryable' }
        }
    }

    // Upload photos added to an already-synced plot. The plot itself is already on
    // the server, so this only attaches photos; on success we mark exactly the ones
    // that landed as synced.
    const handleImages = async (plotId: string, projectUid: string): Promise<PlotUploadResult> => {
        // TEMPORARY: unconditional, see the note on `trace` in monitoringPlotSyncHelper.
        // eslint-disable-next-line no-console
        console.log('[PlotPhotoSync] handleImages entered', { plotId, projectUid })
        try {
            const plot = realm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, plotId)
            if (!plot) {
                // eslint-disable-next-line no-console
                console.warn('[PlotPhotoSync] plot not found on device', plotId)
                return { outcome: 'retryable', detail: 'This plot could not be found on the device.' }
            }
            const snapshot = snapshotPlot(plot)
            // eslint-disable-next-line no-console
            console.log('[PlotPhotoSync] snapshot ok', {
                serverUid: (() => { try { return JSON.parse(snapshot.meta_data || '{}')?.serverUid } catch { return 'unparseable' } })(),
                gallery: galleryFor(plotId).map(g => ({ id: g.image_id, status: g.status, hasLocal: !!g.local_uri, hasCdn: !!g.cdn_url })),
            })

            const { body, uploaded, error, failure } = await buildPlotImagesBody(snapshot, galleryFor(plotId))
            if (!body) {
                // No photo to send, or the plot has no server id to target.
                if (error) {
                    addNewLog({ logType: 'DATA_SYNC', message: `Plot image upload blocked: ${error} (plot ${plotId})`, logLevel: 'error', statusCode: '' })
                    return { outcome: 'unusable', detail: `Photos could not be prepared: ${error}` }
                }
                // Every photo upload failed: keep them queued for the next sync,
                // and say which step broke. This exit used to be silent, which is
                // why a stuck photo showed only "failed".
                if (failure) {
                    // eslint-disable-next-line no-console
                    console.warn(`[PlotPhotoSync] no photo uploaded for plot ${plotId}: ${failure}`)
                    addNewLog({ logType: 'DATA_SYNC', message: `Plot photos not uploaded: ${failure} (plot ${plotId})`, logLevel: 'error', statusCode: '' })
                    return { outcome: 'retryable', detail: failure }
                }
                return { outcome: 'success' }
            }

            const { response, success, status } = await addPlotImages(projectUid, body)
            const result = response?.data
            // eslint-disable-next-line no-console
            console.log('[PlotPhotoSync] attach to plot', {
                plotUid: body.plotUid,
                sent: body.images.map((i: any) => i.filename),
                status,
                success,
                confirmed: (result?.images || []).map((i: any) => i.filename),
                message: response?.message,
            })
            if (success && result) {
                // Only the filenames the server confirmed are marked synced.
                const stored = new Set<string>((result.images || []).map((i: any) => i.filename).filter(Boolean))
                const toMark = uploaded.filter(u => stored.has(u.filename))
                if (toMark.length > 0) {
                    const persisted = await markPlotImagesSynced(toMark)
                    if (!persisted) {
                        addNewLog({ logType: 'DATA_SYNC', message: `Plot images uploaded but local mark-synced failed (plot ${plotId})`, logLevel: 'error', statusCode: '' })
                        return { outcome: 'retryable', detail: 'The photos reached the server but could not be marked as sent on this device.' }
                    }
                }
                if (toMark.length === uploaded.length) return { outcome: 'success' }
                // The server answered 200 but did not confirm every photo, which
                // means it could not write the row. This exit used to be silent too.
                const shortBy = `The server saved ${toMark.length} of ${uploaded.length} photo${uploaded.length === 1 ? '' : 's'}. The rest will be sent again on the next sync.`
                addNewLog({ logType: 'DATA_SYNC', message: `${shortBy} (plot ${plotId})`, logLevel: 'error', statusCode: `${status ?? ''}` })
                return { outcome: 'retryable', detail: shortBy }
            }
            if (isRejectedByServer(status)) {
                addNewLog({ logType: 'DATA_SYNC', message: `Server rejected plot image payload (HTTP ${status})`, logLevel: 'error', statusCode: `${status}` })
                return { outcome: 'rejected', detail: rejectionDetail(response, status) }
            }
            addNewLog({ logType: 'DATA_SYNC', message: 'Plot image API response error', logLevel: 'error', statusCode: `${status ?? ''}` })
            return { outcome: 'retryable', detail: rejectionDetail(response, status) }
        } catch (error: any) {
            // eslint-disable-next-line no-console
            console.warn('[PlotPhotoSync] handleImages threw', error?.message || error)
            addNewLog({ logType: 'DATA_SYNC', message: 'Plot image upload error (Inside Catch)', logLevel: 'error', statusCode: '', logStack: JSON.stringify(error) })
            return { outcome: 'retryable', detail: `Photo sync stopped: ${error?.message || 'unknown error'}` }
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
                const { outcome, detail } = await handlerByKind[queue[i].kind](queue[i].plotId, queue[i].projectUid)
                const permanent = outcome === 'rejected' || outcome === 'unusable'
                if (outcome === 'success') uploaded++
                else if (permanent) {
                    rejected++
                    // Persist the quarantine so the plot stays out of the queue
                    // after the app restarts, instead of silently failing forever.
                    // The detail rides along, so the plot can say what is wrong
                    // rather than only that something is.
                    await updateFixRequiredPlot(queue[i].plotId, FIX_REASON[outcome], detail ?? '')
                }
                else failed++
                setSyncStatuses(prev => prev.map((s, idx) => idx === i
                    ? {
                        ...s,
                        status: outcome === 'success' ? 'done' : permanent ? 'rejected' : 'error',
                        detail: outcome === 'success' ? undefined : detail,
                    }
                    : s))
            }

            const remainingUploads = realm.objects(RealmSchema.MonitoringPlot)
                .filtered('status != "SYNCED" AND is_complete == true AND fix_required == "NO"').length
            const remainingNewPlants = realm.objects(RealmSchema.MonitoringPlot)
                .filtered('status == "SYNCED" AND plot_plants.server_tree_id == "" AND fix_required == "NO"').length
            const remainingNewObservations = realm.objects(RealmSchema.MonitoringPlot)
                .filtered('status == "SYNCED" AND observations.sync_status == "NOT_SYNCED" AND fix_required == "NO"').length
            const remainingRemeasure = realm.objects<MonitoringPlot>(RealmSchema.MonitoringPlot)
                .filtered('status == "SYNCED" AND plot_plants.server_tree_id != "" AND plot_plants.timeline.sync_status == "NOT_SYNCED" AND fix_required == "NO"')
                .filter(plotNeedsRemeasure).length
            const remainingImages = plotIdsWithPendingImages().length
            const remaining = remainingUploads + remainingNewPlants + remainingNewObservations + remainingRemeasure + remainingImages
            const needsFix = realm.objects(RealmSchema.MonitoringPlot).filtered('fix_required != "NO"').length

            if (remaining === 0 && needsFix === 0) {
                setShowFullSync(true)
                toast.show('All plots are synced')
            } else if (rejected > 0 || needsFix > 0) {
                toast.show(`${needsFix} plot${needsFix === 1 ? '' : 's'} could not be uploaded. Open them from the plot list, edit and save to try again.`, { textStyle: { textAlign: 'center' } })
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

    // Failures from the most recent run, kept on screen after it ends. Without this
    // a fast failure showed its reason for a moment and then the sheet went back to
    // the queue list, which is why "failed" looked like it had no reason at all.
    const lastRunFailures = isSyncing ? [] : syncStatuses.filter(s => s.status === 'error' || s.status === 'rejected')

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
                                        <View key={idx} style={styles.quarantinedRow}>
                                        <View style={styles.statusRow}>
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
                                        {!!item.detail && <Text style={styles.fixReasonText}>{item.detail}</Text>}
                                        </View>
                                    ))}
                                </ScrollView>
                            </>
                        ) : (
                            <>
                                {lastRunFailures.length > 0 && (
                                    <View style={styles.lastRunBlock}>
                                        <Text style={styles.lastRunTitle}>Last sync</Text>
                                        {lastRunFailures.map((item, idx) => (
                                            <View key={`lr-${idx}`} style={styles.quarantinedRow}>
                                                <View style={styles.statusRow}>
                                                    <Text style={[styles.statusDot, styles.dotError]}>{item.status === 'rejected' ? '!' : '✗'}</Text>
                                                    <Text style={[styles.statusLabel, { color: Colors.ALERT }]}>{item.name}</Text>
                                                </View>
                                                <Text style={styles.fixReasonText}>
                                                    {item.detail || 'Failed with no reason given.'}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                )}
                                <Text style={styles.modalSubtitle}>
                                    {pendingCount > 0
                                        ? `${pendingCount} plot${pendingCount !== 1 ? 's' : ''} ready to sync`
                                        : quarantinedPlots.length > 0
                                            ? `${quarantinedPlots.length} plot${quarantinedPlots.length !== 1 ? 's' : ''} need a fix`
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
                                    {/* Plots that can never upload as they are. Listed apart from
                                        the queue so it is clear they are waiting on the user, not
                                        on a connection. */}
                                    {quarantinedPlots.map((plot, idx) => (
                                        <View key={`q-${idx}`} style={styles.quarantinedRow}>
                                            <View style={styles.statusRow}>
                                                <Text style={[styles.statusDot, styles.dotError]}>!</Text>
                                                <Text style={[styles.statusLabel, { color: Colors.ALERT }]}>{plot.name || 'Untitled plot'}</Text>
                                                {/* Fixing from here, because this is where the user
                                                    finds out the plot is stuck. */}
                                                <TouchableOpacity
                                                    onPress={() => { handleFixPlot(plot.plot_id) }}
                                                    disabled={fixingPlotId === plot.plot_id}
                                                    style={styles.fixButton}>
                                                    <Text style={styles.fixButtonLabel}>
                                                        {fixingPlotId === plot.plot_id
                                                            ? i18next.t('label.plot_fix_working')
                                                            : i18next.t('label.plot_fix_action')}
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                            {/* The reason the server gave, verbatim. It is the only
                                                thing that tells the user what to change. */}
                                            {!!plot.fix_reason && (
                                                <Text style={styles.fixReasonText}>{plot.fix_reason}</Text>
                                            )}
                                        </View>
                                    ))}
                                </ScrollView>
                                {pendingCount > 0 && <Text style={styles.hintText}>Tap the sync button to start uploading</Text>}
                                {quarantinedPlots.length > 0 && (
                                    <Text style={styles.hintText}>
                                        Open a plot marked &quot;needs fix&quot;, change what is wrong and save. That puts it back in the queue.
                                    </Text>
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

    const renderNeedsFixView = () => (
        <View style={styles.container}>
            <Pressable style={styles.syncPressable} onPress={() => setShowSyncModal(true)}>
                <UnSyncIcon width={20} height={20} />
                <Text style={styles.label}>
                    {quarantinedPlots.length} plot{quarantinedPlots.length !== 1 ? 's' : ''} need a fix
                </Text>
            </Pressable>
            <TouchableOpacity style={styles.infoIconWrapper} onPress={() => setShowSyncModal(true)}>
                <InfoIcon width={18} height={18} />
            </TouchableOpacity>
        </View>
    )

    const renderTile = () => {
        if (isSyncing) return renderSyncView()
        if (pendingCount > 0) return renderUnSyncView()
        // Nothing left to upload, but something is stuck. Keep a way in, or the
        // quarantined plots would be invisible from here.
        if (quarantinedPlots.length > 0) return renderNeedsFixView()
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
    quarantinedRow: {
        width: '100%',
    },
    fixButton: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        backgroundColor: Colors.NEW_PRIMARY,
    },
    fixButtonLabel: {
        fontSize: 11,
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        color: Colors.WHITE,
    },
    fixReasonText: {
        fontSize: 11,
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        color: Colors.TEXT_LIGHT,
        lineHeight: 15,
        paddingLeft: 22,
        paddingRight: 6,
        paddingBottom: 6,
    },
    lastRunBlock: {
        width: '100%',
        paddingBottom: 8,
        marginBottom: 8,
        borderBottomWidth: 0.5,
        borderColor: Colors.GRAY_LIGHT,
    },
    lastRunTitle: {
        fontSize: 11,
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        color: Colors.TEXT_LIGHT,
        letterSpacing: 0.4,
        textTransform: 'uppercase',
        marginBottom: 4,
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
