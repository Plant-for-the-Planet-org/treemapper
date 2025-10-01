import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export const LoadingSpinner = ({ size = 'default' }) => {
  const sizes = { small: 'w-4 h-4', default: 'w-6 h-6', large: 'w-8 h-8' };
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    >
      <Loader2 className={`${sizes[size]} text-gray-400`} />
    </motion.div>
  );
};
