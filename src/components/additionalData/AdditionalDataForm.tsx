import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native'
import React from 'react'
import AdditionalDataFormNote from './AdditionalDataFormNote'
import { Colors, Typography } from 'src/utils/constants'
import { Text } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import AddDataElement from './AddDataElement'


const dummyData = [
  "input","yes_no",
]

const AdditionalDataForm = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

  const openMediaElementView = () => {
    navigation.navigate("SelectElement")
  }



  const renderFooter = () => {
    return (
      <View style={styles.footerWrapper}>
        <TouchableOpacity style={styles.footerButton} onPress={openMediaElementView}>
          <Text style={styles.footerLabel}>Add Field</Text>
        </TouchableOpacity>
      </View>
    )
  }
  return (
    <View style={styles.container}>
      <FlatList data={dummyData} renderItem={({item}) => (<AddDataElement data={item} />)} ListFooterComponent={renderFooter()} ListEmptyComponent={AdditionalDataFormNote} />
    </View>
  )
}

export default AdditionalDataForm

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop:10
  },
  footerWrapper: {
    width: '100%',
    height: 50,
    marginTop: 20
  },
  footerButton: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.TEXT_COLOR,
    width: 100,
    marginLeft: 20

  },
  footerLabel: {
    fontSize: 14,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.TEXT_COLOR
  }
})