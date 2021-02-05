import React from 'react';
import { View, StyleSheet, Image, SafeAreaView } from 'react-native';
import { Header } from '../Common';
import { Colors } from '_styles';
import { add_image } from '../../assets';

const SpecieInfo = ({ route }) => {
  const specieName = route.params.SpecieName;
  return (
    <SafeAreaView style={styles.mainContainer}>
      <View style={styles.container}>
        <Header headingText={specieName} />
        <View style={styles.scrollViewContainer}>
          <Image source={add_image} style={styles.bgImage} />
        </View>
      </View>
    </SafeAreaView>
  );
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
  scrollViewContainer: {
    flex: 1,
    marginTop: 0,
  },
});

export default SpecieInfo;
