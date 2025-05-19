import React, { useState, useEffect, useRef } from 'react';
import Map, { Source, Layer, Marker, NavigationControl, Popup, MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  Layers,
  Users,
  Filter,
  Calendar,
  BarChart4,
  Droplet,
  Leaf,
  ThumbsUp,
  AlertTriangle,
  Trees
} from 'lucide-react';
import type { Feature, FeatureCollection, Polygon } from 'geojson';

// Define interfaces for type safety
interface Species {
  name: string;
  count: number;
  survivalRate: number;
}

interface PollutionReduction {
  co2: number;
  particulates: number;
  history: Array<{
    month: string;
    value: number;
  }>;
}

interface AreaProperties {
  id: string;
  HID: string;
  name: string;
  area: number;
  suitabilityScore: number;
  approvedBy: string;
  approvedDate: string;
  submittedBy: string;
  submittedDate: string;
  treesPlanted: number;
  treesPlannedTotal: number;
  partners: string[];
  species: Species[];
  pollutionReduction: PollutionReduction;
  survivalRate: number;
  lastInspection: string;
}

// Sample GeoJSON data for plantable areas
const sampleGeoJSON: FeatureCollection<Polygon, AreaProperties> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 'PLA-001',
        HID: 'BCN-1001',
        name: 'Parc de la Ciutadella Extension',
        area: 5000,
        suitabilityScore: 92,
        approvedBy: 'Maria Garcia',
        approvedDate: '2025-03-15',
        submittedBy: 'Jordi Puig',
        submittedDate: '2025-03-01',
        treesPlanted: 24,
        treesPlannedTotal: 50,
        partners: ['Barcelona Green Initiative', 'Ciutadella Business Association'],
        species: [
          { name: 'Stone Pine', count: 10, survivalRate: 0.9 },
          { name: 'European Oak', count: 8, survivalRate: 1.0 },
          { name: 'Mediterranean Cypress', count: 6, survivalRate: 0.83 }
        ],
        pollutionReduction: {
          co2: 240,
          particulates: 18,
          history: [
            { month: 'Jan', value: 180 },
            { month: 'Feb', value: 210 },
            { month: 'Mar', value: 240 }
          ]
        },
        survivalRate: 0.92,
        lastInspection: '2025-04-10'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [2.186, 41.386],
          [2.188, 41.386],
          [2.188, 41.388],
          [2.186, 41.388],
          [2.186, 41.386]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'PLA-002',
        HID: 'BCN-1042',
        name: 'Diagonal Mar Park Extension',
        area: 3200,
        suitabilityScore: 85,
        approvedBy: 'Carlos Rodriguez',
        approvedDate: '2025-02-18',
        submittedBy: 'Emma Torres',
        submittedDate: '2025-02-05',
        treesPlanted: 15,
        treesPlannedTotal: 30,
        partners: ['Mar Conservation Fund'],
        species: [
          { name: 'White Poplar', count: 8, survivalRate: 0.88 },
          { name: 'Silver Birch', count: 7, survivalRate: 0.86 }
        ],
        pollutionReduction: {
          co2: 150,
          particulates: 12,
          history: [
            { month: 'Jan', value: 100 },
            { month: 'Feb', value: 130 },
            { month: 'Mar', value: 150 }
          ]
        },
        survivalRate: 0.87,
        lastInspection: '2025-04-05'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [2.215, 41.410],
          [2.218, 41.410],
          [2.218, 41.413],
          [2.215, 41.413],
          [2.215, 41.410]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'PLA-003',
        HID: 'BCN-1078',
        name: 'Gràcia Community Garden',
        area: 1800,
        suitabilityScore: 78,
        approvedBy: 'David Martinez',
        approvedDate: '2025-03-22',
        submittedBy: 'Sofia Kim',
        submittedDate: '2025-03-10',
        treesPlanted: 8,
        treesPlannedTotal: 15,
        partners: ['Gràcia Garden Alliance', 'Neighborhood Association'],
        species: [
          { name: 'Cherry', count: 3, survivalRate: 1.0 },
          { name: 'Olive', count: 5, survivalRate: 0.8 }
        ],
        pollutionReduction: {
          co2: 80,
          particulates: 6,
          history: [
            { month: 'Mar', value: 60 },
            { month: 'Apr', value: 80 }
          ]
        },
        survivalRate: 0.75,
        lastInspection: '2025-04-18'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [2.174, 41.403],
          [2.176, 41.403],
          [2.176, 41.404],
          [2.174, 41.404],
          [2.174, 41.403]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'PLA-015',
        HID: 'BCN-1452',
        name: 'Pedralbes Monastery Gardens',
        area: 2800,
        suitabilityScore: 84,
        approvedBy: 'Ana Dominguez',
        approvedDate: '2025-02-15',
        submittedBy: 'Pere Casals',
        submittedDate: '2025-01-30',
        treesPlanted: 18,
        treesPlannedTotal: 25,
        partners: ['Heritage Conservation Trust', 'University of Barcelona'],
        species: [
          { name: 'Holm Oak', count: 8, survivalRate: 0.87 },
          { name: 'Cypress', count: 6, survivalRate: 0.83 },
          { name: 'Olive', count: 4, survivalRate: 1.0 }
        ],
        pollutionReduction: {
          co2: 180,
          particulates: 14,
          history: [
            { month: 'Feb', value: 140 },
            { month: 'Mar', value: 160 },
            { month: 'Apr', value: 180 }
          ]
        },
        survivalRate: 0.89,
        lastInspection: '2025-04-14'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [2.114, 41.393],
          [2.117, 41.393],
          [2.117, 41.395],
          [2.114, 41.395],
          [2.114, 41.393]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'PLA-016',
        HID: 'BCN-1478',
        name: 'Rambla del Raval Enhancement',
        area: 1600,
        suitabilityScore: 76,
        approvedBy: 'Lluís Teixidor',
        approvedDate: '2025-03-18',
        submittedBy: 'Fatima Hassan',
        submittedDate: '2025-03-02',
        treesPlanted: 12,
        treesPlannedTotal: 18,
        partners: ['El Raval Community Association', 'Urban Renewal Initiative'],
        species: [
          { name: 'Palm', count: 12, survivalRate: 0.83 }
        ],
        pollutionReduction: {
          co2: 120,
          particulates: 11,
          history: [
            { month: 'Mar', value: 90 },
            { month: 'Apr', value: 120 }
          ]
        },
        survivalRate: 0.83,
        lastInspection: '2025-04-16'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [2.168, 41.378],
          [2.170, 41.378],
          [2.170, 41.380],
          [2.168, 41.380],
          [2.168, 41.378]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'PLA-017',
        HID: 'BCN-1497',
        name: 'Barceloneta Market Surroundings',
        area: 900,
        suitabilityScore: 65,
        approvedBy: 'Carlos Rodriguez',
        approvedDate: '2025-03-30',
        submittedBy: 'Lucia Bonet',
        submittedDate: '2025-03-15',
        treesPlanted: 6,
        treesPlannedTotal: 12,
        partners: ['Market Vendors Association'],
        species: [
          { name: 'Orange', count: 6, survivalRate: 0.83 }
        ],
        pollutionReduction: {
          co2: 60,
          particulates: 5,
          history: [
            { month: 'Apr', value: 60 }
          ]
        },
        survivalRate: 0.83,
        lastInspection: '2025-04-25'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [2.186, 41.381],
          [2.187, 41.381],
          [2.187, 41.382],
          [2.186, 41.382],
          [2.186, 41.381]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'PLA-018',
        HID: 'BCN-1512',
        name: 'La Rambla Central Median',
        area: 1100,
        suitabilityScore: 69,
        approvedBy: 'Maria Garcia',
        approvedDate: '2025-03-05',
        submittedBy: 'Jordi Sala',
        submittedDate: '2025-02-15',
        treesPlanted: 10,
        treesPlannedTotal: 15,
        partners: ['Friends of La Rambla', 'Tourism Sustainability Fund'],
        species: [
          { name: 'Palm', count: 5, survivalRate: 0.8 },
          { name: 'Orange', count: 5, survivalRate: 0.6 }
        ],
        pollutionReduction: {
          co2: 70,
          particulates: 9,
          history: [
            { month: 'Mar', value: 50 },
            { month: 'Apr', value: 70 }
          ]
        },
        survivalRate: 0.7,
        lastInspection: '2025-04-12'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [2.172, 41.383],
          [2.173, 41.383],
          [2.173, 41.385],
          [2.172, 41.385],
          [2.172, 41.383]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'PLA-019',
        HID: 'BCN-1531',
        name: 'Camp Nou Surroundings',
        area: 3500,
        suitabilityScore: 80,
        approvedBy: 'David Martinez',
        approvedDate: '2025-02-28',
        submittedBy: 'Xavier Pujol',
        submittedDate: '2025-02-10',
        treesPlanted: 20,
        treesPlannedTotal: 40,
        partners: ['FC Barcelona Foundation', 'Les Corts District'],
        species: [
          { name: 'London Plane', count: 12, survivalRate: 0.83 },
          { name: 'Holm Oak', count: 8, survivalRate: 0.75 }
        ],
        pollutionReduction: {
          co2: 200,
          particulates: 15,
          history: [
            { month: 'Feb', value: 150 },
            { month: 'Mar', value: 180 },
            { month: 'Apr', value: 200 }
          ]
        },
        survivalRate: 0.8,
        lastInspection: '2025-04-08'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [2.120, 41.380],
          [2.124, 41.380],
          [2.124, 41.383],
          [2.120, 41.383],
          [2.120, 41.380]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'PLA-020',
        HID: 'BCN-1556',
        name: 'Vall d\'Hebron Green Belt',
        area: 4500,
        suitabilityScore: 91,
        approvedBy: 'Ana Dominguez',
        approvedDate: '2025-01-20',
        submittedBy: 'Miquel Soler',
        submittedDate: '2025-01-05',
        treesPlanted: 35,
        treesPlannedTotal: 70,
        partners: ['Hospital Vall d\'Hebron', 'Urban Forests Initiative', 'Neighborhood Council'],
        species: [
          { name: 'Stone Pine', count: 15, survivalRate: 0.93 },
          { name: 'Holm Oak', count: 12, survivalRate: 0.91 },
          { name: 'Cork Oak', count: 8, survivalRate: 0.87 }
        ],
        pollutionReduction: {
          co2: 350,
          particulates: 28,
          history: [
            { month: 'Jan', value: 250 },
            { month: 'Feb', value: 290 },
            { month: 'Mar', value: 320 },
            { month: 'Apr', value: 350 }
          ]
        },
        survivalRate: 0.91,
        lastInspection: '2025-04-05'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [2.140, 41.428],
          [2.145, 41.428],
          [2.145, 41.432],
          [2.140, 41.432],
          [2.140, 41.428]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'PLA-004',
        HID: 'BCN-1132',
        name: 'Avinguda Diagonal Median',
        area: 1200,
        suitabilityScore: 70,
        approvedBy: 'Lluís Teixidor',
        approvedDate: '2025-02-28',
        submittedBy: 'Jaume Brugués',
        submittedDate: '2025-02-15',
        treesPlanted: 10,
        treesPlannedTotal: 10,
        partners: ['Urban Beautification Fund'],
        species: [
          { name: 'Palm', count: 10, survivalRate: 0.9 }
        ],
        pollutionReduction: {
          co2: 100,
          particulates: 8,
          history: [
            { month: 'Feb', value: 70 },
            { month: 'Mar', value: 85 },
            { month: 'Apr', value: 100 }
          ]
        },
        survivalRate: 0.9,
        lastInspection: '2025-04-02'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [2.150, 41.397],
          [2.153, 41.397],
          [2.153, 41.399],
          [2.150, 41.399],
          [2.150, 41.397]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'PLA-005',
        HID: 'BCN-1201',
        name: 'Parc Güell Addition',
        area: 4200,
        suitabilityScore: 89,
        approvedBy: 'Maria Garcia',
        approvedDate: '2025-03-05',
        submittedBy: 'Robert Ferrer',
        submittedDate: '2025-02-20',
        treesPlanted: 20,
        treesPlannedTotal: 40,
        partners: ['Barcelona Parks Foundation', 'Green Future Initiative'],
        species: [
          { name: 'Carob', count: 12, survivalRate: 0.92 },
          { name: 'European Oak', count: 8, survivalRate: 0.88 }
        ],
        pollutionReduction: {
          co2: 200,
          particulates: 15,
          history: [
            { month: 'Feb', value: 150 },
            { month: 'Mar', value: 175 },
            { month: 'Apr', value: 200 }
          ]
        },
        survivalRate: 0.9,
        lastInspection: '2025-04-12'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [2.150, 41.414],
          [2.154, 41.414],
          [2.154, 41.417],
          [2.150, 41.417],
          [2.150, 41.414]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'PLA-006',
        HID: 'BCN-1245',
        name: 'Montjuïc Hill Reforestation',
        area: 6500,
        suitabilityScore: 94,
        approvedBy: 'Ana Dominguez',
        approvedDate: '2025-01-20',
        submittedBy: 'Marc Roig',
        submittedDate: '2025-01-05',
        treesPlanted: 45,
        treesPlannedTotal: 100,
        partners: ['Olympic Legacy Fund', 'Barcelona Environmental Agency'],
        species: [
          { name: 'Stone Pine', count: 20, survivalRate: 0.95 },
          { name: 'Holm Oak', count: 15, survivalRate: 0.93 },
          { name: 'Aleppo Pine', count: 10, survivalRate: 0.9 }
        ],
        pollutionReduction: {
          co2: 450,
          particulates: 35,
          history: [
            { month: 'Jan', value: 300 },
            { month: 'Feb', value: 380 },
            { month: 'Mar', value: 420 },
            { month: 'Apr', value: 450 }
          ]
        },
        survivalRate: 0.93,
        lastInspection: '2025-04-18'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [2.158, 41.364],
          [2.162, 41.364],
          [2.162, 41.368],
          [2.158, 41.368],
          [2.158, 41.364]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'PLA-007',
        HID: 'BCN-1267',
        name: 'El Poblenou Green Corridor',
        area: 2800,
        suitabilityScore: 82,
        approvedBy: 'Carlos Rodriguez',
        approvedDate: '2025-02-05',
        submittedBy: 'Paula Vidal',
        submittedDate: '2025-01-15',
        treesPlanted: 18,
        treesPlannedTotal: 35,
        partners: ['22@ District Association', 'Tech Companies Consortium'],
        species: [
          { name: 'London Plane', count: 10, survivalRate: 0.9 },
          { name: 'Nettle Tree', count: 8, survivalRate: 0.87 }
        ],
        pollutionReduction: {
          co2: 180,
          particulates: 14,
          history: [
            { month: 'Feb', value: 140 },
            { month: 'Mar', value: 160 },
            { month: 'Apr', value: 180 }
          ]
        },
        survivalRate: 0.89,
        lastInspection: '2025-04-08'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [2.196, 41.400],
          [2.199, 41.400],
          [2.199, 41.403],
          [2.196, 41.403],
          [2.196, 41.400]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'PLA-008',
        HID: 'BCN-1289',
        name: 'Barceloneta Beach Enhancement',
        area: 1800,
        suitabilityScore: 75,
        approvedBy: 'Lluís Teixidor',
        approvedDate: '2025-03-10',
        submittedBy: 'Clara Rodriguez',
        submittedDate: '2025-02-20',
        treesPlanted: 12,
        treesPlannedTotal: 20,
        partners: ['Beach Restoration Alliance', 'Tourism Board'],
        species: [
          { name: 'Tamarisk', count: 7, survivalRate: 0.85 },
          { name: 'Palm', count: 5, survivalRate: 0.8 }
        ],
        pollutionReduction: {
          co2: 120,
          particulates: 9,
          history: [
            { month: 'Mar', value: 90 },
            { month: 'Apr', value: 120 }
          ]
        },
        survivalRate: 0.83,
        lastInspection: '2025-04-22'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [2.188, 41.378],
          [2.192, 41.378],
          [2.192, 41.380],
          [2.188, 41.380],
          [2.188, 41.378]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'PLA-009',
        HID: 'BCN-1312',
        name: 'Tibidabo Mountain Trail',
        area: 5100,
        suitabilityScore: 88,
        approvedBy: 'Ana Dominguez',
        approvedDate: '2025-01-30',
        submittedBy: 'Joan Puigdollers',
        submittedDate: '2025-01-10',
        treesPlanted: 30,
        treesPlannedTotal: 60,
        partners: ['Collserola Natural Park', 'Hiking Association'],
        species: [
          { name: 'Holm Oak', count: 15, survivalRate: 0.93 },
          { name: 'Cork Oak', count: 10, survivalRate: 0.9 },
          { name: 'Pine', count: 5, survivalRate: 0.8 }
        ],
        pollutionReduction: {
          co2: 300,
          particulates: 22,
          history: [
            { month: 'Jan', value: 200 },
            { month: 'Feb', value: 250 },
            { month: 'Mar', value: 280 },
            { month: 'Apr', value: 300 }
          ]
        },
        survivalRate: 0.9,
        lastInspection: '2025-04-15'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [2.120, 41.422],
          [2.125, 41.422],
          [2.125, 41.426],
          [2.120, 41.426],
          [2.120, 41.422]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'PLA-010',
        HID: 'BCN-1358',
        name: 'Sant Andreu Railway Path',
        area: 2200,
        suitabilityScore: 79,
        approvedBy: 'David Martinez',
        approvedDate: '2025-02-22',
        submittedBy: 'Montse Vila',
        submittedDate: '2025-02-05',
        treesPlanted: 14,
        treesPlannedTotal: 25,
        partners: ['Railways Heritage Foundation', 'Sant Andreu District'],
        species: [
          { name: 'London Plane', count: 8, survivalRate: 0.87 },
          { name: 'Horse Chestnut', count: 6, survivalRate: 0.83 }
        ],
        pollutionReduction: {
          co2: 140,
          particulates: 11,
          history: [
            { month: 'Feb', value: 100 },
            { month: 'Mar', value: 120 },
            { month: 'Apr', value: 140 }
          ]
        },
        survivalRate: 0.86,
        lastInspection: '2025-04-05'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [2.189, 41.435],
          [2.193, 41.435],
          [2.193, 41.438],
          [2.189, 41.438],
          [2.189, 41.435]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'PLA-011',
        HID: 'BCN-1376',
        name: 'Sants Station Green Roof',
        area: 1500,
        suitabilityScore: 72,
        approvedBy: 'Lluís Teixidor',
        approvedDate: '2025-03-15',
        submittedBy: 'Anna Costa',
        submittedDate: '2025-02-25',
        treesPlanted: 0,
        treesPlannedTotal: 0,
        partners: ['Barcelona Transport Authority', 'Sustainable Roofs Initiative'],
        species: [
          { name: 'Lavender', count: 200, survivalRate: 0.95 },
          { name: 'Rosemary', count: 150, survivalRate: 0.92 },
          { name: 'Thyme', count: 100, survivalRate: 0.9 }
        ],
        pollutionReduction: {
          co2: 75,
          particulates: 12,
          history: [
            { month: 'Mar', value: 50 },
            { month: 'Apr', value: 75 }
          ]
        },
        survivalRate: 0.93,
        lastInspection: '2025-04-20'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [2.136, 41.378],
          [2.139, 41.378],
          [2.139, 41.381],
          [2.136, 41.381],
          [2.136, 41.378]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'PLA-012',
        HID: 'BCN-1395',
        name: 'Forum Park Expansion',
        area: 3800,
        suitabilityScore: 86,
        approvedBy: 'Carlos Rodriguez',
        approvedDate: '2025-01-25',
        submittedBy: 'Sandra Lopez',
        submittedDate: '2025-01-10',
        treesPlanted: 22,
        treesPlannedTotal: 45,
        partners: ['Forum Foundation', 'Besòs River Consortium'],
        species: [
          { name: 'Hackberry', count: 10, survivalRate: 0.9 },
          { name: 'Stone Pine', count: 7, survivalRate: 0.85 },
          { name: 'Holm Oak', count: 5, survivalRate: 0.8 }
        ],
        pollutionReduction: {
          co2: 220,
          particulates: 16,
          history: [
            { month: 'Jan', value: 160 },
            { month: 'Feb', value: 180 },
            { month: 'Mar', value: 200 },
            { month: 'Apr', value: 220 }
          ]
        },
        survivalRate: 0.86,
        lastInspection: '2025-04-10'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [2.223, 41.410],
          [2.227, 41.410],
          [2.227, 41.414],
          [2.223, 41.414],
          [2.223, 41.410]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'PLA-013',
        HID: 'BCN-1413',
        name: 'Horta Labyrinth Gardens',
        area: 2600,
        suitabilityScore: 83,
        approvedBy: 'Maria Garcia',
        approvedDate: '2025-02-10',
        submittedBy: 'Oriol Mas',
        submittedDate: '2025-01-25',
        treesPlanted: 16,
        treesPlannedTotal: 30,
        partners: ['Historical Gardens Trust', 'Horta-Guinardó District'],
        species: [
          { name: 'Cypress', count: 8, survivalRate: 0.87 },
          { name: 'Bay Laurel', count: 5, survivalRate: 0.8 },
          { name: 'Magnolia', count: 3, survivalRate: 0.66 }
        ],
        pollutionReduction: {
          co2: 160,
          particulates: 13,
          history: [
            { month: 'Feb', value: 120 },
            { month: 'Mar', value: 140 },
            { month: 'Apr', value: 160 }
          ]
        },
        survivalRate: 0.81,
        lastInspection: '2025-04-08'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [2.148, 41.440],
          [2.152, 41.440],
          [2.152, 41.443],
          [2.148, 41.443],
          [2.148, 41.440]
        ]]
      }
    }
  ]
};

