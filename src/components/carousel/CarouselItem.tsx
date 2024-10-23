import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { scaleFont } from 'src/utils/constants/mixins'
import { Colors, Typography } from 'src/utils/constants'
import { timestampToBasicDate } from 'src/utils/helpers/appHelper/dataAndTimeHelper'
import SingleTreeIcon from 'assets/images/svg/RoundTreeIcon.svg'
import { SCALE_36 } from 'src/utils/constants/spacing'
import InterventionIconSwitch from '../intervention/InterventionIconSwitch'
import i18next from 'src/locales/index'
import { updateFilePath } from 'src/utils/helpers/fileSystemHelper'

interface Props {
  data: any
  onPress: ((id: string, tree_id?: string) => void)
  remeasure: ((id: string, tree_id?: string) => void)
}

const CarouselItem = (props: Props) => {
  const { data, onPress, remeasure } = props
  if (data?.tree_type) {
    const uri = data.cdn_image_url ? `https://cdn.plant-for-the-planet.org/media/cache/coordinate/large/${data.cdn_image_url}` : updateFilePath(data.image_url)
    const hasImage = uri.length > 0
    return <TouchableOpacity style={styles.container} onPress={() => {
      onPress(data.intervention_id, data.tree_id)
    }}>
      <View style={styles.imageWrapper}>
        {hasImage ? <Image style={styles.imageContainer} source={{ uri: uri }} /> : <SingleTreeIcon width={SCALE_36} height={SCALE_36} />
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
      {data.remeasurement_requires && data.status === 'SYNCED' ?<TouchableOpacity style={styles.nextButton} onPress={() => {
        remeasure(data.intervention_id, data.tree_id)
      }}>
        <Text style={styles.nextButtonLabel}>{i18next.t("label.remeasure")}</Text>
      </TouchableOpacity>: null}
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
    paddingHorizontal:10
  },
  nextButtonLabel: {
    fontSize: 12,
    fontFamily: Typography.FONT_FAMILY_BOLD,
    color: Colors.WHITE
  }
})
