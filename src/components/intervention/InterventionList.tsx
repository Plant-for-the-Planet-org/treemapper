import { RefreshControl, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { FlashList } from '@shopify/flash-list'
import InterventionCard from './InterventionCard'
import { scaleSize } from 'src/utils/constants/mixins'
import InterventionHeaderSelector from 'src/components/intervention/InterventionHeaderList'
import { InterventionData } from 'src/types/interface/slice.interface'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { groupInterventionList } from 'src/utils/helpers/interventionHelper/groupInterventions'
import { Typography } from 'src/utils/constants'

interface Props {
  interventionData: InterventionData[] | any[]
}

const InterventionList = (props: Props) => {
  const { interventionData } = props
  const [selectedList, setSelectedList] = useState<InterventionData[]>([])
  const [selectedLabel, setSlectedLabel] = useState('all')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getAllInterventions()
  }, [selectedLabel,interventionData ])

  const getAllInterventions = () => {
    setLoading(true)
    const finalData = groupInterventionList(interventionData, selectedLabel)
    setSelectedList(JSON.parse(JSON.stringify(finalData)))
    setLoading(false)
  }

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const handleNavigation = (item: InterventionData) => {
    navigation.navigate('InterventionPreview', { id: 'preview', intervention: item.intervention_id })
  }

  const emptyInterventoin = () => {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyLable}>Start adding intervention</Text>
      </View>
    )
  }

  return (
    <FlashList
      data={selectedList}
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
          onRefresh={getAllInterventions}
        />}
      ListFooterComponent={<View style={styles.footerWrapper} />}
      ListEmptyComponent={() => (emptyInterventoin())}
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
    fontFamily: Typography.FONT_FAMILY_BOLD
  }
})
