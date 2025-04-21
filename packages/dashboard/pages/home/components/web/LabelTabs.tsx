import React from 'react';
import { useState } from 'react';

const LabelTabs = () => {
  const [activeItem, setActiveItem] = useState(0);

  // Sample data - replace with your own items
  const items = [
    { id: 0, label: 'Overview' },
    { id: 1, label: 'Species' },
    { id: 2, label: 'Team' },
    { id: 3, label: 'Settings' },
  ];

  return (
    <div className="flex space-x-6 overflow-x-auto">
      {items.map((item) => (
        <div
          key={item.id}
          className={`cursor-pointer px-2 py-1 whitespace-nowrap transition-all duration-200 ${activeItem === item.id
              ? 'text-gray-800 font-semibold'
              : 'text-gray-500 hover:text-gray-600'
            }`}
          onClick={() => setActiveItem(item.id)}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
};

export default LabelTabs;