import i18next from 'i18next';
import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Carousel from 'react-native-snap-carousel';
import { Colors, Typography } from '../../styles';
import { MULTI } from '../../utils/inventoryConstants';

interface ISelectedPlantLocationsProps {
  plantLocations: any;
  carouselRef: any;
  setIsCarouselRefVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

const { width } = Dimensions.get('window');
const itemWidth = width - 25 * 2;

const SelectedPlantLocations = ({
  plantLocations,
  setIsCarouselRefVisible,
  carouselRef,
}: ISelectedPlantLocationsProps) => {
  return (
    <View style={styles.carousel}>
      <Carousel
        ref={(el) => {
          carouselRef.current = el;
          setIsCarouselRefVisible(true);
        }}
        data={plantLocations}
        itemWidth={itemWidth}
        sliderWidth={width}
        renderItem={({ item, index }: any) => {
          return (
            <View style={styles.cardContainer}>
              <View style={styles.slideUpBarContainer}>
                <View style={styles.slideUpBar} />
              </View>
              <Text style={styles.hidText}>HID: {item.locationId}</Text>
              {item.sampleTreesCount ? (
                <Text style={styles.text}>
                  {`${item.sampleTreesCount} ${i18next.t('label.sample_trees')}`}{' '}
                </Text>
              ) : (
                []
              )}
              {item.treeType === MULTI ? (
                <Text style={styles.text}>
                  {`${i18next.t('label.plantation_period')}: ${item.plantation_date}`}{' '}
                </Text>
              ) : (
                <Text style={styles.text}>
                  {`${i18next.t('label.plantation_date')} ${item.plantation_date}`}{' '}
                </Text>
              )}
            </View>
          );
        }}
      />
    </View>
  );
};

export default SelectedPlantLocations;

const styles = StyleSheet.create({
  carousel: {
    position: 'absolute',
    bottom: 36,
    zIndex: 2,
  },
  cardContainer: {
    backgroundColor: Colors.WHITE,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.GRAY_LIGHT,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    height: '100%',
  },
  hidText: {
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: Typography.FONT_SIZE_16,
    color: Colors.TEXT_COLOR,
  },
  text: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_14,
    color: Colors.TEXT_COLOR,
    marginTop: 6,
  },
  slideUpBarContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  slideUpBar: {
    borderRadius: 10,
    height: 6,
    width: 30,
    backgroundColor: Colors.PLANET_GRAY,
  },
});
