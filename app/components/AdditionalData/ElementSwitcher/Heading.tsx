import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Typography } from '../../../styles';

interface Props {
  text: string;
}

const Heading = ({ text }: Props) => {
  return <Text style={styles.heading}>{text}</Text>;
};

export default Heading;

const styles = StyleSheet.create({
  heading: {
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: Typography.FONT_SIZE_22,
    color: Colors.TEXT_COLOR,
    marginTop: 24,
  },
});
