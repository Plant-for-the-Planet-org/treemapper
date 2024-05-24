import { Image, StyleSheet, Text, View } from 'react-native'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import FilterMapIcon from 'assets/images/svg/FilterMinimal.svg'
import CloseIcon from 'assets/images/svg/CloseIcon.svg'
import Switch from '../common/Switch'
import { Colors, Typography } from 'src/utils/constants'
import { BottomSheetModal, BottomSheetView, useBottomSheetModal, TouchableOpacity } from '@gorhom/bottom-sheet'
import { useDispatch, useSelector } from 'react-redux'
import { updateInterventionFilter } from 'src/store/slice/displayMapSlice'
import { RootState } from 'src/store'
import InterventionTimeModal from './InterventionTimeModal'
import { INTERVENTION_FILTER } from 'src/types/type/app.type'
import InterventionFilterModal from './InterventionFilterDropDown'

const FunnelIcon = require('assets/images/icons/FunnelIcon.png')
interface Props {
  isVisible: boolean
  toogleModal: () => void
}

const FilterModal = (props: Props) => {
  const [showTimeModal, setTimeModal] = useState(false)
  const [showTypeModal, setTypeModal] = useState(false)

  const { interventionFilter } = useSelector(
    (state: RootState) => state.displayMapState,
  )
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const { dismiss } = useBottomSheetModal()
  // variables
  const snapPoints = useMemo(() => ['45%'], []);
  const { isVisible, toogleModal } = props
  const dispatch = useDispatch()
  useEffect(() => {
    if (isVisible) {
      handlePresentModalPress()
    }
  }, [isVisible])

  useEffect(() => {

  }, [])


  // callbacks
  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);
  const closeModal = () => {
    toogleModal()
    dismiss();
  }

  const toogleIntervention = () => {
    if (interventionFilter === 'none') {
      dispatch(updateInterventionFilter('always'))
      setTimeModal(true)
    } else {
      setTimeModal(false)
      dispatch(updateInterventionFilter('none'))
    }
  }

  const toogleTimeModal = () => {
    setTimeModal(!showTimeModal)
  }


  const toogleTypeModal = () => {
    setTypeModal(!showTypeModal)
  }

  const changeInterventionFilter = (e: INTERVENTION_FILTER) => {
    setTimeModal(false)
    dispatch(updateInterventionFilter(e))
  }


  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      index={0}
      detached
      enableContentPanningGesture={false}
      snapPoints={snapPoints}
      backdropComponent={({ style }) => (
        <View style={[style, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]} />
      )}
      style={{ paddingTop: 20 }}
    >
      <InterventionTimeModal isVisible={showTimeModal} toogleModal={toogleTimeModal} selectedFilter={interventionFilter} changeInterventionFilter={changeInterventionFilter} />
      <InterventionFilterModal isVisible={showTypeModal} toogleModal={toogleTypeModal} />
      <BottomSheetView style={styles.container} >
        <View style={styles.sectionWrapper}>
          <View style={styles.contnetWrapper}>
            <View style={styles.header}>
              <FilterMapIcon onPress={() => { }} style={styles.iconWrapper} />
              <Text style={styles.headerLable}>Filters</Text>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.closeWrapper} onPress={closeModal}>
                <CloseIcon />
              </TouchableOpacity>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardLable}>Monitoring Plots</Text>
              <View style={styles.divider} />
              <Switch value={false} onValueChange={() => { }} disabled={false} />
            </View>
            <View style={[styles.card, { backgroundColor: Colors.NEW_PRIMARY + '1A' }]}>
              <Text style={styles.cardLable}>Interventions</Text>
              <View style={styles.divider} />
              <Switch value={interventionFilter !== 'none'} onValueChange={toogleIntervention} disabled={false} />
            </View>
            <TouchableOpacity style={styles.card} onPress={toogleTypeModal}>
              <Text style={styles.cardLable}>Filter Interventions</Text>
              <View style={styles.divider} />
              <Image source={FunnelIcon} style={styles.closeWrapper} />
            </TouchableOpacity>
            <View style={styles.card}>
              <Text style={styles.cardLable}>Only Interverntion that need {'\n'} remeasurment</Text>
              <View style={styles.divider} />
              <Switch value={false} onValueChange={() => { }} disabled={false} />
            </View>
            <View />
          </View>
        </View>
      </BottomSheetView>
    </BottomSheetModal>)
}

export default FilterModal

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 0,
  },
  sectionWrapper: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
  },
  contnetWrapper: {
    width: '95%',
    paddingTop: 10,
    paddingBottom: 50
  },
  card: {
    height: 50,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
    borderRadius: 10,
    backgroundColor: Colors.GRAY_LIGHT
  },
  header: {
    height: 50,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconWrapper: {
    marginHorizontal: 10
  },
  closeWrapper: {
    width: 30,
    height: 30,
    marginRight: 8,
    tintColor: Colors.TEXT_COLOR
  },
  headerLable: {
    fontSize: 20,
    fontFamily: Typography.FONT_FAMILY_BOLD,
    color: Colors.TEXT_COLOR
  },
  cardLable: {
    fontSize: 16,
    marginHorizontal: 10,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.TEXT_COLOR,
    letterSpacing:1
  },
  
  divider: {
    flex: 1,
  },
})
