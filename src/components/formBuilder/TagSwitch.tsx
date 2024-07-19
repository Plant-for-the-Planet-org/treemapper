import { KeyboardTypeOptions, StyleSheet, View } from 'react-native'
import React from 'react'
import { InputOutline } from 'react-native-input-outline'
import { Text } from 'react-native'
import { Colors } from 'src/utils/constants'
import { scaleFont } from 'src/utils/constants/mixins'
import Switch from '../common/Switch'

interface Props {
  placeholder: string
  changeHandler: (t: string) => void
  keyboardType: KeyboardTypeOptions
  trailingtext: string
  switchEnable: boolean
  description: string
  switchHandler: (b: boolean) => void
  errMsg: string
}

const TagSwitch = (props: Props) => {
  const {
    placeholder,
    changeHandler,
    keyboardType,
    trailingtext,
    switchEnable,
    description,
    switchHandler,
  errMsg
  } = props
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.wrapper,
          {
            backgroundColor: switchEnable
              ? Colors.LIGHT_PRIMARY
              : Colors.GRAY_LIGHT,
          },
        ]}>
        <View style={[styles.switchWrapper]}>
          <Text style={styles.inputLabel}>{description}</Text>
          <View style={styles.switchContainer}>
            <Switch
              value={switchEnable}
              onValueChange={() => { switchHandler(!switchEnable) }}
              disabled={false}
            />
          </View>
        </View>
        {switchEnable && <View style={styles.inputContainer}>
          <InputOutline
            style={styles.inputWrapper}
            keyboardType={keyboardType}
            placeholder={placeholder}
            activeColor={Colors.PRIMARY}
            inactiveColor={Colors.GRAY_BORDER}
            placeholderTextColor={Colors.GRAY_BORDER}
            onChangeText={changeHandler}
            fontSize={18}
            returnKeyType="done"
            error={errMsg.length?errMsg:undefined}
            trailingIcon={() => (
              <Text style={styles.unitLabel}>{trailingtext}</Text>
            )}
          />
        </View>}
      </View>
    </View>
  )
}

export default TagSwitch

const styles = StyleSheet.create({
  container: {
    flexDirection:'row',
    alignItems: 'center',
    marginVertical: 15,
    justifyContent: 'center',
    borderRadius: 10,
    width:'100%'
  },
  wrapper: {
    width:'95%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  inputContainer: {
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginVertical: 20
  },
  inputWrapper: {
    borderRadius: 10,
    width: '95%',
    height: 50,
  },
  unitLabel: {
    color: Colors.GRAY_TEXT,
  },
  switchWrapper: {
    borderRadius: 10,
    width: '100%',
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:'space-around',
  },
  switchContainer: {
    width: 50,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputLabel: {
    color: 'gray',
    fontSize: scaleFont(14),
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    width:'80%'
  },
  divider: {
    flex: 1,
  },
})
