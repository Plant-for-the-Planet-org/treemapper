import {Pressable, StyleSheet, Text, View} from 'react-native'
import React from 'react'
import CtaArrow from 'assets/images/svg/CtaArrow.svg'
import {SideDrawerItem} from 'src/types/interface/app.interface'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'

interface Props {
  item: SideDrawerItem
}

const SideBarCard = (props: Props) => {
  const {label,screen, icon} = props.item
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const handleNavigaiton=()=>{
    navigation.replace(screen)
  }
  return (
    <Pressable style={styles.container} onPress={handleNavigaiton}>
      <View style={styles.wrapper}>
        <View style={styles.iconWrapper}>
          {icon}
        </View>
        <View style={styles.labelWrapper}>
          <Text>{label}</Text>
        </View>
        <View style={styles.arrowWrapper}>
          <CtaArrow />
        </View>
      </View>
    </Pressable>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
})
