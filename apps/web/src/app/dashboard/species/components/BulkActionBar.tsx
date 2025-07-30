import { motion } from "framer-motion";
import { CheckSquare } from "lucide-react";

export const BulkActionBar = ({ selectedCount, onAssignSpecies, onClearSelection }) => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="fixed top-0 left-0 right-0 z-40 bg-blue-600 text-white p-4 shadow-lg"
  >
    <div className="flex items-center justify-between max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <CheckSquare size={20} />
        <span className="font-medium">{selectedCount} unknown species selected</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onAssignSpecies}
          className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
        >
          Assign Scientific Species
        </button>
        <button
          onClick={onClearSelection}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-400 transition-colors"
        >
          Clear Selection
        </button>
      </div>
    </div>
  </motion.div>
);
