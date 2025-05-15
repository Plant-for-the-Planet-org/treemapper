import React from 'react';
import { Trees, Ruler, HeartPulse, Users } from 'lucide-react';

const TreeMetaData = ({ tree }) => {
  if (!tree) return null;

  // Sample metadata about the tree
  const metadataItems = [
    {
      icon: <Trees size={16} className="text-green-600" />,
      label: "Species",
      value: tree.species || "Unknown",
    },
    {
      icon: <Ruler size={16} className="text-purple-500" />,
      label: "Height",
      value: tree.height || "Not measured",
    },
    {
      icon: <HeartPulse size={16} className="text-red-500" />,
      label: "Health Status",
      value: tree.health || "Unknown",
    },
    {
      icon: <Users size={16} className="text-blue-500" />,
      label: "Caretaker",
      value: tree.caretaker || "Community",
    }
  ];

  // Generate a health indicator based on the tree's health status
  const getHealthIndicator = () => {
    const status = tree.health?.toLowerCase() || '';
    
    if (status.includes('excellent')) {
      return { color: 'bg-green-500', percentage: '90%' };
    } else if (status.includes('good')) {
      return { color: 'bg-green-400', percentage: '75%' };
    } else if (status.includes('fair')) {
      return { color: 'bg-yellow-400', percentage: '50%' };
    } else if (status.includes('poor')) {
      return { color: 'bg-orange-400', percentage: '30%' };
    } else if (status.includes('critical')) {
      return { color: 'bg-red-500', percentage: '10%' };
    }
    
    return { color: 'bg-gray-300', percentage: '0%' };
  };

  const healthIndicator = getHealthIndicator();

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-lg font-semibold mb-2 border-b pb-1">Tree Metadata</h3>
      
      <div className="flex-grow">
        <ul className="space-y-2">
          {metadataItems.map((item, index) => (
            <li key={index} className="flex items-center">
              <div className="mr-2 bg-gray-100 p-1 rounded-full">{item.icon}</div>
              <div>
                <div className="text-xs text-gray-500">{item.label}</div>
                <div className="font-medium text-sm">{item.value}</div>
              </div>
            </li>
          ))}
        </ul>

        {/* Health status indicator */}
        <div className="mt-2">
          <div className="text-xs text-gray-500 mb-1">Health Status</div>
          <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full ${healthIndicator.color}`} 
              style={{ width: healthIndicator.percentage }}
            ></div>
          </div>
        </div>
      </div>
      
      {/* Action buttons in a more compact form */}
      <div className="mt-2 pt-1 border-t flex space-x-2">
        <button className="text-xs bg-green-50 hover:bg-green-100 text-green-700 py-1 px-2 rounded-full transition-colors flex-1 text-center">
          Update
        </button>
        <button className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 py-1 px-2 rounded-full transition-colors flex-1 text-center">
          Download
        </button>
      </div>
    </div>
  );
};

export default TreeMetaData;