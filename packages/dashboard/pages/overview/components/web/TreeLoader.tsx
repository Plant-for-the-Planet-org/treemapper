import { motion } from 'framer-motion';
import { Sprout, TreePine, Droplets, Sun } from 'lucide-react';

const TreeLoader = () => {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center space-y-4">
        {/* Main animation container */}
        <div className="relative flex items-end space-x-3">
          {/* Sun animation */}
          <motion.div
            animate={{
              rotate: 360,
              scale: [1, 1.1, 1],
            }}
            transition={{
              rotate: { duration: 8, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
            className="absolute -top-8 left-1/2 transform -translate-x-1/2"
          >
            <Sun className="w-6 h-6 text-yellow-500" />
          </motion.div>

          {/* Sprouting sequence */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0 }}
          >
            <Sprout className="w-5 h-5 text-green-400" />
          </motion.div>

          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Sprout className="w-6 h-6 text-green-500" />
          </motion.div>

          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <TreePine className="w-7 h-7 text-green-600" />
          </motion.div>

          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.2 }}
          >
            <TreePine className="w-8 h-8 text-green-700" />
          </motion.div>

          {/* Water droplets */}
          <motion.div
            animate={{
              y: [0, -8, 0],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5
            }}
            className="absolute -top-4 left-1/4"
          >
            <Droplets className="w-4 h-4 text-blue-400" />
          </motion.div>

          <motion.div
            animate={{
              y: [0, -6, 0],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
            className="absolute -top-3 right-1/4"
          >
            <Droplets className="w-3 h-3 text-blue-400" />
          </motion.div>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center space-x-2">
          <motion.div
            className="h-1 bg-green-200 rounded-full overflow-hidden"
            style={{ width: '120px' }}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
              animate={{ width: ['0%', '100%'] }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.div>
        </div>

        {/* Loading text with typewriter effect */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <motion.span
            className="text-green-700 font-medium"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            Growing your forest data...
          </motion.span>
          
          <motion.div
            animate={{ opacity: [0, 1, 0] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.3
            }}
            className="flex justify-center mt-2 space-x-1"
          >
            <div className="w-1 h-1 bg-green-500 rounded-full"></div>
            <div className="w-1 h-1 bg-green-500 rounded-full"></div>
            <div className="w-1 h-1 bg-green-500 rounded-full"></div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default TreeLoader;