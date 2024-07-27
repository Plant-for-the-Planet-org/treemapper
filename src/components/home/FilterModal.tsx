import { StyleSheet, Text, View, TouchableOpacity, Pressable } from 'react-native'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import FilterMapIcon from 'assets/images/svg/FilterMinimal.svg'
import CloseIcon from 'assets/images/svg/CloseIcon.svg'
import Switch from '../common/Switch'
import { Colors, Typography } from 'src/utils/constants'
import { BottomSheetBackdropProps, BottomSheetModal, BottomSheetView, useBottomSheetModal } from '@gorhom/bottom-sheet'
import { useDispatch, useSelector } from 'react-redux'
import { updateInterventionFilter, updateRemeasurementFilter, updateShowPlots } from 'src/store/slice/displayMapSlice'
import { RootState } from 'src/store'
import InterventionTimeModal from './InterventionTimeModal'
import { INTERVENTION_FILTER } from 'src/types/type/app.type'
import InterventionFilterModal from './InterventionFilterDropDown'
import i18next from 'src/locales/index'

interface Props {
  isVisible: boolean
  toggleModal: () => void
}

const FilterModal = (props: Props) => {
  const [showTimeModal, setShowTimeModal] = useState(false)
  const [showTypeModal, setShowTypeModal] = useState(false)


  const { interventionFilter, showPlots, onlyRemeasurement } = useSelector(
    (state: RootState) => state.displayMapState,
  )
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const { dismiss } = useBottomSheetModal()
  // variables
  const snapPoints = useMemo(() => ['50%', '85%'], []);
  const { isVisible, toggleModal } = props
  const dispatch = useDispatch()
  useEffect(() => {
    if (isVisible) {
      handlePresentModalPress()
    }
  }, [isVisible])




  // callbacks
  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);
  const closeModal = () => {
    toggleModal()
    setShowTypeModal(false)
    dismiss();
  }

  const toggleIntervention = () => {
    if (interventionFilter === 'none') {
      dispatch(updateInterventionFilter('always'))
      setShowTimeModal(true)
    } else {
      setShowTimeModal(false)
      dispatch(updateInterventionFilter('none'))
    }
  }

  const toggleTimeModal = () => {
    setShowTimeModal(!showTimeModal)
  }


  const toggleTypeModal = () => {
    setShowTypeModal(!showTypeModal)
  }

  const changeInterventionFilter = (e: INTERVENTION_FILTER) => {
    setShowTimeModal(false)
    dispatch(updateInterventionFilter(e))
  }


  const handleOpenModal = () => {
    bottomSheetModalRef.current.snapToIndex(showTypeModal ? 0 : 1)
    toggleTypeModal()
  }

  const backdropModal = ({ style }: BottomSheetBackdropProps) => (
    <Pressable style={[style, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]} onPress={closeModal} />
  )

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      index={0}
      handleIndicatorStyle={styles.handleIndicatorStyle}
      detached
      handleStyle={styles.handleIndicatorStyle}
      enableContentPanningGesture={false}
      snapPoints={snapPoints}
      backdropComponent={backdropModal}
      style={{ paddingTop: 20 }}
    >
      <InterventionTimeModal isVisible={showTimeModal} toggleModal={toggleTimeModal} selectedFilter={interventionFilter} changeInterventionFilter={changeInterventionFilter} />
      <BottomSheetView style={styles.container}>
        <View style={styles.sectionWrapper}>
          <View style={styles.contentWrapper}>
            <View style={styles.header}>
              <FilterMapIcon onPress={() => { }} style={styles.iconWrapper} />
              <Text style={styles.headerLabel}>{i18next.t('label.filters')}</Text>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.closeWrapper} onPress={closeModal}>
                <CloseIcon />
              </TouchableOpacity>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>{i18next.t('label.monitoring_plots')}</Text>
              <View style={styles.divider} />
              <Switch value={showPlots} onValueChange={() => { dispatch(updateShowPlots(!showPlots)) }} disabled={false} />
            </View>
            <View style={[styles.card, { backgroundColor: Colors.NEW_PRIMARY + '1A' }]}>
              <Text style={styles.cardLabel}>{i18next.t('label.intervention')}</Text>
              <View style={styles.divider} />
              <Switch value={interventionFilter !== 'none'} onValueChange={toggleIntervention} disabled={false} />
            </View>
            <TouchableOpacity style={styles.card} onPress={handleOpenModal}>
              <Text style={styles.cardLabel}>{i18next.t('label.filter_intervention')}</Text>
              <View style={styles.divider} />
            </TouchableOpacity>
            {showTypeModal && <InterventionFilterModal />}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>{i18next.t('label.only_remeasurement')}</Text>
              <View style={styles.divider} />
              <Switch value={onlyRemeasurement} onValueChange={() => { dispatch(updateRemeasurementFilter(!onlyRemeasurement)) }} disabled={false} />
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
    bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
  },
  contentWrapper: {
    width: '95%',
    paddingBottom: 50
  },
  card: {
    height: 55,
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
    marginRight: 8,
    tintColor: Colors.TEXT_COLOR
  },
  headerLabel: {
    fontSize: 20,
    fontFamily: Typography.FONT_FAMILY_BOLD,
    color: Colors.TEXT_COLOR,
    paddingLeft: 10
  },
  cardLabel: {
    fontSize: 16,
    marginHorizontal: 10,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.TEXT_COLOR,
    letterSpacing: 1,
    paddingLeft: 10,
    textAlign: 'left'

  },
  divider: {
    flex: 1,
  },
  handleIndicatorStyle: {
    backgroundColor: Colors.WHITE,
    width: 0,
    height: 0
  }
})
