import i18next from 'i18next';
import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Carousel from 'react-native-snap-carousel';
import { Colors, Typography } from '../../styles';
import { MULTI } from '../../utils/inventoryConstants';

interface ISelectedPlantLocationsCardsProps {
  plantLocations: any;
  carouselRef: any;
  setIsCarouselRefVisible: React.Dispatch<React.SetStateAction<boolean>>;
  onPressViewSampleTrees: any;
}

const { width } = Dimensions.get('window');
const itemWidth = width - 25 * 2;

const SelectedPlantLocationsCards = ({
  plantLocations,
  carouselRef,
  setIsCarouselRefVisible,
  onPressViewSampleTrees,
}: ISelectedPlantLocationsCardsProps) => {
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
            <View style={styles.cardContainer} key={item.locationId}>
              <View style={styles.slideUpBarContainer}>
                <View style={styles.slideUpBar} />
              </View>
              <Text style={styles.hidText}>HID: {item.hid}</Text>
              {item.sampleTreesCount ? (
                <Text style={styles.text}>
                  {`${item.sampleTreesCount} ${i18next.t('label.sample_trees')}`}
                </Text>
              ) : (
                []
              )}
              {item.treeType === MULTI ? (
                <>
                  <Text style={styles.text}>
                    {`${i18next.t('label.plantation_date')} ${i18next.t(
                      'label.inventory_overview_date',
                      {
                        date: new Date(item.plantation_date),
                      },
                    )}`}
                  </Text>
                  {item.sampleTreesCount > 0 ? (
                    <TouchableOpacity
                      style={styles.textButtonContainer}
                      onPress={() => onPressViewSampleTrees(index)}>
                      <Text style={styles.textButton}>{i18next.t('label.view_sample_trees')}</Text>
                    </TouchableOpacity>
                  ) : (
                    []
                  )}
                </>
              ) : (
                <Text style={styles.text}>
                  {`${i18next.t('label.plantation_date')} ${i18next.t(
                    'label.inventory_overview_date',
                    {
                      date: new Date(item.plantation_date),
                    },
                  )}`}
                </Text>
              )}
            </View>
          );
        }}
      />
    </View>
  );
};

export default SelectedPlantLocationsCards;

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
    paddingBottom: 10,
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
  textButtonContainer: {
    paddingVertical: 10,
    borderRadius: 8,
  },
  textButton: {
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    fontSize: Typography.FONT_SIZE_14,
    color: Colors.PRIMARY_DARK,
  },
});
