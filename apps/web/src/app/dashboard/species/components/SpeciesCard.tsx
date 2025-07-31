import { motion } from "framer-motion";
import { CheckSquare, Square, Leaf, Heart, EyeOff, Eye, TreePine, Users, LeafIcon } from "lucide-react";

export const SpeciesCard = ({ 
  species, 
  isSelected, 
  onClick, 
  onToggleFavorite, 
  onToggleDisabled,
  isUnknown,
  showCheckbox,
  isChecked, // This should be explicitly passed and calculated correctly
  onCheckboxChange
}) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={`cursor-pointer border rounded-lg p-3 transition-all ${
        isSelected 
          ? 'border-green-500 bg-green-50/50 shadow-sm' 
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
      } ${species.isDisabled ? 'opacity-60' : ''}`} // Fixed the condition here
    >
      <div className="flex items-start gap-3">
        {/* {showCheckbox && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              console.log('Checkbox button clicked for:', species.uid); // Debug log
              onCheckboxChange(species.uid);
            }}
            className="mt-1 p-0.5 hover:bg-gray-100 rounded transition-colors"
          >
            {isChecked ? (
              <CheckSquare size={16} className="text-blue-600" />
            ) : (
              <Square size={16} className="text-gray-400" />
            )}
          </button>
        )} */}

        {/* Rest of the component remains the same */}
        <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
          {species.image ? (
            <img src={`${process.env.NEXT_PUBLIC_CDN}/species/${species.image}`} alt={species.commonName || species.speciesName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Leaf className="w-5 h-5 text-gray-400" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-medium text-gray-900 truncate italic">
                  {species.scientificName || species.speciesName}
                </h3>
                {isUnknown && (
                  <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                    Unknown
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600 truncate">
                {species.commonName || `Intervention: ${species.interventionHid}`}
              </p>
            </div>

            <div className="flex items-center gap-1 ml-2">
              {!isUnknown && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(species.uid, !species.favourite);
                  }}
                  className={`p-1 rounded transition-colors ${
                    species.favourite 
                      ? 'text-red-500 hover:text-red-600' 
                      : 'text-gray-300 hover:text-red-400'
                  }`}
                >
                  <Heart size={12} fill={species.favourite ? 'currentColor' : 'none'} />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleDisabled(species.uid, !species.isDisabled); // Fixed property name
                }}
                className={`p-1 rounded transition-colors ${
                  species.isDisabled 
                    ? 'text-gray-400 hover:text-gray-600' 
                    : 'text-green-500 hover:text-green-600'
                }`}
              >
                {species.isDisabled ? <EyeOff size={12} /> : <Eye size={12} />}
              </button>
            </div>
          </div>

          {species.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
              {species.description}
            </p>
          )}

          {/* Usage Stats */}
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            {species.totalCount > 0 && (
              <div className="flex items-center gap-1">
                <TreePine size={10} />
                <span>{species.totalCount} trees</span>
              </div>
            )}
            {species.interventionCount > 0 && (
              <div className="flex items-center gap-1">
                <LeafIcon size={10} />
                <span>{species.interventionCount} interventions</span>
              </div>
            )}
            {species.count && (
              <div className="flex items-center gap-1">
                <TreePine size={10} />
                <span>{species.count} trees</span>
              </div>
            )}
          </div>

          {/* Sources */}
          {species.sources && (
            <div className="flex items-center gap-1 mt-1">
              {species.sources.map((source, index) => (
                <span
                  key={source}
                  className={`px-2 py-0.5 text-xs rounded-full ${
                    source === 'project' 
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {source}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
            <span>Updated {new Date(species.updatedAt || species.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
