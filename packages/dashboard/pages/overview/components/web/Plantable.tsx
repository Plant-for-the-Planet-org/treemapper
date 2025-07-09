import React, { useState, useRef, useEffect } from 'react';
import Map, { Source, Layer, Marker, NavigationControl, Popup, MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapPin, TreePine, Calendar, Activity, Ruler } from 'lucide-react';
import type { Feature, FeatureCollection, Point, Polygon } from 'geojson';
import { getProjectMapData } from '../../../../api/api.fetch';
import { useToken } from '../../../../context/TokenContext';
import useProjectStore from '../../../../store/useProjectStore'
// Define interfaces based on your backend schema
interface InterventionData {
  id: number;
  uid: string;
  hid: string;
  type: string;
  description?: string;
  treeCount: number;
  interventionStatus: string;
  registrationDate: string;
  interventionStartDate: string;
  interventionEndDate: string;
  location: any; // GeoJSON geometry
  image?: string;
  species: Array<{
    speciesName: string;
    count: number;
  }>;
}

interface TreeData {
  id: number;
  hid: string;
  uid: string;
  interventionId?: number;
  speciesName?: string;
  status: string;
  height?: number;
  width?: number;
  plantingDate?: string;
  location: any; // GeoJSON geometry
  image?: string;
  tag?: string;
}

interface MapData {
  interventions: InterventionData[];
  trees: TreeData[];
}

interface TooltipData {
  type: 'intervention' | 'tree';
  data: InterventionData | TreeData;
  x: number;
  y: number;
}

// Sample data based on your schema
const sampleMapData: MapData = {
  interventions: [
    {
      id: 1,
      uid: 'int-001',
      hid: 'BCN-1001',
      type: 'planting',
      description: 'Parc de la Ciutadella Extension reforestation project',
      treeCount: 24,
      interventionStatus: 'active',
      registrationDate: '2025-03-15T10:00:00Z',
      interventionStartDate: '2025-03-15T10:00:00Z',
      interventionEndDate: '2025-12-31T23:59:59Z',
      location: {
        type: 'Polygon',
        coordinates: [[
          [2.186, 41.386],
          [2.188, 41.386],
          [2.188, 41.388],
          [2.186, 41.388],
          [2.186, 41.386]
        ]]
      },
      species: [
        { speciesName: 'Stone Pine', count: 10 },
        { speciesName: 'European Oak', count: 8 },
        { speciesName: 'Mediterranean Cypress', count: 6 }
      ]
    },
    {
      id: 2,
      uid: 'int-002',
      hid: 'BCN-1042',
      type: 'maintenance',
      description: 'Diagonal Mar Park tree maintenance',
      treeCount: 15,
      interventionStatus: 'completed',
      registrationDate: '2025-02-18T10:00:00Z',
      interventionStartDate: '2025-02-18T10:00:00Z',
      interventionEndDate: '2025-03-18T10:00:00Z',
      location: {
        type: 'Polygon',
        coordinates: [[
          [2.215, 41.410],
          [2.218, 41.410],
          [2.218, 41.413],
          [2.215, 41.413],
          [2.215, 41.410]
        ]]
      },
      species: [
        { speciesName: 'White Poplar', count: 8 },
        { speciesName: 'Silver Birch', count: 7 }
      ]
    }
  ],
  trees: [
    {
      id: 1,
      hid: 'TREE-001',
      uid: 'tree-uid-001',
      interventionId: 1,
      speciesName: 'Stone Pine',
      status: 'alive',
      height: 2.5,
      width: 1.2,
      plantingDate: '2025-03-20T10:00:00Z',
      location: {
        type: 'Point',
        coordinates: [2.1865, 41.3865]
      },
      tag: 'SP-001'
    },
    {
      id: 2,
      hid: 'TREE-002',
      uid: 'tree-uid-002',
      interventionId: 1,
      speciesName: 'European Oak',
      status: 'alive',
      height: 1.8,
      width: 0.9,
      plantingDate: '2025-03-22T10:00:00Z',
      location: {
        type: 'Point',
        coordinates: [2.1870, 41.3870]
      },
      tag: 'EO-001'
    },
    {
      id: 3,
      hid: 'TREE-003',
      uid: 'tree-uid-003',
      interventionId: 2,
      speciesName: 'White Poplar',
      status: 'needs_attention',
      height: 3.2,
      width: 1.5,
      plantingDate: '2025-02-25T10:00:00Z',
      location: {
        type: 'Point',
        coordinates: [2.2165, 41.4115]
      },
      tag: 'WP-001'
    },
    {
      id: 4,
      hid: 'TREE-004',
      uid: 'tree-uid-004',
      speciesName: 'Silver Birch',
      status: 'alive',
      height: 2.1,
      width: 1.0,
      plantingDate: '2025-04-01T10:00:00Z',
      location: {
        type: 'Point',
        coordinates: [2.150, 41.400]
      },
      tag: 'SB-001'
    }
  ]
};

