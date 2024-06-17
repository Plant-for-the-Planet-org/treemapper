import { Pressable, StyleSheet, Text, View, } from 'react-native'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import CloseIcon from 'assets/images/svg/CloseIcon.svg'
import { Colors, Typography } from 'src/utils/constants'
import { BottomSheetModal, BottomSheetView, useBottomSheetModal } from '@gorhom/bottom-sheet'
import CustomDropDownPicker from 'src/components/common/CustomDropDown'
import EditDimension from 'assets/images/svg/EditDimension.svg'
import BinIcon from 'assets/images/svg/BinIcon.svg'
import EditPend from 'assets/images/svg/EditPenIcon.svg'
import useMonitoringPlotMangement from 'src/hooks/realm/useMonitoringPlotMangement'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { DropdownData } from 'src/types/interface/app.interface'
import { useRealm } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { MonitoringPlot, PlotGroups } from 'src/types/interface/slice.interface'
import EditInputModal from '../intervention/EditInputModal'



interface Props {
  isVisible: boolean
  toogleModal: () => void
  plotId: string,
  plotData: MonitoringPlot
}

const EidPlantModal = (props: Props) => {
  // ref
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const { delteMonitoringPlot, updatePlotName } = useMonitoringPlotMangement()
  const { dismiss } = useBottomSheetModal()
  // variables
  const snapPoints = useMemo(() => ['40%'], []);
  const [showEdit, setShowEdit] = useState('')

  const [plotName, setPlotname] = useState('')
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const [dropDownList, setDropDrownList] = useState<DropdownData[]>([])
  const [type, setType] = useState<DropdownData>({
    label: '',
    value: '',
    index: 0
  })
  const realm = useRealm()
  const { isVisible, toogleModal, plotId, plotData } = props
  useEffect(() => {
    if (isVisible) {
      handlePresentModalPress()
      setGroupData()
      setPlotname(plotData.name)
    }
  }, [isVisible])


  const setGroupData = () => {
    const groupData = realm.objects<PlotGroups>(RealmSchema.PlotGroups);
    if (groupData) {
      const updateList = groupData.map((el, i) => ({
        label: el.name,
        value: el.group_id,
        index: i
      }))
      setDropDrownList(updateList)
    }
  }

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

  const handleSubmit = () => {
    updatePlotName(plotId, plotName)
    setShowEdit('')
  }

  const handleDimensions = () => {
    bottomSheetModalRef.current.dismiss()
    navigation.navigate('CreatePlotMap', { id: plotId, isEdit: true })
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
        <Pressable style={[style, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]} onPress={closeModal} />
      )}
    >
      <EditInputModal value={showEdit} setValue={setPlotname} onSubmitInputField={handleSubmit} isOpenModal={showEdit.length > 0} setIsOpenModal={showEdit} inputType={'default'} />
      <BottomSheetView style={styles.container} >
        <View style={styles.sectionWrapper}>
          <View style={styles.contnetWrapper}>
            <View style={styles.DropdownOption}>
              <View style={styles.dropwdownContainer}>
                {dropDownList.length > 0 &&
                  <CustomDropDownPicker
                    label={'Plot Group (Optional)'}
                    data={dropDownList}
                    onSelect={setType}
                    selectedValue={type}
                    position='top'
                  />}
              </View>
              <Pressable onPress={closeModal} style={{ padding: 5 }}>
                <CloseIcon width={50} onPress={closeModal} />
              </Pressable>
            </View>
            <Pressable style={styles.optionCard} onPress={() => { setShowEdit(plotData.name) }}>
              <EditPend width={18} height={18} fill={Colors.NEW_PRIMARY} />
              <Text style={styles.cardLabel}> Edit Name</Text>
            </Pressable>
            <Pressable style={styles.optionCard} onPress={handleDimensions}>
              <EditDimension width={18} height={18} />
              <Text style={styles.cardLabel}> Edit Plot Dimension</Text>
            </Pressable>
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
    paddingVertical: 10
  },
  dropwdownContainer: {
    flex: 1
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: '5%',
    marginVertical: 10
  },
  cardLabel: {
    fontSize: 20,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.TEXT_COLOR,
    marginLeft: '5%'
  },

})
