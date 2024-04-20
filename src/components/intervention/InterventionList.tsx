import {StyleSheet, View} from 'react-native'
import React, {useEffect, useState} from 'react'
import {FlashList} from '@shopify/flash-list'
import InterventionCard from './InterventionCard'
import {scaleSize} from 'src/utils/constants/mixins'
import InterventionHeaderSelector from 'src/components/intervention/InterventionHeaderList'
import {InterventionData} from 'src/types/interface/slice.interface'
import {useNavigation} from '@react-navigation/native'
import {StackNavigationProp} from '@react-navigation/stack'
import {RootStackParamList} from 'src/types/type/navigation.type'
import {useDispatch} from 'react-redux'
import {updateInerventionData} from 'src/store/slice/interventionSlice'
import {groupInterventionList} from 'src/utils/helpers/interventionHelper/groupInterventions'

interface Props {
  interventionData: InterventionData[] | any[]
}

const InterventionList = (props: Props) => {
  const [selectedList, setSelectedList] = useState<InterventionData[]>([])
  const [selectedLabel, setSlectedLabel] = useState('all')

  useEffect(() => {
    const finalData = groupInterventionList(interventionData, selectedLabel)
    setSelectedList(finalData)
  }, [selectedLabel])

  const {interventionData} = props
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const dispatch = useDispatch()
  const handleNavigation = (item: InterventionData) => {
    dispatch(updateInerventionData(item))
    navigation.navigate('InterventionPreview', {id: 'preview'})
  }

  return (
    <FlashList
      data={selectedList}
      renderItem={({item}) => (
        <InterventionCard
          item={item}
          key={item.intervention_id}
          openIntervention={handleNavigation}
        />
      )}
      estimatedItemSize={scaleSize(100)}
      ListFooterComponent={<View style={styles.footerWrapper} />}
      ListHeaderComponent={
        <InterventionHeaderSelector
          data={interventionData}
          selectedLabel={selectedLabel}
          setSlectedLabel={setSlectedLabel}
        />
      }
    />
  )
}

export default InterventionList

const styles = StyleSheet.create({
  footerWrapper: {
    height: scaleSize(100),
    width: '100%',
  },
})
