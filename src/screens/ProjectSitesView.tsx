import { Pressable, StyleProp, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Colors, Typography } from 'src/utils/constants'
import { SafeAreaView } from 'react-native-safe-area-context'
import Header from 'src/components/common/Header'
import { useRealm } from '@realm/react'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { AvoidSoftInput } from 'react-native-avoid-softinput'
import { useToast } from 'react-native-toast-notifications'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { RealmSchema } from 'src/types/enum/db.enum'
import { DropdownData, ProjectInterface } from 'src/types/interface/app.interface'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/store'
import i18next from 'i18next'
import CustomDropDown from 'src/components/common/CustomDropDown'
import CustomTextInput from 'src/components/common/CustomTextInput'
import SiteCreationMap from 'src/components/map/SiteCreationMap'
import { GeoJSONObject } from '@turf/helpers'
import AddIcon from 'assets/images/svg/AddIcon.svg'
import CustomButton from 'src/components/common/CustomButton'
import MapLibreGL, { LineLayerStyle } from '@maplibre/maplibre-react-native'
import PenIcon from 'assets/images/svg/EditPenIcon.svg'
import bbox from '@turf/bbox'
import { makeInterventionGeoJson } from 'src/utils/helpers/interventionFormHelper'
import { createNewSite } from 'src/api/api.fetch'
import useProjectManagement from 'src/hooks/realm/useProjectManagement'
import { updateLastProject } from 'src/store/slice/displayMapSlice'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const MapStyle = require('assets/mapStyle/mapStyleOutput.json')



