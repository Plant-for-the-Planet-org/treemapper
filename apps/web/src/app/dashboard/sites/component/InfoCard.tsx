import { motion } from "framer-motion";

export const InfoCard = ({ icon: Icon, title, value, bgColor = 'bg-gray-50', textColor = 'text-gray-900' }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className={`${bgColor} rounded-lg p-4 border border-gray-200`}
  >
    <div className="flex items-center gap-2 mb-2">
      <Icon className="w-4 h-4 text-gray-600" />
      <span className="text-xs text-gray-600 font-medium">{title}</span>
    </div>
    <p className={`text-sm font-semibold ${textColor} truncate`}>{value}</p>
  </motion.div>
);