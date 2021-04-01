import React from 'react';
import { View, Modal, StyleSheet } from 'react-native';
import { SAMPLE, OFF_SITE, MULTI, ON_SITE } from '../../../utils/inventoryConstants';
import { Alrighty } from '../';
import i18next from 'i18next';
import { updateLastScreen, polygonUpdate, addCoordinates } from '../../../repositories/inventory';
import { off_site_enable_banner } from '../../../assets';
import { CommonActions, useNavigation } from '@react-navigation/native';

const infographicText = [
  {
    heading: i18next.t('label.info_graphic_header_1'),
    subHeading: i18next.t('label.info_graphic_sub_header_1'),
  },
  {
    heading: i18next.t('label.info_graphic_header_2'),
    subHeading: i18next.t('label.info_graphic_sub_header_2'),
  },
  {
    heading: i18next.t('label.info_graphic_header_3'),
    subHeading: i18next.t('label.info_graphic_sub_header_3'),
  },
];

export default function MapAlrightyModal({
  treeType,
  updateScreenState,
  showAlrightyModal,
  setShowAlrightyModal,
  skipPicture,
  locateTree,
  setIsCompletePolygon,
  activePolygonIndex,
  geoJSON,
  location,
  updateActiveMarkerIndex,
  activeMarkerIndex,
  inventoryId,
}) {
  let navigation = useNavigation();

  let subHeading = i18next.t('label.alright_modal_sub_header');
  let heading = i18next.t('label.alright_modal_header');
  let bannerImage = undefined;
  let whiteBtnText = treeType === SAMPLE ? i18next.t('label.alright_modal_skip') : '';

  if (treeType === MULTI) {
    const coordsLength = geoJSON.features[activePolygonIndex].geometry.coordinates.length;
    whiteBtnText = coordsLength > 2 ? i18next.t('label.tree_review_alrighty') : '';

    const infoIndex = coordsLength <= 1 ? 0 : coordsLength <= 2 ? 1 : 2;
    heading = infographicText[infoIndex].heading;
    subHeading = infographicText[infoIndex].subHeading;
  } else if (locateTree === OFF_SITE) {
    subHeading = i18next.t('label.alright_modal_off_site_sub_header');
    heading = i18next.t('label.alright_modal_off_site_header');
    bannerImage = off_site_enable_banner;
  }

  const onPressClose = () => {
    if (treeType === MULTI) {
      updateActiveMarkerIndex(activeMarkerIndex - 1);
    }
    setShowAlrightyModal(false);
  };

  const moveScreen = () => updateScreenState('ImageCapturing');

  const offSiteContinue = () => {
    navigation.navigate('SelectSpecies');
    updateLastScreen({ inventory_id: inventoryId, lastScreen: 'SelectSpecies' });
    onPressClose();
  };

  const onPressCompletePolygon = async () => {
    setIsCompletePolygon(true);

    geoJSON.features[0].properties.isPolygonComplete = true;
    geoJSON.features[0].geometry.coordinates.push(geoJSON.features[0].geometry.coordinates[0]);

    addCoordinates({
      inventory_id: inventoryId,
      geoJSON: geoJSON,
      currentCoords: { latitude: location.coords.latitude, longitude: location.coords.longitude },
    }).then(() => {
      if (locateTree !== ON_SITE) {
        // resets the navigation stack with MainScreen => TreeInventory => TotalTreesSpecies
        navigation.dispatch(
          CommonActions.reset({
            index: 2,
            routes: [
              { name: 'MainScreen' },
              { name: 'TreeInventory' },
              { name: 'TotalTreesSpecies' },
            ],
          }),
        );
      }
    });
  };

  const updateAndCompletePolygon = () => {
    polygonUpdate({ inventory_id: inventoryId }).then(() => {
      onPressCompletePolygon();
      setShowAlrightyModal(false);
    });
  };

  return (
    <Modal animationType={'slide'} visible={showAlrightyModal}>
      <View style={styles.cont}>
        <Alrighty
          closeIcon
          bannerImage={bannerImage}
          onPressClose={onPressClose}
          onPressWhiteButton={
            treeType === SAMPLE
              ? skipPicture
              : treeType === MULTI
                ? updateAndCompletePolygon
                : onPressClose
          }
          onPressContinue={
            treeType === MULTI
              ? () => setShowAlrightyModal(false)
              : locateTree === OFF_SITE
                ? offSiteContinue
                : moveScreen
          }
          heading={heading}
          subHeading={subHeading}
          whiteBtnText={whiteBtnText}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  cont: {
    flex: 1,
  },
});
