import { useNetInfo } from '@react-native-community/netinfo';
import { useIsFocused } from '@react-navigation/native';
import React, { useContext, useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import FAIcon from 'react-native-vector-icons/FontAwesome';
import FA5Icon from 'react-native-vector-icons/FontAwesome5';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Typography } from '_styles';
import { clearSpecie, updateUserSpecie } from '../../actions/species';
import { SpeciesContext } from '../../reducers/species';
import { getUserToken } from '../../repositories/user';
import { Camera, Header } from '../Common';
import { updateSpecieData } from './../../repositories/species';
import i18next from 'i18next';

const SpecieInfo = ({ route }) => {
  const [isCamera, setIsCamera] = useState(false);
  const [aliases, setAliases] = useState('');
  const [image, setImage] = useState('');
  const [description, setDescription] = useState('');

  const [specieName, setSpecieName] = useState('');
  const [specieGuid, setSpecieGuid] = useState('');
  const [specieId, setSpecieId] = useState('');
  const toggleUserSpecies = route.params.toggleUserSpecies;

  const { state: specieState, dispatch } = useContext(SpeciesContext);

  const netInfo = useNetInfo();
  const isFocused = useIsFocused();

  useEffect(() => {
    if (specieState.specie) {
      const { specie } = specieState;
      setAliases(specie.aliases);
      setDescription(specie.description);
      setImage(specie.image);

      setSpecieName(specie.scientificName);
      setSpecieGuid(specie.guid);
      setSpecieId(specie.specieId);
    }
  }, [specieState.specie]);

  useEffect(() => {
    if (!isFocused) {
      onSubmitInputField();
      clearSpecie()(dispatch);
    }
  }, [isFocused]);

  const onSubmitInputField = () => {
    const isImageChanged = specieState.specie.image !== image;
    const isDescriptionChanged = specieState.specie.description !== description;
    const isAliasesChanged = specieState.specie.aliases !== aliases;
    const shouldUpdateData = isImageChanged || isDescriptionChanged || isAliasesChanged;

    if (shouldUpdateData) {
      updateSpecieData({
        scientificSpecieGuid: specieGuid,
        aliases,
        description,
        image,
      })
        .then(async () => {
          const userToken = await getUserToken();
          if (netInfo.isConnected && netInfo.isInternetReachable && specieId && userToken) {
            updateUserSpecie({
              scientificSpecieGuid: specieGuid,
              specieId: specieId,
              aliases,
              description,
              image: image ? image : null,
            });
          }
        })
        .catch((err) => {
          console.error('something went wrong');
        });
    }
  };

  const handleCamera = ({ base64Image }) => {
    setIsCamera(!isCamera);
    setImage(`data:image/jpeg;base64,${base64Image}`);
  };

  const CheckIcon = () => {
    const [isUserSpecies, setIsUserSpecies] = useState(true);
    return (
      <TouchableOpacity
        onPress={() => {
          toggleUserSpecies(specieGuid);
          setIsUserSpecies(!isUserSpecies);
        }}>
        {isUserSpecies ? (
          <Ionicons
            name={'ios-checkmark-circle-sharp'}
            size={30}
            style={{ color: Colors.PRIMARY }}
          />
        ) : (
          <MaterialCommunityIcons
            name={'checkbox-blank-circle-outline'}
            size={30}
            style={{ color: Colors.GRAY_MEDIUM }}
          />
        )}
      </TouchableOpacity>
    );
  };

  if (isCamera) {
    return <Camera handleCamera={handleCamera} />;
  } else {
    return (
      <SafeAreaView style={styles.mainContainer}>
        <View style={styles.container}>
          <Header
            headingTextInput={aliases}
            TitleRightComponent={CheckIcon}
            setHeadingText={setAliases}
            onSubmitInputField={onSubmitInputField}
          />
          <ScrollView showsVerticalScrollIndicator={false}>
            <KeyboardAvoidingView behavior={Platform.OS == 'ios' ? 'padding' : 'height'}>
              {!image ? (
                <TouchableOpacity
                  style={styles.emptyImageContainer}
                  onPress={() => setIsCamera(true)}>
                  <View>
                    <Ionicons
                      name={'md-cloud-upload-outline'}
                      style={styles.uploadIcon}
                      size={80}
                      color={Colors.GRAY_LIGHTEST}
                    />
                    <Text style={styles.addImage}>Add Image</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <View style={styles.imageContainer}>
                  <Image
                    source={{
                      uri: `${image}`,
                    }}
                    style={{
                      marginTop: 25,
                      borderRadius: 13,
                      width: '100%',
                      height: Dimensions.get('window').height * 0.3,
                      // transform: [{ rotate: '90deg' }],
                    }}
                  />
                  <View style={styles.imageControls}>
                    <TouchableOpacity onPress={() => setIsCamera(true)}>
                      <View style={[styles.iconContainer, { marginRight: 10 }]}>
                        <FA5Icon name={'pen'} size={16} color={Colors.GRAY_LIGHTEST} />
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setImage('')}>
                      <View style={styles.iconContainer}>
                        <FAIcon name={'trash'} size={18} color={Colors.GRAY_LIGHTEST} />
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              {/* <InfoCard /> */}
              <View style={{ flex: 1, flexDirection: 'column' }}>
                <Text style={styles.infoCardHeading}>{i18next.t('label.species_name')}</Text>
                <Text style={styles.infoCardText}>{specieName}</Text>
                <Text style={styles.infoCardHeading}>{i18next.t('label.species_description')}</Text>
                <TextInput
                  style={[styles.infoCardText, { padding: 0 }]}
                  placeholder={i18next.t('label.type_description_here')}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  textAlignVertical="top"
                  maxLength={255}
                  onSubmitEditing={onSubmitInputField}
                />
              </View>
            </KeyboardAvoidingView>
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  container: {
    flex: 1,
    paddingHorizontal: 25,
    backgroundColor: Colors.WHITE,
  },
  emptyImageContainer: {
    marginTop: 25,
    height: 180,
    backgroundColor: Colors.GRAY_LIGHT,
    borderRadius: 6,
    borderColor: Colors.GRAY_LIGHTEST,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImage: {
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    fontSize: Typography.FONT_SIZE_16,
    color: Colors.PRIMARY,
  },
  infoCardHeading: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_12,
    paddingTop: 25,
  },
  infoCardText: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_18,
    paddingTop: 5,
  },
  imageContainer: {
    position: 'relative',
  },
  imageControls: {
    position: 'absolute',
    top: 30,
    right: 10,
    flexDirection: 'row',
  },
  iconContainer: {
    backgroundColor: Colors.WHITE,
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SpecieInfo;
