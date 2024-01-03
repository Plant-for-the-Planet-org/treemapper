import i18next from 'i18next';
import React, { useContext, useState } from 'react';
import { useNavigation } from '@react-navigation/core';
import DraggableFlatList from 'react-native-draggable-flatlist';
import FontAwesome5Icon from 'react-native-vector-icons/FontAwesome5';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AdditionalDataContext } from '../../reducers/additionalData';
import { deleteMetadataField } from '../../repositories/additionalData';
import { Colors, Typography } from '../../styles';
import { marginTop24 } from '../../styles/design';
import { accessTypes } from '../../utils/additionalData/constants';
import { Loader, PrimaryButton } from '../Common';
import AdditionalDataButton from './AdditionalDataButton';
import KeyValueInput from './KeyValueInput';
import { scaleSize } from '../../styles/mixins';

const { width, height } = Dimensions.get('window');

function Metadata(): JSX.Element {
  const [dragging, setDragging] = useState<boolean>(false);

  const {
    metadata,
    updateMetadataOrder,
    metadataLoading: loading,
    addMetadataInState,
  } = useContext(AdditionalDataContext);

  const navigation = useNavigation();

  const onSwipe = (fieldId: string = '') => {
    deleteMetadataField(fieldId).then(success => {
      if (success) {
        addMetadataInState();
      }
    });
  };

  return (
    <>
      {loading ? (
        <Loader
          isLoaderShow={loading}
          loadingText={i18next.t('label.loading_form_editor')}
          isModal={false}
        />
      ) : !metadata || (metadata && metadata.length) === 0 ? (
        <View style={[styles.emptyFormMessageContainer]}>
          <Text style={styles.title}>{i18next.t('label.get_started_metadata')}</Text>
          <Text style={styles.desc}>{i18next.t('label.get_started_metadata_description')}</Text>
          <PrimaryButton
            btnText={i18next.t('label.create_metadata')}
            onPress={() =>
              navigation.navigate('AddMetadata', {
                metadataOrder: metadata.length,
              })
            }
          />
        </View>
      ) : (
        <DraggableFlatList
          style={styles.container}
          data={metadata}
          contentContainerStyle={
            metadata && metadata.length === 0
              ? {
                  justifyContent: 'center',
                  alignItems: 'center',
                }
              : { paddingBottom: 30 }
          }
          renderItem={({ item, drag }: any) => (
            <View style={styles.fieldWrapper} key={`metadata-${item.id}`}>
              <KeyValueInput
                fieldKey={item.key}
                fieldValue={item.value}
                onPress={() =>
                  navigation.navigate('AddMetadata', {
                    metadataOrder: item.order,
                    metadataId: item.id,
                    fieldKey: item.key,
                    fieldValue: item.value,
                    isPublic: item.accessType === accessTypes.PUBLIC,
                  })
                }
              />
              <TouchableOpacity style={styles.deleteIcon} onPress={() => onSwipe(item.id)}>
                <FontAwesome5Icon name={'trash'} size={18} color={Colors.ALERT} />
              </TouchableOpacity>
            </View>
          )}
          dragHitSlop={{ right: -width + 50 + 36 }}
          keyExtractor={(item: any) => `metadata-field-${item.id}`}
          onDragEnd={({ data }) => updateMetadataOrder(data)}
          ListFooterComponent={() => {
            if (metadata.length > 0) {
              return (
                <AdditionalDataButton
                  buttonType="field"
                  handleButtonPress={() =>
                    navigation.navigate('AddMetadata', {
                      metadataOrder: metadata.length,
                    })
                  }
                  style={styles.marginLeft8}
                />
              );
            } else {
              return <></>;
            }
          }}
        />
      )}
    </>
  );
}

export default React.memo(Metadata);

const styles = StyleSheet.create({
  container: {
    paddingRight: 25,
    paddingLeft: 17,
    height,
    width,
  },

  fieldWrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    flex: 1,
    ...marginTop24,
  },
  emptyFormMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 25,
  },
  title: {
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: Typography.FONT_SIZE_22,
    color: Colors.TEXT_COLOR,
  },
  marginLeft8: {
    marginLeft: 8,
  },
  desc: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_14,
    color: Colors.TEXT_COLOR,
    textAlign: 'left',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 40,
  },
  deleteIcon: {
    position: 'absolute',
    right: -10,
    top: -scaleSize(15),
    backgroundColor: Colors.WHITE,
    padding: 8,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: Colors.GRAY_LIGHT,
  },
});
