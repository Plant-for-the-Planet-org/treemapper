import { useRealm, Realm } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { IAdditionalDetailsForm } from 'src/types/interface/app.interface'
import { FormElement } from 'src/types/interface/form.interface'

const useAdditionalForm = () => {
  const realm = useRealm()

  const addNewForm = async (
    form_id: string,
    order: number
  ): Promise<boolean> => {
    try {
      realm.write(() => {
        realm.create(
          RealmSchema.AdditionalDetailsForm,
          { form_id, order },
          Realm.UpdateMode.All,
        )
      })
      return true
    } catch (error) {
      console.error('Error during write:', error)
      return false
    }
  }

  const addNewElementInForm = async (
    elementDetails: FormElement,
    form_id: string
  ): Promise<boolean> => {
    try {
      realm.write(() => {
        const formDetails = realm.objectForPrimaryKey<IAdditionalDetailsForm>(RealmSchema.AdditionalDetailsForm, form_id)
        formDetails.elements = [...formDetails.elements, elementDetails]
      })
      return Promise.resolve(true)
    } catch (error) {
      console.error('Error during write:', error)
      return false
    }
  }

  const deleteElementInForm = async (
    element_id: string,
    form_id: string
  ): Promise<boolean> => {
    try {
      realm.write(() => {
        const formDetails = realm.objectForPrimaryKey<IAdditionalDetailsForm>(RealmSchema.AdditionalDetailsForm, form_id)
        const filterData = formDetails.elements.filter(el => el.element_id !== element_id)
        formDetails.elements = filterData
        const myData = filterData.filter(el => el.element_id === element_id)
        realm.delete(myData)
      })
      return Promise.resolve(true)
    } catch (error) {
      console.error('Error during write:', error)
      return false
    }
  }


  const updateFormDetails = async (
    updatedDetails: IAdditionalDetailsForm,
    form_id: string
  ): Promise<boolean> => {
    try {
      realm.write(() => {
        const formDetails = realm.objectForPrimaryKey<IAdditionalDetailsForm>(RealmSchema.AdditionalDetailsForm, form_id)
        formDetails.elements = updatedDetails.elements
        formDetails.description = updatedDetails.description
        formDetails.title = updatedDetails.title
        formDetails.order = updatedDetails.order
      })
      return Promise.resolve(true)
    } catch (error) {
      console.error('Error during write:', error)
      return false
    }
  }

  const bulkFormAddition = async (
    data: IAdditionalDetailsForm[]
  ): Promise<boolean> => {
    try {
      realm.write(() => {
        data.forEach(el => {
          realm.create(
            RealmSchema.AdditionalDetailsForm,
            el,
            Realm.UpdateMode.All,
          )
        })
      })
      return Promise.resolve(true)
    } catch (error) {
      console.error('Error during write:', error)
      return false
    }
  }

  const updateElementInForm = async (
    element_id: string,
    form_id: string,
    data: any
  ): Promise<boolean> => {
    try {
      realm.write(() => {
        const formDetails = realm.objectForPrimaryKey<IAdditionalDetailsForm>(RealmSchema.AdditionalDetailsForm, form_id)
        const myData = formDetails.elements.filter(el => el.element_id === element_id);
        myData[0].index = data.index
        myData[0].key = data.key
        myData[0].label = data.label
        myData[0].placeholder = data.label
        myData[0].visibility = data.visibility
        myData[0].data_type = data.data_type
        myData[0].keyboard_type = data.keyboard_type
        myData[0].required = data.required
        myData[0].dropDownData = data.dropDownData

      })
      return Promise.resolve(true)
    } catch (error) {
      console.error('Error during write:', error)
      return false
    }
  }


  const deleteForm = async (id: string): Promise<boolean> => {
    try {
      realm.write(() => {
        const form = realm.objectForPrimaryKey<IAdditionalDetailsForm>(RealmSchema.AdditionalDetailsForm, id);
        realm.delete(form);
      });
      return true    } catch (error) {
      console.error('Error during update:', error);
      return false
    }
  };

  const deleteAllAdditionalData = async (
  ): Promise<boolean> => {
    try {
      realm.write(() => {
        const data = realm.objects(RealmSchema.AdditionalDetailsForm);
        realm.delete(data)
      })
      return Promise.resolve(true)
    } catch (error) {
      console.error('Error during write:', error)
      return false
    }
  }


  return { addNewForm, addNewElementInForm, deleteElementInForm, deleteForm, updateFormDetails, updateElementInForm, bulkFormAddition, deleteAllAdditionalData }
}

export default useAdditionalForm;
