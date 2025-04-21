import React from 'react';
import { useState } from 'react';

const ChildTabs = () => {
    const [activeTab, setActiveTab] = useState('overview');

    const tabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'analytics', label: 'Analytics' },
        { id: 'reports', label: 'Reports' },
        { id: 'notifications', label: 'Notifications' }
    ];

    return (
        <div className="bg-gray-100 p-3 rounded-lg w-fit sm:w-full lg:w-fit md:w-fit">
            <div className="flex space-x-2 bg-gray-200 rounded-md p-1.5">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-3 py-1 rounded-md text-sm font-small transition-colors duration-200 ${activeTab === tab.id
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