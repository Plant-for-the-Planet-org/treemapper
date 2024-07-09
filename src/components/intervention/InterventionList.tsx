import { RefreshControl, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { FlashList } from '@shopify/flash-list'
import InterventionCard from './InterventionCard'
import InterventionHeaderSelector from 'src/components/intervention/InterventionHeaderList'
import { InterventionData } from 'src/types/interface/slice.interface'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { Colors, Typography } from 'src/utils/constants'
import EmptyIntervention from 'assets/images/svg/EmptyIntervention.svg'
import { lastScreenNavigationHelper } from 'src/utils/helpers/interventionFormHelper'
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
  const navDetails = lastScreenNavigationHelper(item)
  //@ts-expect-error ignore
  navigation.navigate(navDetails.screen, {...navDetails.params})
  }

  const emptyInterventoin = () => {
    return (
      <View style={styles.emptyBox}>
        <EmptyIntervention />
        <Text style={styles.emptyHeaderLable}>No Interventions to Show Yet</Text>
        <Text style={styles.emptyLable}>Start mapping your tree interventions to {'\n'} keep track of your progress.</Text>
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
      estimatedItemSize={100}
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
      onEndReachedThreshold={0.3}
      // keyExtractor={({ intervention_id }) => intervention_id}
      onEndReached={handlePageIncrement}
    />
  )
}

export default InterventionList

const styles = StyleSheet.create({
  footerWrapper: {
    height: 140,
    width: '100%',
  },
  emptyBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginTop: 80
  },
  emptyHeaderLable: {
    fontSize: 18,
    fontFamily: Typography.FONT_FAMILY_BOLD,
    textAlign: 'center',
    marginHorizontal: 50,
    marginVertical: 20,
    color: Colors.DARK_TEXT_COLOR
  },
  emptyLable: {
    fontSize: 14,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    textAlign: 'center',
    color: Colors.TEXT_COLOR
  }
})
