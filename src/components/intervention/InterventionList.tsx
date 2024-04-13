import {StyleSheet, View} from 'react-native'
import React from 'react'
import {FlashList} from '@shopify/flash-list'
import InterventionCard from './InterventionCard'
import {scaleSize} from 'src/utils/constants/mixins'
import InterventionHeaderSelector from 'src/components/intervention/InterventionHeaderList'
import { InterventionData } from 'src/types/interface/slice.interface'

interface Props{
  interventionData: InterventionData[] | any[]
}

const InterventionList = (props:Props) => {
  const {interventionData} = props;
  return (
    <FlashList
      data={interventionData}
      renderItem={({item}) => <InterventionCard item={item} key={item.intervention_id}/>}
      estimatedItemSize={scaleSize(100)}
      ListFooterComponent={<View style={styles.footerWrapper} />}
      ListHeaderComponent={<InterventionHeaderSelector />}
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
