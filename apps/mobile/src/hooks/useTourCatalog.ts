import { useMemo } from 'react'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { useTranslation } from 'react-i18next'
import { useQuery, useRealm } from '@realm/react'
import { Ionicons } from '@expo/vector-icons'

import { RootStackParamList } from 'src/types/type/navigation.type'
import useInterventionTour from 'src/hooks/useInterventionTour'
import useManageSpeciesTour from 'src/hooks/useManageSpeciesTour'
import useMonitoringPlotTour from 'src/hooks/useMonitoringPlotTour'
import useCreateSiteTour from 'src/hooks/useCreateSiteTour'
import useMultiTreeTour from 'src/hooks/useMultiTreeTour'
import useSyncTour from 'src/hooks/useSyncTour'
import useOfflineMapTour from 'src/hooks/useOfflineMapTour'
import useRemeasureTour from 'src/hooks/useRemeasureTour'
import { RealmSchema } from 'src/types/enum/db.enum'
import { ProjectInterface } from 'src/types/interface/app.interface'
import { InterventionData, SampleTree } from 'src/types/interface/slice.interface'

export interface TourCatalogEntry {
  /** Stable key for the list and for analytics. Not the library's tour id. */
  key: string
  icon: keyof typeof Ionicons.glyphMap
  title: string
  /** One line on the card: what the user will end up having done. */
  summary: string
  confirmTitle: string
  confirmMessage: string
  /**
   * Why this tour cannot be run right now, or undefined when it can. The list
   * shows the row greyed out with this in place of the summary rather than
   * letting a tour start and stall halfway.
   */
  blockedReason?: string
  /**
   * Puts the user on the screen the first spotlight sits on, then starts.
   * Every entry drops the tour list from the stack on the way (`popToTop` or
   * `replace`), so finishing a tour leaves the user where the tour ended
   * rather than back on a menu.
   */
  begin: () => void
}

/**
 * Every walkthrough the app offers, in the order the "Show me how" screen
 * lists them.
 *
 * **Adding a tour is meant to be two files.** Write its steps under
 * `utils/tour/`, give it a hook like `useManageSpeciesTour`, then add one entry
 * here. The list screen renders whatever this returns, so it needs no change,
 * and neither does the side drawer.
 *
 * `begin` is part of the entry rather than something the screen works out,
 * because every tour starts somewhere different and the navigation is the part
 * that is easy to get wrong: the first step's target has to be mounting before
 * the tour starts, or it measures nothing and falls back to a centred tooltip.
 */
