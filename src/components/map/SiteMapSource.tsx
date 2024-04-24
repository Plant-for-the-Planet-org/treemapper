import { StyleProp } from 'react-native'
import React, { useEffect, useState } from 'react'
import MapLibreGL, { LineLayerStyle } from '@maplibre/maplibre-react-native'
import { Colors } from 'src/utils/constants'
import {useRealm } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { useSelector } from 'react-redux'
import { RootState } from 'src/store'
import { ProjectInterface } from 'src/types/interface/app.interface'

const polyline: StyleProp<LineLayerStyle> = {
  lineWidth: 2,
  lineColor: Colors.TEXT_COLOR,
  lineJoin: 'bevel',
}

const SiteMapSource = () => {
  const [geoJSON, setGeoJSON] = useState<any[]>([])
  const realm = useRealm()
  const { currentProject, projectSite } = useSelector(
    (state: RootState) => state.projectState,
  )

  useEffect(() => {
    if(currentProject && currentProject.projectId===''){
      return
    }
    const ProjectData = realm.objectForPrimaryKey<ProjectInterface>(
      RealmSchema.Projects,
      currentProject.projectId,
    )
    extractSiteCoordinates(ProjectData)

  }, [projectSite])

  const extractSiteCoordinates = (data: ProjectInterface) => {
    try {
      const allProjectSites = [...data.sites]
      const reducedSites = []
      for (let index = 0; index < allProjectSites.length; index++) {
        const siteDetails = allProjectSites[index]
        if (siteDetails && siteDetails.geometry) {
          const parsedData = JSON.parse(siteDetails.geometry)
          if (
            parsedData &&
            parsedData.coordinates &&
            parsedData.type === 'Polygon'
          ) {
            reducedSites.push({
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'Polygon',
                coordinates: [...parsedData.coordinates],
              },
            })
          }

          if (
            parsedData &&
            parsedData.coordinates &&
            parsedData.type === 'MultiPolygon'
          ) {
            reducedSites.push({
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'Polygon',
                coordinates: [...parsedData.coordinates[0]],
              },
            })
          }
        }
      }
      setGeoJSON(reducedSites)
    } catch (error) {
      console.log('error occured at siteGeojson', error)
    }
  }
  if (!geoJSON) {
    return null
  }
  return (
    <>
      {geoJSON.map((feature, i) => {
        return (
          <MapLibreGL.ShapeSource key={i} id={String(i)} shape={feature}>
            <MapLibreGL.LineLayer id={'polyline' + i} style={polyline} />
          </MapLibreGL.ShapeSource>
        )
      })}
    </>
  )
}

export default SiteMapSource
