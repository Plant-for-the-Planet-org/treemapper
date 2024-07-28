import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Colors, Typography } from 'src/utils/constants'
import { timestampToBasicDate } from 'src/utils/helpers/appHelper/dataAndTimeHelper'
import { scaleSize } from 'src/utils/constants/mixins'
import { InterventionData } from 'src/types/interface/slice.interface'
import turfArea from '@turf/area';
import { convertArea } from '@turf/helpers'
import { makeInterventionGeoJson } from 'src/utils/helpers/interventionFormHelper'
import i18next from 'src/locales/index'
interface Props {
  data: InterventionData
}

const InterventionBasicInfo = (props: Props) => {
  const { intervention_date, project_name, site_name, intervention_title, hid, location, intervention_id, planted_species, location_type } = props.data
  const dateFormatted = () => {
    if (intervention_date) {
      return timestampToBasicDate(intervention_date)
    } else {
      return 0
    }
  }
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
        <Text style={styles.cardTitle}>{i18next.t("label.planted_species")}</Text>
        <View style={styles.plantedSpeciesWrapper}>
          {planted_species.map((el, i) => (
            <View key={el.id} style={{ marginVertical: 5 }}>
              {el.aliases && el.aliases !== 'Unknown' && el.aliases !== 'Undefined' ? <Text style={styles.plantedAlias}>{el.aliases}</Text> : null}
              {!!el.scientificName && <Text style={styles.plantedSPeciesLabel}>{el.count} {el.scientificName === 'Undefined' ? i18next.t('label.unknown') : el.scientificName}</Text>}
              {i < planted_species.length - 1 ? <View style={styles.plantedBorder}></View> : null}
            </View>
          ))}
        </View>
      </View>
    </View>

  }

  return (
    <View style={styles.container}>
      <View style={styles.wrapper}>
        {!!hid && <View style={styles.cardWrapper}>
          <Text style={styles.cardTitle}>HID</Text>
          <Text style={styles.cardLabel}>{hid}</Text>
        </View>}
        <View style={styles.cardWrapper}>
          <Text style={styles.cardTitle}>{i18next.t('label.intervention_date')}</Text>
          <View style={styles.timeContainer}>
            <View style={styles.cardDateLabel}>
              <Text style={styles.cardLabel}>
                {dateFormatted()}
              </Text>
            </View>
          </View>
        </View>
        {location_type === 'Polygon' && <View style={styles.cardWrapper}>
          <Text style={styles.cardTitle}>{i18next.t('label.intervention_area')}</Text>
          <Text style={styles.haLabel}>{setPlantingArea()}ha</Text>
        </View>}
        <View style={styles.cardWrapper}>
          <Text style={styles.cardTitle}>{i18next.t('label.type')}</Text>
          <Text style={styles.cardLabel}>{intervention_title}</Text>
        </View>
        {!!project_name && (
          <View style={styles.cardWrapper}>
          <Text style={styles.cardTitle}>{i18next.t('label.project')}</Text>
          <Text style={styles.cardLabel}>{project_name}</Text>
          </View>
        )}
        {!!site_name && (
          <View style={styles.cardWrapper}>
          <Text style={styles.cardTitle}>{i18next.t('label.site')}</Text>
          <Text style={styles.cardLabel}>{site_name}</Text>
          </View>
        )}
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
  cardTitle: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: scaleSize(14),
    marginBottom: 5,
    color: Colors.TEXT_LIGHT,
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
    width: 120,
    marginTop: 5,
    marginRight: 10
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
  }
})
