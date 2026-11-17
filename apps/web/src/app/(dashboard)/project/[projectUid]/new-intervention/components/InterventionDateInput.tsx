import React from 'react';
import { Calendar, AlertCircle } from 'lucide-react';
import { FormData, ValidationErrors } from '../types';

interface InterventionDateInputProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  currentConfig: any;
  errors: ValidationErrors;
}

// Date picker for intervention types that do not show the TreeRegistration
// panel (which carries its own "Planting Date" for tree types). Binds to
// treeDetails.plantingDate because buildApiPayload derives
// interventionStartDate / interventionEndDate from that field for every type.
export const InterventionDateInput: React.FC<InterventionDateInputProps> = ({
  formData,
  setFormData,
  currentConfig,
  errors
}) => {
  if (currentConfig.allowsTreeRegistration || formData.isPlanningMode) return null;

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-lg p-8">
      <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
          <Calendar className="w-4 h-4 text-emerald-600" />
        </div>
        Intervention Date
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={formData.treeDetails.plantingDate}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              treeDetails: { ...prev.treeDetails, plantingDate: e.target.value }
            }))}
            className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 bg-white/60 ${errors.interventionDate ? 'border-red-300' : 'border-slate-200'
              }`}
          />
          {errors.interventionDate && (
            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.interventionDate}
            </p>
          )}
          <p className="text-xs text-slate-500 mt-2">
            When this intervention was carried out
          </p>
        </div>
      </div>
    </div>
  );
};
