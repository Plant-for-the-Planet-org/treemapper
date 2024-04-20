import React, {useState} from 'react'
import DateTimePicker from '@react-native-community/datetimepicker'
import {StyleSheet, Text, View, TouchableOpacity} from 'react-native'
import {scaleFont, scaleSize} from 'src/utils/constants/mixins'
import {Colors, Typography} from 'src/utils/constants'
import {convertDateToTimestamp, timestampToBasicDate} from 'src/utils/helpers/appHelper/dataAndTimeHelper'

interface Props {
  placeHolder: string
  value: number
  callBack:(d:number)=>void
}

const InterventionDatePicker = (props: Props) => {
  const [showPicker, setShowPicker] = useState(false)
  const {placeHolder, value, callBack} = props

  const openPicker = () => {
    setShowPicker(true)
  }

  const onDateSelect=(_event, date: Date)=>{
    setShowPicker(false)
    callBack(convertDateToTimestamp(date))
  }

  return (
    <View style={style.container}>
      <TouchableOpacity style={style.wrapper} onPress={openPicker}>
        <Text style={style.placeHolder}>{placeHolder}</Text>
        <Text style={style.label}>{timestampToBasicDate(value)}</Text>
      </TouchableOpacity>
      {showPicker && <DateTimePicker value={new Date(value)} onChange={onDateSelect}/>}
    </View>
  )
}

export default InterventionDatePicker

const style = StyleSheet.create({
  container: {
    width: '100%',
    height: scaleSize(55),
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  wrapper: {
    width: '90%',
    height: '100%',
    borderWidth: 1,
    borderColor: Colors.GRAY_TEXT,
    backgroundColor: Colors.WHITE,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  placeHolder: {
    paddingHorizontal: 5,
    paddingVertical: 3,
    backgroundColor: Colors.WHITE,
    fontSize: scaleFont(14),
    color: Colors.TEXT_COLOR,
    position: 'absolute',
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    top: -12,
    left: 10,
  },
  label: {
    paddingLeft: 15,
    fontFamily: Typography.FONT_FAMILY_BOLD,
  },
})
