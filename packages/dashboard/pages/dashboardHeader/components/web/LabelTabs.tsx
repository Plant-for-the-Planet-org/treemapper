import React from 'react';
import useHomeStore from '../../../../store/useHomeStore';

interface LabelTabsProps {
  updateRoute: (newRoute: string) => void;
}
const LabelTabs = ({ updateRoute }: LabelTabsProps) => {
  const setParentTab = useHomeStore((state) => state.setParentTab);
  const parentTab = useHomeStore((state) => state.parentTab);
  // Sample data - replace with your own items
  const items = [
    { id: '', label: 'Overview' },
    { id: 'species', label: 'Species' },
    { id: 'team', label: 'Team' },
    { id: 'settings', label: 'Settings' },
  ];

  const handleTabClick = (id: string) => {
    updateRoute(id);
  }

  return (
    <div className="flex space-x-6 overflow-x-auto">
      {items.map((item) => (
        <div
          key={item.id}
          className={`cursor-pointer px-2 py-1 whitespace-nowrap transition-all duration-200 ${parentTab === item.id
            ? 'text-gray-800 font-semibold'
            : 'text-gray-500 hover:text-gray-600'
            }`}
          onClick={() => handleTabClick(item.id)}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
};

export default LabelTabs;