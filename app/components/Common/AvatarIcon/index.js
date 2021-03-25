import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography } from '_styles';

export default function AvatarIcon({ name, style }) {
  return (
    <View style={[styles.avatarContainer, style ? style : {}]}>
      <Text style={styles.avatarText}>{name ? name.charAt(0).toUpperCase() : ''}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatarContainer: {
    borderRadius: 40,
    backgroundColor: Colors.PRIMARY,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 1,
  },
  avatarText: {
    fontSize: 20,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.WHITE,
  },
});
