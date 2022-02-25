import { nanoid } from 'nanoid';
import React, { createContext, useState } from 'react';
import 'react-native-get-random-values';
import {
  addForm,
  addUpdateElement,
  deleteForm,
  deleteFormElement,
  getForms,
  getMetadata,
  updateForm,
  updateMetadata,
} from '../repositories/additionalData';
import {
  filterFormByTreeAndRegistrationType,
  sortByField,
} from '../utils/additionalData/functions';

// Creates the context object for AdditionalData. Used by component to get the state and functions
export const AdditionalDataContext = createContext<any>(null);

// Create a provider for components to consume and subscribe to changes
export const AdditionalDataContextProvider = ({ children }: { children: JSX.Element }) => {
  const [forms, setForms] = useState<any>([]);
  const [filteredForm, setFilteredForm] = useState<any>([]);
  const [formLoading, setFormLoading] = useState<boolean>(false);
  const [metadata, setMetadata] = useState<any>([]);
  const [metadataLoading, setMetadataLoading] = useState<boolean>(false);

  const [treeType, setTreeType] = useState<string>('all');
  const [registrationType, setRegistrationType] = useState<string>('all');

  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);

  const addMetadataInState = () => {
    setMetadataLoading(true);
    getMetadata().then((data: any) => {
      if (data) {
        setMetadata(sortByField('order', data));
      }
      setMetadataLoading(false);
    });
  };

  const updateMetadataOrder = async (updatedMetadata: any) => {
    await updateMetadata(updatedMetadata).then((success: boolean) => {
      if (success) {
        addMetadataInState();
      }
    });
  };

  const updateStateFormData = (formsData: any) => {
    formsData = filterFormByTreeAndRegistrationType(formsData, treeType, registrationType);
    setFilteredForm(formsData);
  };

  const addFormsToState = () => {
    setFormLoading(true);
    getForms().then((formsData: any) => {
      if (formsData) {
        formsData = sortByField('order', formsData);
        setForms(formsData);
        updateStateFormData(formsData);
      }
      setFormLoading(false);
    });
  };

  const addNewForm = ({ order = null, title = '', description = '' }: any) => {
    order = order !== null ? order : Array.isArray(forms) ? forms.length + 1 : 1;

    const formData: any = {
      id: nanoid(),
      order,
      title,
      description,
    };

    let updatedForms = forms.map((form: any) => {
      if (form.order >= order) {
        form.order += 1;
      }
      return form;
    });

    updatedForms = [
      ...updatedForms,
      {
        ...formData,
        elements: [],
      },
    ];

    updatedForms = sortByField('order', updatedForms);
    setForms(updatedForms);
    updateStateFormData(updatedForms);

    addForm(formData);
  };

  const modifyElement = (elementData: any) => {
    const updatedForms = forms.map((form: any) => {
      if (elementData.formId === form.id) {
        const { id: subElementId, type: inputType, ...typeProps } = elementData.typeProperties;
        delete typeProps.parentId;
        const element = {
          ...elementData.elementProperties,
          ...typeProps,
          subElementId,
          inputType,
        };

        if (elementData.isModification) {
          form.elements[elementData.elementIndex] = element;
        } else {
          form.elements.push(element);
        }
      }
      return form;
    });
    setForms(updatedForms);
    updateStateFormData(updatedForms);

    addUpdateElement(elementData);
  };

  const deleteElementFromForm = (formId: string, elementIndexToDelete: number) => {
    const updatedForms = forms.map((form: any) => {
      if (formId === form.id) {
        form.elements.splice(elementIndexToDelete, 1);
      }
      return form;
    });
    setForms(updatedForms);
    updateStateFormData(updatedForms);

    deleteFormElement(formId, elementIndexToDelete);
  };

  const deleteFormById = (formId: string) => {
    let indexToDelete = null;
    for (const i in forms) {
      if (formId === forms[i].id) {
        indexToDelete = Number(i);
        break;
      }
    }
    const updatedForms: any = [...forms];
    updatedForms.splice(indexToDelete, 1);

    setForms(updatedForms);
    updateStateFormData(updatedForms);

    deleteForm(formId);
  };

  const updateFormData = ({ elements = null, pageTitle = '', formId }: any) => {
    const updatedForms = forms.map((form: any) => {
      if (formId === form.id && elements) {
        form.elements = elements;
      } else if (formId === form.id && pageTitle) {
        form.title = pageTitle;
      }
      return form;
    });
    setForms(updatedForms);
    updateStateFormData(updatedForms);

    updateForm({ elements, title: pageTitle, id: formId });
  };

  // returns a provider used by component to access the state and dispatch function of inventory
  return (
    <AdditionalDataContext.Provider
      value={{
        forms,
        formLoading,
        filteredForm,
        addFormsToState,
        addNewForm,
        updateStateFormData,
        treeType,
        setTreeType,
        registrationType,
        setRegistrationType,
        modifyElement,
        isInitialLoading,
        setIsInitialLoading,
        deleteElementFromForm,
        metadata,
        metadataLoading,
        addMetadataInState,
        updateMetadataOrder,
        deleteFormById,
        updateFormData,
        setFormLoading,
      }}>
      {children}
    </AdditionalDataContext.Provider>
  );
};
