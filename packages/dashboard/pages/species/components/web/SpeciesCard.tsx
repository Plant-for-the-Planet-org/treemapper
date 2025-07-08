import { Heart, Leaf, MapPin, EyeOff, Calendar, Eye, ChevronRight } from "lucide-react";

const SpeciesCard = ({ species, isSelected, onClick, isMobile, formatDate, handleToggleDisabled, }) => (
    <div
        onClick={onClick}
        className={`group relative bg-white rounded-2xl shadow-sm border-2 transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.02] ${isSelected
            ? 'ring-2 ring-emerald-500 border-emerald-200 shadow-emerald-100 bg-gradient-to-br from-emerald-50 to-white'
            : 'border-gray-200 hover:border-gray-300'
            } ${species.disabled ? 'opacity-60' : ''}`}
    >
        {/* Favorite indicator */}
        {species.favourite && (
            <div className="absolute top-4 right-4 z-10">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                    <Heart size={16} fill="white" className="text-white" />
                </div>
            </div>
        )}

        <div className="p-6">
            {/* Image and main info */}
            <div className="flex items-start gap-4 mb-4">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0 shadow-inner border border-gray-200">
                    {species.image ? (
                        <img
                            src={`https://pub-261389c3bd084eb3a62686b2f08ce42b.r2.dev/development/species/${species.image}`}
                            alt={species.scientificName}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Leaf size={28} className="text-emerald-500" />
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 italic text-lg leading-tight mb-2 line-clamp-2">
                        {species.scientificName}
                    </h3>
                    {species.commonName && (
                        <p className="text-gray-600 font-medium mb-3 line-clamp-1">
                            {species.commonName}
                        </p>
                    )}

                    {/* Status badges */}
                    <div className="flex flex-wrap items-center gap-2">
                        {species.isNativeSpecies && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                                <MapPin size={10} />
                                Native
                            </span>
                        )}
                        {species.disabled && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                                <EyeOff size={10} />
                                Disabled
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Description preview */}
            {species.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {species.description}
                </p>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar size={12} />
                    <span>{formatDate(species.updatedAt)}</span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleToggleDisabled(species.uid);
                        }}
                        className={`p-2 rounded-lg transition-all duration-200 ${species.disabled
                            ? 'bg-red-100 hover:bg-red-200 text-red-600'
                            : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-600'
                            }`}
                        title={species.disabled ? 'Enable species' : 'Disable species'}
                    >
                        {species.disabled ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>

                    {isMobile && (
                        <ChevronRight size={16} className="text-gray-400" />
                    )}
                </div>
            </div>
        </div>
    </div>
);

export default SpeciesCard;