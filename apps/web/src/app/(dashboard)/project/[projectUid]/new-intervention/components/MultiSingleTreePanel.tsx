import React from 'react';
import { Trees, Tag, Leaf, MapPin, X, Info } from 'lucide-react';
import { FormData } from '../types';
import { Switch } from '@/components/ui/switch';
import { VALIDATION_CONFIG } from '../constants';

interface MultiSingleTreePanelProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}

// Builds the tag for a marked tree: prefix stays constant, suffix is the
// auto-incrementing number (1-based). The prefix carries its own separator,
// e.g. prefix "OAK-" gives "OAK-1", "OAK-2", ...
const buildTag = (prefix: string, index: number) => `${prefix}${index + 1}`;

export const MultiSingleTreePanel: React.FC<MultiSingleTreePanelProps> = ({
  formData,
  setFormData,
}) => {
  // Only relevant for single-tree registration inside planning mode.
  if (!formData.isPlanningMode || formData.interventionType !== 'single-tree-registration') {
    return null;
  }

  const { multiSingleTree, multiTreePoints } = formData;
  const tagPrefix = formData.treeDetails.tagPrefix;
  const selectedSpecies = formData.species[0];
  const speciesLabel = selectedSpecies?.speciesName || selectedSpecies?.otherSpeciesName;

  const toggle = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      multiSingleTree: checked,
      // Clear marked points when turning the mode off.
      multiTreePoints: checked ? prev.multiTreePoints : [],
    }));
  };

  const setPrefix = (value: string) => {
    setFormData(prev => ({
      ...prev,
      treeDetails: { ...prev.treeDetails, tagPrefix: value },
    }));
  };

  const removePoint = (index: number) => {
    setFormData(prev => ({
      ...prev,
      multiTreePoints: prev.multiTreePoints.filter((_, i) => i !== index),
    }));
  };

  const clearAll = () => {
    setFormData(prev => ({ ...prev, multiTreePoints: [] }));
  };

  // Up to three sample tags for the live preview.
  const previewTags = Array.from({ length: 3 }, (_, i) => buildTag(tagPrefix, i));

  return (
    <div className="bg-gradient-to-br from-teal-50/80 to-emerald-50/80 backdrop-blur-sm border-2 border-teal-200/60 rounded-2xl p-8 shadow-lg">
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Trees className="w-4 h-4 text-teal-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Register multiple single trees</h2>
            <p className="text-sm text-slate-600 mt-1">
              Mark many trees on the map in one go. Every tree uses the same selected species and gets an auto-numbered tag.
            </p>
          </div>
        </div>
        <Switch
          checked={multiSingleTree}
          onCheckedChange={toggle}
          aria-label="Toggle register multiple single trees"
        />
      </div>

      {multiSingleTree && (
        <div className="mt-6 space-y-6">
          {/* Shared species note */}
          <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <Leaf className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-emerald-800">
              {speciesLabel ? (
                <p>
                  All marked trees will be registered as <strong>{speciesLabel}</strong>.
                </p>
              ) : (
                <p>All marked trees will share the species you select above. Pick a species to continue.</p>
              )}
            </div>
          </div>

          {/* Tag prefix + live preview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <Tag className="w-4 h-4 text-teal-600" />
                Tag prefix
              </label>
              <input
                type="text"
                value={tagPrefix}
                onChange={(e) => setPrefix(e.target.value)}
                placeholder="e.g. OAK-"
                maxLength={VALIDATION_CONFIG.treeTag.maxLength}
                className="w-full px-4 py-3 border-2 border-teal-200 rounded-xl focus:ring-4 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200 bg-white/60"
              />
              <p className="text-xs text-slate-500 mt-2">
                The prefix stays the same for every tree. A number is added automatically, starting at 1.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Tag preview
              </label>
              <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-2 border-dashed border-teal-200 rounded-xl bg-white/60 min-h-[52px]">
                {previewTags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-teal-100 text-teal-800 text-sm rounded-full font-mono font-medium"
                  >
                    {tag}
                  </span>
                ))}
                <span className="text-sm text-slate-400">...</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Tags increment automatically as you mark trees on the map.
              </p>
            </div>
          </div>

          {/* Marked trees summary + list */}
          <div className="bg-white/70 border border-teal-200 rounded-xl p-4">
            <div className="flex items-center justify-between gap-4 mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-teal-600" />
                <span className="text-sm font-semibold text-slate-900">
                  {multiTreePoints.length} tree{multiTreePoints.length === 1 ? '' : 's'} marked
                </span>
              </div>
              {multiTreePoints.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-xs font-medium text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all"
                >
                  Clear all
                </button>
              )}
            </div>

            {multiTreePoints.length === 0 ? (
              <div className="flex items-start gap-2 text-sm text-slate-500">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Click on the map below to drop a tree. Each click adds a new tree with the next tag.</span>
              </div>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {multiTreePoints.map((point, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between gap-3 bg-white rounded-lg border border-slate-200 px-3 py-2"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex items-center justify-center w-6 h-6 bg-teal-600 text-white text-xs font-semibold rounded-full flex-shrink-0">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-mono font-medium text-slate-900 truncate">
                          {buildTag(tagPrefix, index)}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePoint(index)}
                      aria-label={`Remove tree ${index + 1}`}
                      className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-all flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
