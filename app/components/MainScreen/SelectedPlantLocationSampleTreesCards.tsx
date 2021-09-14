import i18next from 'i18next';
import React from 'react';
import { Dimensions, Image, Platform, StyleSheet, Text, View } from 'react-native';
import RNFS from 'react-native-fs';
import Carousel from 'react-native-snap-carousel';
import { APIConfig } from '../../actions/Config';
import { Colors, Typography } from '../../styles';
import { nonISUCountries } from '../../utils/constants';
const { protocol, cdnUrl } = APIConfig;

interface ISelectedPlantLocationSampleTreesCardsProps {
  singleSelectedPlantLocation: any;
  carouselRef: any;
  setIsCarouselRefVisible: React.Dispatch<React.SetStateAction<boolean>>;
  countryCode: string;
}

const { width } = Dimensions.get('window');
const itemWidth = width - 25 * 2;

const SelectedPlantLocationSampleTreesCards = ({
  singleSelectedPlantLocation,
  carouselRef,
  setIsCarouselRefVisible,
  countryCode,
}: ISelectedPlantLocationSampleTreesCardsProps) => {
  const heightUnit = nonISUCountries.includes(countryCode)
    ? i18next.t('label.select_species_feet')
    : 'm';
  const diameterUnit = nonISUCountries.includes(countryCode)
    ? i18next.t('label.select_species_inches')
    : 'cm';
  return (
    <View style={styles.carousel}>
      <Carousel
        ref={(el) => {
          carouselRef.current = el;
          setIsCarouselRefVisible(true);
        }}
        data={singleSelectedPlantLocation.sampleTrees}
        itemWidth={itemWidth}
        sliderWidth={width}
        renderItem={({ item, index }: any) => {
          let imageSource;

          const imageURIPrefix = Platform.OS === 'android' ? 'file://' : '';
          if (item?.imageUrl) {
            imageSource = {
              uri: `${imageURIPrefix}${RNFS.DocumentDirectoryPath}/${item?.imageUrl}`,
            };
          } else if (item?.cdnImageUrl) {
            imageSource = {
              uri: `${protocol}://${cdnUrl}/media/cache/coordinate/thumb/${item?.cdnImageUrl}`,
            };
          }
          console.log('imageSource', imageSource);

          return (
            <View style={styles.cardContainer} key={item.locationId}>
              <View style={styles.slideUpBarContainer}>
                <View style={styles.slideUpBar} />
              </View>
              <View style={styles.infoContainer}>
                {imageSource ? <Image source={imageSource} style={styles.image} /> : []}
                <View>
                  <Text style={styles.hidText}>HID: {item.hid}</Text>
                  <Text style={[styles.text, { fontStyle: 'italic' }]}>{item.specieName}</Text>
                  <Text style={styles.text}>
                    {`${i18next.t('label.plantation_date')} ${i18next.t(
                      'label.inventory_overview_date',
                      {
                        date: new Date(item.plantationDate),
                      },
                    )}`}
                  </Text>
                  {/* <Text style={styles.text}>{`${item.specieHeight} ${item.specieDiameter}`}</Text> */}
                  <Text style={styles.text}>
                    {Math.round(item.specieHeight * 100) / 100} {heightUnit} •{' '}
                    {Math.round(item.specieDiameter * 100) / 100} {diameterUnit}
                  </Text>
                </View>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
};

export default SelectedPlantLocationSampleTreesCards;

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
    marginTop: 4,
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
  image: {
    borderRadius: 10,
    marginRight: 16,
    width: 80,
    height: 80,
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
  infoContainer: {
    flexDirection: 'row',
  },
});
