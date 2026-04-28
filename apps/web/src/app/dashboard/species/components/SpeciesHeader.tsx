import { motion } from "framer-motion";
import { Leaf, HelpCircle, Plus, Download, Search, Eye, EyeOff, Hash, ChevronDown, Filter } from "lucide-react";
import { MultiSelectDropdown } from "./MultiSelectDropdown";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import CustomButton from "@/component/CutsomButtom";
import { toast } from "react-toastify";

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
  showUnknown,
  setShowUnknown,
  speciesTypeFilter,
  setSpeciesTypeFilter,
  sourceFilter,
  setSourceFilter,
  interventionTypeFilter,
  setInterventionTypeFilter,
  interventionTypes,
  onAddSpecies,
  onExport
}) => {
  const [showFilters, setShowFilters] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border-b border-gray-200 sticky top-0"
    >
      <div className="px-6 py-3">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-4">
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
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md">
                <Hash size={12} />
                <span className="font-medium">{speciesCount}</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-[#007A49] text-white rounded-md">
                <Leaf size={12} />
                <span className="font-medium">{scientificCount}</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-gray-500 text-white rounded-md">
                <HelpCircle size={12} />
                <span className="font-medium">{unknownCount}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowFilters(!showFilters)}
              className="hidden lg:flex"
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
              <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>

            <CustomButton
              variant="outline"
              onClick={() => {
                if (!onAddSpecies) {
                  toast.error("You don't have permission to add species in this project.");
                  return;
                }
                onAddSpecies();
              }}
            >
              <Plus size={14} />
              Add Species
            </CustomButton>
            <CustomButton onClick={onExport}>
              <Download size={14} />
              Export
            </CustomButton>



          </div>
        </div>
        {showFilters && <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'space-between' }}>


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

            {/* <div className="min-w-[160px]">
              <MultiSelectDropdown
                options={interventionTypes.map(type => ({ value: type, label: type.replace(/-/g, ' ') }))}
                selected={interventionTypeFilter}
                onChange={setInterventionTypeFilter}
                placeholder="Intervention Types"
              />
            </div> */}
          </div>
          <div className="flex items-center justify-between gap-4">

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
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${showDisabled
                  ? 'bg-gray-200 text-gray-700'
                  : 'bg-gray-100 text-gray-600'
                  }`}
              >
                {showDisabled ? <Eye size={14} /> : <EyeOff size={14} />}
                {showDisabled ? 'Hide' : 'Show'} Disabled
              </button>
              <button
                onClick={() => setShowUnknown(!showUnknown)}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${showUnknown
                  ? 'bg-gray-200 text-gray-700'
                  : 'bg-gray-100 text-gray-600'
                  }`}
              >
                {showUnknown ? <EyeOff size={14} /> : <Eye size={14} />}
                {showUnknown ? 'Hide' : 'Show'} Unknown
              </button>
            </div>
          </div>
        </div>}
      </div>
    </motion.div>
  )
}