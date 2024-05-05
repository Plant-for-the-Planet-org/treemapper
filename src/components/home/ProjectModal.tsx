import { FlatList, StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import Modal from 'react-native-modal'
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

interface Props {
  isVisible: boolean
  toogleModal: () => void
}

const ProjectModal = (props: Props) => {
  const { isVisible, toogleModal } = props
  const [projectData, setProjectData] = useState<any>([])
  const [projectSies, setProjectSites] = useState<any>([])
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
    const allProjects = realm.objects(RealmSchema.Projects)
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

  return (
    <Modal
      style={styles.container}
      isVisible={isVisible}
      backdropColor='transparent'
      onBackdropPress={toogleModal}>
      <View style={styles.sectionWrapper}>
        <View style={styles.contnetWrapper}>
          <View style={styles.header}>
            <ZoomSiteIcon style={styles.iconWrapper} />
            <Text style={styles.headerLable}>Zoom To Site</Text>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.iconWrapper} onPress={toogleModal} >
              <CloseIcon />
            </TouchableOpacity>
          </View>
          <Text style={styles.projectLabel}>Select Project</Text>
          <CustomDropDownPicker
            label={'Project'}
            data={projectData}
            onSelect={handleProjectSelction}
            selectedValue={selectedProject}
          />

          <Text style={styles.projectLabel}>Select Site</Text>
          <View style={styles.siteContainer}>
            <FlatList
              data={projectSies}
              renderItem={({ item, index }) => {
                return (
                  <TouchableOpacity
                    style={[
                      styles.siteCard,
                      {
                        borderBottomWidth:
                          index < projectSies.length - 1 ? 1 : 0,
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
              ListEmptyComponent={() => {
                return (
                  <View style={styles.siteCard}>
                    <Text style={styles.siteCardLabel}>
                      No Sites found for this project
                    </Text>
                    <View style={styles.divider} />
                  </View>
                )
              }}
            />
          </View>
        </View>
      </View>
    </Modal>
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
    position: 'absolute',
    bottom: 0,
    backgroundColor: Colors.WHITE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
    height: '60%',
  },
  contnetWrapper: {
    width: '95%',
    paddingTop: 10,
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
  },
  siteContainer: {
    width: '100%',
    marginTop: 20,
    marginLeft: '5%',
  },
  siteWrapper: {
    width: '90%',
    backgroundColor: Colors.GRAY_LIGHTEST + '1A',
    borderRadius: 10,
    maxHeight: 200,
    paddingVertical: 5,
  },
  siteCard: {
    width: '90%',
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomColor: Colors.GRAY_BACKDROP,
    marginLeft: 10,
  },
  siteCardLabel: {
    fontSize: Typography.FONT_SIZE_16,
  },
})
