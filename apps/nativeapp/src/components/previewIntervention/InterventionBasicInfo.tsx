import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useState } from 'react'
import { Colors, Typography } from 'src/utils/constants'
import { convertDateToTimestamp, timestampToBasicDate } from 'src/utils/helpers/appHelper/dataAndTimeHelper'
import { scaleSize } from 'src/utils/constants/mixins'
import { InterventionData } from 'src/types/interface/slice.interface'
import turfArea from '@turf/area';
import { convertArea } from '@turf/helpers'
import { makeInterventionGeoJson } from 'src/utils/helpers/interventionFormHelper'
import i18next from 'src/locales/index'
import useInterventionManagement from 'src/hooks/realm/useInterventionManagement'
import DateTimePicker from '@react-native-community/datetimepicker'
import PenIcon from 'assets/images/svg/PenIcon.svg'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'

interface Props {
  data: InterventionData
  userType: string
}

const InterventionBasicInfo = (props: Props) => {
  const { userType } = props
  const { intervention_key, entire_site, status, intervention_end_date, intervention_date, project_id, site_id, project_name, site_name, intervention_title, hid, location, intervention_id, planted_species, sample_trees } = props.data
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

  const [isEditable, setIsEditable] = useState(false)

  const dateFormatted = () => {
    if (intervention_date) {
      return timestampToBasicDate(intervention_date)
    } else {
      return 0
    }
  }
  const endDateFormatted = () => {
    if (intervention_end_date) {
      return timestampToBasicDate(intervention_end_date)
    } else {
      return 0
    }
  }

  const [dateType, setDateType] = useState('')

  const { updateInterventionDate } = useInterventionManagement()



  const setPlantingArea = () => {
    const { geoJSON } = makeInterventionGeoJson(
      location.type,
      JSON.parse(location.coordinates),
      intervention_id,
      {
      }
    )
    // @ts-expect-error: ts module
    const areaInSqM = turfArea(geoJSON);
    const areaInHa = Math.round(convertArea(areaInSqM, 'meters', 'hectares') * 10000) / 10000;
    return areaInHa
  }

  const plantedSpecies = () => {
    if (planted_species.length === 0) {
      return null
    }
    return <View style={styles.plantedSpeciesContainer}>
      <View style={styles.cardWrapper}>
        <Pressable style={{ flexDirection: 'row' }} onPress={handleSpeciesUpdate}>
          <Text style={styles.cardTitle}>{i18next.t("label.planted_species")}</Text>
          {isEditable && <PenIcon width={25} height={28} style={{ top: -2 }} />}
        </Pressable>
        <View style={styles.plantedSpeciesWrapper}>
          {planted_species.map((el, i) => (
            <View key={el.id + i} style={{ marginVertical: 5 }}>
              {el.aliases && el.aliases !== 'Unknown' && el.aliases !== 'Undefined' ? <Text style={styles.plantedAlias}>{el.aliases}</Text> : null}
              {!!el.scientificName && <Text style={styles.plantedSPeciesLabel}>{el.count > 1 ? el.count : ''} {el.scientificName === 'Undefined' ? i18next.t('label.unknown') : el.scientificName}</Text>}
              {i < planted_species.length - 1 ? <View style={styles.plantedBorder}></View> : null}
            </View>
          ))}
        </View>
      </View>
    </View>
  }

  const toggleIsEditable = () => {
    setIsEditable(prev => !prev)
  }

  const handleDate = (isStart: boolean) => {
    if (!isEditable) {
      return
    }

    if (status === 'SYNCED') {
      return
    }
    setDateType(isStart ? "start" : 'end')
  }

  const onDateSelect = async (_event, date: Date) => {
    if (convertDateToTimestamp(date) === convertDateToTimestamp(new Date("1970-01-01T00:00:00.000Z"))) {
      return
    }
    const type = dateType;
    setDateType('')
    await updateInterventionDate(intervention_id, convertDateToTimestamp(date), type === 'start')
  }

  const handleSpeciesUpdate = () => {
    if (!isEditable) {
      return
    }

    if (intervention_key === 'single-tree-registration') {
      navigation.navigate('ManageSpecies', { 'manageSpecies': false, 'reviewTreeSpecies': sample_trees[0].tree_id, id: intervention_id })
      return;
    }

    navigation.navigate('TotalTrees', { isSelectSpecies: false, interventionId: intervention_id, isEditTrees: true })
  }

  const openEditProject = () => {
    if (!isEditable || entire_site) {
      return
    }
    navigation.navigate('EditProject', { interventionId: intervention_id, projectId: project_id, siteId: site_id })
  }


  return (
    <View style={styles.container}>
      {dateType !== '' && <View style={styles.datePickerContainer}><DateTimePicker
        maximumDate={new Date()}
        minimumDate={new Date(dateType !== 'start' ? intervention_date : new Date(2006, 0, 1))}
        is24Hour={true}
        value={new Date(dateType !== 'start' ? intervention_date : intervention_end_date)} onChange={onDateSelect} display='spinner' /></View>}
      <View style={styles.wrapper}>
        {!!hid && <View style={styles.cardWrapper}>
          <Text style={styles.cardTitle}>HID</Text>
          <Text style={styles.cardLabel}>{hid}</Text>
        </View>}
        {status === 'INITIALIZED' ? <TouchableOpacity style={styles.deleteWrapperIcon} onPress={toggleIsEditable}>
          <PenIcon width={30} height={30} />
        </TouchableOpacity> : null}
        <View style={styles.cardWrapper}>
          <View style={{ flexDirection: 'row' }}>
            <Text style={styles.cardTitle}>{i18next.t('label.intervention_date')}</Text>
            {/* <EditIcon style={{ marginTop: 3 }} /> */}
          </View>
          <View style={styles.timeContainer}>
            <Pressable style={styles.cardDateLabel} onPress={() => { handleDate(true) }}>
              <Text style={styles.cardLabel}>
                {dateFormatted()}
              </Text>
              {isEditable && <PenIcon width={25} height={28} style={{ top: -2 }} />}
            </Pressable>
            {intervention_end_date !== 0 && intervention_key !== "single-tree-registration" ? <Pressable style={styles.cardDateLabel} onPress={() => { handleDate(false) }}>
              <Text style={styles.cardLabel}>
                {endDateFormatted()}
              </Text>
              {isEditable && <PenIcon width={25} height={28} style={{ top: -2 }} />}
            </Pressable> : null}
          </View>
        </View>
        {location.type === 'Polygon' && <View style={styles.cardWrapper}>
          <Text style={styles.cardTitle}>{i18next.t('label.intervention_area')}</Text>
          <Text style={styles.haLabel}>{setPlantingArea()}ha</Text>
        </View>}
        <View style={styles.cardWrapper}>
          <Text style={styles.cardTitle}>{i18next.t('label.type')}</Text>
          <Text style={styles.cardLabel}>{intervention_title}</Text>
        </View>
        {userType === 'tpo' && status !== 'SYNCED' ? (
          <Pressable style={styles.cardWrapper} onPress={openEditProject}>
            <View style={styles.projectWrapper}>
              <Text style={styles.cardTitle}>{i18next.t('label.project')}</Text>
              {isEditable && !entire_site ? <PenIcon width={25} height={28} style={{ top: -3 }} /> : null}
            </View>
            <Text style={styles.cardLabel}>{project_name || "No Project assigned"}</Text>
          </Pressable>
        ) : null}
        {userType === 'tpo' && status !== 'SYNCED'?(
          <Pressable style={styles.cardWrapper} onPress={openEditProject}>
            <View style={styles.projectWrapper}>
              <Text style={styles.cardTitle}>{i18next.t('label.site')}</Text>
              {isEditable && !entire_site ? <PenIcon width={25} height={28} style={{ top: -3 }} /> : null}
            </View>
            <Text style={styles.cardLabel}>{site_name || "No Site Selected"}</Text>
          </Pressable>
        ):null}
        {plantedSpecies()}
      </View>
    </View>
  )
}

