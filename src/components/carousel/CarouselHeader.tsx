import {StyleSheet, Text, TouchableOpacity, View} from 'react-native'
import React, {useEffect, useState} from 'react'
import {useDispatch, useSelector} from 'react-redux'
import {clearCarouselData} from 'src/store/slice/displayMapSlice'
import {RootState} from 'src/store'
import {InterventionData} from 'src/types/interface/slice.interface'
import {scaleFont} from 'src/utils/constants/mixins'
import {Colors, Typography} from 'src/utils/constants'
import BackIcon from 'assets/images/svg/SimpleBack.svg'

const CarouselHeader = () => {
  const dispatch = useDispatch()
  const [data, setData] = useState<InterventionData>(null)
  const interventionData = useSelector(
    (state: RootState) => state.displayMapState.selectedIntervention,
  )

  useEffect(() => {
    setData(JSON.parse(interventionData))
  }, [interventionData])

  const onPress = () => {
    dispatch(clearCarouselData())
  }


  if (!data) {
    return null
  }
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onPress} style={styles.backIconWrapper}>
        <BackIcon width={20} height={20} />
      </TouchableOpacity>
      <View style={styles.sectionWrapper}>
        <Text style={styles.title}>{data.intervention_title}</Text>
        <Text style={styles.sectionLabel}>
          {data.sample_trees.length} Sample Trees
        </Text>
      </View>
    </View>
  )
}

export default CarouselHeader

const styles = StyleSheet.create({
  container: {
    width: 200,
    height: 100,
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    backgroundColor: Colors.WHITE,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: scaleFont(14),
    fontFamily: Typography.FONT_FAMILY_BOLD,
  },
  sectionLabel: {
    fontSize: scaleFont(12),
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.TEXT_LIGHT,
    marginTop: 5,
  },
  backIconWrapper: {
    width: 20,
    height: 20,
    marginLeft: 10,
  },
  sectionWrapper: {
    flex: 1,
    marginLeft: 20,
  },
})
