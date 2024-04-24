import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { SampleTree } from 'src/types/interface/slice.interface'
import { scaleFont } from 'src/utils/constants/mixins'
import { Colors, Typography } from 'src/utils/constants'
import { timestampToBasicDate } from 'src/utils/helpers/appHelper/dataAndTimeHelper'
import SingleTreeIcon from 'assets/images/svg/RoundTreeIcon.svg'
import { SCALE_36 } from 'src/utils/constants/spacing'

interface Props {
  data: SampleTree
  onPress: ((id: string)=>void)
}

const CarouselItem = (props: Props) => {
  const { data, onPress } = props
  return (
    <TouchableOpacity style={styles.container} onPress={()=>{
      onPress(data.intervention_id)
    }}>
      <View style={styles.imageWrapper}>
        <SingleTreeIcon width={SCALE_36} height={SCALE_36} />
      </View>
      <View style={styles.sectionWrapper}>
        <Text style={styles.sectionLabel}>Species Name</Text>
        <Text style={styles.speciesName} ellipsizeMode="tail">
          {data.specie_name}
        </Text>
        <Text style={styles.sectionLabel}>Intevetion Date</Text>
        <Text style={styles.vauleLabel}>
          {timestampToBasicDate(data.plantation_date)}
        </Text>
      </View>
    </TouchableOpacity>
  )
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
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.TEXT_LIGHT,
  },
  vauleLabel: {
    fontSize: scaleFont(14),
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.TEXT_COLOR,
    marginBottom: 10,
  },
})
