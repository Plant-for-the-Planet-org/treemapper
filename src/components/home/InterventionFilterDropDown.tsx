import { StyleSheet, Text, View, TouchableOpacity, FlatList } from 'react-native'
import React from 'react'
import { Colors, Typography } from 'src/utils/constants'
import { INTERVENTION_TYPE } from 'src/types/type/app.type';
import { AllIntervention } from 'src/utils/constants/knownIntervention';
import Switch from '../common/Switch';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'src/store';
import { updateSelectedFilters } from 'src/store/slice/displayMapSlice';



const InterventionFilterModal = () => {
  const dispatch = useDispatch()
  const { selectedFilters } = useSelector(
    (state: RootState) => state.displayMapState,
  )

  const handleSelection = (e: INTERVENTION_TYPE) => {
    const index = selectedFilters.includes(e)
    if (index) {
      const filterData = selectedFilters.filter(el => el !== e);
      dispatch(updateSelectedFilters([...filterData]))
    } else {
      dispatch(updateSelectedFilters([...selectedFilters, e]))
    }
  }



  const renderSection = (el, index) => {
    return (<TouchableOpacity style={[styles.tileWrapper, { borderBottomWidth: index < AllIntervention.length - 1 ? 1 : 0 }]} key={el.value} onPress={() => {
      handleSelection(el.value)
    }}>
      <Text style={styles.tileLabel}>{el.label}</Text>
      <View style={styles.divider} />
      <Switch value={selectedFilters.includes(el.value)} onValueChange={() => {
        handleSelection(el.value)
      }} disabled={false} />

    </TouchableOpacity>)
  }
  const renderFooter = () => {
    return (<View style={styles.footer} />)
  }
  return (
    <View style={styles.container}>
      <FlatList
        showsVerticalScrollIndicator={false}
        data={AllIntervention} renderItem={({ item, index }) => renderSection(item, index)}
        ListFooterComponent={renderFooter}
      />
    </View>
  )
}

export default InterventionFilterModal

const styles = StyleSheet.create({
  container: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginBottom: 10,
  },
  tileWrapper: {
    width: "98%",
    height: 45,
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.WHITE,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tileLabel: {
    fontSize: 16,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.TEXT_COLOR,
    paddingLeft: 20
  },
  divider: {
    flex: 1
  },
  footer: {
    width: '100%',
    height: 0,
    marginBottom: 500
  }
})