const ProjectSitesView = () => {


  const realm = useRealm()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const toast = useToast()
  const [allProjects, setAllProjects] = useState<DropdownData[]>([])
  const [showMap, setShowMap] = useState(false)
  const [geometry, setGeometry] = useState(null)
  const [loading, setLoading] = useState(false)
  const [projectBounds, setProjectBounds] = useState([])
  const { addNewSite } = useProjectManagement()
  const dispatch = useDispatch()
  const [selectedProject, setSelectedProject] = useState<DropdownData>({
    label: '',
    value: '',
    index: 0
  })
  const [selectedStatus, setSelectedStatus] = useState<DropdownData>({
    label: 'Planting',
    value: 'planting',
    index: 0
  })

  const [siteName, setSiteName] = useState('')
  const cameraRef = React.createRef<MapLibreGL.Camera>()

  const { currentProject } = useSelector(
    (state: RootState) => state.projectState,
  )

  const statusData: DropdownData[] = [
    {
      label: 'Planting',
      value: 'planting',
      index: 0
    },
    {
      label: 'Planted',
      value: 'planted',
      index: 0
    },
    {
      label: 'Barren',
      value: 'barren',
      index: 0
    },
    {
      label: 'Reforestation',
      value: 'reforestation',
      index: 0
    },
  ]


  const polyline: StyleProp<LineLayerStyle> = {
    lineWidth: 2,
    lineOpacity: 1,
    lineJoin: 'bevel',
  }

  useEffect(() => {
    setupProjectAndSiteDropDown()
    AvoidSoftInput.setShouldMimicIOSBehavior(true);
    return () => {
      AvoidSoftInput.setShouldMimicIOSBehavior(false);
    };
  }, [])


  const setupProjectAndSiteDropDown = () => {
    const projectData = realm.objects<ProjectInterface>(RealmSchema.Projects)
    const mappedData = projectData.map((el, i) => {
      return {
        label: el.name,
        value: el.id,
        index: i,
      }
    })
    if (mappedData?.length) {
      setAllProjects([...JSON.parse(JSON.stringify(mappedData))])
      if (currentProject?.projectId) {
        const projectFound = projectData.find(el => el.id === currentProject.projectId)
        if (projectFound) {
          setupProjectBound(projectFound.id)
          handleProjectSelection({
            value: projectFound.id,
            label: projectFound.name,
            index: 0
          })
        }
      }
    }
  }



  const setupProjectBound = (id: string) => {
    const projectData = realm.objectForPrimaryKey<ProjectInterface>(RealmSchema.Projects, id)
    const { geoJSON } = makeInterventionGeoJson("Point", [JSON.parse(projectData.geometry).coordinates], "Intervention.form_id")
    const bounds = bbox(geoJSON)
    setProjectBounds(bounds)
  }


  const handleProjectSelection = (i: DropdownData) => {
    setSelectedProject(i)
    setupProjectBound(i.value)
  }

  const rightContainer = () => {
    if(showMap){
      return null
    }
    return <View style={styles.rightHeader}>
      <CustomDropDown
        label={'status'}
        data={statusData}
        onSelect={setSelectedStatus}
        selectedValue={selectedStatus}
        whiteBG
      />
    </View>
  }

  const handleGeometry = (e: GeoJSONObject) => {
    setGeometry(() => e)
    toggleSiteCreation()
  }

  useEffect(() => {
    if (geometry && !showMap) {
      handleGeometryBounds()
    }
  }, [geometry, showMap])



  const handleGeometryBounds = () => {
    if (!geometry) {
      return
    }
    const { geoJSON } = makeInterventionGeoJson('Polygon', geometry.geometry.coordinates[0], 'sd')
    const bounds = bbox(geoJSON)
    if (cameraRef?.current) {
      cameraRef.current.fitBounds(
        [bounds[0], bounds[1]],
        [bounds[2], bounds[3]],
        10,
        1000,
      )
    }
  }

  const toggleSiteCreation = async () => {
    setShowMap(prev => !prev)
  }


  const submitHandler = async () => {
    setLoading(true)
    if (siteName === '') {
      toast.show("Please provide site name")
      setLoading(false)
      return
    }
    if (selectedProject.value === '') {
      toast.show("Please select project")
      setLoading(false)
      return
    }

    if (!geometry) {
      toast.show("Please create site area")
      setLoading(false)
      return
    }

    const finalData = {
      "name": siteName,
      "status": selectedStatus.value,
      "geometry": geometry,
    }

    const { response, success } = await createNewSite(selectedProject.value, finalData)
    if (success) {
      await addNewSite(selectedProject.value, {
        id: response.id,
        name: response.name,
        status: response.status,
        geometry: JSON.stringify(response.geometry),
      })
      toast.show("Successfully created new site.")
      navigation.goBack()
      dispatch(updateLastProject(Date.now()))
    } else {
      setLoading(false)
      toast.show("Error ocurred while creating site")
    }
  }


  return (
    <SafeAreaView style={styles.container} edges={['top']}>
     {!showMap &&  <Header label='Create Site' rightComponent={rightContainer()} />}
      <View style={styles.wrapper}>
        <CustomDropDown
          label={i18next.t('label.project')}
          data={allProjects}
          onSelect={handleProjectSelection}
          selectedValue={selectedProject}
        />
        <CustomTextInput
          label={"Site name"}
          onChangeHandler={setSiteName}
          value={siteName}
        />
        <Text style={styles.siteArea}>Site Area</Text>
        {!showMap && <Pressable style={styles.siteWrapper} onPress={toggleSiteCreation}>
          {geometry && !showMap ? <Text style={styles.siteLabel}> Edit site map</Text> : <Text style={styles.siteLabel}> Create new site map</Text>}
          {!geometry && !showMap ? <AddIcon height={14} width={14} fill={Colors.NEW_PRIMARY} /> : <PenIcon height={14} width={14} fill={Colors.NEW_PRIMARY} />}
        </Pressable>}
        {showMap && <View style={styles.mapWrapper}>
          <SiteCreationMap setGeometry={handleGeometry} close={toggleSiteCreation} projectBounds={projectBounds} />
        </View>}
        {!showMap && geometry !== null ? <View style={styles.previewMap}>
          <MapLibreGL.MapView
            style={styles.map}
            logoEnabled={false}
            attributionEnabled={false}
            onDidFinishLoadingMap={handleGeometryBounds}
            styleURL={JSON.stringify(MapStyle)}>
            <MapLibreGL.Camera ref={cameraRef} />
            <MapLibreGL.ShapeSource
              id={'polygon-site-geometry'}
              shape={{
                "type": "FeatureCollection",
                "features": [geometry]
              }}>
              <MapLibreGL.FillLayer
                id={'polyFill'}
                style={{
                  fillOpacity: 0.5,
                  fillColor: Colors.NEW_PRIMARY + '1A'
                }}
              />
              <MapLibreGL.LineLayer
                id={'polyline-geometry'}
                style={{
                  ...polyline, lineColor: Colors.NEW_PRIMARY
                }}
              />
            </MapLibreGL.ShapeSource>
          </MapLibreGL.MapView>
        </View> : null}
        {!showMap && <CustomButton
          loading={loading}
          disable={loading}
          label={'Create Site'} pressHandler={submitHandler} containerStyle={styles.buttonContainer} />}
      </View>
    </SafeAreaView>
  )
}

export default ProjectSitesView

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE
  },
  wrapper: {
    width: '100%',
    flex: 1,
    paddingTop: 5,
    backgroundColor: Colors.BACKDROP_COLOR
  },
  rightHeader: {
    width: '50%',
    justifyContent: 'center',
    alignItems: 'center'
  },
  mapWrapper: {
    flex: 1,
    width:'100%',
    height:'100%',
    position:'absolute'
  },
  siteArea: {
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    marginLeft: '6%',
  },
  siteWrapper: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: '5%',
    marginTop: 10,
  },
  siteLabel: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.NEW_PRIMARY,
    marginRight: 5
  },
  penIconWrapper: {
    width: 40,
    height: 40,
    marginTop: 8
  },
  buttonContainer: {
    width: '100%',
    height: 70,
    position: 'absolute',
    bottom: 30
  },
  previewMap: {
    width: '90%',
    height: '30%',
    borderRadius: 20,
    overflow: 'hidden',
    marginLeft: '5%',
    marginTop: 20
  },
  map: {
    flex: 1,
    alignSelf: 'stretch',
  }
})