import { StyleProp } from 'react-native'
import React, { useEffect, useState } from 'react'
import MapLibreGL, { LineLayerStyle } from '@maplibre/maplibre-react-native'
import { Colors } from 'src/utils/constants'
import { useRealm } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { useSelector } from 'react-redux'
import { RootState } from 'src/store'
import { ProjectInterface } from 'src/types/interface/app.interface'

const polyline: StyleProp<LineLayerStyle> = {
  lineWidth: 2,
  lineColor: Colors.TEXT_COLOR,
  lineJoin: 'bevel',
}

interface Props {
  isSatellite: boolean
}

const SiteMapSource = (props: Props) => {
  const [geoJSON, setGeoJSON] = useState<any[]>([])
  const realm = useRealm()
  const { projectAdded } = useSelector(
    (state: RootState) => state.projectState,
  )

  useEffect(() => {
    if (!projectAdded) {
      setGeoJSON([])
      return;
    }
    const ProjectData = realm.objects<ProjectInterface[]>(
      RealmSchema.Projects,
    )
    if (ProjectData) {
      extractSiteCoordinates([...ProjectData])
    }
  }, [projectAdded])

  const extractSiteCoordinates = (data: any[]) => {
    try {

      const allProjectSites = []
      data.forEach(el => {
        if (el.sites && el.sites.length > 0) {
          allProjectSites.push(...el.sites)
        }
      })
      const reducedSites = [];
      for (const siteDetails of allProjectSites) {
        if (siteDetails?.geometry) {
          const parsedData = JSON.parse(siteDetails.geometry);
          if (parsedData?.coordinates) {
            if (parsedData.type === 'Polygon') {
              reducedSites.push({
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'Polygon',
                  coordinates: [...parsedData.coordinates],
                },
              });
            } else if (parsedData.type === 'MultiPolygon') {
              reducedSites.push({
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'Polygon',
                  coordinates: [...parsedData.coordinates[0]],
                },
              });
            }
          }
        }
      }
      setGeoJSON(reducedSites);
    } catch (error) {
      console.log('error occurred at siteGeojson', error)
    }
  };
  if (!geoJSON) {
    return null
  }
  return (
    <MapLibreGL.ShapeSource id={'projectSites'} shape={{
      type: 'FeatureCollection',
      features: geoJSON.length ? [...geoJSON] : [],
    }}>
      <MapLibreGL.LineLayer
        id={'projectSitesPolyline'}
        style={{ ...polyline, lineColor: props.isSatellite ? Colors.WHITE : Colors.PLANET_BLACK }}
      />
    </MapLibreGL.ShapeSource>
  )
}

export default SiteMapSource