import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native'
import React from 'react'
import MetaDataFormNote from './MetaDataFormNote'
import MetaDataElement from './MetaDataElement'
import { Colors, Typography } from 'src/utils/constants'
import { Text } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'


const MetaDataForm = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

  const openMediaElementView = () => {
    navigation.navigate("MetaDataElement")
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
      {/* <MetaDataFormNote/> */}
      <FlatList data={[1, 2, 3, 4]} renderItem={() => (<MetaDataElement />)} ListFooterComponent={renderFooter()} ListEmptyComponent={MetaDataFormNote} />
    </View>
  )
}

export default MetaDataForm

const styles = StyleSheet.create({
  container: {
    flex: 1
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