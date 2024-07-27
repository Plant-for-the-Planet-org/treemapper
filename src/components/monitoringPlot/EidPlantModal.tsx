import { Pressable, StyleSheet, Text, View, } from 'react-native'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import CloseIcon from 'assets/images/svg/CloseIcon.svg'
import { Colors, Typography } from 'src/utils/constants'
import { BottomSheetBackdropProps, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
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
import AddIcon from 'assets/images/svg/Addicon.svg'



interface Props {
  isVisible: boolean
  toogleModal: () => void
  plotId: string,
  plotData: MonitoringPlot
}

const EidPlantModal = (props: Props) => {
  // ref
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const { delteMonitoringPlot, updatePlotName, removePlotFromGroup, addPlotToGroup } = useMonitoringPlotMangement()
  // variables
  const snapPoints = useMemo(() => ['40%'], []);
  const [showEdit, setShowEdit] = useState('')

  const [plotName, setPlotName] = useState('')
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const [dropDownList, setDropDownList] = useState<DropdownData[]>([])
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
      setPlotName(plotData.name)
    }
  }, [isVisible])


  const updatePlotGroup = async (d: any) => {
    if (type.value) {
      await removePlotFromGroup(type.value, plotId)
      await addPlotToGroup(d.value, plotData)
    } else {
      await addPlotToGroup(d.value, plotData)
    }
  }


  const setGroupData = () => {
    const groupData = realm.objects<PlotGroups>(RealmSchema.PlotGroups);
    if (groupData) {
      const updateList = groupData.map((el, i) => ({
        label: el.name,
        value: el.group_id,
        index: i
      }))
      setDropDownList(updateList)
      if (plotData?.plot_group[0]) {
        setType({
          label: plotData.plot_group[0].name,
          value: plotData.plot_group[0].group_id,
          index: 0
        })
      }
    }
  }

  // callbacks
  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  // callbacks
  const closeModal = () => {
    bottomSheetModalRef.current.dismiss()
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
    toogleModal()
    navigation.navigate('CreatePlotMap', { id: plotId, isEdit: true })
  }

  const addGroup = () => {
    bottomSheetModalRef.current.dismiss()
    toogleModal()
    navigation.navigate("PlotGroup")
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
      handleStyle={styles.handleIndicatorStyle} enableContentPanningGesture={false}
      snapPoints={snapPoints}
      backdropComponent={backdropModal}
    >
      <EditInputModal value={showEdit} setValue={setPlotName} onSubmitInputField={handleSubmit} isOpenModal={showEdit.length > 0} inputType={'default'} />
      <BottomSheetView style={styles.container} >
        <View style={styles.sectionWrapper}>
          <View style={styles.contnetWrapper}>
            <View style={styles.DropdownOption}>
              <View style={styles.dropwdownContainer}>
                {dropDownList.length > 0 ?
                  <CustomDropDownPicker
                    label={'Plot Group (Optional)'}
                    data={dropDownList}
                    onSelect={updatePlotGroup}
                    whiteBG
                    selectedValue={type}
                  /> : <Pressable
                    onPress={addGroup}
                    style={styles.emptyWrapper}><Text style={styles.emptyLabel}>Add Group</Text><AddIcon width={18} height={18} fill={Colors.NEW_PRIMARY} /></Pressable>}
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
  emptyLabel: {
    fontSize: 22,
    fontFamily: Typography.FONT_FAMILY_BOLD,
    color: Colors.NEW_PRIMARY,
    marginRight: 10
  },
  emptyWrapper: {
    height: 55,
    marginLeft: '5%',
    alignItems: 'center',
    flexDirection: 'row'
  }
})
