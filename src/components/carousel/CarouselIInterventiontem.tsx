import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { InterventionData } from 'src/types/interface/slice.interface'
import { scaleFont } from 'src/utils/constants/mixins'
import { Colors, Typography } from 'src/utils/constants'
import { timestampToBasicDate } from 'src/utils/helpers/appHelper/dataAndTimeHelper'
import InterventionIconSwitch from '../intervention/InterventionIconSwitch'
import { SCALE_56 } from 'src/utils/constants/spacing'

interface Props {
  data: InterventionData
  onPress: ((id: string) => void)
}

const CarouselIInterventiontem = (props: Props) => {
  const { data, onPress } = props
  return (
    <TouchableOpacity style={styles.container} onPress={() => {
      onPress(data.intervention_id)
    }}>
      <View style={styles.imageWrapper}>
        <InterventionIconSwitch icon={data.intervention_key} dimension={SCALE_56} />
      </View>
      <View style={styles.sectionWrapper}>
        <Text style={styles.sectionLabel}>Intervention</Text>
        <Text style={styles.speciesName} ellipsizeMode="tail">
          {data.intervention_title}
        </Text>
        <Text style={styles.sectionLabel}>Intervention Date</Text>
        <Text style={styles.vauleLabel}>
          {timestampToBasicDate(data.intervention_date)}
        </Text>
        {data.sample_trees.length > 0 && <Text style={styles.sampleLabel}>Show Tree Details</Text>
        }
      </View>
    </TouchableOpacity>
  )
}

export default CarouselIInterventiontem


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
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.TEXT_COLOR,
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: scaleFont(14),
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.TEXT_LIGHT,
  },
  vauleLabel: {
    fontSize: scaleFont(14),
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.TEXT_COLOR,
    marginBottom: 10,
  },
  sampleLabel: {
    fontSize: scaleFont(14),
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.NEW_PRIMARY,
  }
})
