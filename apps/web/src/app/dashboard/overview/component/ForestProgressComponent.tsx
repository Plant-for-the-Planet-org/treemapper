import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TreePine, Target, Award } from 'lucide-react';

const ForestProgressComponent = ({ target = 0, treeCount = 0 }) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [animatedTreeCount, setAnimatedTreeCount] = useState(0);

  const actualProgress = Math.min((treeCount / target) * 100, 100);
  const isTargetExceeded = treeCount > target;
  const remainingTrees = Math.max(target - treeCount, 0);

  function formatNumber(num) {
    if (num >= 1_000_000_000) {
      return (num / 1_000_000_000).toFixed(1) + 'B';
    } else if (num >= 1_000_000) {
      return (num / 1_000_000).toFixed(1) + 'M';
    } else if (num >= 1_000) {
      return (num / 1_000).toFixed(1) + 'K';
    } else {
      return num.toLocaleString();
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(actualProgress);
      setAnimatedTreeCount(treeCount);
    }, 300);
    return () => clearTimeout(timer);
  }, [actualProgress, treeCount]);

  const getMilestoneReward = () => {
    if (isTargetExceeded) return { text: "Forest Champion", emoji: "🏆" };
    if (actualProgress >= 90) return { text: "Forest Guardian", emoji: "🥇" };
    if (actualProgress >= 75) return { text: "Tree Keeper", emoji: "🥈" };
    if (actualProgress >= 50) return { text: "Nature Friend", emoji: "🥉" };
    if (actualProgress >= 25) return { text: "Seedling Tender", emoji: "🌿" };
    return null;
  };

  const milestone = getMilestoneReward();

  return (
    <div className="w-full px-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-gray-50 rounded-lg">
              <TreePine className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Forest Progress</h3>
            </div>
          </div>
          
          {/* Badge */}
          {milestone && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 1 }}
              className="flex items-center gap-1 bg-green-50 text-green-700 text-xs font-medium px-2 py-1 rounded-full border border-green-200"
            >
              <Award className="w-3 h-3" />
              <span>{milestone.text}</span>
            </motion.div>
          )}
        </div>

        {/* Progress Section */}
        <div className="space-y-2">
          {/* Progress Bar */}
          <div className="relative">
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${animatedProgress}%` }}
                transition={{ duration: 1, delay: 0.4 }}
                className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full relative"
              >
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{
                    duration: 2,
                    ease: "easeInOut",
                    repeat: Infinity,
                    repeatDelay: 3,
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                />
              </motion.div>
            </div>
            
            {/* Progress Text */}
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-gray-600">
                {formatNumber(animatedTreeCount)} trees planted
              </span>
              <span className="text-xs font-medium text-gray-700">
                {actualProgress.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1">
              <Target className="w-3 h-3 text-gray-500" />
              <span className="text-xs text-gray-600">Target:</span>
              <span className="text-xs font-medium text-gray-800">{formatNumber(target)}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <TreePine className="w-3 h-3 text-gray-500" />
              <span className="text-xs text-gray-600">
                {isTargetExceeded ? 'Exceeded by:' : 'Remaining:'}
              </span>
              <span className="text-xs font-medium text-gray-800">
                {isTargetExceeded ? '+' : ''}
                {formatNumber(isTargetExceeded ? treeCount - target : remainingTrees)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForestProgressComponent;