import React from 'react';
import { Info, AlertCircle } from 'lucide-react';
import { FormData, ValidationErrors } from '../types';

interface ProjectSiteSelectorProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  errors: ValidationErrors;
  projects: any;
  sites: any[];
  fetchingSites: boolean;
}

export const ProjectSiteSelector: React.FC<ProjectSiteSelectorProps> = ({
  formData,
  setFormData,
  errors,
  projects,
  sites,
  fetchingSites
}) => {
  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-lg p-8">
      <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
          <Info className="w-4 h-4 text-blue-600" />
        </div>
        Project Selection
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            Project <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={projects?.name ? projects.name : 'No project available'}
            disabled
            className="w-full px-4 py-3 border-2 rounded-xl bg-slate-100/80 text-slate-600 border-slate-200 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            Site (Optional)
          </label>
          <select
            value={formData.siteId || ''}
            onChange={(e) => {
              setFormData(prev => ({
                ...prev,
                siteId: e.target.value || null
              }))
            }}
            disabled={!formData.projectId || sites.length === 0}
            className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 ${!formData.projectId ? 'bg-slate-100/50' : 'bg-white/50'
              } ${errors.siteId ? 'border-red-300' : 'border-slate-200'}`}
          >
            <option value="">
              {fetchingSites ? "Loading sites..." : sites.length === 0 ? "No sites found" : "Select site"}
            </option>
            {sites.map(site => (
              <option key={site.uid} value={site.uid}>{site.name}</option>
            ))}
          </select>
          {errors.siteId && (
            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.siteId}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
