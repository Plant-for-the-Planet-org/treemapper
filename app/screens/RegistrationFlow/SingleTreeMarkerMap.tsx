import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import React, { useRef, useState } from 'react';
import Header from '../../components/Common/Header';
import i18next from 'i18next';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { Colors } from '../../styles';
import MapButtons from '../../components/Common/MapMarking/MapButtons';
import Map from '../../components/Common/MapMarking/Map';
import { useDispatch, useSelector } from 'react-redux';
import { DeviceDetailsState, setGPSAccuracy, setPosition } from '../../redux/deviceDetailsSlice';
import { RootState } from '../../redux/store';
import { resetRouteStack } from '../../utils/navigation';
import Geolocation from 'react-native-geolocation-service';
import { currentPositionOptions } from '../../utils/maps';
import { OFF_SITE, ON_SITE, SAMPLE, SINGLE, TreeType } from '../../utils/inventoryConstants';
import { locationPermission } from '../../utils/permissions';
import MapboxGL from '@react-native-mapbox-gl/maps';
import distanceCalculator from '../../utils/distanceCalculator';
import dbLog from '../../repositories/logs';
import { LogTypes, ModalType } from '../../utils/constants';
import AlertModalSwitcher from '../../components/Common/AlertModal/AlertModalSwitcher';
import { addCoordinateSingleRegisterTree, initiateInventory } from '../../repositories/inventory';
import { setPlantLocationId } from '../../redux/registrationSlice';

type Props = {};

