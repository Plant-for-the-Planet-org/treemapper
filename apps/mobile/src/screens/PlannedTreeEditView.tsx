import { KeyboardType, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Location from 'expo-location'
import { useObject } from '@realm/react'
import { Map, Camera, CameraRef, UserLocation, Marker, GeoJSONSource, Layer } from '@maplibre/maplibre-react-native'

import { RootStackParamList } from 'src/types/type/navigation.type'
import { legacyCdnUrl, v3CdnUrl } from 'src/utils/cdnUrl'
import FallbackImage from 'src/components/common/FallbackImage'
import { InterventionData, SampleTree } from 'src/types/interface/slice.interface'
import { RealmSchema } from 'src/types/enum/db.enum'
import { RootState } from 'src/store'
import { Colors, Typography } from 'src/utils/constants'
import { scaleSize } from 'src/utils/constants/mixins'
import Header from 'src/components/common/Header'
import CustomButton from 'src/components/common/CustomButton'
import EditInputModal from 'src/components/intervention/EditInputModal'
import AlertModal from 'src/components/common/AlertModal'
import useInterventionManagement from 'src/hooks/realm/useInterventionManagement'
import { updateNewIntervention } from 'src/store/slice/appStateSlice'
import { updateImageDetails } from 'src/store/slice/takePictureSlice'
import { updateFilePath } from 'src/utils/helpers/fileSystemHelper'
import { nonISUCountries } from 'src/utils/constants/appConstant'
import { measurementValidation } from 'src/utils/constants/measurementValidation'
import { convertMeasurements, getConvertedDiameter, getConvertedHeight } from 'src/utils/constants/measurements'
import { ctaHaptic } from 'src/utils/helpers/hapticFeedbackHelper'
import getDistanceBetween, { formatDistance } from 'src/utils/helpers/getDistanceBetween'
import SatelliteIconWrapper from 'src/components/map/SatelliteIconWrapper'
import SatelliteLayer from 'assets/mapStyle/satelliteView'
import { useToast } from 'react-native-toast-notifications'
import PenIcon from 'assets/images/svg/PenIcon.svg'
import HeightIcon from 'assets/images/svg/HeightIcon.svg'
import WidthIcon from 'assets/images/svg/WidthIcon.svg'
import MapPin from 'assets/images/svg/MapPin.svg'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const MapStyle = require('assets/mapStyle/mapStyleOutput.json')

type EditLabels = 'height' | 'diameter' | 'treetag' | ''

const PlannedTreeEditView = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'PlannedTreeEdit'>>()
  const interventionId = route.params?.interventionId ?? ''
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const dispatch = useDispatch()
  const toast = useToast()

  const Intervention = useObject<InterventionData>(RealmSchema.Intervention, interventionId)
  const tree: SampleTree | undefined = Intervention?.sample_trees?.[0]

  const { country } = useSelector((state: RootState) => state.userState)
  const userLocation = useSelector((state: RootState) => state.gpsState.user_location)
  const mainMapView = useSelector((state: RootState) => state.displayMapState.mainMapView)
  const imageDetails = useSelector((state: RootState) => state.cameraState)
  const isNonISUCountry: boolean = nonISUCountries.includes(country)

  const { updateSampleTreeDetails, updateSampleTreeImage, saveIntervention } = useInterventionManagement()

  const [imageId, setImageId] = useState('')
  const [openEditModal, setOpenEditModal] = useState<{ label: EditLabels, value: string, type: KeyboardType, open: boolean }>({ label: '', value: '', type: 'default', open: false })
  const [showInputError, setShowInputError] = useState(false)
  const [inputErrorMessage, setInputErrorMessage] = useState('')
  const [showIncorrectRatioAlert, setShowIncorrectRatioAlert] = useState(false)

  const cameraRef = useRef<CameraRef>(null)
  const [liveLocation, setLiveLocation] = useState<[number, number] | null>(null)

  const treeHasLocation = !!tree && !(tree.latitude === 0 && tree.longitude === 0)

  // When a freshly captured image comes back, attach it to this tree.
  useEffect(() => {
    if (imageId && imageId === imageDetails.id && tree) {
      updateSampleTreeImage(interventionId, tree.tree_id, imageDetails.url)
      dispatch(updateImageDetails({ id: '', url: '' }))
      setImageId('')
    }
  }, [imageDetails])

  // Watch the user's position live so they can walk toward the planted tree.
  // Permission is already handled app-wide; we only start a watch when granted.
  useEffect(() => {
    let active = true
    let subscription: Location.LocationSubscription | undefined
    const startWatch = async () => {
      const { status } = await Location.getForegroundPermissionsAsync()
      if (status !== Location.PermissionStatus.GRANTED) {
        return
      }
      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Highest, distanceInterval: 1, timeInterval: 2000 },
        (location) => {
          if (active && location?.coords?.longitude && location?.coords?.latitude) {
            setLiveLocation([location.coords.longitude, location.coords.latitude])
          }
        },
      )
    }
    startWatch()
    return () => {
      active = false
      subscription?.remove()
    }
  }, [])

  const centerOnTree = () => {
    if (cameraRef.current && tree) {
      cameraRef.current.easeTo({ center: [tree.longitude, tree.latitude], zoom: 16, duration: 800 })
    }
  }

  // Frame both the tree and the user; falls back to centering on the tree
  // while the first live position is still being acquired.
  const fitBoth = () => {
    if (!cameraRef.current || !tree) {
      return
    }
    if (!liveLocation) {
      centerOnTree()
      return
    }
    const lngs = [tree.longitude, liveLocation[0]]
    const lats = [tree.latitude, liveLocation[1]]
    cameraRef.current.fitBounds(
      [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)],
      { padding: { top: 60, right: 60, bottom: 60, left: 60 }, duration: 800 },
    )
  }

  // This map is read only: the user can't pan it, so we keep both the tree and
  // the user framed at all times. Reframe on mount and on every position update
  // (and whenever the satellite layer toggles re-mounts the map).
  useEffect(() => {
    if (!treeHasLocation) {
      return
    }
    const timer = setTimeout(liveLocation ? fitBoth : centerOnTree, 300)
    return () => clearTimeout(timer)
  }, [liveLocation, treeHasLocation, mainMapView])

  if (!tree) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header label="Plan Tree" />
        <View style={styles.emptyBox}>
          <Text style={styles.emptyLabel}>No tree found for this plan.</Text>
        </View>
      </SafeAreaView>
    )
  }

  const hasLocation = !(tree.latitude === 0 && tree.longitude === 0)
  const treeCoord: [number, number] = [tree.longitude, tree.latitude]
  const liveCoord: [number, number] | null = liveLocation
    ?? (userLocation && userLocation[0] !== 0 ? [userLocation[0], userLocation[1]] : null)
  const distanceLabel = hasLocation && liveCoord ? formatDistance(getDistanceBetween(liveCoord, treeCoord)) : null
  const localImage = updateFilePath(tree.image_url)
  const cdnUri = tree.cdn_image_url ? (v3CdnUrl('tree', tree.cdn_image_url) ?? '') : ''
  const imageUri = tree.image_url ? localImage : cdnUri
  // trees uploaded before the v3 migration are only on the old CDN
  const imageFallbackUri = tree.image_url ? null : legacyCdnUrl('tree', tree.cdn_image_url)

  const captureImage = () => {
    ctaHaptic()
    const newID = String(new Date().getTime())
    setImageId(newID)
    navigation.navigate('TakePicture', { id: newID, screen: 'EDIT_SAMPLE_TREE' })
  }

  const adjustOnMap = () => {
    navigation.navigate('PlannedTreeLocation', { interventionId, treeId: tree.tree_id })
  }

  const openEdit = (label: EditLabels, currentValue: string, type: KeyboardType) => {
    setOpenEditModal({ label, value: currentValue, type, open: true })
  }

  const setCurrentValue = (d: string) => {
    setOpenEditModal({ ...openEditModal, value: d })
  }

  const baseDetails = (): SampleTree => ({
    ...JSON.parse(JSON.stringify(tree)),
  })

  const handleValidation = async (validate?: boolean) => {
    const finalDetails = baseDetails()
    let hasError = false

    const handleHeightValidation = () => {
      const updatedHeight = openEditModal.value.replace(/,/g, '.')
      const regex = /^(?!0*(\.0+)?$)(\d+(\.\d+)?|\.\d+)$/
      if (regex.test(updatedHeight)) {
        const validationObject = measurementValidation(updatedHeight, tree.specie_diameter, isNonISUCountry)
        setInputErrorMessage(validationObject.heightErrorMessage)
        setShowInputError(!!validationObject.heightErrorMessage)
        hasError = validationObject.heightErrorMessage.length > 0
        if (!hasError) {
          finalDetails.specie_height = getConvertedHeight(Number(updatedHeight), isNonISUCountry)
        }
      } else {
        setInputErrorMessage('Please input correct height')
        setShowInputError(true)
        hasError = true
      }
    }

    const handleDiameterValidation = () => {
      const updatedWidth = openEditModal.value.replace(/,/g, '.')
      const regex = /^(?!0*(\.0+)?$)(\d+(\.\d+)?|\.\d+)$/
      if (regex.test(updatedWidth)) {
        const validationObject = measurementValidation(tree.specie_height, updatedWidth, isNonISUCountry)
        setInputErrorMessage(validationObject.diameterErrorMessage)
        setShowInputError(!!validationObject.diameterErrorMessage)
        hasError = validationObject.diameterErrorMessage.length > 0
        if (!hasError) {
          finalDetails.specie_diameter = getConvertedDiameter(Number(updatedWidth), isNonISUCountry)
        }
      } else {
        setInputErrorMessage('Please input correct diameter')
        setShowInputError(true)
        hasError = true
      }
    }

    const handleTagValidation = () => {
      const regex = /[^a-zA-Z0-9-]/g
      if (regex.test(openEditModal.value)) {
        setInputErrorMessage('Please input a valid tag')
        setShowInputError(true)
        hasError = true
        return
      }
      finalDetails.tag_id = openEditModal.value
    }

    switch (openEditModal.label) {
      case 'height':
        handleHeightValidation()
        break
      case 'diameter':
        handleDiameterValidation()
        break
      case 'treetag':
        handleTagValidation()
        break
      default:
        break
    }

    if (!hasError) {
      await updateSampleTreeDetails(finalDetails)
    }
    setOpenEditModal((prev) => ({ ...prev, open: false }))
  }

  const handleRatioPrimary = () => {
    setShowIncorrectRatioAlert(false)
    setOpenEditModal({ label: '', value: '', type: 'default', open: false })
  }

  const handleRatioSecondary = () => {
    setShowIncorrectRatioAlert(false)
    handleValidation(false)
  }

  const handleSave = async () => {
    if (!hasLocation) {
      toast.show('Please set the tree location')
      return
    }
    if (!tree.image_url && !tree.cdn_image_url) {
      toast.show('Please add a tree image')
      return
    }
    if (!tree.specie_height || !tree.specie_diameter) {
      toast.show('Please add height and width')
      return
    }
    await saveIntervention(interventionId)
    dispatch(updateNewIntervention())
    navigation.goBack()
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header label="Plan Tree" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image */}
        <View style={styles.imageSection}>
          {imageUri ? (
            <View style={styles.imageWrapper}>
              <TouchableOpacity style={styles.imageEditIcon} onPress={captureImage}>
                <PenIcon width={30} height={30} />
              </TouchableOpacity>
              <FallbackImage uri={imageUri} fallbackUri={imageFallbackUri} style={styles.image} />
            </View>
          ) : (
            <TouchableOpacity style={styles.addImageWrapper} onPress={captureImage}>
              <Text style={styles.addImageLabel}>Add Tree Image</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Species (read only) */}
        <View style={styles.metaWrapper}>
          <Text style={styles.title}>Species</Text>
          <Text style={styles.speciesName}>{tree.specie_name || 'Unknown'}</Text>
        </View>

        {/* Location */}
        <View style={styles.metaWrapper}>
          <Text style={styles.title}>Location</Text>
          <Text style={styles.valueLabel}>
            {hasLocation ? `${tree.longitude.toFixed(5)} , ${tree.latitude.toFixed(5)}` : 'Not set'}
          </Text>

          {hasLocation && (
            <View style={styles.mapCard}>
              <Map
                style={styles.map}
                logo={false}
                attribution={false}
                scaleBar={false}
                dragPan={false}
                touchZoom={false}
                doubleTapZoom={false}
                touchRotate={false}
                touchPitch={false}
                mapStyle={mainMapView === 'SATELLITE' ? SatelliteLayer : MapStyle}>
                <Camera ref={cameraRef} maxZoom={18} />
                <UserLocation minDisplacement={1} />
                {liveCoord && (
                  <GeoJSONSource
                    id="walkLine"
                    data={{
                      type: 'Feature',
                      properties: {},
                      geometry: { type: 'LineString', coordinates: [liveCoord, treeCoord] },
                    }}>
                    <Layer
                      id="walkLineLayer"
                      type="line"
                      style={{ lineColor: Colors.NEW_PRIMARY, lineWidth: 3, lineDasharray: [2, 2], lineOpacity: 0.9 }}
                    />
                  </GeoJSONSource>
                )}
                <Marker lngLat={treeCoord} anchor="bottom">
                  <MapPin fill={Colors.NEW_PRIMARY} />
                </Marker>
              </Map>
              {distanceLabel && (
                <View style={styles.distancePill}>
                  <Text style={styles.distanceText}>{distanceLabel}</Text>
                </View>
              )}
              <SatelliteIconWrapper bottom={12} />
            </View>
          )}

          <View style={styles.locationBtnRow}>
            <TouchableOpacity style={styles.locationBtn} onPress={adjustOnMap}>
              <Text style={styles.locationBtnLabel}>Update location</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Dimensions */}
        <View style={styles.mainMetaWrapper}>
          <View style={styles.sectionWrapper}>
            <Text style={styles.title}>Height</Text>
            <Pressable style={styles.metaSectionWrapper} onPress={() => {
              const convertedHeight = convertMeasurements(tree.specie_height, 'm', isNonISUCountry)
              openEdit('height', String(convertedHeight), 'decimal-pad')
            }}>
              <HeightIcon width={14} height={20} style={styles.iconWrapper} />
              <Text style={styles.valueLabel}>
                {convertMeasurements(tree.specie_height, 'm', isNonISUCountry)} {isNonISUCountry ? 'ft' : 'm'}
              </Text>
              <PenIcon style={styles.editIconWrapper} />
            </Pressable>
          </View>
          <View style={styles.sectionWrapper}>
            <Text style={styles.title}>Width</Text>
            <Pressable style={styles.metaSectionWrapper} onPress={() => {
              const convertedWidth = convertMeasurements(tree.specie_diameter, 'cm', isNonISUCountry)
              openEdit('diameter', String(convertedWidth), 'decimal-pad')
            }}>
              <WidthIcon width={18} height={8} style={styles.iconWrapper} />
              <Text style={styles.valueLabel}>
                {convertMeasurements(tree.specie_diameter, 'cm', isNonISUCountry)} {isNonISUCountry ? 'in' : 'cm'}
              </Text>
              <PenIcon style={styles.editIconWrapper} />
            </Pressable>
          </View>
        </View>

        {/* Tag */}
        <View style={styles.metaWrapper}>
          <Text style={styles.title}>Tree Tag</Text>
          <Pressable style={styles.metaSectionWrapper} onPress={() => {
            openEdit('treetag', String(tree.tag_id || ''), 'default')
          }}>
            <Text style={styles.valueLabel}>{tree.tag_id || 'Not Tagged'}</Text>
            <PenIcon style={styles.editIconWrapper} />
          </Pressable>
        </View>

        <View style={styles.footer} />
      </ScrollView>

      <CustomButton label="Save" pressHandler={handleSave} containerStyle={styles.btnContainer} />

      <EditInputModal
        value={openEditModal.value}
        setValue={setCurrentValue}
        onSubmitInputField={() => handleValidation(true)}
        isOpenModal={openEditModal.open}
        inputType={openEditModal.type}
      />
      <AlertModal
        visible={showInputError}
        heading="Invalid value"
        message={inputErrorMessage}
        primaryBtnText="OK"
        onPressPrimaryBtn={() => setShowInputError(false)}
      />
      <AlertModal
        visible={showIncorrectRatioAlert}
        heading="Not an optimal ratio"
        message="The height and width ratio does not look right. Do you want to continue?"
        primaryBtnText="Check again"
        onPressPrimaryBtn={handleRatioPrimary}
        showSecondaryButton
        secondaryBtnText="Continue"
        onPressSecondaryBtn={handleRatioSecondary}
      />
    </SafeAreaView>
  )
}

