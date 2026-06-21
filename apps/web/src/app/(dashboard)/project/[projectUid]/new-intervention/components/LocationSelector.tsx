import React, { useEffect, useState } from 'react';
import { Layers, MapPin, Check, X, AlertCircle, Info } from 'lucide-react';
import { FormData, ValidationErrors } from '../types';
import ProjectMap from '../component/InterventionSelectMap';
import InterventionFileUpload from './InterventionFileUpload';
import { Switch } from '@/components/ui/switch';
import { getSiteInterventionsMap } from '@shared-core/fetchApi/api.fetch';
import useProjectStore from '@shared-core/store/useProjectStore';
import { useToken } from '@/context/useTokenContext';

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
  const { accessToken } = useToken();
  const selectedProject = useProjectStore(state => state.selectedProject);
  const [showExisting, setShowExisting] = useState(false);
  const [existing, setExisting] = useState<any[]>([]);
  const [loadingExisting, setLoadingExisting] = useState(false);

  const handleGeoJSONChange = (geoJson: any) => {
    setFormData(prev => ({ ...prev, geoJSON: geoJson }));
  };

  useEffect(() => {
    setShowExisting(false);
    setExisting([]);
  }, [formData.siteId]);

  useEffect(() => {
    if (!showExisting || !formData.siteId || !selectedProject?.uid) return;
    let cancelled = false;
    const fetchExisting = async () => {
      setLoadingExisting(true);
      try {
        const res = await getSiteInterventionsMap(accessToken, selectedProject.uid, formData.siteId!);
        if (cancelled) return;
        const list = res?.interventions ?? res?.data?.interventions ?? [];
        setExisting(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setExisting([]);
      } finally {
        if (!cancelled) setLoadingExisting(false);
      }
    };
    fetchExisting();
    return () => { cancelled = true; };
  }, [showExisting, formData.siteId, selectedProject?.uid, accessToken]);

  const addMarkedPoint = (point: { longitude: number; latitude: number }) => {
    setFormData(prev => ({ ...prev, multiTreePoints: [...prev.multiTreePoints, point] }));
  };

  const removeMarkedPoint = (index: number) => {
    setFormData(prev => ({
      ...prev,
      multiTreePoints: prev.multiTreePoints.filter((_, i) => i !== index),
    }));
  };

  if (formData.applyToEntireSite) return null;

  const isSingleTree = formData.interventionType === 'single-tree-registration';
  const isMultiSingleTree = formData.isPlanningMode && formData.multiSingleTree && isSingleTree;
  const siteSelected = Boolean(formData.siteId);

  // Geometry modes this intervention type allows, driven by the type config.
  // Falls back to geoJSONType when geometryType is not declared.
  const geometryModes: Array<'point' | 'polygon'> =
    Array.isArray(currentConfig?.geometryType) && currentConfig.geometryType.length
      ? currentConfig.geometryType
      : currentConfig?.geoJSONType === 'Point'
        ? ['point']
        : ['polygon'];
  const allowsBothGeometry = geometryModes.includes('point') && geometryModes.includes('polygon');

  // Geometry types accepted by the file upload (GeoJSON/KML). This is decoupled
  // from the map modes on purpose: even when the map allows both point and
  // polygon (e.g. multi-tree registration), an uploaded file must match the
  // type the intervention stores. `geoJSONType` is that declared upload type,
  // so multi-tree only accepts polygons and single-tree only accepts points.
  const uploadGeometryTypes: Array<'Point' | 'Polygon' | 'MultiPolygon'> =
    currentConfig?.geoJSONType === 'Polygon'
      ? ['Polygon', 'MultiPolygon']
      : currentConfig?.geoJSONType === 'Point'
        ? ['Point']
        : allowsBothGeometry
          ? ['Point', 'Polygon', 'MultiPolygon']
          : geometryModes[0] === 'point'
            ? ['Point']
            : ['Polygon', 'MultiPolygon'];

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
              {isMultiSingleTree ? (
                <p><strong>Mark multiple trees:</strong> Click anywhere on the map to drop a tree. Each click adds a new tree with the next tag. Click a marker to remove it.</p>
              ) : allowsBothGeometry ? (
                <p><strong>Point or polygon:</strong> Use the toggle on the map to pick Point or Polygon, then click the map to mark the location.</p>
              ) : geometryModes[0] === 'point' ? (
                <p><strong>Point Selection:</strong> Click anywhere on the map to select a location. You can drag the marker to adjust the position.</p>
              ) : (
                <p><strong>Polygon Selection:</strong> Click points on the map, then double-click or click the first point to close the polygon.</p>
              )}
            </div>
          </div>
        </div>

        {/* Toggle: show existing interventions for this site */}
        {siteSelected && (
          <div className="flex items-start justify-between gap-4 bg-white rounded-xl border border-slate-200 px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Layers className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Show existing interventions on this site</p>
                <p className="text-xs text-slate-600 mt-0.5">
                  {loadingExisting
                    ? 'Loading existing interventions...'
                    : showExisting
                      ? `${existing.length} existing intervention${existing.length === 1 ? '' : 's'} displayed`
                      : 'Helps you locate existing trees and avoid overlap.'}
                </p>
              </div>
            </div>
            <Switch
              checked={showExisting}
              onCheckedChange={setShowExisting}
              aria-label="Toggle existing interventions overlay"
            />
          </div>
        )}

        {/* Map Component Placeholder */}
        <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 h-80 rounded-xl flex items-center justify-center border border-blue-200">
            <ProjectMap
              updateGeoJSON={handleGeoJSONChange}
              uploadedGeoJSON={formData.geoJSON}
              interventionType={formData.interventionType}
              selectedSite={formData.selectedSite}
              existingInterventions={showExisting ? existing : []}
              isMultiSingleTree={isMultiSingleTree}
              markedPoints={formData.multiTreePoints}
              onAddPoint={addMarkedPoint}
              onRemovePoint={removeMarkedPoint}
              tagPrefix={formData.treeDetails.tagPrefix}
              geometryModes={geometryModes}
            />
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
                  {isSingleTree
                    ? 'Point location has been set. You can click on the map again to change it.'
                    : 'Location has been defined. You can reset and draw again if needed.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* OR Divider — file upload is for a single location, not bulk marking */}
        {!isMultiSingleTree && (
          <div className="flex items-center">
            <div className="flex-1 border-t border-slate-300"></div>
            <span className="px-6 text-slate-500 font-semibold bg-white rounded-full border border-slate-200">OR</span>
            <div className="flex-1 border-t border-slate-300"></div>
          </div>
        )}

        {/* File Upload */}
        {!isMultiSingleTree && (
          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-gradient-to-br from-slate-50 to-slate-100">
            <InterventionFileUpload
              onGeoJSONChange={handleGeoJSONChange}
              allowedGeometryTypes={uploadGeometryTypes}
            />
          </div>
        )}

        {/* File Preview */}
        {!isMultiSingleTree && formData.geoJSONFile && (
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
