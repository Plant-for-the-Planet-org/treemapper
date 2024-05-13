import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  FlatList,
  Dimensions
} from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import Header from 'src/components/common/Header'
import MainFormSection from 'src/components/formBuilder/MainFormSection'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, Typography } from 'src/utils/constants'
import { useRealm } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { IAdditonalDetailsForm } from 'src/types/interface/app.interface'
// import { useSelector } from 'react-redux'
// import { RootState } from 'src/store'
import { FormElement } from 'src/types/interface/form.interface'

const width = Dimensions.get('screen').width



const LocalForm = () => {
  const [formPages, setFormPages] = useState<IAdditonalDetailsForm[]>([])
  // const formFlowData = useSelector((state: RootState) => state.formFlowState)
  // const [data, setData] = useState<FormElement[]>()
  const realm = useRealm()
  const flatlistRef = useRef<FlatList>(null)
  useEffect(() => {
    getDetails()
  }, [])

  const getDetails = () => {
    const data = realm.objects(RealmSchema.AdditonalDetailsForm);
    if (data) {
      setFormPages(JSON.parse(JSON.stringify(data)))
    }
  }


  const handleCompletion = (d: FormElement[]) => {
    flatlistRef.current.scrollToIndex({ index: 1 })
    console.log("ASKLJc", d)
  }

  const renderPages = (data: IAdditonalDetailsForm, i: number) => {
    return (
      <View style={styles.pageWrapper}>
        <Text style={styles.pageLabel}>{data.title || `Page ${i + 1}`}</Text>
        <MainFormSection formData={data} completeLocalForm={handleCompletion} />
      </View>
    )
  }



  return (
    <SafeAreaView style={styles.container}>
      <Header label={"Additional Form"} />
      <ScrollView contentContainerStyle={styles.container}>
        <FlatList
          snapToAlignment='center'
          pagingEnabled
          ref={flatlistRef}
          scrollEnabled={false}
          data={formPages} renderItem={({ item, index }) => renderPages(item, index)} horizontal showsHorizontalScrollIndicator={false} />
      </ScrollView>
    </SafeAreaView>
  )
}

export default LocalForm

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE
  },
  wrapper: {
    flex: 1,
    flexDirection: 'row'
  },
  pageWrapper: {
    flex: 1,
    width,
    height: '100%'
  },
  pageLabel: {
    fontSize: 22,
    fontFamily: Typography.FONT_FAMILY_BOLD,
    color: Colors.TEXT_COLOR,
    marginLeft: 20
  }
})
