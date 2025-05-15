import React, { useState } from 'react';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { X, Map, MessageSquare, Clock, Check, AlertCircle, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import 'maplibre-gl/dist/maplibre-gl.css';
import maplibregl from 'maplibre-gl';

// Sample data for tree planting requests
const initialData = {
  requests: {
    'request-1': {
      id: 'request-1',
      title: 'Downtown Park Corner',
      submittedBy: 'Sarah Johnson',
      submittedOn: '2025-05-10',
      address: '123 Main St, Parkville',
      status: 'New Request',
      image: '/api/placeholder/400/300',
      description: 'Empty corner lot with good sunlight exposure for tree planting.',
      comments: [
        { user: 'Admin', text: 'Need to check water access', timestamp: '2025-05-12T15:20:00' }
      ],
      geoJSON: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [-74.006, 40.7128],
                  [-74.004, 40.7128],
                  [-74.004, 40.7138],
                  [-74.006, 40.7138],
                  [-74.006, 40.7128]
                ]
              ]
            }
          }
        ]
      }
    },
    'request-2': {
      id: 'request-2',
      title: 'Riverside Trail Section',
      submittedBy: 'Michael Chen',
      submittedOn: '2025-05-08',
      address: '450 River Rd, Parkville',
      status: 'Survey Scheduled',
      image: '/api/placeholder/400/300',
      description: 'Area along the river trail that needs shade trees. Good soil conditions observed.',
      comments: [
        { user: 'Surveyor', text: 'Survey scheduled for May 17th', timestamp: '2025-05-09T10:15:00' },
        { user: 'Admin', text: 'Contact local park authority before survey', timestamp: '2025-05-11T09:30:00' }
      ],
      geoJSON: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [-74.0101, 40.7158],
                  [-74.0091, 40.7158],
                  [-74.0091, 40.7168],
                  [-74.0101, 40.7168],
                  [-74.0101, 40.7158]
                ]
              ]
            }
          }
        ]
      }
    }
  },
  columns: {
    'column-1': {
      id: 'column-1',
      title: 'Request',
      requestIds: ['request-1']
    },
    'column-2': {
      id: 'column-2',
      title: 'Survey',
      requestIds: ['request-2']
    },
    'column-3': {
      id: 'column-3',
      title: 'Board Review',
      requestIds: []
    },
    'column-4': {
      id: 'column-4',
      title: 'On Hold',
      requestIds: []
    },
    'column-5': {
      id: 'column-5',
      title: 'Approved',
      requestIds: []
    },
    'column-6': {
      id: 'column-6',
      title: 'Cancelled',
      requestIds: []
    }
  },
  columnOrder: ['column-1', 'column-2', 'column-3', 'column-4', 'column-5', 'column-6']
};

// Status to icon mapping
const statusIcons = {
  'Request': <Clock className="h-5 w-5 text-blue-500" />,
  'Survey': <Map className="h-5 w-5 text-orange-500" />,
  'Board Review': <Layers className="h-5 w-5 text-purple-500" />,
  'On Hold': <AlertCircle className="h-5 w-5 text-yellow-500" />,
  'Approved': <Check className="h-5 w-5 text-green-500" />,
  'Cancelled': <X className="h-5 w-5 text-red-500" />
};