// Define heatmap layer style based on suitability score
const heatmapLayer = {
  id: 'plantable-areas-heat',
  type: 'heatmap' as const,
  paint: {
    'heatmap-weight': [
      'interpolate',
      ['linear'],
      ['get', 'suitabilityScore'],
      60, 0,
      95, 1
    ],
    'heatmap-intensity': 1,
    'heatmap-color': [
      'interpolate',
      ['linear'],
      ['heatmap-density'],
      0, 'rgba(33,102,172,0)',
      0.2, 'rgb(103,169,207)',
      0.4, 'rgb(209,229,240)',
      0.6, 'rgb(253,219,199)',
      0.8, 'rgb(239,138,98)',
      1, 'rgb(178,24,43)'
    ],
    'heatmap-radius': 25,
    'heatmap-opacity': 0.8
  }
};

// Define fill layer for polygons
const fillLayer = {
  id: 'plantable-areas-fill',
  type: 'fill' as const,
  paint: {
    'fill-color': [
      'interpolate',
      ['linear'],
      ['get', 'suitabilityScore'],
      60, '#21669C',
      70, '#67A9CF',
      80, '#D1E5F0',
      90, '#FDDBCB',
      95, '#EF8A62'
    ],
    'fill-opacity': 0.5
  }
};

// Define outline layer for polygons
const outlineLayer = {
  id: 'plantable-areas-outline',
  type: 'line' as const,
  paint: {
    'line-color': '#fff',
    'line-width': 1
  }
};

