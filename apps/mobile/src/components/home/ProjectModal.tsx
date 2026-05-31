import { StyleSheet, Text, View, TouchableOpacity, FlatList, Pressable } from 'react-native'
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import ZoomSiteIcon from 'assets/images/svg/ZoomSiteIcon.svg'
import CloseIcon from 'assets/images/svg/CloseIcon.svg'
import { Colors, Typography } from 'src/utils/constants'
import CustomDropDownPicker from '../common/CustomDropDown'
import { useRealm } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { Entypo } from '@expo/vector-icons'
import bbox from '@turf/bbox'
import { RootState } from 'src/store'
import { useDispatch, useSelector } from 'react-redux'
import {
  updateCurrentProject,
  updateProjectSite,
  updateProjectState,
  updateProjectError,
} from 'src/store/slice/projectStateSlice'
import NetInfo from '@react-native-community/netinfo'
import { getUserProjects } from 'src/api/api.fetch'
import useProjectManagement from 'src/hooks/realm/useProjectManagement'
import useLogManagement from 'src/hooks/realm/useLogManagement'
import { scaleFont } from 'src/utils/constants/mixins'
import { updateMapBounds } from 'src/store/slice/mapBoundSlice'
import { BottomSheetBackdropProps, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import i18next from 'src/locales/index'
import { updateLastProject, updateProjectModal } from 'src/store/slice/displayMapSlice'
import { ProjectInterface } from 'src/types/interface/app.interface'
import { getRandomPointInPolygon } from 'src/utils/helpers/generatePointInPolygon'
import { makeInterventionGeoJson } from 'src/utils/helpers/interventionFormHelper'
import AddIcon from 'assets/images/svg/AddIcon.svg'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'

interface Props {
  isVisible: boolean
  toggleModal: () => void
}

interface DropdownItem {
  label: string
  value: string
  index: number
}

const ProjectModal = (props: Props) => {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const { isVisible, toggleModal } = props
  const [projects, setProjects] = useState<ProjectInterface[]>([])
  
  const [selectedProject, setSelectedProject] = useState<DropdownItem>({
    label: '',
    value: '',
    index: 0,
  })

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const realm = useRealm()
  const dispatch = useDispatch()

  const { currentProject, projectSite } = useSelector(
    (state: RootState) => state.projectState,
  )
  const { toggleProjectModal, lastProjectAdded } = useSelector(
    (state: RootState) => state.displayMapState,
  )
  const isLoggedIn = useSelector((state: RootState) => state.appState.isLoggedIn)
  const refetchProject = useSelector((state: RootState) => state.appState.refetchProject)
  const refreshProject = useSelector((state: RootState) => state.tempState.refreshProject)

  const { addAllProjects } = useProjectManagement()
  const { addNewLog } = useLogManagement()

  // Memoized dropdown data
  const projectDropdownData = useMemo(() => {
    return projects.map((project, index) => ({
      label: project.name,
      value: project.id,
      index
    }))
  }, [projects])

  // Current project sites
  const currentProjectSites = useMemo(() => {
    if (selectedProject.index >= 0 && projects[selectedProject.index]) {
      return projects[selectedProject.index].sites || []
    }
    return []
  }, [selectedProject.index, projects])

  // Centralized map bounds update function
  const updateMapBoundsForGeometry = useCallback((geometry: string, coordinates?: number[]) => {
    try {
      if (coordinates) {
        const { geoJSON } = makeInterventionGeoJson('Point', coordinates, 'sd')
        const bounds = bbox(geoJSON)
        dispatch(updateMapBounds({ bounds, key: 'DISPLAY_MAP' }))
      } else {
        const parsedGeometry = JSON.parse(geometry)
        const bounds = bbox(parsedGeometry)
        dispatch(updateMapBounds({ bounds, key: 'DISPLAY_MAP' }))
      }
    } catch (error) {
      console.log("Error updating map bounds:", error)
    }
  }, [dispatch])

  // Load projects from Realm
  const loadProjects = useCallback(() => {
    const allProjects = realm.objects(RealmSchema.Projects).filtered('purpose != "funds"')
    const projectsArray = JSON.parse(JSON.stringify(allProjects)) as ProjectInterface[]
    setProjects(projectsArray)

    // Set current project if it exists
    if (currentProject.projectId && projectsArray.length > 0) {
      const currentProjectIndex = projectsArray.findIndex(
        project => project.id === currentProject.projectId
      )
      if (currentProjectIndex >= 0) {
        setSelectedProject({
          label: projectsArray[currentProjectIndex].name,
          value: projectsArray[currentProjectIndex].id,
          index: currentProjectIndex
        })
      }
    }
  }, [realm, currentProject.projectId])

  // Fetch projects from the API and sync them into Realm.
  // Runs only when logged in and there is internet. Refreshes the local
  // list afterwards so the dropdown reflects the synced data.
  const fetchAndSyncProjects = useCallback(async () => {
    if (!isLoggedIn) return

    const netInfo = await NetInfo.fetch()
    if (!netInfo.isConnected) return

    const { responseData, responseError } = await getUserProjects()
    if (responseError) {
      addNewLog({
        logType: 'PROJECTS',
        message: 'Project fetching failed (response error)',
        logLevel: 'error',
        statusCode: '400',
      })
      return
    }

    if (responseData.length === 0) {
      // No projects on the account. The empty state renders on manual open.
      loadProjects()
      return
    }

    const result = await addAllProjects(responseData)
    if (result) {
      dispatch(updateProjectState(true))
      if (!currentProject.projectId && responseData.length > 0) {
        const firstProject = responseData[0]
        dispatch(updateCurrentProject({
          name: firstProject.properties.name,
          id: firstProject.properties.id,
        }))
      }
      addNewLog({
        logType: 'PROJECTS',
        message: 'Project Fetched',
        logLevel: 'info',
        statusCode: '000',
      })
    } else {
      dispatch(updateProjectError(true))
      addNewLog({
        logType: 'PROJECTS',
        message: 'Error while syncing project',
        logLevel: 'error',
        statusCode: '000',
      })
    }

    loadProjects()
  }, [isLoggedIn, currentProject.projectId, addAllProjects, addNewLog, dispatch, loadProjects])

  // Modal handlers
  const handlePresentModal = useCallback(() => {
    bottomSheetModalRef.current?.present()
  }, [])

  const closeModal = useCallback(() => {
    bottomSheetModalRef.current?.dismiss()
    toggleModal()
    dispatch(updateProjectModal(false))
  }, [toggleModal, dispatch])

  // Navigation handlers
  const createNewProject = useCallback(() => {
    closeModal()
    navigation.navigate('CreateProject' as any)
  }, [closeModal, navigation])

  const createNewSite = useCallback(() => {
    closeModal()
    navigation.navigate('ProjectSites')
  }, [closeModal, navigation])

  // Project selection handler
  const handleProjectSelection = useCallback((selectedData: DropdownItem) => {
    setSelectedProject(selectedData)

    dispatch(updateCurrentProject({
      name: selectedData.label,
      id: selectedData.value,
    }))

    // Clear site selection when project changes
    dispatch(updateProjectSite({
      name: '',
      id: '',
    }))
  }, [dispatch])

  // Site selection handler
  const handleSiteSelection = useCallback((siteId: string, site: any) => {
    dispatch(updateProjectSite({
      name: site.name,
      id: siteId,
    }))

    closeModal()

    // Update map bounds if not in project modal mode
    if (!toggleProjectModal && site.geometry) {
      updateMapBoundsForGeometry(site.geometry)
    }
  }, [closeModal, toggleProjectModal, updateMapBoundsForGeometry, dispatch])

  // Backdrop component
  const backdropComponent = useCallback(
    ({ style }: BottomSheetBackdropProps) => (
      <Pressable
        style={[style, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}
        onPress={closeModal}
      />
    ),
    [closeModal]
  )

  // Background sync: keep Realm projects in step on home load, on login
  // state change, and whenever a project refetch/refresh is requested.
  // Does not present the modal.
  useEffect(() => {
    fetchAndSyncProjects()
  }, [isLoggedIn, refetchProject, refreshProject, fetchAndSyncProjects])

  // Effect to handle modal visibility. Always fetch when the modal shows up
  // (login + internet are checked inside fetchAndSyncProjects), and show the
  // cached Realm data immediately while the fetch runs.
  useEffect(() => {
    if (isVisible || toggleProjectModal || lastProjectAdded) {
      loadProjects()
      fetchAndSyncProjects()
      handlePresentModal()
    }
  }, [isVisible, toggleProjectModal, lastProjectAdded, loadProjects, fetchAndSyncProjects, handlePresentModal, dispatch])

  // Effect to handle initial map bounds update
  useEffect(() => {
    if (!currentProject.projectId) return

    const currentProjectData = realm.objectForPrimaryKey<ProjectInterface>(
      RealmSchema.Projects,
      currentProject.projectId,
    )

    if (!currentProjectData?.geometry) return

    try {
      const parsedGeometry = JSON.parse(currentProjectData.geometry)

      if (!projectSite.siteId || projectSite.siteId === 'other') {
        // Use project geometry
        if (parsedGeometry && parsedGeometry.coordinates) {
          updateMapBoundsForGeometry('', parsedGeometry.coordinates[0])
        }
      } else {
        // Use site geometry
        const currentSiteData = currentProjectData.sites?.find(
          site => site.id === projectSite.siteId
        )

        if (currentSiteData?.geometry) {
          const siteGeometry = JSON.parse(currentSiteData.geometry)
          if (siteGeometry && siteGeometry.coordinates) {
            const randomPoint = getRandomPointInPolygon(siteGeometry.coordinates[0])
            updateMapBoundsForGeometry('', [randomPoint])
          }
        }
      }
    } catch (error) {
      console.log("Error processing project geometry:", error)
    }
  }, [currentProject.projectId, projectSite.siteId, updateMapBoundsForGeometry])

  // Empty project list component
  const emptyProjectListRender = () => (
    <View style={styles.emptyStateContainer}>
      <Text style={styles.emptyStateTitle}>
        {'No Projects Found'}
      </Text>
      <Text style={styles.emptyStateMessage}>
        'You haven't created any projects yet. Create your first project to get started.
      </Text>
      <TouchableOpacity style={styles.createButton} onPress={createNewProject}>
        <AddIcon height={16} width={16} fill={Colors.WHITE} />
        <Text style={styles.createButtonText}>
          {'Create New Project'}
        </Text>
      </TouchableOpacity>
    </View>
  )

  // Empty site list component
  const emptySiteListRender = () => (
    <View style={styles.siteCard}>
      <Text style={styles.siteCardLabel}>
        {i18next.t('label.no_site_found') || 'No sites found for this project'}
      </Text>
      <View style={styles.divider} />
      {/* <TouchableOpacity style={styles.createSiteButton} onPress={createNewSite}>
        <AddIcon height={12} width={12} fill={Colors.NEW_PRIMARY} />
      </TouchableOpacity> */}
    </View>
  )

  // Site list item renderer
  const renderSiteItem = useCallback(({ item, index }: { item: any, index: number }) => (
    <TouchableOpacity
      style={[
        styles.siteCard,
        {
          borderBottomWidth: index < currentProjectSites.length - 1 ? 1 : 0,
        },
      ]}
      key={item.id}
      onPress={() => handleSiteSelection(item.id, item)}
    >
      <Text style={styles.siteCardLabel}>{item.name}</Text>
      <View style={styles.divider} />
      {projectSite.siteId === item.id && (
        <Entypo size={16} name="check" color={Colors.NEW_PRIMARY} />
      )}
    </TouchableOpacity>
  ), [currentProjectSites.length, handleSiteSelection, projectSite.siteId, toggleProjectModal])

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      index={0}
      handleIndicatorStyle={styles.handleIndicatorStyle}
      detached={false}
      handleStyle={styles.handleStyle}
      enableContentPanningGesture={false}
      enablePanDownToClose={true}
      backdropComponent={backdropComponent}
      backgroundStyle={{ backgroundColor: 'transparent' }}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
    >
      <BottomSheetView style={styles.container}>
        <View style={styles.sectionWrapper}>
          <View style={styles.contentWrapper}>
            <View style={styles.header}>
              <ZoomSiteIcon style={styles.iconWrapper} width={24} height={24} />
              <Text style={styles.headerLabel}>
                {toggleProjectModal ? "Select Project" : i18next.t('label.zoom_to_site')}
              </Text>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.iconWrapper} onPress={closeModal}>
                <CloseIcon width={20} height={20} />
              </TouchableOpacity>
            </View>

            {projects.length === 0 ? (
              emptyProjectListRender()
            ) : (
              <>
                <Text style={styles.projectLabel}>{i18next.t('label.select_project')}</Text>
                <CustomDropDownPicker
                  label={`${i18next.t("label.project")}`}
                  data={projectDropdownData}
                  onSelect={handleProjectSelection}
                  selectedValue={selectedProject}
                  whiteBG
                />

                <View style={styles.projectSiteWrapper}>
                  <Text style={styles.projectLabel}>{i18next.t('label.select_site')}</Text>
                  {/* <Pressable style={styles.addnewWrapper} onPress={createNewSite}>
                    <Text style={styles.addNewSite}>{i18next.t("label.add_new_site")}</Text>
                    <AddIcon height={12} width={12} fill={Colors.NEW_PRIMARY} />
                  </Pressable> */}
                </View>

                <View style={styles.siteContainer}>
                  <FlatList
                    data={currentProjectSites}
                    indicatorStyle="white"
                    renderItem={renderSiteItem}
                    keyExtractor={(item) => item.id}
                    style={styles.siteWrapper}
                    ListEmptyComponent={emptySiteListRender}
                    showsVerticalScrollIndicator={false}
                    ListFooterComponent={()=><View style={{width:'100%',height:300}}></View>}
                  />
                </View>
              </>
            )}
          </View>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  )
}

