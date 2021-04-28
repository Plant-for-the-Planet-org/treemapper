import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { addForm, getForms } from '../../repositories/additionalData';
import Step from './Step';

interface FormProps {}

export default function Form() {
  const [forms, setForms] = useState<any>([]);

  useEffect(() => {
    getForms().then((formsData: any) => {
      if (formsData) {
        setForms(sortFormByOrder(formsData));
      }
    });
  }, []);

  const sortFormByOrder = (formsData: any) => {
    return formsData.sort((a: any, b: any) => {
      return a.order - b.order;
    });
  };

  const addNewForm = async () => {
    await addForm({ order: Array.isArray(forms) ? forms.length + 1 : 1 });
    getForms().then((formsData: any) => {
      if (formsData) {
        setForms(sortFormByOrder(formsData));
      }
    });
  };

  return (
    <View>
      {Array.isArray(forms) && forms.length > 0 ? (
        forms.map((form: any, index) => <Step index={index + 1} fields={form.fields} />)
      ) : (
        <View>
          <Text>Get Started with forms</Text>
          <TouchableOpacity onPress={() => addNewForm()}>
            <Text> Create Form</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
