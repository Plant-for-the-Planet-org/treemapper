import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { scaleFont } from 'src/utils/constants/mixins'
import { Colors, Typography } from 'src/utils/constants'
import { timestampToBasicDate } from 'src/utils/helpers/appHelper/dataAndTimeHelper'
import UploadSpecieIcon from 'assets/images/svg/UploadSpecieIcon.svg'
import { SCALE_56 } from 'src/utils/constants/spacing'
import InterventionIconSwitch from '../intervention/InterventionIconSwitch'
import i18next from 'src/locales/index'
import { updateFilePath } from 'src/utils/helpers/fileSystemHelper'
import { legacyCdnUrl, v3CdnUrl } from 'src/utils/cdnUrl'
import FallbackImage from '../common/FallbackImage'

interface Props {
  data: any
  onPress: ((id: string, tree_id?: string) => void)
  remeasure: ((id: string, tree_id?: string) => void)
  isPlanned?: boolean
}

const CarouselItem = (props: Props) => {
  const { data, onPress, remeasure, isPlanned } = props

  if (data?.tree_type) {
    const uri = data.cdn_image_url ? (v3CdnUrl('tree', data.cdn_image_url) ?? '') : updateFilePath(data.image_url)
    // trees uploaded before the v3 migration are only on the old CDN
    const fallbackUri = data.cdn_image_url ? legacyCdnUrl('tree', data.cdn_image_url) : null
    const hasImage = uri.length > 0
    return <TouchableOpacity style={styles.container} onPress={() => {
      onPress(data.intervention_id, data.tree_id)
    }}>
      <View style={styles.imageWrapper}>
        {hasImage ? <FallbackImage uri={uri} fallbackUri={fallbackUri} style={styles.imageContainer} /> : <UploadSpecieIcon width={SCALE_56} height={SCALE_56} />
        }
      </View>
      <View style={styles.sectionWrapper}>
        <Text style={styles.sectionLabel}>{i18next.t("label.species_name")}</Text>
        <Text style={styles.speciesName} ellipsizeMode="tail">
          {data.specie_name}
        </Text>
        <Text style={styles.sectionLabel}>{i18next.t("label.intervention_date")}</Text>
        <Text style={styles.valueLabel}>
          {timestampToBasicDate(data.plantation_date)}
        </Text>
      </View>
      {/* {data.remeasurement_requires && data.status === 'SYNCED' ?<TouchableOpacity style={styles.nextButton} onPress={() => {
        remeasure(data.intervention_id, data.tree_id)
      }}>
        <Text style={styles.nextButtonLabel}>{i18next.t("label.remeasure")}</Text>
      </TouchableOpacity>: null} */}
      {isPlanned ? <TouchableOpacity style={styles.nextButton} onPress={() => {
        onPress(data.intervention_id, data.tree_id)
      }}>
        <Text style={styles.nextButtonLabel}>Add details</Text>
      </TouchableOpacity> : !data.is_alive ? <View style={styles.deadBadge}>
        <Text style={styles.deadBadgeLabel}>{i18next.t("label.dead")}</Text>
      </View> : data.status === 'SYNCED' ? <TouchableOpacity style={styles.nextButton} onPress={() => {
        remeasure(data.intervention_id, data.tree_id)
      }}>
        <Text style={styles.nextButtonLabel}>{i18next.t("label.remeasure")}</Text>
      </TouchableOpacity> : null}
    </TouchableOpacity>
  } else {
    return <TouchableOpacity style={styles.container} onPress={() => {
      onPress(data.intervention_id)
    }}>
      <View style={styles.imageWrapper}>
        <InterventionIconSwitch icon={data.intervention_key} dimension={false} />
      </View>
      <View style={styles.sectionWrapper}>
        <Text style={styles.sectionLabel}>{i18next.t("label.intervention")}</Text>
        <Text style={styles.itLabel} ellipsizeMode="tail">
          {data.intervention_title}
        </Text>
        <Text style={styles.sampleLabel}>{i18next.t("label.show_more_details")}</Text>

      </View>
    </TouchableOpacity>
  }
}

export default CarouselItem

const styles = StyleSheet.create({
  container: {
    width: '95%',
    height: 150,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.WHITE,
  },
  imageWrapper: {
    width: '35%',
    height: '80%',
    backgroundColor: Colors.NEW_PRIMARY + '1A',
    marginLeft: 10,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: '98%',
    height: '98%',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.NEW_PRIMARY + '1A',
  },
  imageUrl: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },

  sectionWrapper: {
    marginLeft: '5%',
    justifyContent: 'center',
  },
  speciesName: {
    fontSize: scaleFont(14),
    fontFamily: Typography.FONT_FAMILY_ITALIC,
    color: Colors.TEXT_COLOR,
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: scaleFont(14),
    fontFamily: Typography.FONT_FAMILY_BOLD,
    color: Colors.DARK_TEXT_COLOR,
  },
  valueLabel: {
    fontSize: scaleFont(14),
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.TEXT_COLOR,
    marginBottom: 10,
  },
  itLabel: {
    fontSize: scaleFont(14),
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.TEXT_LIGHT,
    marginBottom: 5
  },
  sampleLabel: {
    fontSize: scaleFont(14),
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.NEW_PRIMARY,
  },
  nextButton: {
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: Colors.NEW_PRIMARY,
    borderRadius: 12,
    paddingHorizontal: 10
  },
  nextButtonLabel: {
    fontSize: 12,
    fontFamily: Typography.FONT_FAMILY_BOLD,
    color: Colors.WHITE
  },
  deadBadge: {
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: Colors.GRAY_LIGHT,
    borderRadius: 12,
    paddingHorizontal: 10
  },
  deadBadgeLabel: {
    fontSize: 12,
    fontFamily: Typography.FONT_FAMILY_BOLD,
    color: Colors.TEXT_COLOR
  }
})
