import React, { useEffect } from 'react';
import { Text, Modal, View, StyleSheet, Image } from 'react-native';
import { Header } from '../Common';
import { Colors, Typography } from '_styles';
import { add_image } from '../../assets';

const SpecieInfo = ({route}) => {
  useEffect(() => {

  }, []);
  const specieName = route.params.SpecieName;
  return(
    <Modal> 
      <View style={styles.container}>
        <Header
          headingText={specieName}
        />
        <View style={styles.scrollViewContainer}>
          <Image source={add_image} style={styles.bgImage} />
        </View>
      </View>
            
    </Modal>
        
  );
};

const styles = StyleSheet.create({
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
    borderRadius: 10
  },
  scrollViewContainer: {
    flex: 1,
    marginTop: 0,
  },
});

export default SpecieInfo;