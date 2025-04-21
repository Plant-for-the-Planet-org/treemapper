// import React, { useState, useCallback } from 'react';
// // Import all components from the maplibre-specific path
// import Map, { NavigationControl, Marker, GeolocateControl } from 'react-map-gl/maplibre';
// import {MapPin } from 'lucide-react';

// const MapComponent = ({ width = '100%', height = '100%' }) => {
//   // Initial viewport settings
//   const [viewState, setViewState] = useState({
//     longitude: -100,
//     latitude: 40,
//     zoom: 3.5
//   });

//   // State for selected marker
//   const [marker, setMarker] = useState(null);

//   // State for manual coordinates input
//   const [manualCoords, setManualCoords] = useState({
//     latitude: '',
//     longitude: ''
//   });

//   // Handle map click to place a marker
//   const handleMapClick = useCallback(event => {
//     const { lngLat } = event;
//     setMarker({
//       longitude: lngLat.lng,
//       latitude: lngLat.lat
//     });
//     setManualCoords({
//       longitude: lngLat.lng.toFixed(6),
//       latitude: lngLat.lat.toFixed(6)
//     });
//   }, []);

//   // Handle manual coordinate input
//   const handleCoordChange = (e) => {
//     const { name, value } = e.target;
//     setManualCoords({
//       ...manualCoords,
//       [name]: value
//     });
//   };

//   // Set marker from manual coordinates
//   const handleSetCoordinates = () => {
//     const lng = parseFloat(manualCoords.longitude);
//     const lat = parseFloat(manualCoords.latitude);

//     if (!isNaN(lng) && !isNaN(lat)) {
//       setMarker({
//         longitude: lng,
//         latitude: lat
//       });

//       // Update viewport to center on the new marker
//       setViewState({
//         ...viewState,
//         longitude: lng,
//         latitude: lat
//       });
//     }
//   };

//   // Handle zoom in and out
//   const handleZoomIn = () => {
//     setViewState({
//       ...viewState,
//       zoom: Math.min(viewState.zoom + 1, 20)
//     });
//   };

//   const handleZoomOut = () => {
//     setViewState({
//       ...viewState,
//       zoom: Math.max(viewState.zoom - 1, 1)
//     });
//   };

//   return (
//     <div style={{ position: 'relative', width, height }}>
//       <Map
//         {...viewState}
//         onMove={evt => setViewState(evt.viewState)}
//         mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
//         onClick={handleMapClick}
//         style={{ width: '100%', height: '100%'}}
//       >
//         {/* Default navigation controls (zoom, compass, etc.) */}
//         <NavigationControl position="bottom-right" />

//         {/* GeolocateControl - adds the find my location button */}
//         <GeolocateControl
//           position="bottom-right"
//           positionOptions={{ enableHighAccuracy: true }}
//           trackUserLocation={true}
//         />

//         {/* Display marker if set */}
//         {marker && (
//           <Marker 
//             longitude={marker.longitude} 
//             latitude={marker.latitude}
//             anchor="bottom"
//             draggable
//             onDragEnd={(event) => {
//               setMarker({
//                 longitude: event.lngLat.lng,
//                 latitude: event.lngLat.lat
//               });
//               setManualCoords({
//                 longitude: event.lngLat.lng.toFixed(6),
//                 latitude: event.lngLat.lat.toFixed(6)
//               });
//             }}
//           >
//             <MapPin color="#FF0000" size={24} />
//           </Marker>
//         )}

//       </Map>

//       {/* Coordinate input form */}
//       <div style={{
//         position: 'absolute',
//         bottom: '20px',
//         left: '20px',
//         background: 'white',
//         padding: '10px',
//         borderRadius: '4px',
//         boxShadow: '0 0 10px rgba(0,0,0,0.1)',
//         zIndex: 1
//       }}>
//         <div className="flex flex-col sm:flex-row items-start gap-3">
//           <div className="w-full sm:w-auto">
//             <label className="block text-xs mb-1">
//               Latitude:
//             </label>
//             <input
//               type="text"
//               name="latitude"
//               value={manualCoords.latitude}
//               onChange={handleCoordChange}
//               className="w-full sm:w-32 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
//             />
//           </div>

//           <div className="w-full sm:w-auto">
//             <label className="block text-xs mb-1">
//               Longitude:
//             </label>
//             <input
//               type="text"
//               name="longitude"
//               value={manualCoords.longitude}
//               onChange={handleCoordChange}
//               className="w-full sm:w-32 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
//             />
//           </div>

//           <div className="w-full sm:w-auto self-end mt-4 sm:mt-0">
//             <button
//               onClick={handleSetCoordinates}
//               className="w-full sm:w-auto bg-blue-500 text-white border-none py-1 px-3 rounded text-sm cursor-pointer hover:bg-blue-600 transition-colors"
//             >
//               Set Location
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default MapComponent;

import React from "react";

const ABC = () => {
  return null
}

export default ABC;