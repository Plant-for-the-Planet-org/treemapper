import React from 'react';
import { TreePine, AlertCircle } from 'lucide-react';
import { FormData, ValidationErrors } from '../types';
import { VALIDATION_CONFIG } from '../constants';

interface TreeRegistrationProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  currentConfig: any;
  errors: ValidationErrors;
}

export const TreeRegistration: React.FC<TreeRegistrationProps> = ({
  formData,
  setFormData,
  currentConfig,
  errors
}) => {
  if (!currentConfig.allowsTreeRegistration) return null;

  // In bulk single-tree mode the tag is built from the prefix in the bulk panel,
  // so the single tag field here would be redundant.
  if (formData.isPlanningMode && formData.multiSingleTree && formData.interventionType === 'single-tree-registration') {
    return null;
  }

  const totalTreeCount = formData.species.reduce((sum, species) => sum + species.count, 0);

  if (formData.isPlanningMode) {
    return (
      <div className="bg-gradient-to-br from-amber-50/80 to-orange-50/80 backdrop-blur-sm border-2 border-amber-200/60 rounded-2xl p-8 shadow-lg">
        <h2 className="text-xl font-semibold text-amber-900 mb-6 flex items-center gap-2">
          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
            <TreePine className="w-4 h-4 text-amber-600" />
          </div>
          Tree Tag (Optional)
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Tree Tag
            </label>
            <input
              type="text"
              value={formData.treeDetails.tag}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                treeDetails: { ...prev.treeDetails, tag: e.target.value }
              }))}
              placeholder="Enter tree identifier"
              maxLength={VALIDATION_CONFIG.treeTag.maxLength}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 bg-white/60 ${errors.treeTag ? 'border-red-300' : 'border-amber-200'
                }`}
            />
            {errors.treeTag && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.treeTag}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-amber-50/80 to-orange-50/80 backdrop-blur-sm border-2 border-amber-200/60 rounded-2xl p-8 shadow-lg">
      <h2 className="text-xl font-semibold text-amber-900 mb-6 flex items-center gap-2">
        <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
          <TreePine className="w-4 h-4 text-amber-600" />
        </div>
        Tree Registration Details
      </h2>

      {formData.interventionType === 'single-tree-registration' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Tree Tag
            </label>
            <input
              type="text"
              value={formData.treeDetails.tag}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                treeDetails: { ...prev.treeDetails, tag: e.target.value }
              }))}
              placeholder="Enter tree identifier"
              maxLength={VALIDATION_CONFIG.treeTag.maxLength}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 bg-white/60 ${errors.treeTag ? 'border-red-300' : 'border-amber-200'
                }`}
            />
            {errors.treeTag && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.treeTag}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Planting Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.treeDetails.plantingDate}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                treeDetails: { ...prev.treeDetails, plantingDate: e.target.value }
              }))}
              className="w-full px-4 py-3 border-2 border-amber-200 rounded-xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 bg-white/60"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Height (m)
            </label>
            <input
              type="number"
              value={formData.treeDetails.height}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                treeDetails: { ...prev.treeDetails, height: e.target.value }
              }))}
              placeholder="Tree height"
              min="0"
              step="0.01"
              className="w-full px-4 py-3 border-2 border-amber-200 rounded-xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 bg-white/60"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Width/DBH (cm)
            </label>
            <input
              type="number"
              value={formData.treeDetails.width}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                treeDetails: { ...prev.treeDetails, width: e.target.value }
              }))}
              placeholder="Diameter at breast height"
              min="0"
              step="0.01"
              className="w-full px-4 py-3 border-2 border-amber-200 rounded-xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 bg-white/60"
            />
          </div>
        </div>
      ) : (
        // Multi-tree registration
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Total Trees <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={totalTreeCount}
              disabled
              className="w-full px-4 py-3 border-2 border-amber-200 rounded-xl bg-amber-50/50 text-slate-600"
            />
            <p className="text-xs text-amber-700 mt-1">Calculated from species counts above</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Planting Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.treeDetails.plantingDate}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                treeDetails: { ...prev.treeDetails, plantingDate: e.target.value }
              }))}
              className="w-full px-4 py-3 border-2 border-amber-200 rounded-xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 bg-white/60"
            />
          </div>
        </div>
      )}
    </div>
  );
};
