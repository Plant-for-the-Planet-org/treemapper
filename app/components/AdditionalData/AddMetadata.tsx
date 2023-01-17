import i18next from 'i18next';
import React, { useContext, useEffect, useState } from 'react';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import KeyValueForm from './KeyValueForm';
import { accessTypes } from '../../utils/additionalData/constants';
import { AdditionalDataContext } from '../../reducers/additionalData';
import { addOrUpdateMetadataField } from '../../repositories/additionalData';

interface IAddMetadataFormProps {
  fieldKey?: string;
  fieldValue?: string;
  metadataId?: string;
  metadataOrder: number;
  isPublic?: boolean;
}

type RootStackParamList = {
  AddMetadata: IAddMetadataFormProps;
};

type AddMetadataFormScreenRouteProp = RouteProp<RootStackParamList, 'AddMetadata'>;

const AddMetadata = () => {
  const [fieldKey, setFieldKey] = useState<string>('');
  const [fieldValue, setFieldValue] = useState<string>('');
  const [metadataId, setMetadataId] = useState<string>('');
  const [isPublic, setIsPublic] = useState<boolean>(false);
  const [metadataOrder, setMetadataOrder] = useState<number | null>();

  const navigation = useNavigation();
  const route: AddMetadataFormScreenRouteProp = useRoute();

  const { addMetadataInState } = useContext(AdditionalDataContext);

  useEffect(() => {
    setFieldKey(route.params?.fieldKey || '');
    setFieldValue(route.params?.fieldValue || '');
    setMetadataOrder(route.params?.metadataOrder ?? null);
    setMetadataId(route.params?.metadataId || '');
    setIsPublic(route.params?.isPublic || false);
  }, [route.params]);

  const handleOnSubmit = (data: any) => {
    const fieldData = {
      id: metadataId,
      key: data.key,
      value: data.value,
      order: metadataOrder,
      accessType: data.isPublic ? accessTypes.PUBLIC : accessTypes.PRIVATE,
    };
    addOrUpdateMetadataField(fieldData).then((success: boolean) => {
      if (success) {
        addMetadataInState();
        navigation.goBack();
      }
    });
  };

  return (
    <KeyValueForm
      fieldKey={fieldKey}
      fieldValue={fieldValue}
      isPublic={isPublic}
      headingText={i18next.t('label.add_metadata')}
      showPublicToggle={true}
      handleOnSubmit={handleOnSubmit}
    />
  );
};

export default AddMetadata;
