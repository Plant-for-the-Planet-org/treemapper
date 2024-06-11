import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { scaleFont, scaleSize } from 'src/utils/constants/mixins'
import { Colors, Typography } from 'src/utils/constants'
import CustomSwitch from 'src/components/common/Switch'
interface Props {
  description: string
  selectHandler: (v: boolean) => void
  value: boolean
}

const PlaceHolderSwitch = (props: Props) => {
  const { description, selectHandler, value } = props;
  const changeHandler = () => {
    selectHandler(!value)
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
    height: scaleSize(55),
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
    marginBottom: 15

  },
  inputWrapper: {
    borderRadius: 5,
    width: '90%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal:5
  },
  inputLabel: {
    color: Colors.DARK_TEXT_COLOR,
    fontSize: scaleFont(15),
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    marginLeft:10,
    flex:1
  },
  switchWrapper: {
    marginLeft:'20%'
  }
})
