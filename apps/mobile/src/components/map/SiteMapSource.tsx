import { StyleProp } from 'react-native'
import React, { useMemo } from 'react'
import { GeoJSONSource, Layer, LineLayerStyle } from '@maplibre/maplibre-react-native'
import { Colors } from 'src/utils/constants'
import { useQuery } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { useSelector } from 'react-redux'
import { RootState } from 'src/store'

const polyline: StyleProp<LineLayerStyle> = {
  lineWidth: 2,
  lineColor: Colors.TEXT_COLOR,
  lineJoin: 'bevel',
}

interface Props {
  isSatellite: boolean
  // When set, only the boundary of this site is drawn (e.g. the site picked
  // for an intervention). When omitted, all sites are drawn (home map).
  siteId?: string
}

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

const SiteMapSource = (props: Props) => {
  const { projectAdded } = useSelector(
    (state: RootState) => state.projectState,
  )
  // Live Realm collection: re-renders whenever projects or their sites change.
  // This is what makes freshly synced site boundaries appear immediately,
  // instead of only after the app is closed and reopened.
  const projects = useQuery(RealmSchema.Projects, data => data)

  const geoJSON = useMemo(() => {
    if (!projectAdded) {
      return []
    }
    const reducedSites: any[] = []
    try {
      for (const project of projects) {
        const sites = (project as any).sites || []
        for (const siteDetails of sites) {
          if (!siteDetails?.geometry) {
            continue
          }
          if (props.siteId && siteDetails.id !== props.siteId) {
            continue
          }
          const parsedData = JSON.parse(siteDetails.geometry)
          // Stored geometry can be a FeatureCollection, a Feature, or a bare geometry.
          if (parsedData?.type === 'FeatureCollection' && Array.isArray(parsedData.features)) {
            for (const feature of parsedData.features) {
              const polygon = toPolygonFeature(feature?.geometry)
              if (polygon) {
                reducedSites.push(polygon)
              }
            }
          } else if (parsedData?.type === 'Feature') {
            const polygon = toPolygonFeature(parsedData.geometry)
            if (polygon) {
              reducedSites.push(polygon)
            }
          } else {
            const polygon = toPolygonFeature(parsedData)
            if (polygon) {
              reducedSites.push(polygon)
            }
          }
        }
      }
    } catch (error) {
      console.error('error occurred at siteGeojson', error)
    }
    return reducedSites
  }, [projects, projectAdded, props.siteId])

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
