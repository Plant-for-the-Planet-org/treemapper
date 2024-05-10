// import { StyleSheet, Switch, Text, View } from 'react-native'
// import React, { useEffect, useMemo, useRef, useState } from 'react'
// import Header from 'src/components/common/Header'
// import { Colors, Typography } from 'src/utils/constants'
// import { SafeAreaView } from 'react-native-safe-area-context'
// import CustomTextInput from 'src/components/common/CustomTextInput'
// import CustomDropDown from 'src/components/common/CustomDropDown'
// import CustomButton from 'src/components/common/CustomButton'
// import { scaleSize } from 'src/utils/constants/mixins'
// import { BottomSheetModal, useBottomSheetModal } from '@gorhom/bottom-sheet'
// import DropDownFieldElement from 'src/components/additionalData/DropDownFieldElement'




// const AdditionDataElement = () => {
//   const [inputKey, setInputKey] = useState('')
//   // const [inputValue, setInputValue] = useState('')
//   const [isPublic, setIsPublic] = useState(false)
//   const [advanceMode, setAdvanceMode] = useState(false)
//   const [fieldKey, setFieldKey] = useState(`INPUT-${Date.now()}`)
//   const [isRequired, setIsRequired] = useState(false)
//   const [showOptionModal, setShowDropDownOption] = useState(false)


//   const bottomSheetModalRef = useRef<BottomSheetModal>(null);
//   const { dismiss } = useBottomSheetModal()
//   // variables
//   const snapPoints = useMemo(() => ['70%'], []);

//   useEffect(() => {
//     bottomSheetModalRef.current?.present();
//   }, [])

//   const fieldType: Array<{
//     label: string
//     value: string
//     index: number
//   }> = [{
//     label: 'Text',
//     value: 'default',
//     index: 0
//   }, {
//     label: 'Number',
//     value: 'number',
//     index: 0
//   }]

//   const renderHeaderRight = () => {
//     return <View style={styles.switchHeaderContainer}>
//       <Text style={styles.switchText}>Advance Mode</Text>
//       <Switch value={advanceMode} onValueChange={() => {
//         setAdvanceMode(!advanceMode)
//       }} disabled={false} />
//     </View>
//   }

//   const toogleOptionModal = () => {
//     setShowDropDownOption(!showOptionModal)
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <DropDownFieldElement isVisible={showOptionModal} toogleModal={toogleOptionModal} />
//       <Header label='' rightComponet={renderHeaderRight()} />
//       <Text style={styles.header}>Add Input</Text>
//       <CustomTextInput
//         label="Field name"
//         onChangeHandler={setInputKey}
//         value={inputKey}
//       />
//       <CustomDropDown
//         label={'Field Type'}
//         data={fieldType}
//         onSelect={() => { }}
//         selectedValue={fieldType[0]}
//       />
//       {advanceMode && <CustomTextInput
//         label="Field key"
//         onChangeHandler={setInputKey}
//         value={fieldKey}
//       />}
//       <View style={styles.switchContainer}>
//         <Text style={styles.switchText}>This is required</Text>
//         <Switch value={isRequired} onValueChange={() => {
//           setIsRequired(!isRequired)
//         }} disabled={false} />
//       </View>
//       <View style={styles.switchContainer}>
//         <Text style={styles.switchText}>Make this data public</Text>
//         <Switch value={isPublic} onValueChange={() => {
//           setIsPublic(!isPublic)
//         }} disabled={false} />
//       </View>
//       <Text style={styles.dropDownOption}>Dropdown options</Text>
//       <Text style={styles.addDropDown} onPress={toogleOptionModal}>Add Dropdown Options</Text>
//       <View style={styles.btnWrapper}></View>
//       <CustomButton
//         label="Add Element"
//         containerStyle={styles.btnContainer}
//         pressHandler={() => { }}
//       />
//       {/* <BottomSheetModal
//         ref={bottomSheetModalRef}
//         index={0}
//         detached
//         enableContentPanningGesture={false}
//         snapPoints={snapPoints}
//         backdropComponent={({ style }) => (
//           <View style={[style, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]} />
//         )}
//       ><View />
//       </BottomSheetModal> */}
//     </SafeAreaView>
//   )
// }

// export default AdditionDataElement

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: Colors.WHITE
//   },
//   header: {
//     fontSize: 22,
//     fontFamily: Typography.FONT_FAMILY_EXTRA_BOLD,
//     color: Colors.DARK_TEXT_COLOR,
//     marginLeft: 20,
//     marginVertical: 10
//   },
//   placeHolder: {
//     fontSize: 22,
//     fontFamily: Typography.FONT_FAMILY_EXTRA_BOLD,
//     color: Colors.DARK_TEXT_COLOR,
//     marginLeft: 20,
//     marginVertical: 10
//   },
//   switchContainer: {
//     width: '100%',
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//     marginTop: 20
//   },
//   switchHeaderContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     height: '100%',
//   },
//   switchText: {
//     color: Colors.TEXT_COLOR,
//     fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
//     fontSize: Typography.FONT_SIZE_16,
//     marginRight: 16,
//   },
//   btnContainer: {
//     width: '100%',
//     height: scaleSize(70),
//     position: 'absolute',
//     bottom: 20,
//   },
//   btnWrapper:{
//     width:'100%',
//     flex:1,
//     alignItems:'flex-end'
//   },
//   dropDownOption: {
//     fontSize: 18,
//     fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
//     color: Colors.TEXT_COLOR,
//     marginLeft: 20,
//     marginTop: 20
//   },
//   addDropDown: {
//     fontSize: 16,
//     fontFamily: Typography.FONT_FAMILY_REGULAR,
//     color: Colors.NEW_PRIMARY,
//     marginLeft: 20,
//     marginVertical: 10
//   },

// })

import { View, Text } from 'react-native'
import React from 'react'

const AdditionDataElement = () => {
  return (
    <View>
      <Text>AdditionDataElement</Text>
    </View>
  )
}

export default AdditionDataElement