const SingleTreeMarkerMap = (props: Props) => {
  const [isInitial, setIsInitial] = useState(true);
  const [isCameraRefVisible, setIsCameraRefVisible] = useState(false);
  const [loader, setLoader] = useState(false);
  const [showPoorAccuracyModal, setShowPoorAccuracyModal] = useState(false);
  const [showUnknownLocationModal, setShowUnknownLocationModal] = useState(false);
  const [inventory, setInventory] = useState(null);

  const camera = useRef(null);
  const map = useRef(null);

  const position = useSelector((state: RootState) => state.deviceDetails.position);
  const treeType = useSelector((state: RootState) => state.registration.treeType);
  const gpsAccuracy = useSelector((state: RootState) => state.deviceDetails.gpsAccuracy);
  const plantLocationId = useSelector((state: RootState) => state.registration.plantLocationId);

  const dispatch = useDispatch();

  const navigation = useNavigation();

  // resets the navigation stack with MainScreen => TreeInventory
  const resetRoute = () => {
    resetRouteStack(navigation, ['MainScreen', 'TreeInventory']);
  };

  //recenter the marker to the current coordinates
  const onPressMyLocationIcon = (position: any) => {
    if (isInitial && treeType === TreeType.SAMPLE) {
      setIsInitial(false);
      return;
    }
    if (isCameraRefVisible && camera?.current?.setCamera) {
      setIsInitial(false);
      camera.current.setCamera({
        centerCoordinate: [position.coords.longitude, position.coords.latitude],
        zoomLevel: 18,
        animationDuration: 1000,
      });
    }
  };

  //only the first time marker will follow the user's current location by default
  const onUpdateUserLocation = (userLocation: any) => {
    if (isInitial && userLocation) {
      onPressMyLocationIcon(userLocation);
    }
  };

  //getting current position of the user with high accuracy
  const updateCurrentPosition = async () => {
    return new Promise(resolve => {
      Geolocation.getCurrentPosition(
        position => {
          dispatch(setGPSAccuracy(position.coords.accuracy));
          dispatch(setPosition(position));
          onUpdateUserLocation(position);
          resolve(position);
        },
        err => {
          // if (captureMode === OFF_SITE) {
          //   setShowSecondaryButton(false);
          //   setAlertHeading(i18next.t('label.location_service'));
          //   setAlertSubHeading(i18next.t('label.location_service_message'));
          //   setShowAlert(true);
          // } else {
          //   setIsLocationAlertShow(true);
          // }
        },
        currentPositionOptions,
      );
    });
  };

  const checkPermission = async ({ showAlert = false, isOffsite = false }) => {
    try {
      await locationPermission();
      MapboxGL.setTelemetryEnabled(false);
      updateCurrentPosition();
      return true;
    } catch (err) {
      if (showAlert) {
        // if (err?.message == 'blocked') {
        //   if (isOffsite) {
        //     setShowSecondaryButton(false);
        //     setAlertHeading(i18next.t('label.location_service'));
        //     setAlertSubHeading(i18next.t('label.location_service_message'));
        //     setShowAlert(true);
        //   } else {
        //     setIsPermissionBlocked(true);
        //   }
        // } else if (err?.message == 'denied') {
        //   setIsPermissionDenied(true);
        // } else {
        //   bugsnag.notify(err);
        // }
      }
      return false;
    }
  };

  // Adds coordinates and locateTree label to inventory
  const onPressContinue = async (
    currentCoords: number[],
    centerCoordinates: number[],
    locateTreeVariable: string,
  ) => {
    let result;
    if (!plantLocationId) {
      result = await initiateInventory({ treeType: SINGLE });
      if (result) {
        dispatch(setPlantLocationId(result.inventory_id));
      }
    }
    if (plantLocationId || result) {
      addCoordinateSingleRegisterTree({
        inventory_id: plantLocationId || result.inventory_id,
        markedCoords: centerCoordinates,
        locateTree: locateTreeVariable,
        currentCoords: { latitude: currentCoords[0], longitude: currentCoords[1] },
      }).then(() => {
        // TODO: show alrighty modal to navigate to it's page
      });
    }
  };

  //checks if the marker is within 100 meters range or not and assigns a LocateTree label accordingly
  const addPointMarker = async (forceContinue = false) => {
    let centerCoordinates = await map.current.getCenter();

    //Check distance
    if (gpsAccuracy < 30 || forceContinue) {
      if (position && position.coords) {
        let currentCoords = [position.coords.latitude, position.coords.longitude];

        const distanceInMeters = distanceCalculator(
          [currentCoords[0], currentCoords[1]],
          [centerCoordinates[1], centerCoordinates[0]],
          'meters',
        );

        let locateTreeVariable;
        if (distanceInMeters < 100) {
          setLocateTree(ON_SITE);
          locateTreeVariable = ON_SITE;
        } else if (treeType !== SAMPLE) {
          setLocateTree(OFF_SITE);
          locateTreeVariable = OFF_SITE;
        }
        onPressContinue(currentCoords, centerCoordinates, locateTreeVariable);
      } else {
        dbLog.error({
          logType: LogTypes.INVENTORY,
          message: 'Failed to update Current Position',
        });
        setShowUnknownLocationModal(true);
      }
    } else {
      setShowPoorAccuracyModal(true);
    }
  };

  return (
    <View style={styles.container} fourceInset={{ top: 'always' }}>
      <Map
        treeType={treeType}
        setLoader={setLoader}
        map={map}
        camera={camera}
        setIsCameraRefVisible={setIsCameraRefVisible}
        setLocation={(data: MapboxGL.Location) => dispatch(setPosition(data))}
        location={position}
        loader={loader}
      />

      <MapButtons
        location={position}
        onPressMyLocationIcon={onPressMyLocationIcon}
        setIsLocationAlertShow={() => checkPermission({ showAlert: true })}
        addMarker={() => addPointMarker()}
        loader={loader}
      />
      <View style={styles.headerCont}>
        <SafeAreaView />
        <Header
          onBackPress={resetRoute}
          closeIcon
          headingText={i18next.t('label.tree_map_marking_header')}
        />
      </View>
      <AlertModalSwitcher
        type={ModalType.POOR_ACCURACY}
        visible={showPoorAccuracyModal}
        onPressPrimaryButton={() => setShowPoorAccuracyModal(false)}
        onPressSecondaryButton={() => {
          setShowPoorAccuracyModal(false);
          addPointMarker(true);
        }}
      />
      <AlertModalSwitcher
        type={ModalType.UNKNOWN_LOCATION}
        visible={showUnknownLocationModal}
        setVisible={setShowUnknownLocationModal}
      />
    </View>
  );
};

export default SingleTreeMarkerMap;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  headerCont: {
    paddingHorizontal: 25,
    position: 'absolute',
    top: 0,
    backgroundColor: 'rgba(255, 255, 255, 0)',
    width: '100%',
  },
});
