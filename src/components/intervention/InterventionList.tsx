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
import { Colors, Typography } from 'src/utils/constants'
import { useDispatch } from 'react-redux'
import { resetRegisterationForm } from 'src/store/slice/registerFormSlice'
import { resetSampleTreeform } from 'src/store/slice/sampleTreeSlice'
import EmptyIntervention from 'assets/images/svg/EmptyIntervention.svg'
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
  const dispatch = useDispatch()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const handleNavigation = (item: InterventionData) => {
    dispatch(resetRegisterationForm())
    dispatch(resetSampleTreeform())
    navigation.navigate('InterventionPreview', { id: 'preview', intervention: item.intervention_id })
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
    alignItems: 'center',
    width:'100%',
    marginTop:80
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
