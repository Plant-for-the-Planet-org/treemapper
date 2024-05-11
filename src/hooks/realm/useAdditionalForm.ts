import { useRealm, Realm } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { IAdditonalDetailsForm, Metadata } from 'src/types/interface/app.interface'
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
          RealmSchema.AdditonalDetailsForm,
          { form_id, order },
          Realm.UpdateMode.All,
        )
      })
      return Promise.resolve(true)
    } catch (error) {
      console.error('Error during write:', error)
      return Promise.reject(false)
    }
  }

  const addNewElementInForm = async (
    elementDetails: FormElement,
    form_id: string
  ): Promise<boolean> => {
    try {
      realm.write(() => {
        const formDetails = realm.objectForPrimaryKey<IAdditonalDetailsForm>(RealmSchema.AdditonalDetailsForm, form_id)
        console.log("Kdcscd", elementDetails)
        console.log("Kdcscd form_id", form_id)
        console.log("LKdcj", formDetails)
        formDetails.elements = [...formDetails.elements, elementDetails]
      })
      return Promise.resolve(true)
    } catch (error) {
      console.error('Error during write:', error)
      return Promise.reject(false)
    }
  }

  const updateElementInForm = async (
    elements: FormElement[],
    form_id: string
  ): Promise<boolean> => {
    try {
      realm.write(() => {
        const formDetails = realm.objectForPrimaryKey<IAdditonalDetailsForm>(RealmSchema.AdditonalDetailsForm, form_id)
        formDetails.elements = [...elements]
      })
      return Promise.resolve(true)
    } catch (error) {
      console.error('Error during write:', error)
      return Promise.reject(false)
    }
  }


  const updateFormDetails = async (
    updatedDetails: IAdditonalDetailsForm,
    form_id: string
  ): Promise<boolean> => {
    try {
      realm.write(() => {
        const formDetails = realm.objectForPrimaryKey<IAdditonalDetailsForm>(RealmSchema.AdditonalDetailsForm, form_id)
        formDetails.elements = updatedDetails.elements
        formDetails.description = updatedDetails.description
        formDetails.title = updatedDetails.title
        formDetails.order = updatedDetails.order
      })
      return Promise.resolve(true)
    } catch (error) {
      console.error('Error during write:', error)
      return Promise.reject(false)
    }
  }




  const deleteForm = async (id: string): Promise<boolean> => {
    try {
      realm.write(() => {
        const intervention = realm.objectForPrimaryKey<Metadata>(RealmSchema.AdditonalDetailsForm, id);
        realm.delete(intervention);
      });
      return Promise.resolve(true);
    } catch (error) {
      console.error('Error during update:', error);
      return Promise.reject(false);
    }
  };



  return { addNewForm, addNewElementInForm, updateElementInForm, deleteForm, updateFormDetails }
}

export default useAdditionalForm;
