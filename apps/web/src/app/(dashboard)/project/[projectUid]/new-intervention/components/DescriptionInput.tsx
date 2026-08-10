import React from 'react';
import { FileText, AlertCircle } from 'lucide-react';
import { FormData, ValidationErrors } from '../types';
import { VALIDATION_CONFIG } from '../constants';

interface DescriptionInputProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  errors: ValidationErrors;
}

export const DescriptionInput: React.FC<DescriptionInputProps> = ({
  formData,
  setFormData,
  errors
}) => {
  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-lg p-8">
      <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
          <FileText className="w-4 h-4 text-indigo-600" />
        </div>
        {formData.isPlanningMode ? 'Details / Comment (Optional)' : 'Details (Optional)'}
      </h2>
      <textarea
        value={formData.description}
        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
        placeholder={formData.isPlanningMode
          ? 'Add a comment or notes about this planned intervention...'
          : 'Describe the intervention or any relevant details...'}
        maxLength={VALIDATION_CONFIG.description.maxLength}
        rows={5}
        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 resize-none bg-white/50 ${errors.description ? 'border-red-300' : 'border-slate-200'
          }`}
      />
      <div className="flex justify-between mt-3">
        <div>
          {errors.description && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.description}
            </p>
          )}
        </div>
        <p className="text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
          {formData.description.length}/{VALIDATION_CONFIG.description.maxLength}
        </p>
      </div>
    </div>
  );
};
