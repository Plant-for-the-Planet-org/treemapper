import React from 'react';
import {StyleSheet, ScrollView} from 'react-native';
import {Header, LargeButton, PrimaryButton} from '../Common';
import {SafeAreaView} from 'react-native';
import {Colors, Typography} from '_styles';

const TPOQuestion = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Header
        headingText={'Register Trees'}
        subHeadingText={
          'Are these trees planted by donation from Plant-for-the-Planet App?'
        }
      />
      <ScrollView>
        <LargeButton
          heading={'Yes'}
          subHeading={
            'This registration will notify donors, and does not increase the tree count.'
          }
          active={false}
        />
        <LargeButton
          heading={'No'}
          subHeading={
            'Please select this for trees you’ve planted from external donations.'
          }
          active={false}
        />
      </ScrollView>
      <PrimaryButton btnText={'Continue'} />
    </SafeAreaView>
  );
};
export default TPOQuestion;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: 25,
  },
  addSpecies: {
    color: Colors.ALERT,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_18,
    lineHeight: Typography.LINE_HEIGHT_30,
  },
});
