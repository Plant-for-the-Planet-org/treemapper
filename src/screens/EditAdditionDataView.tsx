import { SafeAreaView, StyleSheet } from 'react-native'
import React, { useEffect, useState } from 'react'
import Header from 'src/components/common/Header'
import { Colors } from 'src/utils/constants'
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { useRealm } from '@realm/react'
import { InterventionData } from 'src/types/interface/slice.interface'
import { RealmSchema } from 'src/types/enum/db.enum'
import MainFormSection from 'src/components/formBuilder/MainFormSection'
import { FormElement } from 'src/types/interface/form.interface'
import useInterventionManagement from 'src/hooks/realm/useInterventionManagement'
import { StackNavigationProp } from '@react-navigation/stack'


const EditAdditionData = () => {
    const [formElements, setFormElements] = useState<FormElement[]>([])
    const route = useRoute<RouteProp<RootStackParamList, 'EditAdditionData'>>()
    const InterventoinID = route.params && route.params.interventionID ? route.params.interventionID : ""
    const realm = useRealm()
    const { updateEditAdditionalData } = useInterventionManagement()
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
    useEffect(() => {
        setupForm()
    }, [])

    const handleEdit = async (elements: FormElement[]) => {
        const formData = []
        const additionalData = []
        elements.forEach(el => {
            if (el.isFormData) {
                formData.push(el)
            } else {
                additionalData.push(el)
            }
        })
        await updateEditAdditionalData(InterventoinID, formData, additionalData)
        navigation.goBack()
    }

    const setupForm = () => {
        const intervention = realm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, InterventoinID);
        if (intervention) {
            const formData = intervention.form_data.map(el => {
                return { ...el, isFormData: true }
            })
            const additionalData = intervention.additional_data.map(el => {
                return { ...el, isFormData: false }
            })
            const allElements = [...formData, ...additionalData]
            setFormElements(allElements)
        }
    }


    return (
        <SafeAreaView style={styles.container}>
            <Header label='Edit Data' />
            {formElements.length > 0 && <MainFormSection formData={{ elements: formElements }} interventionID={InterventoinID} isEditForm={handleEdit} />}
        </SafeAreaView>
    )

}

export default EditAdditionData

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.WHITE
    },
    wrapper: {
        flex: 1
    }
})