export default InterventionBasicInfo

const styles = StyleSheet.create({
  container: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20
  },
  wrapper: {
    width: '90%',
    borderRadius: 10,
    paddingVertical: 20,
    borderWidth: 0.5,
    backgroundColor: Colors.WHITE,
    borderColor: '#f2ebdd',
    shadowColor: Colors.GRAY_TEXT,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 2,
  },
  cardWrapper: {
    width: '100%',
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  projectWrapper: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  cardTitle: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: scaleSize(14),
    marginBottom: 5,
    color: Colors.TEXT_LIGHT,
    marginRight: 10
  },
  cardLabel: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: scaleSize(14),
    color: Colors.TEXT_COLOR,
  },
  cardDateLabel: {
    borderColor: Colors.GRAY_LIGHT,
    borderWidth: 1,
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 5,
    marginRight: 10,
    flexDirection: 'row'
  },
  timeContainer: {
    width: "100%",
    flexDirection: 'row',
    alignItems: 'center'
  },
  haLabel: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: scaleSize(16),
    color: Colors.DARK_TEXT_COLOR,
  },
  plantedSpeciesContainer: {
    width: '100%',
  },
  plantedSpeciesWrapper: {
    width: '100%',
    backgroundColor: Colors.GRAY_DARK + '1A',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  plantedAlias: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: scaleSize(16),
    color: Colors.DARK_TEXT_COLOR,
  },
  plantedSPeciesLabel: {
    fontFamily: Typography.FONT_FAMILY_ITALIC,
    fontSize: scaleSize(14),
    color: Colors.TEXT_COLOR,
    paddingBottom: 10,
  },
  plantedBorder: {
    width: '95%',
    height: 1,
    backgroundColor: Colors.GRAY_LIGHT,
    marginBottom: 10
  },
  datePickerContainer: {
    position: "absolute",
    zIndex: 1,
    backgroundColor: '#fff',
    width: "100%",
    bottom: 0
  },
  deleteWrapperIcon: {
    width: 35,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.GRAY_BACKDROP,
    marginLeft: 10,
    borderRadius: 8,
    position: 'absolute',
    right: 10,
    top: 10
  },
})
