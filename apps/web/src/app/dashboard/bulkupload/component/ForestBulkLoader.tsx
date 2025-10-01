import { motion } from 'framer-motion';
import { TreePine } from 'lucide-react';

const ForestBulkLoader = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      {/* Animated Icon Container */}
      <div className="relative mb-6">
        {/* Pulsing background circle */}
        <motion.div
          className="absolute inset-0 bg-[#007A49] rounded-full opacity-20"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.1, 0.2]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Main icon container */}
        <div className="relative w-16 h-16 bg-[#007A49] rounded-full flex items-center justify-center">
          {/* Scaling tree icon */}
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <TreePine className="w-8 h-8 text-white" />
          </motion.div>
          
          {/* Sparkle effects around the tree */}
          {[...Array(6)].map((_, index) => {
            const angle = (index * 60) * (Math.PI / 180);
            const radius = 28;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            return (
              <motion.div
                key={index}
                className="absolute w-1 h-1 bg-yellow-300 rounded-full"
                style={{
                  left: `50%`,
                  top: `50%`,
                  transform: `translate(${x}px, ${y}px)`
                }}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: index * 0.2,
                  ease: "easeInOut"
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Loading text */}
      <div className="text-center">
        <motion.h3
          className="text-lg font-semibold text-gray-800 mb-2"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          Processing Forest Data
        </motion.h3>
        
        <p className="text-sm text-gray-600">
          Uploading records in bulk...
        </p>
      </div>

      {/* Animated dots */}
      <div className="flex space-x-1 mt-4">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="w-2 h-2 bg-[#007A49] rounded-full"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: index * 0.2
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default ForestBulkLoader;