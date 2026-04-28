import { motion } from "framer-motion";
import { Search, AlertCircle } from "lucide-react";
import { LoadingSpinner } from "./LoadingSpinner";

export const SpeciesSearch = ({ 
  searchTerm, 
  onSearchChange, 
  searchResults, 
  isSearching, 
  onSelectSpecies, 
  onRequestNew 
}) => (
  <div className="space-y-4">
    <div className="relative">
      <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search species database..."
        className="w-full pl-10 pr-3 py-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
      />
    </div>

    {isSearching && (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
      </div>
    )}

    {searchResults.length > 0 && (
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {searchResults.map((species) => (
          <motion.div
            key={species.id}
            whileHover={{ scale: 1.01 }}
            onClick={() => onSelectSpecies(species)}
            className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-green-500 hover:bg-green-50/50 transition-colors"
          >
            <h4 className="text-sm font-medium text-gray-900 italic">
              {species.scientificName}
            </h4>
            <p className="text-xs text-gray-600">{species.commonName}</p>
          </motion.div>
        ))}
      </div>
    )}

    {searchTerm.length >= 3 && !isSearching && searchResults.length === 0 && (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-sm font-medium text-gray-900 mb-2">Species not found</h3>
        <p className="text-xs text-gray-600 mb-4">
          Can't find "{searchTerm}" in our database
        </p>
        <button
          onClick={onRequestNew}
          className="px-4 py-2 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
        >
          Request this species
        </button>
      </div>
    )}

    {searchTerm.length < 3 && (
      <div className="text-center py-8 text-gray-500">
        <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-sm">Enter at least 3 characters to search</p>
      </div>
    )}
  </div>
);
