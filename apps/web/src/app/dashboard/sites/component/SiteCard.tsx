import { motion } from "framer-motion";
import { AreaChart, User, Calendar, Clock } from "lucide-react";

export const SiteCard = ({ site, isSelected, onSelect }) => {
  const getStatusConfig = (status) => {
    const configs = {
      planting: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', dot: 'bg-green-500' },
      planning: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
      completed: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', dot: 'bg-gray-500' },
      default: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' }
    };
    return configs[status] || configs.default;
  };

  const statusConfig = getStatusConfig(site.status);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      onClick={() => onSelect(site)}
      className={`cursor-pointer transition-all duration-200 border rounded-xl p-4 ${
        isSelected
          ? 'bg-green-50/50 border-green-200 shadow-sm'
          : 'bg-white hover:bg-gray-50/80 border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 text-sm mb-1 truncate">{site.name}</h3>
          <p className="text-xs text-gray-500">ID: {site.id}</p>
        </div>
        <div className={`px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}></div>
          {site.status}
        </div>
      </div>

      <p className="text-xs text-gray-600 mb-3 line-clamp-2 leading-relaxed">{site.description}</p>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-gray-50 rounded-lg p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <AreaChart className="w-3 h-3 text-gray-500" />
            <span className="text-xs text-gray-600">Area</span>
          </div>
          <p className="text-xs font-medium text-gray-900">{site.area}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <User className="w-3 h-3 text-gray-500" />
            <span className="text-xs text-gray-600">Creator</span>
          </div>
          <p className="text-xs font-medium text-gray-900 truncate">{site.createdBy}</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>{site.createdAt}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>{site.lastUpdate}</span>
        </div>
      </div>
    </motion.div>
  );
};