import { motion } from "framer-motion";
import { Save, X, Edit3, Trash2, MapPin, User, Calendar, Clock, AreaChart, FileText } from "lucide-react";
import { InfoCard } from "./InfoCard";
import SiteViewer from '@/component/DisplayGeoJSONMap';


export const SiteDetails = ({ site, isEditing, editedSite, setEditedSite, onEdit, onSave, onCancel, onDelete }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    className="bg-white rounded-xl border border-gray-200 overflow-hidden"
  >
    {/* Header */}
    <div className="bg-gray-900 text-white p-6">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          {isEditing ? (
            <input
              type="text"
              value={editedSite?.name || ''}
              onChange={(e) => setEditedSite({ ...editedSite, name: e.target.value })}
              className="text-xl font-semibold bg-transparent border-b border-white/30 focus:border-white outline-none w-full text-white placeholder-white/70"
              placeholder="Site name..."
            />
          ) : (
            <h2 className="text-xl font-semibold mb-2">{site.name}</h2>
          )}

          <div className="flex items-center gap-3 mt-2">
            <span className="bg-white/20 px-2 py-1 rounded-md text-xs font-medium capitalize">
              {site.status}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          {isEditing ? (
            <>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onSave}
                className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onCancel}
                className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </>
          ) : (
            <>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onEdit}
                className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
              >
                <Edit3 className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onDelete}
                className="bg-red-500/80 hover:bg-red-600 p-2 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </motion.button>
            </>
          )}
        </div>
      </div>
    </div>

    {/* Content */}
    <div className="p-6 space-y-6">
      {/* Map Section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-900">Location</h3>
        </div>
        <div className="h-64 bg-gray-50 rounded-lg overflow-hidden">
          <SiteViewer geoJsonData={site.geometry} />
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <InfoCard icon={User} title="Created By" value={site.createdBy} />
        <InfoCard icon={Calendar} title="Created" value={site.createdAt} />
        <InfoCard icon={Clock} title="Updated" value={site.lastUpdate} />
        <InfoCard icon={AreaChart} title="Area" value={site.area} bgColor="bg-green-50" textColor="text-green-900" />
      </div>

      {/* Description */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-4 h-4 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-900">Description</h3>
        </div>
        {isEditing ? (
          <textarea
            value={editedSite?.description || ''}
            onChange={(e) => setEditedSite({ ...editedSite, description: e.target.value })}
            rows={4}
            className="w-full p-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none resize-none"
            placeholder="Enter site description..."
          />
        ) : (
          <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-lg">
            {site.description}
          </p>
        )}
      </div>
    </div>
  </motion.div>
);