const useTourCatalog = (): TourCatalogEntry[] => {
  const { t } = useTranslation()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const { startSingleTreeTour } = useInterventionTour()
  const { startManageSpeciesTour } = useManageSpeciesTour()
  const { startMonitoringPlotTour } = useMonitoringPlotTour()
  const { startCreateSiteTour } = useCreateSiteTour()
  const { startMultiTreeTour } = useMultiTreeTour()
  const { startSyncTour } = useSyncTour()
  const { startOfflineMapTour } = useOfflineMapTour()
  const { startRemeasureTour } = useRemeasureTour()
  const realm = useRealm()

  // A monitoring plot and a site both have to belong to a project, and both
  // screens refuse to continue without one. Same filter `CreatePlotView` uses:
  // "funds" projects cannot be field-recorded into.
  const recordableProjects = useQuery<ProjectInterface>(RealmSchema.Projects, data =>
    data.filtered('purpose != "funds"'),
  )
  const hasProject = recordableProjects.length > 0

  // The sync tile only exists while something is waiting, so the tour that
  // explains it needs something waiting. Same filter `SyncIntervention` tiles
  // on, before it splits the queue from the quarantined records.
  const waitingToUpload = useQuery<InterventionData>(RealmSchema.Intervention, data =>
    data.filtered('status != "SYNCED" AND is_complete == true'),
  )

  // A tree can only be measured again once it is on the server, and only while
  // it is alive -- the same rule `SampleTreePreviewList` draws the measure icon
  // on. The tour opens on one of these, so it has to find one first.
  const remeasurableTrees = useQuery<SampleTree>(RealmSchema.TreeDetail, data =>
    data.filtered('is_alive == true AND status == "SYNCED"'),
  )

  /**
   * The tree the remeasurement tour will open, or null.
   *
   * A tree is only usable if its intervention still holds it: the review
   * screen lists `intervention.sample_trees`, so a tree whose intervention is
   * gone would leave the first spotlight with nothing to sit on.
   */
  const remeasurableTree = useMemo(() => {
    for (const tree of remeasurableTrees) {
      const intervention = realm.objectForPrimaryKey<InterventionData>(
        RealmSchema.Intervention,
        tree.intervention_id,
      )
      if (!intervention) {
        continue
      }
      for (const sampleTree of intervention.sample_trees) {
        if (sampleTree.tree_id === tree.tree_id) {
          return tree
        }
      }
    }
    return null
  }, [remeasurableTrees, realm])

  return useMemo(
    () => [
      {
        key: 'single_tree',
        icon: 'footsteps',
        title: t('label.tour_single_tree_name'),
        summary: t('label.tour_single_tree_summary'),
        confirmTitle: t('label.tour_start_alert_title'),
        confirmMessage: t('label.tour_start_alert_message'),
        begin: () => {
          // The first spotlight sits on the home screen (the project picker, or
          // the "+" button when a project is already chosen), so everything
          // above Home has to be off the stack before the tour starts.
          navigation.popToTop()
          startSingleTreeTour()
        },
      },
      {
        key: 'multi_tree',
        icon: 'grid',
        title: t('label.tour_multi_tree_name'),
        summary: t('label.tour_multi_tree_summary'),
        confirmTitle: t('label.multi_tour_start_alert_title'),
        confirmMessage: t('label.multi_tour_start_alert_message'),
        begin: () => {
          // Opens on the project picker or the "+" button, same as the single
          // tree tour, so everything above Home has to be off the stack first.
          navigation.popToTop()
          startMultiTreeTour()
        },
      },
      {
        key: 'manage_species',
        icon: 'leaf',
        title: t('label.tour_species_name'),
        summary: t('label.tour_species_summary'),
        confirmTitle: t('label.species_tour_start_alert_title'),
        confirmMessage: t('label.species_tour_start_alert_message'),
        begin: () => {
          // `replace`, not `navigate`: the tour ends two screens deep, and a
          // menu left underneath is not somewhere to come back to.
          // `manageSpecies` is the same param the drawer's Manage Species row
          // passes. Without it the screen behaves as the capture flow's species
          // picker, where tapping a card selects a species instead of opening
          // it to edit.
          navigation.replace('ManageSpecies', { manageSpecies: true })
          startManageSpeciesTour()
        },
      },
      {
        key: 'monitoring_plot',
        icon: 'analytics',
        title: t('label.tour_plot_name'),
        summary: t('label.tour_plot_summary'),
        confirmTitle: t('label.plot_tour_start_alert_title'),
        confirmMessage: t('label.plot_tour_start_alert_message'),
        blockedReason: hasProject ? undefined : t('label.plot_tour_needs_project'),
        begin: () => {
          // Opens on the "+" button, same as the single tree tour.
          navigation.popToTop()
          startMonitoringPlotTour()
        },
      },
      {
        key: 'create_site',
        icon: 'map',
        title: t('label.tour_site_name'),
        summary: t('label.tour_site_summary'),
        confirmTitle: t('label.site_tour_start_alert_title'),
        confirmMessage: t('label.site_tour_start_alert_message'),
        blockedReason: hasProject ? undefined : t('label.site_tour_needs_project'),
        begin: () => {
          // Opens on the "+" button, same as the tree and plot tours.
          navigation.popToTop()
          startCreateSiteTour()
        },
      },
      {
        key: 'remeasure',
        icon: 'resize',
        title: t('label.tour_remeasure_name'),
        summary: t('label.tour_remeasure_summary'),
        confirmTitle: t('label.remeasure_tour_start_alert_title'),
        confirmMessage: t('label.remeasure_tour_start_alert_message'),
        blockedReason: remeasurableTree ? undefined : t('label.remeasure_tour_needs_tree'),
        begin: () => {
          if (!remeasurableTree) {
            return
          }
          // The only tour that is opened on a record rather than on a screen:
          // the measure icon exists on one kind of tree, so the catalogue picks
          // the tree instead of watching the user look for one. `replace`, not
          // `navigate`: the tour ends deeper in and a menu left underneath is
          // not somewhere to come back to.
          navigation.replace('InterventionPreview', {
            id: 'preview',
            intervention: remeasurableTree.intervention_id,
            sampleTree: remeasurableTree.tree_id,
            interventionId: remeasurableTree.intervention_id,
          })
          startRemeasureTour()
        },
      },
      {
        key: 'sync',
        icon: 'cloud-upload',
        title: t('label.tour_sync_name'),
        summary: t('label.tour_sync_summary'),
        confirmTitle: t('label.sync_tour_start_alert_title'),
        confirmMessage: t('label.sync_tour_start_alert_message'),
        blockedReason: waitingToUpload.length > 0 ? undefined : t('label.sync_tour_needs_data'),
        begin: () => {
          // The first two steps sit on the map screen's header tile, so the
          // tour has to start there whichever tab the user came from.
          navigation.popToTop()
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          //@ts-expect-error nested navigator params
          navigation.navigate('Home', { screen: 'Map' })
          startSyncTour()
        },
      },
      {
        key: 'offline_maps',
        icon: 'cloud-offline',
        title: t('label.tour_offline_name'),
        summary: t('label.tour_offline_summary'),
        confirmTitle: t('label.offline_tour_start_alert_title'),
        confirmMessage: t('label.offline_tour_start_alert_message'),
        begin: () => {
          // The one tour with nothing to set up first: no project, no record,
          // no account. `replace` for the same reason as the species tour.
          navigation.replace('OfflineMap')
          startOfflineMapTour()
        },
      },
    ],
    [
      t,
      navigation,
      startSingleTreeTour,
      startManageSpeciesTour,
      startMonitoringPlotTour,
      startCreateSiteTour,
      startMultiTreeTour,
      startSyncTour,
      startOfflineMapTour,
      startRemeasureTour,
      hasProject,
      waitingToUpload.length,
      remeasurableTree,
    ],
  )
}

export default useTourCatalog
