import { StyleSheet, Text, View, TouchableOpacity, FlatList } from 'react-native'
import React from 'react'
import Modal from 'react-native-modal'
import { Colors, Typography } from 'src/utils/constants'
import { INTERVENTION_TYPE } from 'src/types/type/app.type';
import { AllIntervention } from 'src/utils/constants/knownIntervention';
import Switch from '../common/Switch';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'src/store';
import { updateSelectedFilters } from 'src/store/slice/displayMapSlice';


interface Props {
  isVisible: boolean
  toogleModal: () => void
}

const InterventionFilterModal = (props: Props) => {
  const { isVisible, toogleModal } = props
  const handleClose = () => {
    toogleModal()
  }
  const dispatch = useDispatch()
  const { selectedFilters } = useSelector(
    (state: RootState) => state.displayMapState,
  )

  const handleSelection = (e: INTERVENTION_TYPE) => {
    const index = selectedFilters.includes(e)
    if (index) {
      const filterdData = selectedFilters.filter(el => el !== e);
      dispatch(updateSelectedFilters([...filterdData]))
    } else {
      dispatch(updateSelectedFilters([...selectedFilters, e]))
    }
  }



  const renderSection = (el, index) => {
    return (<TouchableOpacity style={[styles.tileWrapper, { borderBottomWidth: index < AllIntervention.length-1 ? 1 : 0 }]} key={el.value} onPress={() => {
      handleSelection(el.value)
    }}>
      <Text style={styles.tileLabel}>{el.label}</Text>
      <View style={styles.divider} />
      <Switch value={selectedFilters.includes(el.value)} onValueChange={() => {
        handleSelection(el.value)
      }} disabled={false} />

    </TouchableOpacity>)
  }
  return (
    <Modal
      style={styles.container}
      isVisible={isVisible}
      onBackdropPress={handleClose}>
      <View style={styles.sectionWrapper}>
        <FlatList
          showsVerticalScrollIndicator={false}
          data={AllIntervention} renderItem={({ item, index }) => renderSection(item, index)} />
      </View>
    </Modal>
  )
}

export default InterventionFilterModal

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 0,
    justifyContent: 'center',
    alignItems: 'center'
  },
  sectionWrapper: {
    width: '90%',
    position: 'absolute',
    backgroundColor: Colors.WHITE,
    borderRadius: 20,
    alignItems: 'center',
    paddingVertical: 20,
    height: '60%'
  },
  tileWrapper: {
    width: "100%",
    height: 60,
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.GRAY_LIGHT,
    flexDirection: 'row',
  },
  tileLabel: {
    fontSize: 16,
    fontFamily: Typography.FONT_FAMILY_BOLD,
    color: Colors.TEXT_COLOR,
    paddingRight: 30
  },
  divider: {
    flex: 1
  }
})