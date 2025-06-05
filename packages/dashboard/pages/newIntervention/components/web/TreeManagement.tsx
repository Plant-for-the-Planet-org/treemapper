import React, { useState } from 'react';
import TreeList from './TreeList';
import MapComponent from './MapComponent';
import TreeData from './TreeData';
import TreeMetaData from './TreeMetaData';
import sampleTrees from './SampleIntervention';

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
    <div className="flex flex-col md:flex-row h-full w-full p-4 gap-4">
      {/* Left panel - Tree List */}
      <div className="w-full md:w-1/3 bg-white rounded-lg shadow-md overflow-hidden">
        <TreeList 
          interventions={sortedTrees}
          onSelectIntervention={handleTreeSelect}
          selectedIntervention={selectedTree}
          sortOption={sortOption}
          onSortChange={setSortOption}
          filterOption={filterOption}
          onFilterChange={setFilterOption}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      </div>

      {/* Right panel - Map and Tree Details */}
      <div className="w-full md:w-2/3 flex flex-col gap-4 h-full">
        {/* {selectedTree && (
          <div className="bg-white rounded-lg shadow-md p-3 flex items-center">
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{selectedTree.species || "Tree"} #{selectedTree.id}</h3>
              <p className="text-sm text-gray-600">
                {selectedTree.intervention} | {new Date(selectedTree.date).toLocaleDateString()} | 
                Health: {selectedTree.health || "Unknown"}
              </p>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                Update
              </button>
              <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                History
              </button>
            </div>
          </div>
        )} */}
        
        {/* Map component with dynamic height */}
        <div 
          className="bg-white rounded-lg shadow-md w-full overflow-hidden"
          style={{ height: selectedTree ? '70%' : '100%' }}
        >
          <MapComponent selectedTree={selectedTree} allTrees={sampleTrees} />
        </div>

        {/* Tree data and metadata cards - only shown when tree is selected */}
        {selectedTree && (
          <div className="flex gap-4 h-1/3">
            <div className="w-1/2 bg-white rounded-lg shadow-md p-4 overflow-auto">
              <TreeData tree={selectedTree} />
            </div>
            <div className="w-1/2 bg-white rounded-lg shadow-md p-4 overflow-auto">
              <TreeMetaData tree={selectedTree} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TreeManagement;