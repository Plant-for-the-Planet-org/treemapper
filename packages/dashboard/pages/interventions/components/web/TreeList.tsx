import React from 'react';
import { List, Grid, SlidersHorizontal, Filter } from 'lucide-react';

const TreeList = ({ 
  trees, 
  onSelectTree, 
  selectedTree, 
  sortOption, 
  onSortChange, 
  filterOption, 
  onFilterChange,
  viewMode,
  onViewModeChange
}) => {
  // Available intervention types for filtering
  const interventionTypes = ['all', 'Planting', 'Watering', 'Fertilizing', 'Pruning'];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold mb-4">List of Trees</h2>
        
        {/* Filter and Sort Controls */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <SlidersHorizontal size={18} />
              <span className="text-sm font-medium">Sort by:</span>
            </div>
            <select 
              value={sortOption} 
              onChange={(e) => onSortChange(e.target.value)}
              className="border rounded p-1 text-sm"
            >
              <option value="date">Date</option>
              <option value="id">ID</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter size={18} />
              <span className="text-sm font-medium">By intervention:</span>
            </div>
            <select 
              value={filterOption} 
              onChange={(e) => onFilterChange(e.target.value)}
              className="border rounded p-1 text-sm"
            >
              {interventionTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">View:</span>
            <div className="flex border rounded overflow-hidden">
              <button 
                className={`p-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
                onClick={() => onViewModeChange('list')}
                aria-label="List view"
              >
                <List size={18} />
              </button>
              <button 
                className={`p-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
                onClick={() => onViewModeChange('grid')}
                aria-label="Grid view"
              >
                <Grid size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tree List */}
      <div className="overflow-y-auto flex-grow p-2">
        {viewMode === 'list' ? (
          <div className="space-y-2">
            {trees.map(tree => (
              <div 
                key={tree.id}
                onClick={() => onSelectTree(tree)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedTree?.id === tree.id 
                    ? 'bg-blue-100 border-blue-500 border' 
                    : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="font-medium">{tree.id}</div>
                  <div className="text-xs text-gray-500">{new Date(tree.date).toLocaleDateString()}</div>
                </div>
                <div className="text-sm text-gray-600 mt-1">{tree.intervention}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {trees.map(tree => (
              <div 
                key={tree.id}
                onClick={() => onSelectTree(tree)}
                className={`p-3 rounded-lg cursor-pointer transition-colors flex flex-col items-center justify-center aspect-square ${
                  selectedTree?.id === tree.id 
                    ? 'bg-blue-100 border-blue-500 border' 
                    : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <div className="font-medium text-center">{tree.id}</div>
                <div className="text-xs text-gray-500 mt-1">{tree.intervention}</div>
              </div>
            ))}
          </div>
        )}
        
        {trees.length === 0 && (
          <div className="text-center p-4 text-gray-500">
            No trees found matching the current filters.
          </div>
        )}
      </div>
    </div>
  );
};

export default TreeList;