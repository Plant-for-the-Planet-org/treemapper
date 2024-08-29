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
import { INTERVENTION_FILTER } from 'src/types/type/app.type'
import InterventionFilterModal from './InterventionFilterDropDown'
import i18next from 'src/locales/index'
import InterventionDropDown from 'src/components/common/InterventionDropDown'

interface Props {
  isVisible: boolean
  toggleModal: () => void
}

const FilterModal = (props: Props) => {
  const [showTypeModal, setShowTypeModal] = useState(false)


  const { interventionFilter, showPlots, onlyRemeasurement } = useSelector(
    (state: RootState) => state.displayMapState,
  )

  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const { dismiss } = useBottomSheetModal()
  const snapPoints = useMemo(() => ['54%', '85%', '55%'], []);
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





  const toggleTypeModal = () => {
    setShowTypeModal(!showTypeModal)
  }

  const changeInterventionFilter = (e: INTERVENTION_FILTER) => {
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
      backgroundStyle={{ backgroundColor: 'transparent' }}
    >
      <BottomSheetView style={styles.container}>
        <View style={styles.sectionWrapper}>
          <View style={styles.contentWrapper}>
            <View style={styles.header}>
              <FilterMapIcon onPress={() => { }} style={styles.iconWrapper} height={18} width={18} />
              <Text style={styles.headerLabel}>{i18next.t('label.filters')}</Text>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.closeWrapper} onPress={closeModal}>
                <CloseIcon width={18} height={18} />
              </TouchableOpacity>
            </View>
            <View style={[styles.card, { backgroundColor: showPlots ? Colors.NEW_PRIMARY + '1A' : Colors.GRAY_LIGHT }]}>
              <Text style={styles.cardLabel}>{i18next.t('label.monitoring_plots')}</Text>
              <View style={styles.divider} />
              <Switch value={showPlots} onValueChange={() => { dispatch(updateShowPlots(!showPlots)) }} disabled={false} />
            </View>
            <InterventionDropDown
              onSelect={changeInterventionFilter}
              selectedValue={{
                label: '',
                value: interventionFilter,
                index: 0,
              }} />
            {interventionFilter !== 'none' && <TouchableOpacity style={[styles.card, { backgroundColor: showTypeModal ? Colors.NEW_PRIMARY + '1A' : Colors.GRAY_LIGHT }]} onPress={handleOpenModal}>
              <Text style={styles.cardLabel}>{i18next.t('label.filter_intervention')}</Text>
              <View style={styles.divider} />
            </TouchableOpacity>}
            {showTypeModal && <InterventionFilterModal />}
            <View style={[styles.card, { backgroundColor: onlyRemeasurement ? Colors.NEW_PRIMARY + '1A' : Colors.GRAY_LIGHT }]}>
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
    height:'100%',
    bottom: 0,
    backgroundColor: Colors.WHITE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
    paddingTop: 10
  },
  contentWrapper: {
    width: '95%',
    paddingBottom: 50
  },
  card: {
    height: 60,
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
    fontSize: 21,
    fontFamily: Typography.FONT_FAMILY_BOLD,
    color: Colors.TEXT_COLOR,
  },
  cardLabel: {
    fontSize: 15,
    marginHorizontal: 10,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.DARK_TEXT,
    letterSpacing: 1,
    paddingLeft: 10,
    textAlign: 'left',
    maxWidth: '80%'
  },
  divider: {
    flex: 1,
  },
  handleIndicatorStyle: {
    width: 0,
    height: 0
  }
})
