import { RefreshControl, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { FlashList } from '@shopify/flash-list'
import InterventionCard from './InterventionCard'
import { scaleSize } from 'src/utils/constants/mixins'
import InterventionHeaderSelector from 'src/components/intervention/InterventionHeaderList'
import { InterventionData } from 'src/types/interface/slice.interface'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { Typography } from 'src/utils/constants'

interface Props {
  interventionData: InterventionData[] | any[]
  selectedLabel: string
  setSlectedLabel: (s: string) => void
  handlePageIncrement: () => void
  loading: boolean
  refreshHandler: () => void
}

const InterventionList = (props: Props) => {
  const { interventionData, selectedLabel, setSlectedLabel, handlePageIncrement, refreshHandler, loading } = props

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const handleNavigation = (item: InterventionData) => {
    navigation.navigate('InterventionPreview', { id: 'preview', intervention: item.intervention_id })
  }

  const emptyInterventoin = () => {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyLable}>Start adding intervention</Text>
        <Text style={styles.emptyLable}>Some placeholder to show when there is no intervention</Text>
      </View>
    )
  }

  return (
    <FlashList
      data={interventionData}
      renderItem={({ item }) => (
        <InterventionCard
          item={item}
          key={item.intervention_id}
          openIntervention={handleNavigation}
        />
      )}
      estimatedItemSize={scaleSize(100)}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={refreshHandler}
        />}
      ListFooterComponent={<View style={styles.footerWrapper} />}
      ListEmptyComponent={() => (emptyInterventoin())}
      ListHeaderComponent={
        <InterventionHeaderSelector
          selectedLabel={selectedLabel}
          setSlectedLabel={setSlectedLabel}
        />
      }
      onEndReachedThreshold={0.1}
      onEndReached={handlePageIncrement}
    />
  )
}

export default InterventionList

const styles = StyleSheet.create({
  footerWrapper: {
    height: scaleSize(140),
    width: '100%',
  },
  emptyBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyLable: {
    fontSize: 18,
    fontFamily: Typography.FONT_FAMILY_BOLD,
    textAlign: 'center',
    marginHorizontal: 50,
    marginVertical: 20
  }
})
