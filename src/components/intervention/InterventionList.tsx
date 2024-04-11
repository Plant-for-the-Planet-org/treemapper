import {StyleSheet, View} from 'react-native'
import React from 'react'
import {FlashList} from '@shopify/flash-list'
import InterventionCard from './InterventionCard'
import {scaleSize} from 'src/utils/constants/mixins'
import InterventionHeaderSelector from 'src/components/intervention/InterventionHeaderList'

const InterventionList = () => {
  return (
    <FlashList
      data={[1, 2, 3, 4, 5, 5]}
      renderItem={() => <InterventionCard />}
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
