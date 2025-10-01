import CustomButton from "@/component/CutsomButtom";
import { motion } from "framer-motion";
import { Plus, Search, Filter } from "lucide-react";

export const SiteManagementHeader = ({ onCreateSite, searchTerm, setSearchTerm, statusFilter, setStatusFilter }) => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200"
  >
    <div className="px-6 py-4">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          {/* <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
            <TreePine className="w-4 h-4 text-white" />
          </div> */}
          <div className="flex gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search sites..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none w-full bg-white"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none appearance-none bg-white min-w-[130px]"
              >
                <option value="all">All Status</option>
                <option value="planning">Planning</option>
                <option value="planting">Planting</option>
                <option value="completed">Completed</option>
                <option value="barren">Barren</option>
              </select>
            </div>
          </div>
        </div>
        <CustomButton onClick={onCreateSite}>
          <Plus className="h-4 w-4 mr-2" />
          Add Site
        </CustomButton>
      </div>


    </div>
  </motion.div>
);