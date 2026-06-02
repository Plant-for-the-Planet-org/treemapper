import { StyleProp } from 'react-native'
import React, { useEffect, useState } from 'react'
import { GeoJSONSource, Layer, LineLayerStyle } from '@maplibre/maplibre-react-native'
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
  const { lastProjectAdded } = useSelector(
    (state: RootState) => state.displayMapState,
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
  }, [projectAdded, lastProjectAdded])

  const toPolygonFeature = (geometry: any) => {
    if (!geometry?.coordinates) {
      return null
    }
    if (geometry.type === 'Polygon') {
      return {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [...geometry.coordinates],
        },
      }
    }
    if (geometry.type === 'MultiPolygon') {
      // Keep it a MultiPolygon so every polygon renders, not just the first.
      return {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'MultiPolygon',
          coordinates: [...geometry.coordinates],
        },
      }
    }
    return null
  }

  const extractSiteCoordinates = (data: any[]) => {
    try {

      const allProjectSites: any[] = []
      data.forEach(el => {
        if (el.sites && el.sites.length > 0) {
          allProjectSites.push(...el.sites)
        }
      })
      const reducedSites: any[] = [];
      for (const siteDetails of allProjectSites) {
        if (siteDetails?.geometry) {
          const parsedData = JSON.parse(siteDetails.geometry);
          // Stored geometry can be a FeatureCollection, a Feature, or a bare geometry.
          if (parsedData?.type === 'FeatureCollection' && Array.isArray(parsedData.features)) {
            for (const feature of parsedData.features) {
              const polygon = toPolygonFeature(feature?.geometry);
              if (polygon) {
                reducedSites.push(polygon);
              }
            }
          } else if (parsedData?.type === 'Feature') {
            const polygon = toPolygonFeature(parsedData.geometry);
            if (polygon) {
              reducedSites.push(polygon);
            }
          } else {
            const polygon = toPolygonFeature(parsedData);
            if (polygon) {
              reducedSites.push(polygon);
            }
          }
        }
      }
      setGeoJSON(reducedSites);
    } catch (error) {
      console.error('error occurred at siteGeojson', error)
    }
  };
  if (!geoJSON) {
    return null
  }
  return (
    <GeoJSONSource id={'projectSites'} data={{
      type: 'FeatureCollection',
      features: geoJSON.length ? [...geoJSON] : [],
    }}>
      <Layer
        id={'projectSitesPolyline'}
        type="line"
        style={{ ...polyline, lineColor: props.isSatellite ? Colors.WHITE : Colors.PLANET_BLACK }}
      />
    </GeoJSONSource>
  )
}

export default SiteMapSource