import MapboxGL, { LineLayerStyle } from '@react-native-mapbox-gl/maps';
import React, { useEffect, useRef, useState } from 'react';
import { StyleProp, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../styles';
import bbox from '@turf/bbox';
import turfCenter from '@turf/center';
import Geolocation from 'react-native-geolocation-service';
import SampleTreeMarkers from '../Common/SampleTreeMarkers';

interface IGeoJSONMapProps {
  setLoader: React.Dispatch<React.SetStateAction<boolean>>;
  setIsCameraRefVisible: React.Dispatch<React.SetStateAction<boolean>>;
  showClickedGeoJSON: boolean;
  clickedGeoJSON: any[];
  carouselRef: any;
  isCameraRefVisible: boolean;
  camera: any;
  location: MapboxGL.Location | Geolocation.GeoPosition | undefined;
  setLocation: React.Dispatch<
    React.SetStateAction<MapboxGL.Location | Geolocation.GeoPosition | undefined>
  >;
  geoJSON: any;
  getSelectedPlantLocations: any;
  isCarouselRefVisible: boolean;
  showSinglePlantLocation: boolean;
  singleSelectedGeoJSON: any;
  isSampleCarouselRefVisible: boolean;
  sampleCarouselRef: any;
  onPressViewSampleTrees: any;
}

const GeoJSONMap = ({
  setLoader,
  setIsCameraRefVisible,
  showClickedGeoJSON,
  clickedGeoJSON,
  carouselRef,
  isCameraRefVisible,
  camera,
  location,
  setLocation,
  geoJSON,
  getSelectedPlantLocations,
  isCarouselRefVisible,
  showSinglePlantLocation,
  singleSelectedGeoJSON,
  isSampleCarouselRefVisible,
  sampleCarouselRef,
  onPressViewSampleTrees,
}: IGeoJSONMapProps) => {
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);
  const [activeSampleCarouselIndex, setActiveSampleCarouselIndex] = useState(0);
  // sets the bound to focus the selected polygon
  const [bounds, setBounds] = useState<any>([]);
  // used to store and focus on the center of the bounding box of the polygon selected
  const [centerCoordinate, setCenterCoordinate] = useState<any>([]);

  const map = useRef(null);

  useEffect(() => {
    if (isCameraRefVisible && carouselRef?.current) {
      setActiveCarouselIndex(carouselRef.current.currentIndex);
      const selectedGeoJSON = clickedGeoJSON[carouselRef.current.currentIndex];

      setCenterCoordinate(turfCenter(selectedGeoJSON.features[0]));

      setBounds(bbox(selectedGeoJSON.features[0]));
    }
  }, [carouselRef?.current?.currentIndex, isCarouselRefVisible]);

  useEffect(() => {
    if (isCameraRefVisible && sampleCarouselRef?.current) {
      setActiveSampleCarouselIndex(sampleCarouselRef.current.currentIndex);
      // const selectedCoordinate =
      //   singleSelectedGeoJSON.features[sampleCarouselRef.current.currentIndex + 1].geometry
      //     .coordinates;
      // if (camera?.current?.setCamera) {
      //   camera.current.setCamera({ centerCoordinate: selectedCoordinate });
      // }
    }
  }, [sampleCarouselRef?.current?.currentIndex, isSampleCarouselRefVisible]);

  // used to focus the selected polygon whenever the bounds are changed or center coordinate is updated
  useEffect(() => {
    if (isCameraRefVisible && bounds.length > 0 && camera?.current?.fitBounds) {
      camera.current.fitBounds([bounds[0], bounds[1]], [bounds[2], bounds[3]], 100, 1000);
    }
    if (isCameraRefVisible && centerCoordinate.length > 0 && camera?.current?.setCamera) {
      let config = {
        centerCoordinate,
      };
      camera.current.setCamera(config);
    }
  }, [isCameraRefVisible, bounds, centerCoordinate]);

  const onChangeRegionStart = () => setLoader(true);

  const onChangeRegionComplete = () => setLoader(false);

  return (
    <MapboxGL.MapView
      style={styles.container}
      ref={map}
      compassViewPosition={3}
      compassViewMargins={{
        x: 30,
        y: 180,
      }}
      logoEnabled
      onRegionWillChange={onChangeRegionStart}
      onRegionDidChange={onChangeRegionComplete}>
      <MapboxGL.Camera
        ref={(el) => {
          camera.current = el;
          setIsCameraRefVisible(!!el);
        }}
      />

      {/* Shows only clicked polygons after user clicks on the polygon. */}
      {/* Can show more than 1 if clicked on overlapping polygons.  */}
      {/* If not clicked on any polygon then shows all the polygons. */}

      {showSinglePlantLocation ? (
        <>
          <SampleTreeMarkers
            geoJSON={singleSelectedGeoJSON}
            isPointForMultipleTree={false}
            locateTree={''}
          />
          <MapboxGL.ShapeSource
            id={'singleSelectedPolygon'}
            shape={{
              type: 'FeatureCollection',
              features: [singleSelectedGeoJSON.features[0]],
            }}>
            <MapboxGL.FillLayer id={'singleSelectedPolyFill'} style={fillStyle} />
            <MapboxGL.LineLayer id={'singleSelectedPolyline'} style={polyline} />
            <MapboxGL.CircleLayer id={'singleSelectedPolyCircle'} style={circleStyle} />
          </MapboxGL.ShapeSource>
        </>
      ) : showClickedGeoJSON && clickedGeoJSON.length > 0 ? (
        clickedGeoJSON.map((singleGeoJson, index) => {
          return (
            <MapboxGL.ShapeSource
              key={`polygonClicked-${index}`}
              id={`polygonClicked-${index}`}
              shape={singleGeoJson}
              onPress={() => {
                if (activeCarouselIndex === index) {
                  onPressViewSampleTrees(index);
                } else if (isCarouselRefVisible) {
                  carouselRef.current.snapToItem(index);
                  setActiveCarouselIndex(index);
                }
              }}
              style={activeCarouselIndex === index ? { zIndex: 1000 } : { zIndex: 999 }}>
              <MapboxGL.FillLayer
                id={`polyFillClicked-${index}`}
                style={activeCarouselIndex !== index ? inactiveFillStyle : fillStyle}
              />
              <MapboxGL.LineLayer
                id={`polylineClicked-${index}`}
                style={activeCarouselIndex !== index ? inactivePolyline : polyline}
              />

              <MapboxGL.CircleLayer
                id={`circleClicked-${index}`}
                style={activeCarouselIndex !== index ? inactiveCircleStyle : circleStyle}
                // belowLayerID={'polylineClicked'}
                // belowLayerID={
                //   activeCarouselIndex !== index
                //     ? `polylineClicked-${activeCarouselIndex}`
                //     : undefined
                // }
                // aboveLayerID={`polyFillClicked-${index}`}
              />
            </MapboxGL.ShapeSource>
          );
        })
      ) : (
        <MapboxGL.ShapeSource
          id={'polygon'}
          shape={geoJSON}
          onPress={(e) => {
            if (e?.features.length > 0) {
              getSelectedPlantLocations(e.features);
            }
          }}>
          <MapboxGL.FillLayer id={'polyFill'} style={fillStyle} />
          <MapboxGL.LineLayer id={'polyline'} style={polyline} />
          {/* <MapboxGL.CircleLayer id={'circle'} style={circleStyle} aboveLayerID={'fillpoly'} /> */}
        </MapboxGL.ShapeSource>
      )}
      {location && (
        <MapboxGL.UserLocation showsUserHeadingIndicator onUpdate={(data) => setLocation(data)} />
      )}
    </MapboxGL.MapView>
  );
};

export default GeoJSONMap;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
});

const polyline: StyleProp<LineLayerStyle> = {
  lineWidth: 2,
  lineColor: Colors.PRIMARY,
  lineOpacity: 0.5,
  lineJoin: 'bevel',
};
const inactivePolyline: StyleProp<LineLayerStyle> = {
  lineWidth: 2,
  lineColor: Colors.PLANET_BLACK,
  lineOpacity: 0.3,
  lineJoin: 'bevel',
};

const fillStyle = { fillColor: Colors.PRIMARY, fillOpacity: 0.3 };
const inactiveFillStyle = { fillColor: Colors.PLANET_BLACK, fillOpacity: 0.2 };

const circleStyle = { circleColor: Colors.PRIMARY_DARK, circleOpacity: 1 };
const inactiveCircleStyle = { circleColor: Colors.PLANET_BLACK, circleOpacity: 0.2 };
