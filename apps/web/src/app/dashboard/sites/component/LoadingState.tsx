import { motion } from "framer-motion";
import { LoadingSpinner } from "./LoadingSpinner";

// Enhanced Loading State Component
export const LoadingState = ({ message = 'Loading...' }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center p-8 text-center"
  >
    <LoadingSpinner size="large" />
    <p className="text-sm text-gray-500 mt-3 font-medium">{message}</p>
  </motion.div>
);