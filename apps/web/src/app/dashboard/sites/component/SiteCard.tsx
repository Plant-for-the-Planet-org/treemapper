import { motion } from "framer-motion";
import { AreaChart, User, Calendar } from "lucide-react";

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

  // Generate initials from display name
  const getInitials = (name) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  // Generate random light background color for initials
  const getRandomBgColor = (name) => {
    const colors = [
      'bg-blue-100', 'bg-green-100', 'bg-yellow-100', 'bg-purple-100', 
      'bg-pink-100', 'bg-indigo-100', 'bg-red-100', 'bg-orange-100'
    ];
    if (!name) return colors[0];
    const hash = name.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // Get corresponding text color for the background
  const getTextColor = (bgColor) => {
    const colorMap = {
      'bg-blue-100': 'text-blue-700',
      'bg-green-100': 'text-green-700',
      'bg-yellow-100': 'text-yellow-700',
      'bg-purple-100': 'text-purple-700',
      'bg-pink-100': 'text-pink-700',
      'bg-indigo-100': 'text-indigo-700',
      'bg-red-100': 'text-red-700',
      'bg-orange-100': 'text-orange-700'
    };
    return colorMap[bgColor] || 'text-gray-700';
  };

  // Render member avatars with overlap
  const renderMemberAvatars = () => {
    if (!site.member || site.member.totalCount === 0) return null;

    const { totalCount, avatars } = site.member;

    // Single member case - show only avatar
    if (totalCount === 1) {
      const member = avatars[0];
      const bgColor = getRandomBgColor(member.displayName);
      const textColor = getTextColor(bgColor);

      return (
        <div className="flex items-center">
          <div className="w-6 h-6 rounded-full border-2 border-white overflow-hidden">
            {member.image ? (
              <img 
                src={member.image} 
                alt={member.displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className={`w-full h-full ${bgColor} ${textColor} flex items-center justify-center text-xs font-medium`}>
                {getInitials(member.displayName)}
              </div>
            )}
          </div>
        </div>
      );
    }

    // Multiple members case
    const showCount = Math.min(totalCount === 5 ? 4 : totalCount - 1, 4);
    const remainingCount = totalCount - showCount;

    return (
      <div className="flex items-center">
        {/* Avatar stack */}
        <div className="flex items-center -space-x-2">
          {avatars.slice(0, showCount).map((member, index) => {
            const bgColor = getRandomBgColor(member.displayName);
            const textColor = getTextColor(bgColor);
            
            return (
              <div 
                key={member.uid} 
                className="w-6 h-6 rounded-full border-2 border-white overflow-hidden relative"
                style={{ zIndex: showCount - index }}
              >
                {member.image ? (
                  <img 
                    src={member.image} 
                    alt={member.displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={`w-full h-full ${bgColor} ${textColor} flex items-center justify-center text-xs font-medium`}>
                    {getInitials(member.displayName)}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Plus count */}
        {remainingCount > 0 && (
          <div className="ml-1 w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
            <span className="text-xs font-medium text-gray-600">+{remainingCount}</span>
          </div>
        )}
      </div>
    );
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
        {renderMemberAvatars()}
      </div>
    </motion.div>
  );
};