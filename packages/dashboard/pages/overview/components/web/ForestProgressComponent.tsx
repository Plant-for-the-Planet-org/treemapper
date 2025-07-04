import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TreePine, Leaf, Target } from 'lucide-react';

const ForestProgressComponent = ({ target=0, treeCount=0 }) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [animatedTreeCount, setAnimatedTreeCount] = useState(0);

  const actualProgress = Math.min((treeCount / target) * 100, 100);
  const isTargetExceeded = treeCount > target;
  const remainingTrees = Math.max(target - treeCount, 0);

  function formatNumber(num) {
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(1) + ' Billion';
  } else if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + ' Million';
  } else if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + ' Thousand';
  } else {
    return num
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
    if (isTargetExceeded) return "🏆 Forest Champion";
    if (actualProgress >= 90) return "🥇 Forest Guardian";
    if (actualProgress >= 75) return "🥈 Tree Keeper";
    if (actualProgress >= 50) return "🥉 Nature Friend";
    if (actualProgress >= 25) return "🌿 Seedling Tender";
    return null;
  };

  return (
    <div style={{display:'flex',justifyContent:'center',alignItems:'center',width:'100%'}}>
<div className="w-[96vw] h-[15vh] bg-white rounded-xl shadow-md border border-gray-200 flex items-center justify-between px-6 overflow-hidden">
      {/* Icon and Label */}
      <div className="flex items-center gap-4" >
        <div className="p-2 bg-gray-100 rounded-full shadow-sm">
          <TreePine className="w-5 h-5 text-gray-700" />
        </div>
        <div>
          <h3 className="text-md font-semibold text-gray-800">Forest Progress</h3>
          <p className="text-xs text-gray-500">Growing your paradise</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="flex-1 mx-6">
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${animatedProgress}%` }}
            transition={{ duration: 1, delay: 0.4 }}
            className="h-full bg-green-700 rounded-full relative"
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
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            />
          </motion.div>
        </div>
        <div className="text-xs text-gray-600 mt-1">{animatedTreeCount} trees planted</div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6">
        <div className="text-center">
          <Target className="w-4 h-4 mx-auto text-gray-500 mb-0.5" />
          <div className="text-sm font-medium text-gray-800">{formatNumber(target)}</div>
          <div className="text-[10px] text-gray-500">Target</div>
        </div>
        <div className="text-center">
          <TreePine className="w-4 h-4 mx-auto text-gray-500 mb-0.5" />
          <div className="text-sm font-medium text-gray-800">
            {isTargetExceeded ? '+' : ''}
            {formatNumber(remainingTrees)}
          </div>
          <div className="text-[10px] text-gray-500">
            {isTargetExceeded ? 'Extra trees' : 'Remaining'}
          </div>
        </div>
      </div>

      {/* Badge */}
      {getMilestoneReward() && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 1 }}
          className="ml-4 bg-gray-100 text-gray-700 text-xs font-semibold px-3 py-1 rounded-full shadow-sm"
        >
          {getMilestoneReward()}
        </motion.div>
      )}
    </div>
    </div>
  );
};

export default ForestProgressComponent;
