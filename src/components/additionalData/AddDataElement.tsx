import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Colors, Typography } from 'src/utils/constants'
import { IAdditionalDetailsForm } from 'src/types/interface/app.interface'
import { FormElement } from 'src/types/interface/form.interface'
import useAdditionalForm from 'src/hooks/realm/useAdditionalForm'
import BinIcon from 'assets/images/svg/BinIcon.svg'
import { scaleSize } from 'src/utils/constants/mixins'
import i18next from 'src/locales/index'
import AdditionalElement from './AdditionalElement'
import DraggableFlatList from "react-native-draggable-flatlist";

interface Props {
  data: IAdditionalDetailsForm
  pressHandler: (data: FormElement, form_id: string) => void
  pageNo: number
  openHandler: (id: string) => void
}
const { width } = Dimensions.get('window');


const AddDataElement = (props: Props) => {
  const { data, pageNo, openHandler, pressHandler } = props
  const { deleteForm, updateElementIndex } = useAdditionalForm()
  const handlePress = () => {
    openHandler(data.form_id)
  }
  const [elementData, setElementData] = useState([])

  useEffect(() => {
    setElementData(props.data.elements)
  }, [props.data])


  const renderFooter = () => {
    return (
      <View style={styles.footerWrapper}>
        <TouchableOpacity style={styles.footerButton} onPress={handlePress}>
          <Text style={styles.footerLabel}>{i18next.t('label.add_field')}</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const deleteFormHandler = () => {
    deleteForm(data.form_id)
  }

  const handleIndexUpdate = (d: FormElement[]) => {
    setElementData(d)
    updateElementIndex(d, data.form_id)
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerTitleWrapper}>
        <Text style={styles.headerLabel}>{i18next.t('label.page')} {pageNo + 1}</Text>
        <TouchableOpacity style={styles.deleteWrapper} onPress={deleteFormHandler}>
          <BinIcon width={15} height={15} fill={'tomato'} />
        </TouchableOpacity>
      </View>
      <DraggableFlatList
        data={elementData}
        scrollEnabled={false}
        onDragEnd={({ data }) => handleIndexUpdate(data)}
        dragHitSlop={{ right: -width + 50 + 36 }}
        keyExtractor={({ element_id }) => element_id}
        renderItem={({ item, drag, isActive }) => (<AdditionalElement
          drag={drag}
          isActive={isActive}
          elementDetails={item} pressHandler={pressHandler} form_id={data.form_id} />)} ListFooterComponent={renderFooter()} />
    </View>
  )
}



export default AddDataElement

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginLeft: '2%',
    flex: 1
  },
  wrapper: {
    width: "90%",
    paddingVertical: 10,
  },
  sectionWrapper: {
    paddingBottom: 20,
    paddingLeft: 10,
    borderRadius: 8,
    borderWidth: 0.8,
    borderColor: Colors.GRAY_LIGHT
  },
  gapWrapper: {
    paddingLeft: 10,
    borderRadius: 8,
    borderWidth: 0.8,
    borderColor: Colors.GRAY_LIGHT
  },
  keyLabel: {
    fontSize: 16,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.TEXT_COLOR,
    marginVertical: 10
  },
  bodyWrapper: {
    width: "95%",
    backgroundColor: Colors.WHITE,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    alignItems: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: Colors.TEXT_COLOR,
    borderStyle: 'dotted'
  },
  dropdown: {
    height: scaleSize(40),
    borderColor: Colors.GRAY_BORDER,
    borderWidth: 0.5,
    borderRadius: 5,
    width: '95%',
    paddingHorizontal: 8,
  },
  inputWrapper: {
    fontSize: 18,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.TEXT_COLOR,
    marginLeft: 10,
    width: '70%'
  },
  yesNoWrapper: {
    width: '100%',
    height: '100%',
    alignItems: "center",
    paddingLeft: 10,
    justifyContent: 'space-between',
    flexDirection: 'row'
  },
  headerLabel: {
    fontSize: 22,
    fontFamily: Typography.FONT_FAMILY_BOLD,
    color: Colors.TEXT_COLOR,
    marginLeft: 20,
    marginVertical: 20
  },
  footerWrapper: {
    width: '100%',
    height: 50,
    marginTop: 20
  },
  footerButton: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.TEXT_COLOR,
    width: 100,
    marginLeft: 20

  },
  footerLabel: {
    fontSize: 14,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.TEXT_COLOR
  },
  headerTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deleteWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    // borderWidth: 1,
    // borderColor: 'tomato',
    // borderStyle: 'dashed',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
    marginRight: 20
  },
  deletable: {
    fontSize: 16,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: 'tomato',
    marginHorizontal: 10,
  },
  placeholderStyle: {
    fontSize: 16,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    paddingHorizontal: 3,
    color: Colors.TEXT_COLOR
  },
  selectedTextStyle: {
    fontSize: 16,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
  },
  itemTextStyle: {
    fontSize: 16,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.TEXT_COLOR
  },
  listContainer: {
    borderRadius: 12,
    elevation: 5, // This adds a shadow on Android
    shadowColor: 'black', // This adds a shadow on iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  }
})