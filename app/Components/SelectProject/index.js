import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { Header, LargeButton, PrimaryButton } from '../Common';
import { SafeAreaView } from 'react-native';
import { Colors, Typography } from '_styles';


const SelectProject = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Header headingText={'Select Project'} subHeadingText={'Trees you register can be associated to a specific project'} />
      <ScrollView>
        <LargeButton heading={'Continue without a Project'} subHeading={'Trees wont be associated with a project.'} active={false} />
        <LargeButton heading={'Yucatan Reforestation'} subHeading={'Mexico'} active />
        <LargeButton heading={'Add new project'} subHeading={'Add projects to showcase your past progress or to receive donations to plant more'} active={false} />
      </ScrollView>
      <PrimaryButton btnText={'Continue'} />
    </SafeAreaView>
  );
};
export default SelectProject;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: 25
  },
  addSpecies: {
    color: Colors.ALERT,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_18,
    lineHeight: Typography.LINE_HEIGHT_30,
  }
});