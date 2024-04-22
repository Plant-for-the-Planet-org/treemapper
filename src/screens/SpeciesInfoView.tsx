import { StyleSheet, KeyboardAvoidingView, ScrollView, Platform } from 'react-native'
import React from 'react'
import Header from 'src/components/common/Header'
import { IScientificSpecies } from 'src/types/interface/app.interface'
import SpecieInfoImageSection from 'src/components/species/SpecieInfoImageSection'
import SpecieInfoDetailSection from 'src/components/species/SpecieInfoDetailSection'
import SpeciesInfoHeader from 'src/components/species/SpeciesInfoHeader'
import { useRoute, RouteProp } from '@react-navigation/native'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { useObject } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors } from 'src/utils/constants'

const SpeciesInfoView = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'SpeciesInfo'>>()
  const specieData = useObject<IScientificSpecies>(
    RealmSchema.ScientificSpecies,
    route.params.guid,
  )

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS == 'ios' ? 'padding' : 'height'}
      >
        <ScrollView>
          <Header label="" />
          <SpeciesInfoHeader item={specieData} />
          <SpecieInfoImageSection item={specieData} />
          <SpecieInfoDetailSection item={specieData} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

export default SpeciesInfoView

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE
  },
})
