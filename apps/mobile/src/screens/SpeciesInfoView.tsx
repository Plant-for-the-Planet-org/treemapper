import { StyleSheet, ScrollView } from 'react-native'
import React, { useEffect } from 'react'
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
import { AvoidSoftInput, AvoidSoftInputView } from 'react-native-avoid-softinput'
import i18next from 'i18next'

const SpeciesInfoView = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'SpeciesInfo'>>()
  const specieData = useObject<IScientificSpecies>(
    RealmSchema.ScientificSpecies,
    route.params.guid,
  )
  useEffect(() => {
    // This should be run when screen gains focus - enable the module where it's needed
    AvoidSoftInput.setShouldMimicIOSBehavior(true);
    return () => {
      // This should be run when screen loses focus - disable the module where it's not needed, to make a cleanup
      AvoidSoftInput.setShouldMimicIOSBehavior(false);
    };
  })

  return (
    <SafeAreaView style={styles.container}>
      <AvoidSoftInputView>
        <ScrollView>
          <Header label={i18next.t("label.back")} />
          <SpeciesInfoHeader item={specieData} />
          <SpecieInfoImageSection item={specieData} />
          <SpecieInfoDetailSection item={specieData} />
        </ScrollView>
      </AvoidSoftInputView>
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
