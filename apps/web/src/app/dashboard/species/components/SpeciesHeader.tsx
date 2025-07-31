import { motion } from "framer-motion";
import { Leaf, HelpCircle, Plus, Download, Search, Eye, EyeOff , Hash} from "lucide-react";
import { MultiSelectDropdown } from "./MultiSelectDropdown";

export const SpeciesHeader = ({ 
  speciesCount, 
  scientificCount,
  unknownCount,
  searchTerm, 
  setSearchTerm,
  sortBy,
  setSortBy,
  showDisabled,
  setShowDisabled,
  speciesTypeFilter,
  setSpeciesTypeFilter,
  sourceFilter,
  setSourceFilter,
  interventionTypeFilter,
  setInterventionTypeFilter,
  interventionTypes,
  onAddSpecies,
  onExport 
}) => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white border-b border-gray-200 sticky top-0"
  >
    <div className="px-6 py-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-gray-900">Species Management</h1>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md">
              <Hash size={12} />
              <span className="font-medium">{speciesCount}</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-md">
              <Leaf size={12} />
              <span className="font-medium">{scientificCount}</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-700 rounded-md">
              <HelpCircle size={12} />
              <span className="font-medium">{unknownCount}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onAddSpecies}
            className="flex items-center gap-2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <Plus size={14} />
            Add Species
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onExport}
            className="flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            <Download size={14} />
            Export
          </motion.button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search species..."
            className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none bg-white"
          >
            <option value="name">Name</option>
            <option value="date">Date</option>
            <option value="favorite">Favorite</option>
            <option value="interventionCount">Intervention Count</option>
          </select>

          <button
            onClick={() => setShowDisabled(!showDisabled)}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              showDisabled 
                ? 'bg-gray-200 text-gray-700' 
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {showDisabled ? <Eye size={14} /> : <EyeOff size={14} />}
            {showDisabled ? 'Hide' : 'Show'} Disabled
          </button>
        </div>
      </div>

      {/* Additional Filters */}
      <div className="flex items-center gap-3 text-xs">
        <select
          value={speciesTypeFilter}
          onChange={(e) => setSpeciesTypeFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none bg-white"
        >
          <option value="all">All Types</option>
          <option value="scientific">Scientific Only</option>
          <option value="unknown">Unknown Only</option>
        </select>

        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none bg-white"
        >
          <option value="all">All Sources</option>
          <option value="project">Project Only</option>
          <option value="intervention">Intervention Only</option>
        </select>

        <div className="min-w-[160px]">
          <MultiSelectDropdown
            options={interventionTypes.map(type => ({ value: type, label: type.replace(/-/g, ' ') }))}
            selected={interventionTypeFilter}
            onChange={setInterventionTypeFilter}
            placeholder="Intervention Types"
          />
        </div>
      </div>
    </div>
  </motion.div>
);