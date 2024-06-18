import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useState } from 'react'
import { scaleFont, scaleSize } from 'src/utils/constants/mixins'
import { Colors, Typography } from 'src/utils/constants'
import CustomSwitch from 'src/components/common/Switch'
import InfoIcon from 'assets/images/svg/InfoIcon.svg'
interface Props {
  description: string
  selectHandler: (v: boolean) => void
  value: boolean
  showInfoIcon?: boolean
  infoText?: string
}

const PlaceHolderSwitch = (props: Props) => {
  const { description, selectHandler, value, infoText, showInfoIcon } = props;
  const [showInfoData, setInfoData] = useState(false)
  const changeHandler = () => {
    selectHandler(!value)
  }
  const handleInfoIcon = () => {
    setInfoData(!showInfoData)
  }
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: value
              ? Colors.NEW_PRIMARY + '1A'
              : Colors.GRAY_LIGHT,
          },
        ]}>
        <Text style={styles.inputLabel}>{description}</Text>
        {showInfoIcon && <TouchableOpacity
          onPress={handleInfoIcon}
          style={styles.infoIconContainer}>
          <InfoIcon width={18} height={18} />
          {showInfoData && <View style={[styles.infoTextContainer]}>
            <Text style={styles.infoText}>{infoText}</Text>
          </View>}
        </TouchableOpacity>}
        <View style={styles.divider}></View>
        <CustomSwitch
          value={value}
          onValueChange={changeHandler}
          disabled={false}
          styles={styles.switchWrapper}
        />
      </View>
    </View>
  )
}

export default PlaceHolderSwitch

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: scaleSize(50),
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
    marginBottom: 15,
    zIndex: 1,
    position: 'relative',

  },
  inputWrapper: {
    borderRadius: 8,
    width: '90%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 5
  },
  inputLabel: {
    color: Colors.DARK_TEXT_COLOR,
    fontSize: scaleFont(15),
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    marginLeft: 10,
  },
  switchWrapper: {
  },
  infoIconContainer: {
    position: 'relative',
    padding: 10,
  },
  infoTextContainer: {
    position: 'absolute',
    right: -120,
    top: 36,
    padding: 10,
    borderRadius: 8,
    width: 300,
    backgroundColor: Colors.TEXT_COLOR,
    zIndex: 2,
  },
  infoText: {
    fontSize: Typography.FONT_SIZE_12,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.WHITE,
    textAlign: 'justify',
    letterSpacing: 0.2
  },
  divider: {
    flex: 1
  }
})
