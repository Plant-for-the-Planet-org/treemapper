import { motion } from "framer-motion"
import { MapPin } from "lucide-react"
import { LoadingSpinner } from "./LoadingSpinner"

export const EmptyState = ({ loading }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="bg-background rounded-xl border border-border p-12 text-center h-full flex items-center justify-center"
  >
    <div className="max-w-sm">
      <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
        {loading ? <LoadingSpinner /> : <MapPin className="w-8 h-8 text-muted-foreground/60" />}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {loading ? "Loading sites..." : "Select a Site"}
      </h3>
      {!loading && (
        <p className="text-sm text-muted-foreground">Choose a site from the list to view details and manage settings.</p>
      )}
    </div>
  </motion.div>
)
