import { motion } from 'framer-motion'
import { TreePine } from 'lucide-react'

const ForestBulkLoader = () => {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="relative mb-5">
        <motion.div
          className="absolute inset-0 bg-primary rounded-full opacity-20"
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.1, 0.2] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative w-14 h-14 bg-primary rounded-full flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <TreePine className="w-7 h-7 text-primary-foreground" />
          </motion.div>
        </div>
      </div>

      <div className="text-center">
        <motion.h3
          className="text-sm font-semibold text-foreground mb-1"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          Processing forest data
        </motion.h3>
        <p className="text-xs text-muted-foreground">Uploading records in bulk...</p>
      </div>

      <div className="flex space-x-1 mt-4">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="w-2 h-2 bg-primary rounded-full"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity, delay: index * 0.2 }}
          />
        ))}
      </div>
    </div>
  )
}

export default ForestBulkLoader
