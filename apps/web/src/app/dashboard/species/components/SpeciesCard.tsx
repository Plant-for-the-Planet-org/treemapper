import { motion } from "framer-motion";
import { CheckSquare, Square, Leaf, Heart, EyeOff, Eye, TreePine, Users, LeafIcon, HelpCircle } from "lucide-react";

const formatRelativeTime = (date) => {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now - then;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 5) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return then.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: now.getFullYear() !== then.getFullYear() ? 'numeric' : undefined 
  });
};

export const SpeciesCard = ({ 
  species, 
  isSelected, 
  onClick, 
  onToggleFavorite, 
  onToggleDisabled,
  isUnknown,
  showCheckbox,
  isChecked,
  onCheckboxChange
}) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={`cursor-pointer border rounded-lg p-3 transition-all h-32 ${
        isSelected 
          ? 'border-green-800 bg-green-[#007A49] shadow-sm' 
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
      } ${(species.isDisabled || species.disabled) ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start gap-3 h-full">
        {/* {showCheckbox && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCheckboxChange(species.uid);
            }}
            className="mt-1 p-0.5 hover:bg-gray-100 rounded transition-colors"
          >
            {isChecked ? (
              <CheckSquare size={16} className="text-[#007A49]" />
            ) : (
              <Square size={16} className="text-gray-400" />
            )}
          </button>
        )} */}

        <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
          {species.image ? (
            <img src={`${process.env.NEXT_PUBLIC_CDN}/species/${species.image}`} alt={species.commonName || species.speciesName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Leaf className="w-5 h-5 text-gray-400" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col h-full">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-medium text-gray-900 truncate italic">
                  {species.scientificName || species.speciesName}
                </h3>
                {isUnknown && (
                  <div className="flex items-center gap-1">
                    <HelpCircle size={12} className="text-gray-400" />
                    <span className="text-xs text-gray-500 italic">unknown</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-600 truncate">
                {species.commonName || species.speciesName}
              </p>
            </div>

            <div className="flex items-center gap-1 ml-2">
              {species.projectSpeciesUid && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(species.uid, !species.favourite, species.projectSpeciesUid);
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
              {species.projectSpeciesUid && <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleDisabled(species.uid, !(species.isDisabled || species.disabled), species.projectSpeciesUid);
                }}
                className={`p-1 rounded transition-colors ${
                  (species.isDisabled || species.disabled)
                    ? 'text-gray-400 hover:text-gray-600' 
                  : 'text-[#007A49] hover:text-[#006B3F]'
                }`}
              >
                {(species.isDisabled || species.disabled) ? <EyeOff size={12} /> : <Eye size={12} />}
              </button>}
            </div>
          </div>

          {species.description && (
            <p className="text-xs text-gray-500 line-clamp-2">
              {species.description}
            </p>
          )}

          {/* Usage Stats */}
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            {(species.totalCount > 0 || species.totalSpecimenCount > 0 || species.count > 0) && (
              <div className="flex items-center gap-1">
                <TreePine size={10} />
                <span>{species.totalCount || species.totalSpecimenCount || species.count} trees</span>
              </div>
            )}
            {(species.interventionCount > 0 || species.interventionUsageCount > 0 || (isUnknown && 1)) && (
              <div className="flex items-center gap-1">
                <LeafIcon size={10} />
                <span>{species.interventionCount || species.interventionUsageCount || (isUnknown ? 1 : 0)} interventions</span>
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
                      : 'bg-[#007A49] text-white'
                  }`}
                >
                  {source}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-end justify-start mt-auto text-xs text-gray-400">
            <span>Updated: {formatRelativeTime(species.updatedAt || species.createdAt)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};