export default PlannedTreeEditView

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  emptyBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyLabel: {
    fontSize: 16,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.TEXT_COLOR,
  },
  imageSection: {
    width: '100%',
    alignItems: 'center',
  },
  imageWrapper: {
    width: '100%',
    height: scaleSize(250),
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  image: {
    width: '90%',
    height: '95%',
    borderRadius: 10,
    backgroundColor: 'black',
  },
  imageEditIcon: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: Colors.GRAY_LIGHT,
    position: 'absolute',
    top: 20,
    right: '8%',
    zIndex: 1,
  },
  addImageWrapper: {
    backgroundColor: Colors.GRAY_BACKDROP + '1A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: Colors.GRAY_TEXT,
    height: 50,
    width: '90%',
    borderRadius: 8,
    marginVertical: 20,
  },
  addImageLabel: {
    fontSize: 16,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.TEXT_COLOR,
  },
  metaWrapper: {
    width: '100%',
    paddingVertical: 5,
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  mainMetaWrapper: {
    width: '100%',
    flexDirection: 'row',
    marginBottom: 10,
    paddingHorizontal: 20,
    paddingVertical: 5,
  },
  sectionWrapper: {
    flex: 1,
  },
  metaSectionWrapper: {
    width: '100%',
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: 14,
    color: Colors.TEXT_COLOR,
  },
  valueLabel: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.TEXT_COLOR,
    marginTop: 6,
  },
  speciesName: {
    fontFamily: Typography.FONT_FAMILY_ITALIC,
    fontSize: 16,
    color: Colors.TEXT_COLOR,
    marginTop: 6,
  },
  iconWrapper: {
    marginRight: 10,
  },
  editIconWrapper: {
    marginLeft: 10,
  },
  mapCard: {
    width: '100%',
    height: scaleSize(220),
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 12,
    backgroundColor: Colors.GRAY_LIGHT,
  },
  map: {
    flex: 1,
    alignSelf: 'stretch',
  },
  distancePill: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.WHITE,
    shadowColor: Colors.BLACK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  distanceText: {
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    fontSize: 13,
    color: Colors.TEXT_COLOR,
  },
  locationBtnRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  locationBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.PRIMARY_DARK,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationBtnLabel: {
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    fontSize: 14,
    color: Colors.WHITE,
  },
  btnContainer: {
    width: '100%',
    height: scaleSize(70),
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    bottom: 30,
  },
  footer: {
    width: '100%',
    height: 120,
  },
})
