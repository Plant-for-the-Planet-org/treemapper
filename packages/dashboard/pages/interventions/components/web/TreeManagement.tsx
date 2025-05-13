import React, { useState } from 'react';
import TreeList from './TreeList';
import MapComponent from './MapComponent';
import TreeData from './TreeData';
import TreeMetaData from './TreeMetaData';

// Sample data - replace with your actual data source
const sampleTrees = [
  { id: 'TREE-001', location: { lat: 19.111, lng: 74.747 }, intervention: 'Planting', date: '2025-01-15', species: 'Neem', height: '2.3m', health: 'Good' },
  { id: 'TREE-002', location: { lat: 19.115, lng: 74.750 }, intervention: 'Watering', date: '2025-02-20', species: 'Banyan', height: '3.1m', health: 'Excellent' },
  { id: 'TREE-003', location: { lat: 19.105, lng: 74.738 }, intervention: 'Fertilizing', date: '2025-03-10', species: 'Peepal', height: '1.8m', health: 'Fair' },
  { id: 'TREE-004', location: { lat: 19.120, lng: 74.742 }, intervention: 'Pruning', date: '2025-04-05', species: 'Mango', height: '4.2m', health: 'Good' },
  { id: 'TREE-005', location: { lat: 19.118, lng: 74.735 }, intervention: 'Planting', date: '2025-05-01', species: 'Gulmohar', height: '1.5m', health: 'Good' },
];

const TreeManagement = () => {
  const [selectedTree, setSelectedTree] = useState(null);
  const [sortOption, setSortOption] = useState('date');
  const [filterOption, setFilterOption] = useState('all');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'

  // Handle tree selection
  const handleTreeSelect = (tree) => {
    setSelectedTree(tree);
  };

  // Filter trees based on current filter option
  const filteredTrees = filterOption === 'all' 
    ? sampleTrees 
    : sampleTrees.filter(tree => tree.intervention === filterOption);

  // Sort trees based on current sort option
  const sortedTrees = [...filteredTrees].sort((a, b) => {
    if (sortOption === 'date') {
      return new Date(b.date) - new Date(a.date);
    } else if (sortOption === 'id') {
      return a.id.localeCompare(b.id);
    }
    return 0;
  });

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100 p-4 gap-4">
      {/* Left panel - Tree List */}
      <div className="w-full md:w-1/3 bg-white rounded-lg shadow-md overflow-hidden">
        <TreeList 
          trees={sortedTrees}
          onSelectTree={handleTreeSelect}
          selectedTree={selectedTree}
          sortOption={sortOption}
          onSortChange={setSortOption}
          filterOption={filterOption}
          onFilterChange={setFilterOption}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      </div>

      {/* Right panel - Map and Tree Details */}
      <div className="w-full md:w-2/3 flex flex-col gap-4">
        {/* Map component */}
        <div className="bg-white rounded-lg shadow-md h-1/2 overflow-hidden">
          <MapComponent selectedTree={selectedTree} allTrees={sampleTrees} />
        </div>

        {/* Tree data and metadata cards */}
        {selectedTree && (
          <div className="flex gap-4 h-1/3">
            <div className="w-1/2 bg-white rounded-lg shadow-md p-4">
              <TreeData tree={selectedTree} />
            </div>
            <div className="w-1/2 bg-white rounded-lg shadow-md p-4">
              <TreeMetaData tree={selectedTree} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TreeManagement;