// Convert data to GeoJSON format
const createInterventionGeoJSON = (interventions: InterventionData[]): FeatureCollection => ({
  type: 'FeatureCollection',
  features: interventions.map(intervention => ({
    type: 'Feature',
    properties: intervention,
    geometry: intervention.location
  }))
});

const createTreeGeoJSON = (trees: TreeData[]): FeatureCollection => ({
  type: 'FeatureCollection',
  features: trees.map(tree => ({
    type: 'Feature',
    properties: tree,
    geometry: tree.location
  }))
});

// Layer styles
const interventionFillLayer = {
  id: 'interventions-fill',
  type: 'fill' as const,
  paint: {
    'fill-color': [
      'case',
      ['==', ['get', 'interventionStatus'], 'active'], '#007A49',
      ['==', ['get', 'interventionStatus'], 'completed'], '#28a745',
      ['==', ['get', 'interventionStatus'], 'planned'], '#6c757d',
      '#007A49'
    ],
    'fill-opacity': 0.3
  }
};

const interventionOutlineLayer = {
  id: 'interventions-outline',
  type: 'line' as const,
  paint: {
    'line-color': '#007A49',
    'line-width': 2
  }
};

const treeLayer = {
  id: 'trees-circle',
  type: 'circle' as const,
  paint: {
    'circle-radius': [
      'case',
      ['==', ['get', 'status'], 'alive'], 6,
      ['==', ['get', 'status'], 'needs_attention'], 8,
      ['==', ['get', 'status'], 'dead'], 5,
      6
    ],
    'circle-color': [
      'case',
      ['==', ['get', 'status'], 'alive'], '#007A49',
      ['==', ['get', 'status'], 'needs_attention'], '#ffc107',
      ['==', ['get', 'status'], 'dead'], '#dc3545',
      '#007A49'
    ],
    'circle-stroke-width': 2,
    'circle-stroke-color': '#ffffff'
  }
};

