import { KeyboardTypeOptions, StyleSheet, View } from 'react-native'
import React from 'react'
import { InputOutline } from 'react-native-input-outline'
import { Colors, Typography } from 'src/utils/constants'

interface Props {
  placeholder: string
  keyboardType: KeyboardTypeOptions
  errMsg: string
  value: string
}

const SignUpOutline = (props: Props) => {
  const { value, placeholder, keyboardType, errMsg } = props
  return (
    <View style={styles.containerOutline}>
      <InputOutline
        editable={false}
        style={styles.inputWrapperOutline}
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
      />
    </View>
  )
}

export default SignUpOutline

const styles = StyleSheet.create({
  containerOutline: {
    width: '100%',
    height: 50,
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  inputWrapperOutline: {
    borderRadius: 8,
    width: '100%',
    height: '100%',
  },
  unitLabelOutline: {
    color: Colors.TEXT_LIGHT,
    fontSize: 16,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
  },
  infoWrapperOutline: {
    flexDirection: 'row',
    alignItems: "center",
    zIndex: 10,
  },
  infoTextContainerOutline: {
    position: 'absolute',
    borderRadius: 8,
    backgroundColor: Colors.TEXT_COLOR,
    width: 200,
    left: -180,
    top: 20
  },
  infoTextOutline: {
    fontSize: Typography.FONT_SIZE_12,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.WHITE,
    letterSpacing: 0.2,
    paddingHorizontal: 10,
    paddingVertical: 10
  },
})
