import React from 'react';
import { Leaf, Sprout, Map, Activity } from 'lucide-react';

const StatCard = ({ title, value, note, icon: Icon }) => {
  return (
    <div className="flex-shrink-0 rounded-lg border border-gray-200 p-3 shadow-sm bg-white min-w-[280px] sm:min-w-[250px] lg:min-w-0 w-full h-full">
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-medium text-gray-700">{title}</h3>
        <div className="text-gray-400">
          <Icon size={20} />
        </div>
      </div>
      <p className="text-3xl font-bold mt-2">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{note}</p>
    </div>
  );
};

const StatCardsContainer = () => {
  const stats = [
    {
      title: "Trees Planted",
      value: "990.4k",
      note: "+20.1% from last month",
      icon: Leaf
    },
    {
      title: "Species Planted",
      value: "28",
      note: "+10% from last month",
      icon: Sprout
    },
    {
      title: "Area Covered",
      value: "124 ha",
      note: "+19% from last month",
      icon: Map
    },
    {
      title: "Field Data Collectors",
      value: "5",
      note: "+0 since last month",
      icon: Activity
    }
  ];

  return (
    <div className="w-full px-4 py-6">
      <div className="flex gap-4 overflow-x-auto md:overflow-visible md:flex-wrap">
        {stats.map((stat, index) => (
          <div key={index} className="flex-shrink-0 md:flex-1 md:min-w-[0]">
            <StatCard 
              title={stat.title} 
              value={stat.value} 
              note={stat.note} 
              icon={stat.icon} 
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatCardsContainer;
