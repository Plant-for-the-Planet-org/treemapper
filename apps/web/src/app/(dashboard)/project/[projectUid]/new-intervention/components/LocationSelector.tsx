import React from 'react';
import { MapPin, Check, X, AlertCircle, Info } from 'lucide-react';
import { FormData, ValidationErrors } from '../types';
import ProjectMap from '../component/InterventionSelectMap';
import GeoJSONFileUpload from '@/component/GeoJSONfileupload';

interface LocationSelectorProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  currentConfig: any;
  errors: ValidationErrors;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  formData,
  setFormData,
  currentConfig,
  errors
}) => {
  const handleGeoJSONChange = (geoJson: any) => {
    setFormData(prev => ({ ...prev, geoJSON: geoJson }));
  };

  if (formData.applyToEntireSite) return null;

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-lg p-8">
      <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
          <MapPin className="w-4 h-4 text-blue-600" />
        </div>
        Location <span className="text-red-500">*</span>
      </h2>

      <div className="space-y-6">
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              {currentConfig.type === 'single-tree-registration' ? (
                <p><strong>Point Selection:</strong> Click anywhere on the map to select a location. You can drag the marker to adjust the position.</p>
              ) : (
                <p><strong>Polygon Selection:</strong> Click on the map to add points. Click the first point again or double-click to complete the polygon.</p>
              )}
            </div>
          </div>
        </div>

        {/* Map Component Placeholder */}
        <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 h-80 rounded-xl flex items-center justify-center border border-blue-200">
            <ProjectMap updateGeoJSON={handleGeoJSONChange} uploadedGeoJSON={formData.geoJSON} interventionType={formData.interventionType} />
          </div>
        </div>
        
        {/* Selection Status */}
        {formData.geoJSON && (
          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-emerald-800">
                  Location Selected
                </p>
                <p className="text-xs text-emerald-700 mt-1">
                  {currentConfig.type === 'single-tree-registration' 
                    ? 'Point location has been set. You can click on the map again to change it.'
                    : 'Polygon area has been defined. You can reset and draw again if needed.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* OR Divider */}
        <div className="flex items-center">
          <div className="flex-1 border-t border-slate-300"></div>
          <span className="px-6 text-slate-500 font-semibold bg-white rounded-full border border-slate-200">OR</span>
          <div className="flex-1 border-t border-slate-300"></div>
        </div>

        {/* File Upload */}
        <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-gradient-to-br from-slate-50 to-slate-100">
          <GeoJSONFileUpload
            onGeoJSONChange={handleGeoJSONChange}
            allowedGeometryTypes={
              currentConfig.type === 'single-tree-registration'
                ? ['Point']
                : ['Polygon', 'MultiPolygon']
            }
          />
        </div>

        {/* File Preview */}
        {formData.geoJSONFile && (
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-800">
                {formData.geoJSONFile.name}
              </span>
              <span className="text-sm text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                {(formData.geoJSONFile.size / 1024).toFixed(1)} KB
              </span>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, geoJSONFile: null }))}
                className="ml-auto text-emerald-600 hover:text-emerald-800 p-1 hover:bg-emerald-100 rounded-lg transition-all duration-150"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {errors.location && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.location}
          </p>
        )}
      </div>
    </div>
  );
};