// Mini-chart component for the sidebar
const MiniChart = ({ data, title, color }: { data: Array<{ month: string; value: number }> | undefined; title: string; color: string }) => {
  if (!data || data.length === 0) {
    return (
      <div className="w-full mt-2">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <div className="h-12 w-full flex items-center justify-center">
          <p className="text-sm text-gray-500">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mt-2">
      <p className="text-sm font-medium text-gray-600">{title}</p>
      <div className="h-12 w-full flex items-end">
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center" style={{ width: `${100 / data.length}%` }}>
            <div
              className="w-4 rounded-t"
              style={{
                backgroundColor: color,
                height: `${(item.value / Math.max(...data.map(d => d.value))) * 40}px`
              }}
            ></div>
            <span className="text-xs mt-1">{item.month}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Gauge component for showing rates and percentages
const Gauge = ({ value, title, color }) => {
  const percentage = Math.round(value * 100);
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-16 h-8 overflow-hidden">
        <div className="absolute w-16 h-16 rounded-full bg-gray-200 top-8"></div>
        <div
          className="absolute w-16 h-16 rounded-full top-8 origin-top-center"
          style={{
            backgroundColor: color,
            transform: `rotate(${180 * value}deg)`,
            clipPath: 'polygon(50% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%)'
          }}
        ></div>
        <div className="absolute w-10 h-10 rounded-full bg-white top-10 left-3"></div>
      </div>
      <p className="text-lg font-semibold">{percentage}%</p>
      <p className="text-xs text-gray-600">{title}</p>
    </div>
  );
};

// Main component
const PlantableAreasMap = () => {
  const [viewport, setViewport] = useState({
    longitude: -74.0,
    latitude: 40.72,
    zoom: 12
  });

  const [selectedArea, setSelectedArea] = useState<AreaProperties | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    minSuitability: 60,
    approvalDate: 'all',
    hasPartners: false,
    treeCount: 'all'
  });

  const mapRef = useRef<MapRef>(null);

  // Filter GeoJSON data based on search and filters
  const filteredGeoJSON: FeatureCollection<Polygon, AreaProperties> = {
    type: 'FeatureCollection',
    features: sampleGeoJSON.features.filter(feature => {
      const properties = feature.properties;
      if (!properties) return false;

      // Search filter - search across multiple fields
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const searchableFields = [
          properties.name,
          properties.id,
          properties.HID
        ];

        const hasMatch = searchableFields.some(field =>
          field.toLowerCase().includes(searchLower)
        );

        if (!hasMatch) {
          return false;
        }
      }

      // Suitability filter
      if (properties.suitabilityScore < activeFilters.minSuitability) {
        return false;
      }

      // Approval date filter
      if (activeFilters.approvalDate !== 'all') {
        const approvalDate = new Date(properties.approvedDate);
        const today = new Date();
        const monthDiff = (today.getFullYear() - approvalDate.getFullYear()) * 12 +
          today.getMonth() - approvalDate.getMonth();

        if (activeFilters.approvalDate === 'lastMonth' && monthDiff > 1) return false;
        if (activeFilters.approvalDate === 'lastQuarter' && monthDiff > 3) return false;
        if (activeFilters.approvalDate === 'lastYear' && monthDiff > 12) return false;
      }

      // Partners filter
      if (activeFilters.hasPartners && properties.partners.length === 0) {
        return false;
      }

      // Tree count filter
      if (activeFilters.treeCount === 'lessThan10' && properties.treesPlanted >= 10) return false;
      if (activeFilters.treeCount === '10to20' && (properties.treesPlanted < 10 || properties.treesPlanted > 20)) return false;
      if (activeFilters.treeCount === 'moreThan20' && properties.treesPlanted <= 20) return false;

      return true;
    })
  };

  // Handle map click
  const handleMapClick = (event: any) => {
    if (!mapRef.current) return;

    const features = mapRef.current.queryRenderedFeatures(event.point, {
      layers: ['plantable-areas-fill']
    });

    if (features.length > 0) {
      const properties = features[0].properties;
      if (properties) {
        // Parse species and partners if they are strings
        const parsedProperties = {
          ...properties,
          species: typeof properties.species === 'string'
            ? JSON.parse(properties.species) as Species[]
            : properties.species as Species[],
          partners: typeof properties.partners === 'string'
            ? JSON.parse(properties.partners) as string[]
            : properties.partners as string[]
        } as AreaProperties;
        setSelectedArea(parsedProperties);
      }
    } else {
      setSelectedArea(null);
    }
  };

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Reset filters
  const resetFilters = () => {
    setActiveFilters({
      minSuitability: 60,
      approvalDate: 'all',
      hasPartners: false,
      treeCount: 'all'
    });
  };
  return (
    <div className="w-full h-full bg-gray-50 relative " style={{zIndex:0, paddingBottom:60}}>
      {/* Header */}


      {/* Map */}
      <div className="w-full h-full">
        <Map
          ref={mapRef}
          mapLib={import('maplibre-gl')}
          mapStyle={{
            "version": 8,
            "metadata": "PFTP",
            "name": "",
            "bearing": 0,
            "pitch": 0,
            "zoom": 12,
            "center": [2.17, 41.39],
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
          onClick={handleMapClick}
          style={{ width: '100%', height: '100%' }}
        >
          <Source id="plantable-areas" type="geojson" data={filteredGeoJSON}>
            <Layer {...heatmapLayer} />
            <Layer {...fillLayer} />
            <Layer {...outlineLayer} />
          </Source>

          <NavigationControl position="bottom-right"  />

          {/* Search Bar */}
          <div className="absolute top-4 left-4 z-10 bg-white p-2 rounded-md shadow-md w-64">
            <div className="flex items-center bg-gray-100 rounded-md px-3 py-2">
              <Search className="h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search by name, ID, or HID..."
                className="ml-2 bg-transparent outline-none text-sm w-full"
                value={searchQuery}
                onChange={handleSearch}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="hover:text-gray-700"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="absolute top-4 right-4 z-10">
            <button
              className="bg-white p-2 rounded-md shadow-md flex items-center"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-5 w-5 text-gray-700" />
              <span className="ml-2 text-sm font-medium">Filters</span>
            </button>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-2 bg-white rounded-md shadow-md p-4 w-64"
                >
                  <h3 className="font-medium text-gray-800 mb-3">Filter Options</h3>

                  <div className="mb-3">
                    <label className="text-sm text-gray-600 block mb-1">Minimum Suitability Score</label>
                    <div className="flex items-center">
                      <input
                        type="range"
                        min="60"
                        max="95"
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        value={activeFilters.minSuitability}
                        onChange={(e) => setActiveFilters({ ...activeFilters, minSuitability: parseInt(e.target.value) })}
                      />
                      <span className="ml-2 text-sm font-medium">{activeFilters.minSuitability}</span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="text-sm text-gray-600 block mb-1">Approval Date</label>
                    <select
                      className="w-full p-2 border rounded-md text-sm"
                      value={activeFilters.approvalDate}
                      onChange={(e) => setActiveFilters({ ...activeFilters, approvalDate: e.target.value })}
                    >
                      <option value="all">All Time</option>
                      <option value="lastMonth">Last Month</option>
                      <option value="lastQuarter">Last Quarter</option>
                      <option value="lastYear">Last Year</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="text-sm text-gray-600 block mb-1">Trees Planted</label>
                    <select
                      className="w-full p-2 border rounded-md text-sm"
                      value={activeFilters.treeCount}
                      onChange={(e) => setActiveFilters({ ...activeFilters, treeCount: e.target.value })}
                    >
                      <option value="all">All</option>
                      <option value="lessThan10">Less than 10</option>
                      <option value="10to20">10 to 20</option>
                      <option value="moreThan20">More than 20</option>
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded text-green-600"
                        checked={activeFilters.hasPartners}
                        onChange={(e) => setActiveFilters({ ...activeFilters, hasPartners: e.target.checked })}
                      />
                      <span className="ml-2 text-sm text-gray-700">Has Partners/Sponsors</span>
                    </label>
                  </div>

                  <button
                    className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-sm font-medium rounded-md transition"
                    onClick={resetFilters}
                  >
                    Reset Filters
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 z-10 bg-white p-2 rounded-md shadow-md">
            <div className="flex items-center mb-1">
              <Layers className="h-4 w-4 text-gray-700 mr-1" />
              <h4 className="text-sm font-medium">Suitability</h4>
            </div>
            <div className="flex items-center">
              <div className="w-full h-3 rounded bg-gradient-to-r from-blue-700 via-blue-400 to-red-500"></div>
            </div>
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
        </Map>
      </div>

      {/* Sidebar for selected area */}
      <AnimatePresence>
        {selectedArea && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: 'tween', ease: 'easeOut', duration: 0.4 }}
            className="absolute top-0 left-0 bottom-0 w-1/3 bg-white shadow-lg z-10 overflow-y-auto p-4"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">{selectedArea.name}</h2>
                <p className="text-sm text-gray-500">
                  <span className="font-medium">HID:</span> {selectedArea.HID} | <span className="font-medium">ID:</span> {selectedArea.id}
                </p>
              </div>
              <button
                className="p-1 rounded-full hover:bg-gray-100"
                onClick={() => setSelectedArea(null)}
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Area Details */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="flex items-center mb-2">
                  <Trees className="h-4 w-4 text-green-600 mr-1" />
                  <h3 className="text-sm font-medium text-green-800">Trees</h3>
                </div>
                <p className="text-2xl font-bold text-green-700">{selectedArea.treesPlanted}</p>
                <p className="text-xs text-green-600">of {selectedArea.treesPlannedTotal} planned</p>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center mb-2">
                  <Leaf className="h-4 w-4 text-blue-600 mr-1" />
                  <h3 className="text-sm font-medium text-blue-800">Area</h3>
                </div>
                <p className="text-2xl font-bold text-blue-700">{selectedArea.area} m²</p>
                <p className="text-xs text-blue-600">Suitability Score: {selectedArea.suitabilityScore}/100</p>
              </div>
            </div>

            {/* Tabs for different information */}
            <div className="border-b mb-4">
              <ul className="flex -mb-px">
                <li className="mr-2">
                  <button className="inline-block py-2 px-4 text-sm font-medium text-green-600 border-b-2 border-green-600">Details</button>
                </li>
                <li className="mr-2">
                  <button className="inline-block py-2 px-4 text-sm font-medium text-gray-500 hover:text-gray-700">Activities</button>
                </li>
                <li className="mr-2">
                  <button className="inline-block py-2 px-4 text-sm font-medium text-gray-500 hover:text-gray-700">Timeline</button>
                </li>
              </ul>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="flex justify-center">
                <Gauge value={selectedArea.survivalRate} title="Survival Rate" color="#10B981" />
              </div>
              <div className="flex justify-center">
                <Gauge value={selectedArea.treesPlanted / selectedArea.treesPlannedTotal} title="Completion" color="#3B82F6" />
              </div>
            </div>

            {/* CO2 Reduction Chart */}
            <div className="mb-6 bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center mb-2">
                <BarChart4 className="h-4 w-4 text-gray-700 mr-1" />
                <h3 className="text-sm font-medium">CO2 Reduction (kg)</h3>
              </div>
              <MiniChart
                data={selectedArea.pollutionReduction.history}
                color="#10B981"
                title="CO2 Reduction History"
              />
              <p className="text-xs text-gray-500 mt-1">Total reduction: {selectedArea.pollutionReduction.co2} kg</p>
            </div>

            {/* Species Information */}
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <Leaf className="h-4 w-4 text-green-600 mr-1" />
                <h3 className="text-sm font-medium">Species Planted</h3>
              </div>
              <div className="space-y-2">
                {selectedArea?.species?.map((species: Species, index: number) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                    <div>
                      <p className="text-sm font-medium">{species.name}</p>
                      <p className="text-xs text-gray-500">{species.count} trees</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{Math.round(species.survivalRate * 100)}% survival</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Approval Information */}
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <ThumbsUp className="h-4 w-4 text-blue-600 mr-1" />
                <h3 className="text-sm font-medium">Approval Details</h3>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm"><span className="font-medium">Approved by:</span> {selectedArea.approvedBy}</p>
                <p className="text-sm"><span className="font-medium">Approval date:</span> {new Date(selectedArea.approvedDate).toLocaleDateString()}</p>
                <p className="text-sm"><span className="font-medium">Submitted by:</span> {selectedArea.submittedBy}</p>
                <p className="text-sm"><span className="font-medium">Submission date:</span> {new Date(selectedArea.submittedDate).toLocaleDateString()}</p>
                <p className="text-sm"><span className="font-medium">Last inspection:</span> {new Date(selectedArea.lastInspection).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Partners/Sponsors */}
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <Users className="h-4 w-4 text-purple-600 mr-1" />
                <h3 className="text-sm font-medium">Partners & Sponsors</h3>
              </div>

              {selectedArea.partners.length > 0 ? (
                <div className="space-y-2">
                  {selectedArea.partners.map((partner, index) => (
                    <div key={index} className="bg-purple-50 p-2 rounded-md">
                      <p className="text-sm font-medium">{partner}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 p-3 rounded-md flex items-center">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2" />
                  <p className="text-sm text-gray-600">No partners or sponsors yet</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <button className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md text-sm font-medium transition">
                Manage Partnerships
              </button>
              <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-md text-sm font-medium transition">
                Edit Details
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default PlantableAreasMap;