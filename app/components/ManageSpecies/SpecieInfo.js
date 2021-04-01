import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Text,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  TextInput,
  Dimensions,
  Platform,
} from 'react-native';
import { Header, Camera } from '../Common';
import { Colors, Typography } from '_styles';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Icon from 'react-native-vector-icons/FontAwesome';
import RNFS from 'react-native-fs';
import {
  addAliasesAndDescription,
  addLocalImage,
  changeIsUpdatedStatus,
} from './../../repositories/species';
import { addAliasesAndDescriptionOnServer, UpdateSpeciesImage } from '../../actions/species';
import { getCdnUrls } from '../../actions/user';
import { ScrollView } from 'react-native-gesture-handler';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useNetInfo } from '@react-native-community/netinfo';
import i18next from '../../languages/languages';

const IS_ANDROID = Platform.OS === 'android';

const SpecieInfo = ({ route }) => {
  const [isCamera, setIsCamera] = useState(false);
  const [aliases, setAliases] = useState();
  const [localImageUrl, setLocalImageUrl] = useState('');
  const [description, setDescription] = useState();
  const [cdnUrl, setCdnUrl] = useState();
  const specieName = route.params.SpecieName;
  const SpecieGuid = route.params.SpecieGuid;
  const SpecieId = route.params.SpecieId;
  let SpecieDescription = route.params.SpecieDescription;
  const toggleUserSpecies = route.params.toggleUserSpecies;

  const navigation = useNavigation();
  const netInfo = useNetInfo();
  const isFocused = useIsFocused();

  useEffect(() => {
    console.log(
      route.params.SpecieDescription,
      route.params.SpecieAliases,
      'route.params.SpecieDescription',
    );
    setAliases(route.params.SpecieAliases);
    setDescription(route.params.SpecieDescription);
    getCdnUrls(i18next.language).then((cdnMedia) => {
      console.log(cdnMedia, 'cdnMedia');
      setCdnUrl(cdnMedia.cache);
    });
    if (route.params.SpecieLocalImage) {
      setLocalImageUrl(route.params.SpecieLocalImage);
    }
    if (route.params.SpecieImage && !route.params.SpecieLocalImage) {
      getCdnUrls(i18next.language).then((cdnMedia) => {
        setCdnUrl(cdnMedia.cache);
        RNFS.downloadFile({
          fromUrl: `${cdnMedia.cache}/species/default/${route.params.SpecieImage}`,
          toFile: `${RNFS.DocumentDirectoryPath}/${route.params.SpecieImage}`,
        }).promise.then((r) => {
          console.log(r, 'Done');
          addLocalImage(route.params.SpecieGuid, route.params.SpecieImage).then(() => {
            setLocalImageUrl(route.params.SpecieImage);
          });
        });
      });
    }
  }, []);

  useEffect(() => {
    if (!isFocused) {
      onSubmitInputField();
    }
  }, [isFocused]);

  const InfoCard = () => {
    const [descriptionText, setDescriptionText] = useState('');
    useEffect(() => {
      setDescriptionText(SpecieDescription);
    }, []);
    return (
      <View style={{ flex: 1, flexDirection: 'column' }}>
        <Text style={styles.InfoCard_heading}>Specie Name</Text>
        <Text style={styles.InfoCard_text}>{specieName}</Text>
        <Text style={styles.InfoCard_heading}>Description</Text>
        <TextInput
          style={styles.InfoCard_text}
          placeholder={'Type the Description here'}
          value={descriptionText}
          onChangeText={(text) => {
            setDescriptionText(text);
            setDescription(text);
          }}
          onSubmitEditing={() => onSubmitInputField(descriptionText)}
        />
      </View>
    );
  };
  const onSubmitInputField = () => {
    console.log(aliases, description, 'onSubmitInputField');
    addAliasesAndDescription({ scientificSpecieGuid: SpecieGuid, aliases, description });
    if (netInfo.isConnected && netInfo.isInternetReachable) {
      addAliasesAndDescriptionOnServer({
        scientificSpecieGuid: SpecieGuid,
        specieId: SpecieId,
        aliases,
        description,
      });
    }
  };

  const handleCamera = (data, fsurl) => {
    setIsCamera(!isCamera);
    console.log(fsurl, 'fsurl');
    setLocalImageUrl(fsurl);
    addLocalImage(SpecieGuid, fsurl);
    UpdateSpeciesImage(data, SpecieId, SpecieGuid)
      .then(() => {
        console.log('UpdateSpeciesImage Done');
      })
      .catch((err) => {
        console.log(err, 'UpdateSpeciesImage Error');
      });
  };

  const checkIcon = () => {
    const [isUserSpecies, setIsUserSpecies] = useState(true);
    return (
      <TouchableOpacity
        onPress={() => {
          toggleUserSpecies(SpecieGuid);
          setIsUserSpecies(!isUserSpecies);
        }}>
        {isUserSpecies ? (
          <Icon name={'check-circle'} size={30} style={{ color: Colors.PRIMARY }} />
        ) : (
          <Icon name={'check-circle'} size={30} style={{ color: Colors.GRAY_MEDIUM }} />
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
            TitleRightComponent={checkIcon}
            setHeadingText={setAliases}
            onSubmitInputField={onSubmitInputField}
          />
          <ScrollView showsVerticalScrollIndicator={false}>
            <KeyboardAvoidingView behavior={Platform.OS == 'ios' ? 'padding' : 'height'}>
              {!localImageUrl ? (
                <TouchableOpacity
                  style={styles.image_container}
                  onPress={() => setIsCamera(!isCamera)}>
                  <View>
                    <Ionicons
                      name={'md-cloud-upload-outline'}
                      style={styles.uploadIcon}
                      size={80}
                      color={Colors.GRAY_LIGHTEST}
                    />
                    <Text style={styles.add_image}>Add Image</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                // <Image
                //   source={{
                //     uri: `https://bucketeer-894cef84-0684-47b5-a5e7-917b8655836a.s3.eu-west-1.amazonaws.com/development/media/cache/species/default/${SpecieImage}`,
                //   }}
                //   resizeMode={'contain'}
                //   style={{
                //     // flex: 1,
                //     flexDirection: 'row',
                //     height: 200,
                //     width: 230,
                //     // marginHorizontal: 25,
                //     marginTop: 25,
                //     transform: [{ rotate: '90deg' }],
                //     borderRadius: 5,
                //     alignSelf: 'center',
                //   }}
                // />
                <TouchableOpacity onPress={() => setIsCamera(!isCamera)}>
                  <Image
                    source={{
                      uri: IS_ANDROID
                        ? `file://${RNFS.DocumentDirectoryPath}/${localImageUrl}`
                        : `${RNFS.DocumentDirectoryPath}/${localImageUrl}`,
                    }}
                    style={{
                      marginTop: 25,
                      borderRadius: 13,
                      width: '100%',
                      height: Dimensions.get('window').height * 0.3,
                      // transform: [{ rotate: '90deg' }],
                    }}
                  />
                </TouchableOpacity>
              )}
              {/* <InfoCard /> */}
              <View style={{ flex: 1, flexDirection: 'column' }}>
                <Text style={styles.InfoCard_heading}>Specie Name</Text>
                <Text style={styles.InfoCard_text}>{specieName}</Text>
                <Text style={styles.InfoCard_heading}>Description</Text>
                <TextInput
                  style={styles.InfoCard_text}
                  placeholder={'Type the Description here'}
                  value={description}
                  onChangeText={(text) => {
                    // setDescriptionText(text);
                    setDescription(text);
                  }}
                  onSubmitEditing={() => onSubmitInputField()}
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
    // paddingTop: 20,
    backgroundColor: Colors.WHITE,
  },
  bgImage: {
    margin: 10,
    width: '90%',
    height: '30%',
    borderRadius: 10,
  },
  image_container: {
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
  add_image: {
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    fontSize: Typography.FONT_SIZE_16,
    color: Colors.PRIMARY,
  },
  InfoCard_heading: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_12,
    paddingTop: 25,
  },
  InfoCard_text: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_18,
    paddingTop: 5,
  },
  InfoCard_heading_editable: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_12,
    paddingTop: 25,
  },
  cont: {
    flex: 1,
  },
  bgWhite: {
    backgroundColor: Colors.WHITE,
  },
  externalInputContainer: {
    flexDirection: 'row',
    height: 65,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.WHITE,
    paddingHorizontal: 25,
    borderTopWidth: 0.5,
    borderColor: Colors.TEXT_COLOR,
  },
  labelModal: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_18,
    lineHeight: Typography.LINE_HEIGHT_30,
    color: Colors.TEXT_COLOR,
    marginRight: 10,
  },
  value: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_20,
    color: Colors.TEXT_COLOR,
    fontWeight: Typography.FONT_WEIGHT_MEDIUM,
    flex: 1,
    paddingVertical: 10,
  },
});

export default SpecieInfo;
