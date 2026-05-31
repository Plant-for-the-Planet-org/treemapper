import React from 'react';
import { Target } from 'lucide-react';
import { FormData } from '../types';
import { interventionConfigurations } from '../constants';

interface InterventionTypeSelectorProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}

export const InterventionTypeSelector: React.FC<InterventionTypeSelectorProps> = ({
  formData,
  setFormData
}) => {
  const currentConfig = interventionConfigurations[formData.interventionType];
  const PLANNABLE_TYPES = ['single-tree-registration', 'multi-tree-registration'];
  const visibleConfigurations = formData.isPlanningMode
    ? Object.fromEntries(
        Object.entries(interventionConfigurations).filter(([key]) => PLANNABLE_TYPES.includes(key))
      )
    : interventionConfigurations;

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-lg p-8">
      <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
          <Target className="w-4 h-4 text-purple-600" />
        </div>
        Intervention Type
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {Object.entries(visibleConfigurations).map(([key, config]) => (
          <label
            key={key}
            className={`relative cursor-pointer group transition-all duration-200 ${formData.interventionType === key ? 'scale-105' : 'hover:scale-102'
              }`}
          >
            <input
              type="radio"
              name="interventionType"
              value={key}
              checked={formData.interventionType === key}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                interventionType: e.target.value,
                species: [],
                geoJSON: null,
                geoJSONFile: null,
                // Bulk single-tree only applies to single-tree registration.
                multiSingleTree: e.target.value === 'single-tree-registration' ? prev.multiSingleTree : false,
                multiTreePoints: e.target.value === 'single-tree-registration' ? prev.multiTreePoints : []
              }))}
              className="sr-only"
            />
            <div className={`p-4 rounded-xl border-2 transition-all duration-200 ${formData.interventionType === key
              ? `border-${config.color}-500 bg-${config.color}-50 shadow-lg shadow-${config.color}-500/20`
              : 'border-slate-200 bg-white/50 hover:border-slate-300 hover:shadow-md'
              }`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${formData.interventionType === key
                  ? `bg-${config.color}-100 text-${config.color}-600`
                  : 'bg-slate-100 text-slate-600'
                  }`}>
                  {config.icon}
                </div>
                <span className="font-medium text-slate-900">
                  {key.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </span>
              </div>
            </div>
          </label>
        ))}
      </div>

      {currentConfig && (
        <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-xl p-6 border border-slate-200/60">
          <p className="text-slate-700 mb-4">{currentConfig.description}</p>
          <div className="flex flex-wrap gap-2">
            {currentConfig.allowsSpecies && (
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-sm rounded-full font-medium">
                Species Tracking
              </span>
            )}
            {currentConfig.allowsTreeRegistration && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium">
                Tree Registration
              </span>
            )}
            {currentConfig.geoJSONType && (
              <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full font-medium">
                {currentConfig.geoJSONType} Required
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
