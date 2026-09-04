import { KeyboardTypeOptions, StyleSheet, View, Text, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import { InputOutline } from 'react-native-input-outline'
import { Colors, Typography } from 'src/utils/constants'
import { scaleFont } from 'src/utils/constants/mixins'
import InfoIcon from 'assets/images/svg/InfoIcon.svg'
import {
  AnalyticsEvents,
  FIELD_TERMS,
  trackTermEvent,
} from 'src/utils/analytics'

interface Props {
  placeholder: string
  changeHandler: (h: string) => void
  keyboardType: KeyboardTypeOptions
  trailingText: string
  errMsg: string
  autoFocus?: boolean
  defaultValue?: string
  info?: string
  /**
   * Opt in to field-level analytics. Pass the field's stable key (not its
   * label, which is translated). When it maps to a word under study in
   * FIELD_TERMS, opening the info tooltip is recorded as a terminology
   * signal: people only tap "what does this mean" when the label did not
   * tell them.
   */
  analyticsField?: string
  analyticsForm?: string
  onFieldFocus?: () => void
  onFieldBlur?: () => void
}

const OutlinedTextInput = (props: Props) => {
  const { placeholder, changeHandler, keyboardType, trailingText, errMsg, autoFocus, defaultValue, info, analyticsField, analyticsForm, onFieldFocus, onFieldBlur } = props

  const [showInfoData, setShowInfoData] = useState(false)


  const toggleInfoData = () => {
    setShowInfoData(prev => {
      const opening = !prev
      const term = analyticsField ? FIELD_TERMS[analyticsField] : undefined
      // Only the open counts. Tapping again to dismiss is not a second
      // moment of confusion.
      if (opening && term) {
        trackTermEvent(AnalyticsEvents.TERM_TOOLTIP_OPENED, term, {
          field: analyticsField,
          form_name: analyticsForm,
        })
      }
      return opening
    })
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
        style={styles.inputWrapper}
        keyboardType={keyboardType}
        placeholder={placeholder}
        fontColor={Colors.DARK_TEXT_COLOR}
        // paddingVertical={16}
        activeColor={Colors.NEW_PRIMARY}
        returnKeyType="done"
        inactiveColor={Colors.GRAY_BORDER}
        placeholderTextColor={Colors.GRAY_BORDER}
        onChangeText={changeHandler}
        // fontSize={16}
        fontFamily={Typography.FONT_FAMILY_SEMI_BOLD}
        error={errMsg.length ? errMsg : undefined}
        autoFocus={autoFocus || false}
        value={defaultValue || ""}
        onFocus={onFieldFocus}
        onBlur={onFieldBlur}
        trailingIcon={renderTrailingComma}
      />
    </View>
  )
}

export default OutlinedTextInput

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 70,
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    zIndex:2
  },
  inputWrapper: {
    borderRadius: 8,
    width: '95%',
    height: '100%',
  },
  unitLabel: {
    color: Colors.TEXT_LIGHT,
    fontSize: scaleFont(16),
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD
  },
  infoWrapper: {
    flexDirection: 'row',
    alignItems: "center",
    zIndex: 10,
  },
  infoIconContainer: {
    marginLeft:10,
    marginTop:3
  },
  infoTextContainer: {
    position: 'absolute',
    borderRadius: 8,
    backgroundColor: Colors.TEXT_COLOR,
    width:200,
    left:-180,
    top:15
  },
  infoText: {
    fontSize: Typography.FONT_SIZE_12,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.WHITE,
    textAlign: 'justify',
    letterSpacing: 0.2,
    paddingHorizontal:10,
    paddingVertical:10
  },
})
