import { View, StyleSheet, FlatList, TouchableOpacity, Text } from 'react-native'
import React, { useEffect, useState } from 'react'
import MetaDataFormNote from './MetaDataFormNote'
import MetaDataElement from './MetaDataElement'
import { Colors, Typography } from 'src/utils/constants'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { useQuery } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { Metadata } from 'src/types/interface/app.interface'
import i18next from 'src/locales/index'


const MetaDataForm = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const [metaData, setMetaData] = useState<Metadata[]>([])

  const allMetaData = useQuery<Metadata>(
    RealmSchema.Metadata,
    data => {
      return data
    },
  )

  useEffect(() => {
    setMetaData([...allMetaData])
  }, [allMetaData])



  const openMediaElementView = () => {
    navigation.navigate("MetaDataElement", { order: allMetaData.length + 1 })
  }

  const editDetails = (d: Metadata) => {
    navigation.navigate("MetaDataElement", { order: d.order, edit: true, id: d.id })

  }



  const renderFooter = () => {
    if (metaData.length === 0) {
      return null
    }
    return (
      <View style={styles.footerWrapper}>
        <TouchableOpacity style={styles.footerButton} onPress={openMediaElementView}>
          <Text style={styles.footerLabel}>{i18next.t("label.add_field")}</Text>
        </TouchableOpacity>
      </View>
    )
  }
  return (
    <View style={styles.container}>
      <FlatList data={metaData} renderItem={({ item }) => (<MetaDataElement data={item} handleSelection={editDetails} />)} ListFooterComponent={renderFooter()} ListEmptyComponent={MetaDataFormNote} />
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