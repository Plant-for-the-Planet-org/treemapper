import {StyleSheet, Text, View} from 'react-native'
import React from 'react'
import CtaArrow from 'assets/images/svg/CtaArrow.svg'

interface Props {
  label: string
}

const SideBarCard = (props: Props) => {
  const {label} = props
  return (
    <View style={styles.container}>
      <View style={styles.wrapper}>
        <View style={styles.iconWrapper}></View>
        <View style={styles.labelWrapper}>
          <Text>{label}</Text>
        </View>
        <View style={styles.arrowWrapper}>
          <CtaArrow />
        </View>
      </View>
    </View>
  )
}

export default SideBarCard

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 5,
  },
  wrapper: {
    width: '90%',
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  iconWrapper: {
    height: 25,
    width: 25,
    marginLeft: 10,
    backgroundColor: 'green',
    borderRadius: 5,
  },
  labelWrapper: {
    flex: 1,
    marginHorizontal: 10,
  },
  arrowWrapper: {
    marginRight: 10,
    height: 25,
    width: 25,
    borderRadius: 5,
    justifyContent:'center',
    alignItems:'center'
  },
})
