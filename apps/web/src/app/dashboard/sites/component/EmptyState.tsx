import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { LoadingSpinner } from "./LoadingSpinner";

export const EmptyState = ({ loading }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="bg-white rounded-xl border border-gray-200 p-12 text-center h-full flex items-center justify-center"
  >
    <div className="max-w-sm">
      <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
        {loading ? <LoadingSpinner /> : <MapPin className="w-8 h-8 text-gray-400" />}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {loading ? "Loading sites..." : "Select a Site"}
      </h3>
      {!loading && (
        <p className="text-sm text-gray-600">Choose a site from the list to view details and manage settings.</p>
      )}
    </div>
  </motion.div>
);
