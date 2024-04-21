import { StyleSheet, Switch, Text, View } from 'react-native'
import React from 'react'
import { scaleFont, scaleSize } from 'src/utils/constants/mixins'
import { Colors, Typography } from 'src/utils/constants'
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
        <Switch
          value={value}
          onValueChange={changeHandler}
          disabled={false}
          style={styles.switchWrapper}
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

  },
  inputWrapper: {
    borderRadius: 12,
    width: '94%',
    paddingHorizontal: 10,
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 7,
  },
  inputLabel: {
    color: Colors.TEXT_LIGHT,
    fontSize: scaleFont(15),
    fontFamily: Typography.FONT_FAMILY_REGULAR,
  },
  switchWrapper: {
    width: 50,
    height: 30,
    backgroundColor:'red'
  }
})