// RequestDetails component (Modal)
const RequestDetails = ({ request, onClose, onAddComment }) => {
  const [comment, setComment] = useState('');
  const [mapReady, setMapReady] = useState(false);

  // Initialize map after component mounts
  React.useEffect(() => {
    if (!mapReady && request) {
      const map = new maplibregl.Map({
        container: 'map-container',
        style: {
          version: 8,
          sources: {
            'osm': {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution: '© OpenStreetMap Contributors'
            }
          },
          layers: [
            {
              id: 'osm-tiles',
              type: 'raster',
              source: 'osm',
              minzoom: 0,
              maxzoom: 19
            }
          ]
        },
        center: [-74.005, 40.7133], // Centered on the GeoJSON data
        zoom: 15
      });

      map.on('load', () => {
        // Add GeoJSON source
        map.addSource('plot-boundary', {
          type: 'geojson',
          data: request.geoJSON
        });

        // Add fill layer
        map.addLayer({
          id: 'plot-fill',
          type: 'fill',
          source: 'plot-boundary',
          paint: {
            'fill-color': '#0080ff',
            'fill-opacity': 0.5
          }
        });

        // Add outline layer
        map.addLayer({
          id: 'plot-outline',
          type: 'line',
          source: 'plot-boundary',
          paint: {
            'line-color': '#000',
            'line-width': 2
          }
        });

        setMapReady(true);
      });

      return () => {
        if (map) map.remove();
      };
    }
  }, [request, mapReady]);

  const handleAddComment = () => {
    if (comment.trim()) {
      onAddComment(request.id, {
        user: 'Admin',
        text: comment,
        timestamp: new Date().toISOString()
      });
      setComment('');
    }
  };

  if (!request) return null;

  return (
    <motion.div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">{request.title}</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Status</h3>
              <div className="flex items-center mt-1">
                {statusIcons[request.status] || statusIcons['Request']}
                <span className="ml-2">{request.status}</span>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Submitted By</h3>
              <p>{request.submittedBy} on {new Date(request.submittedOn).toLocaleDateString()}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Location</h3>
              <p>{request.address}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Description</h3>
              <p>{request.description}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Site Image</h3>
              <div className="mt-1 rounded-md overflow-hidden border border-gray-200">
                <img src={request.image} alt="Site location" className="w-full h-auto" />
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="h-64">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Location Map</h3>
              <div id="map-container" className="w-full h-full rounded-md border border-gray-200"></div>
            </div>
            
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-500">Comments</h3>
              <div className="mt-1 border border-gray-200 rounded-md p-3 max-h-48 overflow-y-auto bg-gray-50">
                {request.comments.length > 0 ? (
                  <div className="space-y-3">
                    {request.comments.map((comment, index) => (
                      <div key={index} className="border-b border-gray-200 pb-2 last:border-0 last:pb-0">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{comment.user}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm mt-1">{comment.text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No comments yet.</p>
                )}
              </div>
              
              <div className="mt-2">
                <div className="flex">
                  <input
                    type="text"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleAddComment}
                    className="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <MessageSquare className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const KanbanBoard = () => {
  const [data, setData] = useState(initialData);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);

  // Get requests for each column
  const getColumnRequests = (columnId) => {
    const column = data.columns[columnId];
    return column.requestIds.map(requestId => data.requests[requestId]);
  };

  const handleDragStart = (requestId) => {
    setDraggedItem(requestId);
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e, targetColumnId) => {
    e.preventDefault();
    if (draggedItem) {
      // Find the source column that contains the dragged item
      const sourceColumnId = Object.keys(data.columns).find(columnId => 
        data.columns[columnId].requestIds.includes(draggedItem)
      );

      if (sourceColumnId && sourceColumnId !== targetColumnId) {
        // Remove from source column
        const sourceColumn = data.columns[sourceColumnId];
        const newSourceRequestIds = sourceColumn.requestIds.filter(id => id !== draggedItem);

        // Add to target column
        const targetColumn = data.columns[targetColumnId];
        const newTargetRequestIds = [...targetColumn.requestIds, draggedItem];

        // Update the data
        setData(prevData => ({
          ...prevData,
          columns: {
            ...prevData.columns,
            [sourceColumnId]: {
              ...sourceColumn,
              requestIds: newSourceRequestIds
            },
            [targetColumnId]: {
              ...targetColumn,
              requestIds: newTargetRequestIds
            }
          }
        }));
      }
      setDraggedItem(null);
    }
  };

  const handleOpenRequestDetails = (requestId) => {
    setSelectedRequest(data.requests[requestId]);
  };

  const handleCloseRequestDetails = () => {
    setSelectedRequest(null);
  };

  const handleAddComment = (requestId, comment) => {
    setData(prevData => ({
      ...prevData,
      requests: {
        ...prevData.requests,
        [requestId]: {
          ...prevData.requests[requestId],
          comments: [...prevData.requests[requestId].comments, comment]
        }
      }
    }));
  };

  const handleChangeStatus = (requestId, newStatus) => {
    setData(prevData => ({
      ...prevData,
      requests: {
        ...prevData.requests,
        [requestId]: {
          ...prevData.requests[requestId],
          status: newStatus
        }
      }
    }));
  };

  return (
    <div className="h-screen bg-gray-50 p-6 overflow-hidden flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Tree Planting Requests</h1>
        <p className="text-gray-500">Manage planting requests across different stages</p>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <div className="flex space-x-4 h-full overflow-x-auto pb-4">
          {data.columnOrder.map((columnId) => {
            const column = data.columns[columnId];
            const requests = getColumnRequests(column.id);

            return (
              <div 
                key={column.id} 
                className="w-80 flex-shrink-0 flex flex-col bg-gray-100 rounded-md overflow-hidden"
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                <div className="p-3 bg-white border-b border-gray-200 flex items-center">
                  {statusIcons[column.title]}
                  <h2 className="ml-2 font-semibold">{column.title}</h2>
                  <div className="ml-auto bg-gray-200 text-gray-700 rounded-full px-2 py-0.5 text-xs font-medium">
                    {requests.length}
                  </div>
                </div>
                
                <div className="flex-1 p-2 overflow-y-auto min-h-[200px]">
                  {requests.map((request) => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="mb-2 p-3 bg-white rounded-md shadow-sm border border-gray-200 
                        hover:shadow-md transition-all cursor-pointer"
                      onClick={() => handleOpenRequestDetails(request.id)}
                      draggable
                      onDragStart={() => handleDragStart(request.id)}
                    >
                      <div className="flex items-start justify-between">
                        <h3 className="font-medium">{request.title}</h3>
                      </div>
                      <div className="mt-2 text-sm text-gray-500">{request.address}</div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          {new Date(request.submittedOn).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <MessageSquare className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-xs">{request.comments.length}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <AnimatePresence>
        {selectedRequest && (
          <RequestDetails 
            request={selectedRequest} 
            onClose={handleCloseRequestDetails}
            onAddComment={handleAddComment}
            onChangeStatus={handleChangeStatus}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default KanbanBoard;