import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, Text, Image } from 'react-native';
import { Header, Camera } from '../Common';
import { Colors, Typography } from '_styles';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { UpdateSpeciesImage } from './../../utils/specieImageUpload';

const SpecieInfo = ({ route }) => {
  const [isCamera, setIsCamera] = useState(false);
  const [imagePath, setImagePath] = useState();

  const specieName = route.params.SpecieName;
  const SpecieGuid = route.params.SpecieGuid;
  const SpecieId = route.params.SpecieId;
  const SpecieAliases = route.params.SpecieAliases;
  const SpecieDescription = route.params.SpecieDescription;
  const SpecieImage = route.params.SpecieImage;

  console.log(specieName, SpecieGuid, SpecieId, 'specieName');

  const InfoCard = (heading, text) => {
    return (
      <View>
        <Text style={styles.InfoCard_heading}>Specie Name</Text>
        <Text style={styles.InfoCard_text}>{specieName}</Text>
        <Text style={styles.InfoCard_heading}>Aliases</Text>
        <Text style={styles.InfoCard_text}>{SpecieAliases}</Text>
        <Text style={styles.InfoCard_heading}>Description</Text>
        <Text style={styles.InfoCard_text}>{SpecieDescription}</Text>
      </View>
    );
  };

  const handleCamera = (data) => {
    setIsCamera(!isCamera);
    setImagePath(data.uri);
    console.log(data.uri, 'data.uri');
    UpdateSpeciesImage(data, SpecieId)
      .then(() => {
        console.log('UpdateSpeciesImage Done');
      })
      .catch((err) => {
        console.log(err, 'UpdateSpeciesImage Error');
      });
  };
  if (isCamera) {
    return <Camera handleCamera={handleCamera} />;
  } else {
    return (
      <SafeAreaView style={styles.mainContainer}>
        <View style={styles.container}>
          <Header headingText={specieName} />
          <TouchableOpacity style={styles.image_container} onPress={() => setIsCamera(!isCamera)}>
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
          {/* <Image
            source={{ uri: `${APIConfig.protocol}://${Config.SPECIE_IMAGE_CDN}${item.image}` }}
            resizeMode={'contain'}
            // style={{ flex: 1, width: 200, height: 100, borderRadius: 10 }}
          /> */}
          <InfoCard />
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
});

export default SpecieInfo;
