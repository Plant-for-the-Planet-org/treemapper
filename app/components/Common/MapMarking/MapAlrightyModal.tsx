import { CommonActions, useNavigation } from '@react-navigation/native';
import i18next from 'i18next';
import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { Alrighty } from '../';
import { off_site_enable_banner } from '../../../assets';
import { addCoordinates, polygonUpdate, updateLastScreen } from '../../../repositories/inventory';
import { MULTI, OFF_SITE, ON_SITE, SAMPLE } from '../../../utils/inventoryConstants';

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

interface IMapAlrightyModalProps {
  treeType?: any;
  updateScreenState?: any;
  showAlrightyModal?: any;
  setShowAlrightyModal?: any;
  locateTree?: any;
  setIsCompletePolygon?: any;
  activePolygonIndex?: any;
  geoJSON?: any;
  location?: any;
  updateActiveMarkerIndex?: any;
  activeMarkerIndex?: any;
  inventoryId?: any;
}

export default function MapAlrightyModal({
  treeType,
  updateScreenState,
  showAlrightyModal,
  setShowAlrightyModal,
  locateTree,
  setIsCompletePolygon,
  activePolygonIndex,
  geoJSON,
  location,
  updateActiveMarkerIndex,
  activeMarkerIndex,
  inventoryId,
}: IMapAlrightyModalProps) {
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
      currentCoords:
        locateTree === OFF_SITE
          ? null
          : { latitude: location.coords.latitude, longitude: location.coords.longitude },
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
          onPressWhiteButton={treeType === MULTI ? updateAndCompletePolygon : onPressClose}
          onPressContinue={
            treeType === MULTI
              ? () => setShowAlrightyModal(false)
              : locateTree === OFF_SITE
              ? offSiteContinue
              : moveScreen
          }
          heading={heading}
          subHeading={subHeading}
          whiteBtnText={treeType !== SAMPLE ? whiteBtnText : null}
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
