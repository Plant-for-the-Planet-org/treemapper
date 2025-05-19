import React from 'react';
import { useState } from 'react';

const ChildTabs = ({selectedTab,setSelectedTab}) => {

    const tabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'projectKPI', label: 'Project KPI' },
        { id: 'species', label: 'Species' },
        { id: 'geo', label: 'Geolocation' },

    ];

    return (
        <div className="p-3 rounded-lg w-fit sm:w-full lg:w-fit md:w-fit" style={{marginLeft:20}}>
            <div className="flex space-x-2 bg-gray-100 rounded-md p-1.5">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setSelectedTab(tab.id)}
                        className={`px-3 py-1 rounded-md text-sm font-small transition-colors duration-200 ${selectedTab === tab.id
                                ? 'bg-white text-black shadow-md'
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>

    );
};

export default ChildTabs;