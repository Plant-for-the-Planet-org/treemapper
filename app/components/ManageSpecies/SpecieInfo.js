import { useNetInfo } from '@react-native-community/netinfo';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
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
import Icon from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Typography } from '_styles';
import { updateUserSpecie } from '../../actions/species';
import { Camera, Header } from '../Common';
import { updateSpecieData, addLocalImage } from './../../repositories/species';
const IS_ANDROID = Platform.OS === 'android';

const SpecieInfo = ({ route }) => {
  const [isCamera, setIsCamera] = useState(false);
  const [aliases, setAliases] = useState();
  const [localImageUrl, setLocalImageUrl] = useState();
  const [description, setDescription] = useState();
  const specieName = route.params.specieName;
  const specieGuid = route.params.specieGuid;
  const specieId = route.params.specieId;
  const toggleUserSpecies = route.params.toggleUserSpecies;

  const netInfo = useNetInfo();
  const isFocused = useIsFocused();

  useEffect(() => {
    setAliases(route.params.specieAliases);
    setDescription(route.params.specieDescription);
    setLocalImageUrl(route.params.specieImage);
  }, []);

  useEffect(() => {
    if (!isFocused) {
      console.log('screen is not focused');
      onSubmitInputField();
    }
  }, [isFocused]);

  const onSubmitInputField = () => {
    updateSpecieData({
      scientificSpecieGuid: specieGuid,
      aliases,
      description,
      image: localImageUrl,
    });
    if (netInfo.isConnected && netInfo.isInternetReachable) {
      updateUserSpecie({
        scientificSpecieGuid: specieGuid,
        specieId: specieId,
        aliases,
        description,
        image: localImageUrl,
      });
    }
  };

  const handleCamera = (data, fsurl, base64Image) => {
    setIsCamera(!isCamera);
    setLocalImageUrl(`data:image/jpeg;base64,${base64Image}`);
  };

  const checkIcon = () => {
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
                      uri: `${localImageUrl}`,
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
                  style={[styles.InfoCard_text, { padding: 0 }]}
                  placeholder={'Type the Description here'}
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
