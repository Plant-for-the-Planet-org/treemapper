import React from 'react';
import { Calendar, Droplets, Activity, MapPin } from 'lucide-react';

const TreeData = ({ tree }) => {
  if (!tree) return null;

  // Basic tree data to display
  const treeDataItems = [
    {
      icon: <Calendar size={16} className="text-blue-500" />,
      label: "Planted Date",
      value: new Date(tree.date).toLocaleDateString(),
    },
    {
      icon: <MapPin size={16} className="text-red-500" />,
      label: "Location",
      value: `${tree.location.lat.toFixed(4)}, ${tree.location.lng.toFixed(4)}`,
    },
    {
      icon: <Droplets size={16} className="text-green-500" />,
      label: "Intervention",
      value: tree.intervention,
    },
    {
      icon: <Activity size={16} className="text-orange-500" />,
      label: "ID",
      value: tree.id,
    }
  ];

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-lg font-semibold mb-3 border-b pb-2">Tree Data</h3>
      
      <div className="flex-grow">
        <ul className="space-y-3">
          {treeDataItems.map((item, index) => (
            <li key={index} className="flex items-center">
              <div className="mr-3 bg-gray-100 p-2 rounded-full">{item.icon}</div>
              <div>
                <div className="text-xs text-gray-500">{item.label}</div>
                <div className="font-medium">{item.value}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      
      {/* Additional actions or details could go here */}
      <div className="mt-4 pt-2 border-t">
        <button
          className="text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 py-1 px-3 rounded-full transition-colors"
        >
          View Full History
        </button>
      </div>
    </div>
  );
};

export default TreeData;