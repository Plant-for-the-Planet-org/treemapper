import { KeyboardTypeOptions, StyleSheet, View, Text, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import { InputOutline } from 'react-native-input-outline'
import { Colors, Typography } from 'src/utils/constants'
import InfoIcon from 'assets/images/svg/InfoIcon.svg'

interface Props {
  placeholder: string
  keyboardType: KeyboardTypeOptions
  trailingText: string
  errMsg: string
  info?: string
  value: string
}

const SignUpOutline = (props: Props) => {
  const { value, placeholder, keyboardType, trailingText, errMsg, info } = props

  const [showInfoData, setShowInfoData] = useState(false)


  const toggleInfoData = () => {
    setShowInfoData(prev => !prev)
  }

  const renderTrailingComma = () => {
    return info ? <View style={styles.infoWrapper}>
      <Text style={styles.unitLabel}>{trailingText}</Text>
      <TouchableOpacity
        onPress={toggleInfoData}
        style={styles.infoIconContainer}>
        <InfoIcon width={18} height={18} />
        {showInfoData && <TouchableOpacity style={[styles.infoTextContainer]} onPress={toggleInfoData}>
          <Text style={styles.infoText}>{info}</Text>
        </TouchableOpacity>}
      </TouchableOpacity>
    </View> : <Text style={styles.unitLabel}>{trailingText}</Text>
  }
  return (
    <View style={styles.container}>
      <InputOutline
        editable={false}
        style={styles.inputWrapper}
        keyboardType={keyboardType}
        placeholder={placeholder}
        fontColor={Colors.TEXT_LIGHT}
        paddingVertical={10}
        activeColor={Colors.TEXT_LIGHT}
        returnKeyType="done"
        inactiveColor={Colors.TEXT_LIGHT}
        placeholderTextColor={Colors.TEXT_LIGHT}
        onChangeText={()=>{}}
        fontSize={16}
        fontFamily={Typography.FONT_FAMILY_SEMI_BOLD}
        error={errMsg.length ? errMsg : undefined}
        autoFocus={false}
        value={value}
        trailingIcon={renderTrailingComma}
        
      />
    </View>
  )
}

export default SignUpOutline

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 50,
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  inputWrapper: {
    borderRadius: 8,
    width: '100%',
    height: '100%',
  },
  unitLabel: {
    color: Colors.TEXT_LIGHT,
    fontSize: 16,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
  },
  infoWrapper: {
    flexDirection: 'row',
    alignItems: "center",
    zIndex: 10,
  },
  infoIconContainer: {
    marginLeft: 10
  },
  infoTextContainer: {
    position: 'absolute',
    borderRadius: 8,
    backgroundColor: Colors.TEXT_COLOR,
    width: 200,
    left: -180,
    top: 20
  },
  infoText: {
    fontSize: Typography.FONT_SIZE_12,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.WHITE,
    letterSpacing: 0.2,
    paddingHorizontal: 10,
    paddingVertical: 10
  },
})
