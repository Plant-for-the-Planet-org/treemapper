import {StyleSheet, View} from 'react-native'
import React from 'react'
import Header from 'src/components/common/Header'
import FreeUpSaceButton from 'src/components/intervention/FreeUpSaceButton'
import InterventionList from 'src/components/intervention/InterventionList'
import {useQuery} from '@realm/react'
import {RealmSchema} from 'src/types/enum/db.enum'
import {InterventionData} from 'src/types/interface/slice.interface'

const InterventionFormView = () => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-expect-error
  const interventionData: InterventionData[] = useQuery<InterventionData[]>(
    RealmSchema.Intervention,
    data => {
      return data
    },
  )
  return (
    <View style={styles.cotnainer}>
      <Header
        label=""
        showBackIcon={false}
        rightComponet={<FreeUpSaceButton />}
      />
      <InterventionList interventionData={interventionData} />
    </View>
  )
}

export default InterventionFormView

const styles = StyleSheet.create({
  cotnainer: {
    flex: 1,
  },
})
