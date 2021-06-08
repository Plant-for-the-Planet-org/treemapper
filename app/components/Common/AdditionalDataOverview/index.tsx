import i18next from 'i18next';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Typography } from '../../../styles';

interface Props {
  metadata: any;
}

const AdditionalDataOverview = ({ metadata }: Props) => {
  return (
    <>
      {metadata ? (
        Object.keys(metadata).length > 0 &&
        Object.keys(metadata).map((key: string) => {
          if (metadata[key] && Object.keys(metadata[key]).length > 0) {
            return (
              <View style={styles.subDataContainer}>
                <Text style={styles.keyHeading}>{i18next.t(`label.${key}`)}</Text>
                {Object.entries(metadata[key]).map(([key, value]: any) => {
                  return (
                    <View style={styles.keyValueContainer}>
                      <Text style={styles.keyText}>{key}</Text>
                      <Text style={styles.valueText}>{value}</Text>
                    </View>
                  );
                })}
              </View>
            );
          }
        })
      ) : (
        <></>
      )}
    </>
  );
};

export default AdditionalDataOverview;

const styles = StyleSheet.create({
  subDataContainer: {
    borderWidth: 1,
    borderColor: Colors.GRAY_LIGHT,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingTop: 4,
    marginBottom: 24,
  },
  keyHeading: {
    fontSize: Typography.FONT_SIZE_14,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.TEXT_COLOR,
    paddingTop: 4,
  },
  keyValueContainer: {
    borderRadius: 6,
    backgroundColor: Colors.GRAY_LIGHT,
    padding: 8,
    paddingTop: 4,
    marginVertical: 8,
  },
  keyText: {
    fontSize: Typography.FONT_SIZE_12,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.TEXT_COLOR,
    paddingVertical: 4,
    marginBottom: 4,
  },
  valueText: {
    fontSize: Typography.FONT_SIZE_14,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: Colors.WHITE,
  },
});
