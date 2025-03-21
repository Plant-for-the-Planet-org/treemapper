import { StyleSheet, Text, View, TouchableOpacity, FlatList, Pressable } from 'react-native'
import React, { useEffect, useMemo, useRef, useState } from 'react'
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
} from 'src/store/slice/projectStateSlice'
import { scaleFont } from 'src/utils/constants/mixins'
import { updateMapBounds } from 'src/store/slice/mapBoundSlice'
import { BottomSheetBackdropProps, BottomSheetModal, BottomSheetView, useBottomSheetModal } from '@gorhom/bottom-sheet'
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

const ProjectModal = (props: Props) => {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const { dismiss } = useBottomSheetModal()
  const snapPoints = useMemo(() => ['65%'], []);
  const { isVisible, toggleModal } = props
  const [projectData, setProjectData] = useState<any>([])
  const [projectSites, setProjectSites] = useState<any>([])

  const [selectedProject, setSelectedProject] = useState<{
    label: string
    value: string
    index: number
  }>({
    label: '',
    value: '',
    index: 0,
  })
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

  const realm = useRealm()

  const { currentProject, projectSite } = useSelector(
    (state: RootState) => state.projectState,
  )

  const { toggleProjectModal, lastProjectAdded } = useSelector(
    (state: RootState) => state.displayMapState,
  )

  const dispatch = useDispatch()

  const projectDataDropDown = (data: any) => {
    const ProjectData = data.map((el, i) => {
      return {
        label: el.name,
        value: el.id,
        index: i,
      }
    })
    if (ProjectData.length > 0) {
      setProjectData(() => ([...ProjectData]))
      if (currentProject.projectId !== '') {
        const indexOf = ProjectData.findIndex(obj => obj.value === currentProject.projectId);
        if (indexOf >= 0) {
          setSelectedProject(ProjectData[indexOf])
          setProjectSites(data[indexOf].sites)
        }
      }
    }
  }



  const createNewSite = () => {
    closeModal()
    setTimeout(() => {
      navigation.navigate('ProjectSites')
    }, 300);
  }

  const handelSiteSelection = (id: string, item: any) => {
    dispatch(
      updateProjectSite({
        name: item.name,
        id,
      }),
    )
    dismiss()
    toggleModal()
    dispatch(updateProjectModal(false))
    if (!toggleProjectModal) {
      const geometry = JSON.parse(item?.geometry)
      const bounds = bbox(geometry)
      dispatch(
        updateMapBounds({
          bounds: bounds,
          key: 'DISPLAY_MAP',
        }),
      )
    }
  }

  const handleProjectSelection = (data: {
    label: string
    value: string
    index: number
  }) => {
    setSelectedProject(data)
    dispatch(
      updateCurrentProject({
        name: data.label,
        id: data.value,
      }),
    )
    dispatch(
      updateProjectSite({
        name: '',
        id: '',
      }),
    )
    const allProjects = realm.objects(RealmSchema.Projects)
    setProjectSites(allProjects[data.index].sites)
  }

  const handlePresentModalPress = () => {
    bottomSheetModalRef.current?.present();
  }


  useEffect(() => {
    if (isVisible || toggleProjectModal || lastProjectAdded) {
      const allProjects = realm.objects(RealmSchema.Projects).filtered('purpose != "funds"')
      if (allProjects && projectData.length === 0) {
        projectDataDropDown(JSON.parse(JSON.stringify(allProjects)))
      } else {
        projectDataDropDown([])
      }
      handlePresentModalPress()
      dispatch(updateLastProject(0))
    }
  }, [isVisible, toggleProjectModal, lastProjectAdded])

  useEffect(() => {
    setTimeout(() => {
      if (!currentProject.projectId) {
        return
      }
      const ProjectData = realm.objectForPrimaryKey<ProjectInterface>(
        RealmSchema.Projects,
        currentProject.projectId,
      )
      if (!ProjectData.geometry) {
        return
      }
      try {
        if (!projectSite.siteId || projectSite.siteId === 'other') {
          const { geoJSON } = makeInterventionGeoJson('Point', JSON.parse(ProjectData.geometry).coordinates[0], 'sd')
          const bounds = bbox(geoJSON)
          dispatch(updateMapBounds({ bounds: bounds, key: 'DISPLAY_MAP' }))
          return
        }
      } catch (error) {
        console.log("Error",error)
      }
      const currentSiteData = ProjectData.sites.filter(
        el => el.id === projectSite.siteId,
      )
      try {
        const parsedGeometry = JSON.parse(currentSiteData[0].geometry)
        const newCoords = getRandomPointInPolygon(parsedGeometry.coordinates[0])
        const { geoJSON } = makeInterventionGeoJson('Point', [newCoords], 'sd')
        const bounds = bbox(geoJSON)
        dispatch(updateMapBounds({ bounds: bounds, key: 'DISPLAY_MAP' }))
      } catch (error) {
        console.log("Error",error)
      }
    }, 500);
  }, [])





  const closeModal = () => {
    toggleModal()
    dismiss();
    dispatch(updateProjectModal(false))
  }
  const backdropModal = ({ style }: BottomSheetBackdropProps) => (
    <Pressable style={[style, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]} onPress={closeModal} />
  )

  const emptyListRenderUI = () => {
    return (
      <View style={styles.siteCard}>
        <Text style={styles.siteCardLabel}>
          {i18next.t('label.no_site_found')}
        </Text>
        <View style={styles.divider} />
      </View>
    )
  }

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      index={0}
      handleIndicatorStyle={styles.handleIndicatorStyle}
      detached
      handleStyle={styles.handleIndicatorStyle} enableContentPanningGesture={false}
      snapPoints={snapPoints}
      backdropComponent={backdropModal}
      backgroundStyle={{ backgroundColor: 'transparent' }}
    >
      <BottomSheetView style={styles.container} >
        <View style={styles.sectionWrapper}>
          <View style={styles.contentWrapper}>
            <View style={styles.header}>
              <ZoomSiteIcon style={styles.iconWrapper} width={24} height={24} />
              <Text style={styles.headerLabel}>{toggleProjectModal ? "Select Project" : i18next.t('label.zoom_to_site')}</Text>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.iconWrapper} onPress={closeModal} >
                <CloseIcon width={20} height={20} />
              </TouchableOpacity>
            </View>
            <Text style={styles.projectLabel}>{i18next.t('label.select_project')}</Text>
            <CustomDropDownPicker
              label={`${i18next.t("label.project")}`}
              data={projectData}
              onSelect={handleProjectSelection}
              selectedValue={selectedProject}
              whiteBG
            />
            <View style={styles.projectSiteWrapper}>
              <Text style={styles.projectLabel}>{i18next.t('label.select_site')}</Text>
              <Pressable style={styles.addnewWrapper} onPress={createNewSite}>
                <Text style={styles.addNewSite}>{i18next.t("label.add_new_site")}</Text>
                <AddIcon height={12} width={12} fill={Colors.NEW_PRIMARY} />
              </Pressable>
            </View>
            <View style={styles.siteContainer}>
              <FlatList
                data={projectSites}
                indicatorStyle="white"
                renderItem={({ item, index }) => {
                  return (
                    <TouchableOpacity
                      style={[
                        styles.siteCard,
                        {
                          borderBottomWidth:
                            index < projectSites.length - 1 ? 1 : 0,
                        },
                      ]}
                      key={index}
                      onPress={() => {
                        handelSiteSelection(item.id, item)
                      }}>
                      <Text style={styles.siteCardLabel}>{item.name}</Text>
                      <View style={styles.divider} />
                      {projectSite.siteId === item.id && toggleProjectModal ? (
                        <Entypo size={16} name="check" color={Colors.NEW_PRIMARY} />
                      ) : null}
                    </TouchableOpacity>
                  )
                }}
                style={styles.siteWrapper}
                ListEmptyComponent={emptyListRenderUI}
              />
            </View>
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
    backgroundColor: Colors.WHITE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
    paddingTop: 10
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
  }
})
