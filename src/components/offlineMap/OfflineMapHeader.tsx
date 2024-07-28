import {StyleSheet, Text, TouchableOpacity, View} from 'react-native'
import React from 'react'
import LayerBackDrop from 'assets/images/svg/LayerBackdrop.svg'
import {Colors, Typography} from 'src/utils/constants'
import {scaleFont} from 'src/utils/constants/mixins'
import AddIcon from 'assets/images/svg/AddIcon.svg'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'

const OfflineMapHeader = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const addNewMap=()=>{
    navigation.navigate('OfflineMapSelection')
  }
  return (
    <View style={styles.container}>
      <View style={styles.backdrop}>
        <LayerBackDrop />
      </View>
      <Text style={styles.headerLabel}>Add Area to Offline Maps</Text>
      <Text style={styles.note}>
        Add & Save your Area to Offline Maps {'\n'}
        Anytime, Anywhere {'\n'}
      </Text>
      <TouchableOpacity style={styles.btnContainer} onPress={addNewMap}>
        <AddIcon style={styles.btnIcon} fill={Colors.WHITE}/>
        <Text style={styles.btnLabel}>Add Area</Text>
      </TouchableOpacity>
    </View>
  )
}

export default OfflineMapHeader

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '30%',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    backgroundColor: Colors.NEW_PRIMARY + '1A',
    zIndex: -1,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    width: '100%',
    justifyContent: 'flex-end',
    height: '100%',
    paddingBottom:12,
  },
  headerLabel: {
    fontFamily: Typography.FONT_FAMILY_BOLD,
    color: Colors.BLACK,
    fontSize: scaleFont(18),
    marginTop: 30,
    marginBottom: 10,
  },
  note: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.BLACK,
    fontSize: scaleFont(14),
    lineHeight: 20,
    textAlign: 'center',
  },
  btnContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: Colors.NEW_PRIMARY,
    paddingHorizontal:20,
    paddingVertical:13,
    marginBottom:20,
    flexDirection:'row'
  },
  btnIcon: {
    marginRight: 10,
  },
  btnLabel: {
    fontFamily: Typography.FONT_FAMILY_BOLD,
    color: Colors.WHITE,
    fontSize: scaleFont(14),
  },
})
