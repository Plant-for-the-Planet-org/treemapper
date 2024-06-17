import { Pressable, StyleSheet, Text, View, } from 'react-native'
import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import CloseIcon from 'assets/images/svg/CloseIcon.svg'
import { Colors, Typography } from 'src/utils/constants'
import { BottomSheetModal, BottomSheetView, useBottomSheetModal } from '@gorhom/bottom-sheet'
import CustomDropDown from '../common/CustomDropDown'
import EditDimension from 'assets/images/svg/EditDimension.svg'
import BinIcon from 'assets/images/svg/BinIcon.svg'
import EditPend from 'assets/images/svg/EditPenIcon.svg'
import useMonitoringPlotMangement from 'src/hooks/realm/useMonitoringPlotMangement'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'



interface Props {
  isVisible: boolean
  toogleModal: () => void
  plotId: string
}

const EidPlantModal = (props: Props) => {
  // ref
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const { delteMonitoringPlot } = useMonitoringPlotMangement()
  const { dismiss } = useBottomSheetModal()
  // variables
  const snapPoints = useMemo(() => ['40%'], []);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

  const { isVisible, toogleModal, plotId } = props
  useEffect(() => {
    if (isVisible) {
      handlePresentModalPress()
    }
  }, [isVisible])

  // callbacks
  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  // callbacks
  const closeModal = () => {
    dismiss()
    toogleModal()
  }

  const deleteHandler = async () => {
    navigation.goBack()
    await delteMonitoringPlot(plotId)
  }

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      index={0}
      handleIndicatorStyle={styles.handleIndicatorStyle}
      detached
      handleStyle={styles.handleIndicatorStyle} enableContentPanningGesture={false}
      snapPoints={snapPoints}
      backdropComponent={({ style }) => (
        <View style={[style, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]} />
      )}
    >
      <BottomSheetView style={styles.container} >
        <View style={styles.sectionWrapper}>
          <View style={styles.contnetWrapper}>
            <View style={styles.DropdownOption}>
              <View style={styles.dropwdownContainer}>
                <CustomDropDown
                  label={'Plot Groups'}
                  whiteBG
                  data={[{
                    label: 'Americas 7 Vertisols',
                    value: 'Americas 7 Vertisols',
                    index: 0,
                  }]}
                  onSelect={() => null}
                  selectedValue={{
                    label: 'Americas 7 Vertisols',
                    value: 'Americas 7 Vertisols',
                    index: 0,
                  }}
                />
              </View>
              <CloseIcon width={50} onPress={closeModal} />
            </View>
            <View style={styles.optionCard}>
              <EditPend width={18} height={18} fill={Colors.NEW_PRIMARY} />
              <Text style={styles.cardLabel}> Edit Name</Text>
            </View>
            <View style={styles.optionCard}>
              <EditDimension width={18} height={18} />
              <Text style={styles.cardLabel}> Edit Plot Dimension</Text>
            </View>
            <Pressable style={styles.optionCard} onPress={deleteHandler}>
              <BinIcon width={18} height={18} fill={'tomato'} />
              <Text style={styles.cardLabel}> Delete </Text>
            </Pressable>
          </View>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  )
}

export default EidPlantModal

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 0,
  },
  sectionWrapper: {
    width: '100%',
    backgroundColor: Colors.WHITE,
    alignItems: 'center',
  },
  contnetWrapper: {
    width: '95%',
    borderRadius: 30
  },
  handleIndicatorStyle: {
    backgroundColor: Colors.WHITE,
    borderRadius: 30
  },
  DropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 70,
  },
  dropwdownContainer: {
    flex: 1
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: '5%',
    marginVertical: 20
  },
  cardLabel: {
    fontSize: 20,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.TEXT_COLOR,
    marginLeft: '5%'
  }

})
