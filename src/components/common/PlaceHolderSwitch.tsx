import {StyleSheet, Switch, Text, View} from 'react-native'
import React from 'react'
import {scaleFont} from 'src/utils/constants/mixins'
import {Colors, Typography} from 'src/utils/constants'
interface Props {
  description: string
  selectHandler:(v:boolean)=>void
  value: boolean
}

const PlaceHolderSwitch = (props: Props) => {
  const {description,selectHandler,value} = props;
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
        <View style={styles.divider} />
        <Switch
          value={value}
          onValueChange={changeHandler}
          disabled={false}
        />
      </View>
    </View>
  )
}

export default PlaceHolderSwitch

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  inputWrapper: {
    borderRadius: 10,
    width: '95%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
  },
  inputLabel: {
    color: Colors.TEXT_LIGHT,
    fontSize: scaleFont(15),
    marginLeft: 10,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
  },
  divider: {
    flex: 1,
  },
})
