'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader, CheckCircle, AlertCircle, Layers } from 'lucide-react';
import { editInterventionComprehensive, getUserProjectSites } from '@shared-core/fetchApi/api.fetch';
import { Button } from './ui';

interface Site {
  id: string | number;
  uid?: string;
  name: string;
}

interface Intervention {
  uid: string;
  hid: string;
}

interface BulkUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedInterventions: Intervention[];
  accessToken: string;
  currentProjectUid: string;
  onComplete: () => void;
}

// Sentinel: user hasn't touched the site picker — send nothing to server
const SITE_UNCHANGED = '__unchanged__';
// Sentinel: user explicitly wants to clear the site
const SITE_NONE = '__none__';

type ProgressState = 'idle' | 'running' | 'done';

export default function BulkUpdateModal({
  isOpen,
  onClose,
  selectedInterventions,
  accessToken,
  currentProjectUid,
  onComplete,
}: BulkUpdateModalProps) {
  const [sites, setSites] = useState<Site[]>([]);
  const [loadingSites, setLoadingSites] = useState(false);
  // SITE_UNCHANGED = no change; SITE_NONE = clear site; '<uid>' = assign to site
  const [siteValue, setSiteValue] = useState<string>(SITE_UNCHANGED);
  const [progressState, setProgressState] = useState<ProgressState>('idle');
  const [doneCount, setDoneCount] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    setSiteValue(SITE_UNCHANGED);
    setProgressState('idle');
    setDoneCount(0);
    setErrors([]);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !currentProjectUid || !accessToken) return;
    setLoadingSites(true);
    setSites([]);
    getUserProjectSites(accessToken, currentProjectUid)
      .then((res) => { if (res?.statusCode === 200) setSites(res.data || []); })
      .catch(() => setSites([]))
      .finally(() => setLoadingSites(false));
  }, [isOpen, currentProjectUid, accessToken]);

  const resolveSiteUid = (): string | null | undefined => {
    if (siteValue === SITE_UNCHANGED) return undefined; // omit from payload
    if (siteValue === SITE_NONE) return null;           // unassign
    return siteValue;                                   // assign
  };

  const handleSubmit = async () => {
    const resolvedSiteUid = resolveSiteUid();
    // Nothing to change
    if (resolvedSiteUid === undefined) return;

    setProgressState('running');
    setDoneCount(0);
    setErrors([]);

    const newErrors: string[] = [];

    for (const intervention of selectedInterventions) {
      try {
        const res = await editInterventionComprehensive(
          accessToken,
          intervention.uid,
          currentProjectUid,
          { siteUid: resolvedSiteUid }
        );
        if (res?.statusCode !== 200) {
          newErrors.push(`${intervention.hid}: ${res?.message || 'Update failed'}`);
        }
      } catch {
        newErrors.push(`${intervention.hid}: Network error`);
      }
      setDoneCount((c) => c + 1);
    }

    setErrors(newErrors);
    setProgressState('done');
    if (newErrors.length === 0) {
      onComplete();
      onClose();
    }
  };

  if (!isOpen) return null;

  const total = selectedInterventions.length;
  const canSubmit =
    progressState === 'idle' &&
    !loadingSites &&
    siteValue !== SITE_UNCHANGED;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-[#007A49]" />
            <h2 className="text-base font-semibold text-gray-900">
              Assign Site ({total} intervention{total !== 1 ? 's' : ''})
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

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Site selector */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Site</label>
            {loadingSites ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                <Loader className="h-4 w-4 animate-spin" />
                <span>Loading sites...</span>
              </div>
            ) : (
              <select
                value={siteValue}
                onChange={(e) => setSiteValue(e.target.value)}
                disabled={progressState !== 'idle'}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#007A49]/30 disabled:opacity-50 bg-white"
              >
                <option value={SITE_UNCHANGED}>-- Select a site --</option>
                <option value={SITE_NONE}>No site (clear assignment)</option>
                {sites.map((s) => (
                  <option key={s.uid ?? s.id} value={s.uid ?? String(s.id)}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}
            {!loadingSites && sites.length === 0 && (
              <p className="text-xs text-amber-600">
                This project has no sites. You can only clear site assignments.
              </p>
            )}
          </div>

          {/* Progress */}
          {progressState !== 'idle' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>{progressState === 'running' ? 'Updating...' : 'Done'}</span>
                <span>{doneCount} / {total}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#007A49] transition-all duration-300"
                  style={{ width: `${total > 0 ? (doneCount / total) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 space-y-1">
              <div className="flex items-center gap-1.5 text-sm font-medium text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.length} update{errors.length !== 1 ? 's' : ''} failed</span>
              </div>
              <ul className="text-xs text-red-600 space-y-0.5 max-h-24 overflow-y-auto">
                {errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}

          {progressState === 'done' && errors.length === 0 && (
            <div className="flex items-center gap-2 text-sm text-[#007A49]">
              <CheckCircle className="h-4 w-4" />
              <span>All interventions updated.</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <Button variant="outline" onClick={onClose} disabled={progressState === 'running'}>
            Cancel
          </Button>
          {progressState !== 'done' && (
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
          )}
          {progressState === 'done' && errors.length > 0 && (
            <Button
              variant="primary"
              onClick={onClose}
              className="bg-[#007A49] hover:bg-[#006B3F] text-white"
            >
              Close
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
