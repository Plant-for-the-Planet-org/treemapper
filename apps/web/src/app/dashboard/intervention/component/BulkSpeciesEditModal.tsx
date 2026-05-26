'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Loader, CheckCircle, AlertCircle, Leaf, Search, Plus, Minus } from 'lucide-react';
import {
  bulkUpdateInterventionSpecies,
  getSciencetificSpecies,
} from '@shared-core/fetchApi/api.fetch';
import { Button } from './ui';

interface SpeciesShape {
  uid?: string;
  speciesName?: string;
  otherSpeciesName?: string;
  scientificSpeciesUid?: string;
  count: number;
}

interface InterventionShape {
  uid: string;
  hid: string;
  type: string;
  species?: SpeciesShape[];
}

interface ScientificSpecies {
  id: number;
  uid: string;
  scientificName: string;
  commonName?: string;
}

interface BulkSpeciesEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedInterventions: InterventionShape[];
  accessToken: string;
  currentProjectUid: string;
  onComplete: () => void;
}

type SourceOption = {
  key: string;
  label: string;
  isUnknown: boolean;
  scientificSpeciesUid?: string;
  speciesName?: string;
  maxTreeCount: number;
};

type ProgressState = 'idle' | 'running' | 'done';

export default function BulkSpeciesEditModal({
  isOpen,
  onClose,
  selectedInterventions,
  accessToken,
  currentProjectUid,
  onComplete,
}: BulkSpeciesEditModalProps) {
  const [selectedSourceKey, setSelectedSourceKey] = useState<string>('');
  const [targetMode, setTargetMode] = useState<'scientific' | 'unknown'>('scientific');
  const [targetSpecies, setTargetSpecies] = useState<ScientificSpecies | null>(null);
  const [targetUnknownName, setTargetUnknownName] = useState<string>('');
  const [targetUnknownCommon, setTargetUnknownCommon] = useState<string>('');
  const [targetCount, setTargetCount] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ScientificSpecies[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [progressState, setProgressState] = useState<ProgressState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [errorDetails, setErrorDetails] = useState<string[]>([]);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Compute the intersection of species across all selected interventions
  const sourceOptions = useMemo<SourceOption[]>(() => {
    if (selectedInterventions.length === 0) return [];

    const buildKey = (s: SpeciesShape): string | null => {
      if (s.scientificSpeciesUid) return `sci:${s.scientificSpeciesUid}`;
      if (s.otherSpeciesName) return `unk:${s.otherSpeciesName}`;
      if (s.speciesName) return `unk:${s.speciesName}`;
      return null;
    };

    // Count keys per intervention and track max tree count seen per key
    let intersection: Set<string> | null = null;
    const repByKey = new Map<string, SpeciesShape>();
    const maxCountByKey = new Map<string, number>();

    for (const i of selectedInterventions) {
      const keys = new Set<string>();
      for (const s of i.species ?? []) {
        const k = buildKey(s);
        if (!k) continue;
        keys.add(k);
        if (!repByKey.has(k)) repByKey.set(k, s);
        maxCountByKey.set(k, Math.max(maxCountByKey.get(k) ?? 0, s.count ?? 0));
      }
      intersection = intersection === null ? keys : new Set([...intersection].filter(k => keys.has(k)));
    }

    if (!intersection) return [];

    return Array.from(intersection).map(k => {
      const rep = repByKey.get(k)!;
      const isUnknown = k.startsWith('unk:');
      const label = isUnknown
        ? `${rep.otherSpeciesName ?? rep.speciesName ?? 'Unknown'} (unknown)`
        : rep.speciesName ?? 'Scientific species';
      return {
        key: k,
        label,
        isUnknown,
        scientificSpeciesUid: rep.scientificSpeciesUid,
        speciesName: rep.otherSpeciesName ?? rep.speciesName,
        maxTreeCount: maxCountByKey.get(k) ?? 0,
      } as SourceOption;
    });
  }, [selectedInterventions]);

  const selectedSource = useMemo(
    () => sourceOptions.find(o => o.key === selectedSourceKey) ?? null,
    [sourceOptions, selectedSourceKey]
  );

  // Reset state on open
  useEffect(() => {
    if (!isOpen) return;
    setSelectedSourceKey('');
    setTargetMode('scientific');
    setTargetSpecies(null);
    setTargetUnknownName('');
    setTargetUnknownCommon('');
    setTargetCount('');
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
    setProgressState('idle');
    setErrorMessage('');
    setErrorDetails([]);
  }, [isOpen]);

  // Debounced species search
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await getSciencetificSpecies(accessToken, searchQuery);
        if (res?.statusCode === 200) {
          setSearchResults(res.data || []);
          setShowResults(true);
        }
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, accessToken]);

  const handleSubmit = async () => {
    if (!selectedSource) return;

    const parsedCount = targetCount === '' ? undefined : Number(targetCount);
    if (parsedCount !== undefined && (Number.isNaN(parsedCount) || parsedCount < 1)) {
      setErrorMessage('Species count must be at least 1');
      return;
    }
    if (parsedCount !== undefined && parsedCount < selectedSource.maxTreeCount) {
      setErrorMessage(
        `Count cannot drop below ${selectedSource.maxTreeCount} (existing tree count in at least one intervention)`
      );
      return;
    }

    if (targetMode === 'scientific' && !targetSpecies && selectedSource.isUnknown) {
      setErrorMessage('Pick a target scientific species when promoting an unknown species');
      return;
    }
    if (targetMode === 'unknown' && !selectedSource.isUnknown && !targetUnknownName.trim()) {
      setErrorMessage('Provide a target species name when demoting to unknown');
      return;
    }

    const payload: Parameters<typeof bulkUpdateInterventionSpecies>[2] = {
      interventionUids: selectedInterventions.map(i => i.uid),
      sourceIsUnknown: selectedSource.isUnknown,
    };
    if (selectedSource.isUnknown) {
      payload.sourceSpeciesName = selectedSource.speciesName;
    } else {
      payload.sourceScientificSpeciesUid = selectedSource.scientificSpeciesUid;
    }

    if (targetMode === 'scientific') {
      payload.targetIsUnknown = false;
      if (targetSpecies) payload.targetScientificSpeciesId = targetSpecies.id;
    } else {
      payload.targetIsUnknown = true;
      if (targetUnknownName.trim()) payload.targetSpeciesName = targetUnknownName.trim();
      if (targetUnknownCommon.trim()) payload.targetCommonName = targetUnknownCommon.trim();
    }
    if (parsedCount !== undefined) payload.targetSpeciesCount = parsedCount;

    const hasMutation =
      payload.targetScientificSpeciesId !== undefined ||
      payload.targetIsUnknown !== undefined ||
      payload.targetSpeciesName !== undefined ||
      payload.targetCommonName !== undefined ||
      payload.targetSpeciesCount !== undefined;
    if (!hasMutation) {
      setErrorMessage('Change at least one field before submitting');
      return;
    }

    setErrorMessage('');
    setErrorDetails([]);
    setProgressState('running');
    try {
      const res = await bulkUpdateInterventionSpecies(accessToken, currentProjectUid, payload);
      if (res?.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
        setProgressState('done');
        onComplete();
        onClose();
      } else {
        setProgressState('idle');
        const body = res?.response ?? res;
        setErrorMessage(body?.message || 'Bulk update failed');
        const uids = body?.details?.interventionUids;
        if (Array.isArray(uids)) setErrorDetails(uids);
      }
    } catch (err: any) {
      setProgressState('idle');
      setErrorMessage(err?.message || 'Network error');
    }
  };

  if (!isOpen) return null;

  const total = selectedInterventions.length;
  const canSubmit = progressState === 'idle' && selectedSource !== null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-[#007A49]" />
            <h2 className="text-base font-semibold text-gray-900">
              Edit Species ({total} intervention{total !== 1 ? 's' : ''})
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={progressState === 'running'}
            className="p-1 rounded hover:bg-gray-100 transition-colors disabled:opacity-40"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 overflow-y-auto">
          {/* Source */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Species to edit</label>
            {sourceOptions.length === 0 ? (
              <p className="text-xs text-amber-600">
                No species are common to all {total} selected intervention{total !== 1 ? 's' : ''}.
              </p>
            ) : (
              <select
                value={selectedSourceKey}
                onChange={(e) => setSelectedSourceKey(e.target.value)}
                disabled={progressState !== 'idle'}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#007A49]/30 disabled:opacity-50 bg-white"
              >
                <option value="">-- Pick a common species --</option>
                {sourceOptions.map(o => (
                  <option key={o.key} value={o.key}>{o.label}</option>
                ))}
              </select>
            )}
          </div>

          {selectedSource && (
            <>
              {/* Target mode */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Change to</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetMode('scientific')}
                    disabled={progressState !== 'idle'}
                    className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${targetMode === 'scientific' ? 'border-[#007A49] bg-[#007A49]/5 text-[#007A49] font-medium' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                  >
                    Scientific species
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetMode('unknown')}
                    disabled={progressState !== 'idle'}
                    className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${targetMode === 'unknown' ? 'border-[#007A49] bg-[#007A49]/5 text-[#007A49] font-medium' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                  >
                    Unknown / free text
                  </button>
                </div>
              </div>

              {targetMode === 'scientific' ? (
                <div className="space-y-1.5 relative">
                  <label className="text-sm font-medium text-gray-700">Target scientific species</label>
                  {targetSpecies ? (
                    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 border border-gray-200">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{targetSpecies.scientificName}</p>
                        {targetSpecies.commonName && (
                          <p className="text-xs text-gray-500">{targetSpecies.commonName}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => { setTargetSpecies(null); setSearchQuery(''); }}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Clear
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2">
                        <Search className="h-4 w-4 text-gray-400" />
                        <input
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search species..."
                          className="flex-1 text-sm outline-none bg-transparent"
                        />
                        {isSearching && <Loader className="h-4 w-4 animate-spin text-gray-400" />}
                      </div>
                      {showResults && searchResults.length > 0 && (
                        <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {searchResults.map(s => (
                            <li
                              key={s.id}
                              onClick={() => { setTargetSpecies(s); setShowResults(false); }}
                              className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-50"
                            >
                              <div className="font-medium text-gray-900">{s.scientificName}</div>
                              {s.commonName && <div className="text-xs text-gray-500">{s.commonName}</div>}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                  {!selectedSource.isUnknown && !targetSpecies && (
                    <p className="text-xs text-gray-500">Leave blank to keep current scientific species.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="space-y-1.5">
                    <label className="text-xs text-gray-600">Species name</label>
                    <input
                      value={targetUnknownName}
                      onChange={(e) => setTargetUnknownName(e.target.value)}
                      placeholder="e.g. unidentified shrub"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#007A49]/30"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-gray-600">Common name (optional)</label>
                    <input
                      value={targetUnknownCommon}
                      onChange={(e) => setTargetUnknownCommon(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#007A49]/30"
                    />
                  </div>
                </div>
              )}

              {/* Count */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Species count (per intervention)</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetCount(c => String(Math.max(1, (Number(c) || 0) - 1)))}
                    disabled={progressState !== 'idle'}
                    className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                  >
                    <Minus className="h-3.5 w-3.5 text-gray-600" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={targetCount}
                    onChange={(e) => setTargetCount(e.target.value)}
                    placeholder="Leave blank to keep current count"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#007A49]/30"
                  />
                  <button
                    type="button"
                    onClick={() => setTargetCount(c => String((Number(c) || 0) + 1))}
                    disabled={progressState !== 'idle'}
                    className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                  >
                    <Plus className="h-3.5 w-3.5 text-gray-600" />
                  </button>
                </div>
                {selectedSource.maxTreeCount > 0 && (
                  <p className="text-xs text-gray-500">
                    At least {selectedSource.maxTreeCount} (highest existing tree count across selected interventions).
                  </p>
                )}
              </div>
            </>
          )}

          {errorMessage && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 space-y-1">
              <div className="flex items-center gap-1.5 text-sm font-medium text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span>{errorMessage}</span>
              </div>
              {errorDetails.length > 0 && (
                <ul className="text-xs text-red-600 space-y-0.5 max-h-24 overflow-y-auto">
                  {errorDetails.map((u, i) => <li key={i}>{u}</li>)}
                </ul>
              )}
            </div>
          )}

          {progressState === 'done' && !errorMessage && (
            <div className="flex items-center gap-2 text-sm text-[#007A49]">
              <CheckCircle className="h-4 w-4" />
              <span>All interventions updated.</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <Button variant="outline" onClick={onClose} disabled={progressState === 'running'}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="bg-[#007A49] hover:bg-[#006B3F] text-white"
          >
            {progressState === 'running' ? (
              <><Loader className="h-4 w-4 animate-spin mr-2" />Updating...</>
            ) : (
              `Update ${total} Intervention${total !== 1 ? 's' : ''}`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
