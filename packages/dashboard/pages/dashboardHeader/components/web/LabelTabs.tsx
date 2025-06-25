import React, { useEffect, useState } from 'react';
import useHomeStore from '../../../../store/useHomeStore';
import { usePathname } from 'next/navigation';
import useProjectStore from '../../../../store/useProjectStore'
interface LabelTabsProps {
  updateRoute: (newRoute: string) => void;
}
const LabelTabs = ({ updateRoute }: LabelTabsProps) => {
  const [parentTab, setParentTab] = useState('');
  const pathname = usePathname();
  const selectedProject = useProjectStore(state => state.selectedProject)
  const items = [
    // { id: 'plantable', label: 'Plantable' },
    { id: '', label: 'Overview' },
    // { id: 'board', label: 'Approvals' },
    { id: 'sites', label: 'Sites' },
    { id: 'species', label: 'Species' },
    { id: 'team', label: 'Team' },
    { id: 'intervention', label: 'Interventions' },
    { id: 'settings', label: 'Settings' }
  ];

  useEffect(() => {
    if (pathname) {
      const section = getSectionFromUrl(pathname);
      setParentTab(section);
    }
  }, [pathname]);


  // Helper function to extract section from URL
  function getSectionFromUrl(pathname) {
    const urlToStateMap = {
      '/dashboard/overview': '',
      '/dashboard/sites': 'sites',
      '/dashboard/species': 'species',
      '/dashboard/team': 'team',
      '/dashboard/intervention': 'intervention',
      '/dashboard/settings': 'settings'
    };
    return urlToStateMap[pathname] || '';
  }

  const handleTabClick = (id: string) => {
    updateRoute(id);
    setParentTab(id)
  }

  return (
    <div className="flex space-x-6 overflow-x-auto">
      {items.map((item) => {
        if (selectedProject?.userRole === 'contributor') {
          if ( item.id === 'settings' || item.id === 'team'|| item.id === 'sites') {
            return null
          }
        }
        return (
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
        )
      })}
    </div>
  );
};

export default LabelTabs;