// Tooltip component
const Tooltip = ({ tooltipData }: { tooltipData: TooltipData | null }) => {
  if (!tooltipData) return null;

  const { type, data, x, y } = tooltipData;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#007A49';
      case 'completed': return '#28a745';
      case 'planned': return '#6c757d';
      case 'alive': return '#007A49';
      case 'needs_attention': return '#ffc107';
      case 'dead': return '#dc3545';
      default: return '#007A49';
    }
  };

  return (
    <div
      className="absolute bg-white rounded-lg shadow-lg border p-3 z-50 max-w-xs"
      style={{
        left: x + 10,
        top: y - 10,
        pointerEvents: 'none'
      }}
    >
      {type === 'intervention' ? (
        <div>
          <div className="flex items-center mb-2">
            <div
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: getStatusColor((data as InterventionData).interventionStatus) }}
            />
            <h3 className="font-semibold text-gray-800 text-sm">
              Intervention {(data as InterventionData).hid}
            </h3>
          </div>
          <div className="space-y-1 text-xs text-gray-600">
            <div className="flex items-center">
              <Activity className="w-3 h-3 mr-1" />
              <span className="font-medium">Type:</span> {(data as InterventionData).type}
            </div>
            <div className="flex items-center">
              <TreePine className="w-3 h-3 mr-1" />
              <span className="font-medium">Trees:</span> {(data as InterventionData).treeCount}
            </div>
            <div className="flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              <span className="font-medium">Start:</span> {formatDate((data as InterventionData).interventionStartDate)}
            </div>
            {(data as InterventionData).description && (
              <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                {(data as InterventionData).description}
              </div>
            )}
            {(data as InterventionData).species.length > 0 && (
              <div className="mt-2">
                <span className="font-medium text-xs">Species:</span>
                {/* <div className="text-xs text-gray-500">
                  {(data as InterventionData).species.map(s => s.speciesName).join(', ')}
                </div> */}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-center mb-2">
            <div
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: getStatusColor((data as TreeData).status) }}
            />
            <h3 className="font-semibold text-gray-800 text-sm">
              Tree {(data as TreeData).hid}
            </h3>
          </div>
          <div className="space-y-1 text-xs text-gray-600">
            <div className="flex items-center">
              <TreePine className="w-3 h-3 mr-1" />
              <span className="font-medium">Species:</span> {(data as TreeData).speciesName || 'Unknown'}
            </div>
            <div className="flex items-center">
              <Activity className="w-3 h-3 mr-1" />
              <span className="font-medium">Status:</span> {(data as TreeData).status}
            </div>
            {(data as TreeData).height && (
              <div className="flex items-center">
                <Ruler className="w-3 h-3 mr-1" />
                <span className="font-medium">Height:</span> {(data as TreeData).height}m
              </div>
            )}
            {(data as TreeData).plantingDate && (
              <div className="flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                <span className="font-medium">Planted:</span> {formatDate((data as TreeData).plantingDate)}
              </div>
            )}
            {(data as TreeData).tag && (
              <div className="text-xs text-gray-500 mt-1">
                Tag: {(data as TreeData).tag}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Main component
const TreeInterventionMap = () => {
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);
  const mapRef = useRef<MapRef>(null);
  const { accessToken } = useToken()
  const selectedProject = useProjectStore(state => state.selectedProject)
  const [interventionGeoJSON, setInterventionGeoJSON] = useState(null)
  const [treeGeoJSON, setTreeGeoJSON] = useState(null)

  useEffect(() => {
    console.log("MNK", "mpunted")
    fetchData()
  }, [])

  const fetchData = async () => {
    const respones = await getProjectMapData(accessToken, selectedProject?.uid)
    if (respones.statusCode === 200) {
      try {
        setInterventionGeoJSON(createInterventionGeoJSON(respones.data.interventions))
        setTreeGeoJSON(createTreeGeoJSON(respones.data.trees))

      } catch (error) {

      }
    }
  }
  // Create GeoJSON data


  // Handle mouse move for tooltips
  const handleMouseMove = (event: any) => {
    if (!mapRef.current) return;

    const features = mapRef.current.queryRenderedFeatures(event.point, {
      layers: ['interventions-fill', 'trees-circle']
    });

    if (features.length > 0) {
      const feature = features[0];
      const isIntervention = feature.layer.id === 'interventions-fill';
      if (tooltipData) {
        setTooltipData(null);
      }
      setTooltipData({
        type: isIntervention ? 'intervention' : 'tree',
        data: feature.properties as any,
        x: event.point.x,
        y: event.point.y
      });
    }
  };

  const handleMouseLeave = () => {
    setTooltipData(null);
  };

  return (
    <div className="w-full h-full bg-gray-50 relative">
      <div className="w-full h-full">
        <Map
          ref={mapRef}
          mapLib={import('maplibre-gl')}
          mapStyle={{
            "version": 8,
            "metadata": "Tree Intervention Map",
            "name": "Tree Map",
            "bearing": 0,
            "pitch": 0,
            "zoom": 4,
            "center": [69.3451, 30.3753],
            "sources": {
              "imagery": {
                "type": "raster",
                "tiles": [
                  "https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                ],
                "tileSize": 256,
                "minzoom": 0,
                "maxzoom": 24
              }
            },
            "id": "Imagery",
            "layers": [
              {
                "id": "Imagery",
                "type": "raster",
                "source": "imagery",
                "minzoom": 0,
                "maxzoom": 24,
                "layout": { "visibility": "visible" }
              }
            ]
          }}
          onClick={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ width: '100%', height: '100%' }}
          interactiveLayerIds={['interventions-fill', 'trees-circle']}
        >
          {/* Intervention Polygons */}
          <Source id="interventions" type="geojson" data={interventionGeoJSON}>
            <Layer {...interventionFillLayer} />
            <Layer {...interventionOutlineLayer} />
          </Source>

          {/* Tree Points */}
          <Source id="trees" type="geojson" data={treeGeoJSON}>
            <Layer {...treeLayer} />
          </Source>

          <NavigationControl position="bottom-right" />
        </Map>
      </div>

      {/* Tooltip */}
      <Tooltip tooltipData={tooltipData} />
    </div>
  );
};

export default TreeInterventionMap;