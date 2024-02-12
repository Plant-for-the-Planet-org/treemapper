import bbox from '@turf/bbox';
import turfCenter from '@turf/center';
import Geolocation from 'react-native-geolocation-service';
import { Platform, StyleProp, StyleSheet } from 'react-native';
import MapLibreGL, { LineLayerStyle } from '@maplibre/maplibre-react-native';
import React, { memo, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { Colors } from '../../styles';
import SampleTreeMarkers from '../Common/SampleTreeMarkers';
import { UserContext } from '../../reducers/user';

const mapStyle = JSON.stringify(require('../../assets/mapStyle/mapStyleOutput.json'));

const IS_ANDROID = Platform.OS === 'android';

interface IGeoJSONMapProps {
  setLoader: React.Dispatch<React.SetStateAction<boolean>>;
  setIsCameraRefVisible: React.Dispatch<React.SetStateAction<boolean>>;
  showClickedGeoJSON: boolean;
  clickedGeoJSON: any[];
  carouselRef: any;
  isCameraRefVisible: boolean;
  camera: any;
  location: MapLibreGL.Location | Geolocation.GeoPosition | undefined;
  setLocation: React.Dispatch<
    React.SetStateAction<MapLibreGL.Location | Geolocation.GeoPosition | undefined>
  >;
  geoJSON: any;
  pointGeoJSON: any;
  getSelectedPlantLocations: any;
  isCarouselRefVisible: boolean;
  showSinglePlantLocation: boolean;
  singleSelectedGeoJSON: any;
  sampleCarouselRef: any;
  onPressViewSampleTrees: any;
  siteCenterCoordinate: any;
  siteBounds: any;
  projectSites: any;
  remeasurePolygons: string[];
  remeasureDuePolygons: string[];
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
  pointGeoJSON,
  getSelectedPlantLocations,
  isCarouselRefVisible,
  showSinglePlantLocation,
  singleSelectedGeoJSON,
  sampleCarouselRef,
  onPressViewSampleTrees,
  siteCenterCoordinate,
  siteBounds,
  projectSites,
  remeasurePolygons,
  remeasureDuePolygons,
}: IGeoJSONMapProps) => {
  const geoJSONInitialState = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[]],
        },
      },
    ],
  };

  // console.log(JSON.stringify(geoJSON), '==geoJSON==');

  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);
  // sets the bound to focus the selected polygon
  const [bounds, setBounds] = useState<any>([]);
  // used to store and focus on the center of the bounding box of the polygon selected
  const [centerCoordinate, setCenterCoordinate] = useState<any>([]);
  // used to store the selected project sites geoJSON
  const [projectSitesGeoJSON, setProjectSitesGeoJSON] = useState<any>(geoJSONInitialState);
  const { state: userInfo, dispatch: userDispatch } = useContext(UserContext);

  const map = useRef(null);

  useEffect(() => {
    if (isCameraRefVisible && carouselRef?.current) {
      setActiveCarouselIndex(carouselRef.current.currentIndex);
      const selectedGeoJSON = clickedGeoJSON[carouselRef.current.currentIndex];

      setCenterCoordinate(turfCenter(selectedGeoJSON.features[0]));

      setBounds(bbox(selectedGeoJSON.features[0]));
    }
  }, [carouselRef?.current?.currentIndex, isCarouselRefVisible]);

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

  // used to focus the selected polygon whenever the bounds are changed or center coordinate is updated
  useEffect(() => {
    if (isCameraRefVisible && siteBounds.length > 0 && camera?.current?.fitBounds) {
      camera.current.fitBounds(
        [siteBounds[0], siteBounds[1]],
        [siteBounds[2], siteBounds[3]],
        40,
        1000,
      );
    }
    // if (isCameraRefVisible && siteCenterCoordinate.length > 0 && camera?.current?.setCamera) {
    //   let config = {
    //     centerCoordinate: siteCenterCoordinate,
    //   };
    //   camera.current.setCamera(config);
    // }
  }, [isCameraRefVisible, siteBounds, siteCenterCoordinate]);

  // creates geoJSON object for the selected project sites
  useEffect(() => {
    if (projectSites && projectSites.length > 0) {
      // filteredNonNullSites = here removing the sites that contains null in geometry
      const filteredNonNullSites = projectSites.filter(item => JSON.parse(item?.geometry) !== null);
      const features = filteredNonNullSites.map(site => {
        const geometry = JSON.parse(site?.geometry);
        if (geometry?.type === 'MultiPolygon') {
          const coordinates = geometry.coordinates.map(polygon => {
            return polygon[0];
          });
          geometry.coordinates = coordinates;
          geometry.type = 'Polygon';
        }

        return {
          type: 'Feature',
          properties: {
            id: site.id,
            name: site.name,
            description: site.description,
            type: 'site',
          },
          geometry,
        };
      });

      setProjectSitesGeoJSON({
        type: 'FeatureCollection',
        features,
      });
    }
  }, [projectSites, userInfo.accessToken]);

  const onChangeRegionStart = () => setLoader(true);

  const onChangeRegionComplete = () => setLoader(false);

  let attributionPosition: any = {
    bottom: IS_ANDROID ? 20 : 10,
    left: IS_ANDROID ? 20 : 8,
  };

  let compassViewMargins = {
    x: IS_ANDROID ? 12 : 16,
    y: IS_ANDROID ? 160 : 120,
  };

  if (showSinglePlantLocation || showClickedGeoJSON) {
    attributionPosition = {
      bottom: 8,
      right: 8,
    };
  }

  const SitePolygon = useCallback(() => {
    return (
      <MapLibreGL.ShapeSource id={'projectSites'} shape={projectSitesGeoJSON}>
        <MapLibreGL.LineLayer
          id={'projectSitesPolyline'}
          style={{ ...polyline, lineColor: Colors.PLANET_BLACK }}
        />
      </MapLibreGL.ShapeSource>
    );
  }, [projectSitesGeoJSON]);

  const RemeasurePolygon = () => {
    return (
      <>
        <MapLibreGL.ShapeSource
          id={'point'}
          shape={pointGeoJSON}
          onPress={e => {
            console.log('\n\n\ne.features', e.features);
            if (e?.features.length > 0) {
              getSelectedPlantLocations(e.features);
            }
          }}>
          <MapLibreGL.CircleLayer id={'pointCircle'} style={bigCircleStyle} />
        </MapLibreGL.ShapeSource>
        <MapLibreGL.ShapeSource
          id={'polygon'}
          shape={geoJSON}
          onPress={e => {
            console.log('\n\n\ne.features ssss', e.features);
            if (e?.features.length > 0) {
              getSelectedPlantLocations(e.features);
            }
          }}>
          <MapLibreGL.FillLayer
            id={'polyFill'}
            style={{
              fillColor: ['get', 'color'],
              fillOpacity: 0.3,
            }}
          />
          <MapLibreGL.LineLayer
            id={'polyline'}
            style={{
              lineWidth: 2,
              lineColor: ['get', 'color'],
              lineOpacity: 0.5,
              lineJoin: 'bevel',
            }}
          />
        </MapLibreGL.ShapeSource>
      </>
    );
  };

  return (
    <MapLibreGL.MapView
      style={styles.container}
      styleURL={mapStyle}
      ref={map}
      compassViewPosition={3}
      compassViewMargins={compassViewMargins}
      attributionPosition={attributionPosition}
      onRegionWillChange={onChangeRegionStart}
      onRegionDidChange={onChangeRegionComplete}>
      <MapLibreGL.Camera
        ref={el => {
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
            sampleCarouselRef={sampleCarouselRef}
          />
          <MapLibreGL.ShapeSource
            id={'singleSelectedPolygon'}
            shape={{
              type: 'FeatureCollection',
              features: [singleSelectedGeoJSON.features[0]],
            }}>
            <MapLibreGL.FillLayer id={'singleSelectedPolyFill'} style={fillStyle} />
            <MapLibreGL.LineLayer id={'singleSelectedPolyline'} style={polyline} />
            <MapLibreGL.CircleLayer id={'singleSelectedPolyCircle'} style={circleStyle} />
          </MapLibreGL.ShapeSource>
        </>
      ) : showClickedGeoJSON && clickedGeoJSON.length > 0 ? (
        clickedGeoJSON.map((singleGeoJson, index) => {
          const styles = {
            remeasurePolygonStyle: {
              fill: remeasureFillStyle,
              line: remeasurePolyline,
              circle: remeasureCircleStyle,
            },
            remeasureDuePolygonStyle: {
              fill: remeasureElapseFillStyle,
              line: remeasureElapsePolyline,
              circle: remeasureElapseCircleStyle,
            },
            selectedDefaultStyle: {
              fill: fillStyle,
              line: polyline,
              circle: circleStyle,
            },
            notSelectedDefaultStyle: {
              fill: inactiveFillStyle,
              line: inactivePolyline,
              circle: inactiveCircleStyle,
            },
          };

          const inventoryId = singleGeoJson?.features[0]?.properties?.inventoryId;

          const isSelected = activeCarouselIndex == index;
          const polygonStyleKey = remeasurePolygons.includes(inventoryId)
            ? 'remeasurePolygonStyle'
            : remeasureDuePolygons.includes(inventoryId)
            ? 'remeasureDuePolygonStyle'
            : isSelected
            ? 'selectedDefaultStyle'
            : 'notSelectedDefaultStyle';

          return (
            <MapLibreGL.ShapeSource
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
              <MapLibreGL.FillLayer
                id={`polyFillClicked-${index}`}
                style={{
                  ...styles[`${polygonStyleKey}`].fill,
                  fillOpacity: isSelected ? 0.3 : 0.1,
                }}
              />
              <MapLibreGL.LineLayer
                id={`polylineClicked-${index}`}
                style={{ ...styles[`${polygonStyleKey}`].line, lineOpacity: isSelected ? 1 : 0.5 }}
              />

              <MapLibreGL.CircleLayer
                id={`circleClicked-${index}`}
                style={{
                  ...styles[`${polygonStyleKey}`].circle,
                  circleOpacity: isSelected ? 1 : 0.2,
                }}
              />
            </MapLibreGL.ShapeSource>
          );
        })
      ) : (
        <>
          <RemeasurePolygon />
          <SitePolygon />
        </>
      )}
      {location && (
        <MapLibreGL.UserLocation showsUserHeadingIndicator onUpdate={data => setLocation(data)} />
      )}
    </MapLibreGL.MapView>
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

const remeasurePolyline: StyleProp<LineLayerStyle> = {
  lineWidth: 2,
  lineColor: Colors.WARNING,
  lineOpacity: 1,
  lineJoin: 'bevel',
};

const remeasureElapsePolyline: StyleProp<LineLayerStyle> = {
  lineWidth: 2,
  lineColor: Colors.PLANET_CRIMSON,
  lineOpacity: 1,
  lineJoin: 'bevel',
};

const fillStyle = { fillColor: Colors.PRIMARY, fillOpacity: 0.3 };
const inactiveFillStyle = { fillColor: Colors.PLANET_BLACK, fillOpacity: 0.2 };
const remeasureFillStyle = { fillColor: Colors.WARNING, fillOpacity: 0.3 };
const remeasureElapseFillStyle = { fillColor: Colors.PLANET_CRIMSON, fillOpacity: 0.3 };

const bigCircleStyle = { circleColor: Colors.PRIMARY_DARK, circleOpacity: 0.5, circleRadius: 12 };
const circleStyle = { circleColor: Colors.PRIMARY_DARK, circleOpacity: 0.8 };
const inactiveCircleStyle = { circleColor: Colors.PLANET_BLACK, circleOpacity: 0.2 };
const remeasureCircleStyle = { circleColor: Colors.WARNING, circleOpacity: 0.2 };
const remeasureElapseCircleStyle = { circleColor: Colors.PLANET_CRIMSON, circleOpacity: 0.2 };
