import { AnimatePresence, motion } from "framer-motion";
import { Search } from "lucide-react";
import { LoadingState } from "./LoadingState";
import { SiteCard } from "./SiteCard";

export const SitesList = ({ sites, selectedSite, onSiteSelect, loading, filteredSites }) => (
  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
    <div className="p-4 border-b border-gray-100 bg-gray-50/50">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">Sites Overview</h2>
        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
          {filteredSites.length} sites
        </span>
      </div>
    </div>

    <div className="h-full overflow-y-auto max-h-[calc(100vh-200px)]">
      {loading ? (
        <LoadingState message="Loading sites..." />
      ) : (
        <div className="p-4 space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredSites.map((site) => (
              <SiteCard
                key={site.id}
                site={site}
                isSelected={selectedSite?.id === site.id}
                onSelect={onSiteSelect}
              />
            ))}
          </AnimatePresence>

          {!loading && filteredSites.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-8 text-center text-gray-500"
            >
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-gray-700 mb-1">No sites found</h3>
              <p className="text-xs text-gray-500">Try adjusting your search criteria</p>
            </motion.div>
          )}
        </div>
      )}
    </div>
  </div>
);