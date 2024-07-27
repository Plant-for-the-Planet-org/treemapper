import { StyleSheet, Text, View, TouchableOpacity, FlatList, Pressable } from 'react-native'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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

interface Props {
  isVisible: boolean
  toogleModal: () => void
}

const ProjectModal = (props: Props) => {
  // ref
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const { dismiss } = useBottomSheetModal()
  // variables
  const snapPoints = useMemo(() => ['65%'], []);

  const { isVisible, toogleModal } = props
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
  const realm = useRealm()
  const { currentProject, projectSite, projectAdded } = useSelector(
    (state: RootState) => state.projectState,
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
      setProjectData(ProjectData)
      setSelectedProject(ProjectData[0])

      if (data.length && data[0].sites) {
        setProjectSites(data[0].sites)
      }
      if (currentProject.projectId === '') {
        dispatch(
          updateCurrentProject({
            name: ProjectData[0].label,
            id: ProjectData[0].value,
          }),
        )
      }
    }
  }

  useEffect(() => {
    const allProjects = realm.objects(RealmSchema.Projects).filtered('purpose != "funds"')
    if (allProjects && projectData.length === 0) {
      projectDataDropDown(JSON.parse(JSON.stringify(allProjects)))
    } else {
      projectDataDropDown([])

    }
  }, [projectAdded])

  const handlSiteSelection = (id: string, item: any) => {
    dispatch(
      updateProjectSite({
        name: item.name,
        id,
      }),
    )

    const geometry = JSON.parse(item?.geometry)
    const bounds = bbox(geometry)
    dispatch(
      updateMapBounds({
        bodunds: bounds,
        key: 'DISPLAY_MAP',
      }),
    )
    dismiss()
    toogleModal()
  }

  const handleProjectSelction = (data: {
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

  useEffect(() => {
    if (isVisible) {
      handlePresentModalPress()
    }
  }, [isVisible])

  // callbacks
  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);
  const closeModal = () => {
    toogleModal()
    dismiss();
  }
  const backdropModal = ({ style }: BottomSheetBackdropProps) => (
    <Pressable style={[style, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]} onPress={closeModal} />
  )

  const emptyListRenderUI=() => {
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
      handleStyle={styles.handleIndicatorStyle}      enableContentPanningGesture={false}
      snapPoints={snapPoints}
      backdropComponent={backdropModal}
    >
      <BottomSheetView style={styles.container} >
        <View style={styles.sectionWrapper}>
          <View style={styles.contnetWrapper}>
            <View style={styles.header}>
              <ZoomSiteIcon style={styles.iconWrapper} />
              <Text style={styles.headerLable}>{i18next.t('label.zoom_to_site')}</Text>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.iconWrapper} onPress={closeModal} >
                <CloseIcon />
              </TouchableOpacity>
            </View>
            <Text style={styles.projectLabel}>{i18next.t('label.select_project')}</Text>
            <CustomDropDownPicker
              label={'Project'}
              data={projectData}
              onSelect={handleProjectSelction}
              selectedValue={selectedProject}
            />

            <Text style={styles.projectLabel}>{i18next.t('label.select_site')}</Text>
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
                        handlSiteSelection(item.id, item)
                      }}>
                      <Text style={styles.siteCardLabel}>{item.name}</Text>
                      <View style={styles.divider} />
                      {projectSite.siteId === item.id && (
                        <Entypo size={16} name="check" color={Colors.PRIMARY} />
                      )}
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
    alignItems: 'center',
  },
  contnetWrapper: {
    width: '95%',
    borderRadius:30
  },
  card: {
    height: 50,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
    borderRadius: 10,
    backgroundColor: Colors.GRAY_LIGHT,
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
  headerLable: {
    fontSize: scaleFont(16),
    fontFamily: Typography.FONT_FAMILY_BOLD,
    color:Colors.DARK_TEXT
  },
  cardLable: {
    fontSize: 16,
    marginHorizontal: 10,
  },
  divider: {
    flex: 1,
  },
  projectLabel: {
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: Typography.FONT_SIZE_14,
    marginHorizontal: 20,
    color:Colors.DARK_TEXT,
    marginVertical:10
  },
  siteContainer: {
    width: '100%',
    marginLeft: '5%',
    maxHeight: '47.5%',
  },
  siteWrapper: {
    height: '100%',
    width: '90%',
    backgroundColor: Colors.GRAY_LIGHTEST + '1A',
    borderRadius: 10,
    paddingVertical: 5,
  },
  siteCard: {
    width: '90%',
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomColor: Colors.GRAY_BACKDROP,
    marginLeft: 10,
    paddingVertical: 14
  },
  siteCardLabel: {
    fontSize: 14,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color:Colors.DARK_TEXT_COLOR
  },
  handleIndicatorStyle: {
    backgroundColor: Colors.WHITE,
    borderRadius:30
  }
})
