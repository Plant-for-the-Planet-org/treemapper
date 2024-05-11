import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { Colors, Typography } from 'src/utils/constants'
import { IAdditonalDetailsForm } from 'src/types/interface/app.interface'
import { FormElement } from 'src/types/interface/form.interface'


interface Props {
  data: IAdditonalDetailsForm
  pressHandler: (id: string, form_id: string) => void
  pageNo: number
  openHandler: (id: string) => void
}

const Element = (props: { elementDetails: FormElement }) => {
  const { elementDetails } = props;
  const renderBody = () => {
    switch (elementDetails.type) {
      case "INPUT":
        return (
          <Text style={styles.inputWrapper}>
            Heell
          </Text>
        )
      case "YES_NO":
        return (
          <View style={styles.yesNoWrapper}>
            <Text>Yes no</Text>
          </View>
        )

      default:
        return (
          <View ></View>
        )
    }
  }


  return (
    <View style={styles.cotnainer}>
      <View style={styles.wrapper}>
        <View style={styles.sectionWrapper}>
          <Text style={styles.keyLabel}>Input Element</Text>
          <View style={styles.bodyWrapper}>
            {renderBody()}
          </View>
        </View>
      </View>
    </View>
  )
}

const AddDataElement = (props: Props) => {
  const { data, pageNo, openHandler } = props
  const handlePress = () => {
    openHandler(data.form_id)
  }
  const renderFooter = () => {
    return (
      <View style={styles.footerWrapper}>
        <TouchableOpacity style={styles.footerButton} onPress={handlePress}>
          <Text style={styles.footerLabel}>Add Field</Text>
        </TouchableOpacity>
      </View>
    )
  }
  return (
    <View style={styles.cotnainer}>
      <Text style={styles.headerLabel}>Page {pageNo + 1}</Text>
      <FlatList data={data.elements} renderItem={({ item }) => (<Element elementDetails={item} />)} ListFooterComponent={renderFooter()} />
    </View>
  )
}



export default AddDataElement

const styles = StyleSheet.create({
  cotnainer: {
    width: '100%',
    marginLeft:'2%'
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
  keyLabel: {
    fontSize: 16,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.TEXT_COLOR,
    marginVertical: 10
  },
  bodyWrapper: {
    width: "90%",
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
  inputWrapper: {
    fontSize: 18,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.TEXT_COLOR,
    marginLeft: 10
  },
  yesNoWrapper: {
    width: '100%',
    height: '100%',
    alignItems: "center",
    paddingLeft: 10
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
})