import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  FlatList,
  Dimensions,
  ActivityIndicator
} from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import Header from 'src/components/common/Header'
import MainFormSection from 'src/components/formBuilder/MainFormSection'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, Typography } from 'src/utils/constants'
import { useRealm } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { IAdditonalDetailsForm } from 'src/types/interface/app.interface'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { FormElement } from 'src/types/interface/form.interface'
import { useDispatch, useSelector } from 'react-redux'
import { updateAdditionalData } from 'src/store/slice/registerFormSlice'
import { RootState } from 'src/store'
import useInterventionManagement from 'src/hooks/realm/useInterventionManagement'
import { v4 as uuid } from 'uuid'

const width = Dimensions.get('screen').width



const LocalForm = () => {
  const [loading, setLoading] = useState(true)
  const [formPages, setFormPages] = useState<IAdditonalDetailsForm[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const formFlowData = useSelector((state: RootState) => state.formFlowState)
  const [finalData, setFinalData] = useState<Array<{ page: string, elements: FormElement[] }>>([])
  const realm = useRealm()
  const flatlistRef = useRef<FlatList>(null)
  const { updateLocalFormDetailsIntervention } = useInterventionManagement()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const dispatch = useDispatch()
  useEffect(() => {
    getDetails()
  }, [])

  const getDetails = async () => {
    const data = realm.objects(RealmSchema.AdditonalDetailsForm);
    if (!checkForNonEmptyForm(data)) {
      await updateLocalFormDetailsIntervention(formFlowData.form_id, [])
      navigation.replace("DynamicForm")
      return
    }
    setFormPages(JSON.parse(JSON.stringify(data)))
    setLoading(false)
  }


  const checkForNonEmptyForm = (data: any) => {
    data.forEach(el => {
      if (el.type === 'INPUT' || el.type === 'DROPDOWN' || el.type === 'YES_NO' || el.type === 'SWITCH') {
        return true
      }
    })
    return false
  }


  const handleCompletion = async (data: FormElement[], id: string) => {
    const filterData = finalData.filter(el => el.page !== id);
    setFinalData([...filterData, { elements: data, page: id }])
    if (formPages.length > currentPage + 1) {
      flatlistRef.current.scrollToIndex({ index: currentPage + 1 });
      setCurrentPage(currentPage + 1)
    } else {
      updateFinalData([...filterData, { elements: data, page: id }])
    }
  }

  const handleBack = () => {
    if (currentPage < 1) {
      navigation.goBack()
    } else {
      flatlistRef.current.scrollToIndex({ index: currentPage - 1 });
      setCurrentPage(currentPage - 1)
    }
  }

  const updateFinalData = async (d: any) => {
    const allData = []
    d.forEach(el => {
      el.elements.forEach(element => {
        allData.push(element)
      });
    });
    const updatedData = allData.map(el => {
      return ({ ...el, element_id: uuid() })
    })
    dispatch(updateAdditionalData(updatedData))
    await updateLocalFormDetailsIntervention(formFlowData.form_id, updatedData)
    navigation.replace("DynamicForm")
  }


  const renderPages = (data: IAdditonalDetailsForm, i: number) => {
    return (
      <View style={styles.pageWrapper}>
        <Text style={styles.pageLabel}>{data.title || `Page ${i + 1}`}</Text>
        <MainFormSection formData={data} completeLocalForm={handleCompletion} page={data.form_id} interventionID={formFlowData.form_id} />
      </View>
    )
  }

  if (loading) {
    return <View style={styles.backdrop}>
      <ActivityIndicator size={'large'} color={Colors.NEW_PRIMARY} />
    </View>
  }


  return (
    <SafeAreaView style={styles.container}>
      <Header label={"Additional Form"} backFunc={handleBack} />
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
  },
  backdrop: {
    width: '100%',
    height: "100%",
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  }
})