export default ProjectModal

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 0,
  },
  sectionWrapper: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 100,
    backgroundColor: Colors.WHITE,

  },
  contentWrapper: {
    width: '95%',
    borderRadius: 30,
    height: '100%'
  },
  header: {
    height: 50,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconWrapper: {
    marginHorizontal: 10,
  },
  headerLabel: {
    fontSize: scaleFont(18),
    fontFamily: Typography.FONT_FAMILY_BOLD,
    color: Colors.DARK_TEXT,
    marginLeft: 10
  },
  cardLabel: {
    fontSize: 16,
    marginHorizontal: 10,
  },
  divider: {
    flex: 1,
  },
  projectSiteWrapper: {
    width: '100%',
    alignItems: "center",
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  addnewWrapper: {
    alignItems: "center",
    flexDirection: 'row',
    marginHorizontal: 10
  },
  projectLabel: {
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: 16,
    marginHorizontal: 20,
    color: Colors.DARK_TEXT,
    marginVertical: 10,
  },
  addNewSite: {
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: 14,
    color: Colors.NEW_PRIMARY,
    marginRight: 5
  },
  siteContainer: {
    width: '100%',
    marginLeft: '2.5%',
    height: '45%'
  },
  siteWrapper: {
    height: '100%',
    width: '95%',
    backgroundColor: Colors.GRAY_LIGHTEST + '1A',
    borderRadius: 10,
    paddingVertical: 5,
  },
  siteCard: {
    width: '95%',
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomColor: Colors.GRAY_BACKDROP,
    marginLeft: 10,
    paddingVertical: 20,
    borderBottomWidth: 0.5
  },
  siteCardLabel: {
    fontSize: 14,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.DARK_TEXT_COLOR,
    paddingHorizontal: 10
  },
  handleIndicatorStyle: {
    width: 0,
    height: 0
  },
  handleStyle: {
    backgroundColor: Colors.WHITE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  // New styles for empty states and buttons
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: scaleFont(18),
    fontFamily: Typography.FONT_FAMILY_BOLD,
    color: Colors.DARK_TEXT,
    textAlign: 'center',
    marginBottom: 10,
  },
  emptyStateMessage: {
    fontSize: 14,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.DARK_TEXT_COLOR,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  createButton: {
    backgroundColor: Colors.NEW_PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 10,
    minWidth: 200,
  },
  createButtonText: {
    color: Colors.WHITE,
    fontSize: 16,
    fontFamily: Typography.FONT_FAMILY_BOLD,
    marginLeft: 8,
  },
  createSiteButton: {
    padding: 8,
  },
})