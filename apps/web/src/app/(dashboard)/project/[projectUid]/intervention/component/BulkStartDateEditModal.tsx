'use client';

import React, { useEffect, useState } from 'react';
import { X, Loader, CheckCircle, AlertCircle, CalendarDays } from 'lucide-react';
import { bulkUpdateInterventionStartDate } from '@shared-core/fetchApi/api.fetch';
import { Button } from './ui';

interface BulkStartDateEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedInterventions: { uid: string; hid: string }[];
  accessToken: string;
  currentProjectUid: string;
  onComplete: () => void;
}

type ProgressState = 'idle' | 'running' | 'done';

export default function BulkStartDateEditModal({
  isOpen,
  onClose,
  selectedInterventions,
  accessToken,
  currentProjectUid,
  onComplete,
}: BulkStartDateEditModalProps) {
  const [date, setDate] = useState('');
  const [progressState, setProgressState] = useState<ProgressState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [errorDetails, setErrorDetails] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    setDate('');
    setProgressState('idle');
    setErrorMessage('');
    setErrorDetails([]);
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!date) {
      setErrorMessage('Select a date');
      return;
    }
    setErrorMessage('');
    setErrorDetails([]);
    setProgressState('running');
    try {
      const res = await bulkUpdateInterventionStartDate(accessToken, currentProjectUid, {
        interventionUids: selectedInterventions.map((i) => i.uid),
        interventionStartDate: date,
      });
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-[#007A49]" />
            <h2 className="text-base font-semibold text-gray-900">
              Edit Start Date ({total} intervention{total !== 1 ? 's' : ''})
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

        <div className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">New intervention start date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={progressState !== 'idle'}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#007A49]/30 disabled:opacity-50 bg-white"
            />
            <p className="text-xs text-gray-500">
              Applied to all {total} selected intervention{total !== 1 ? 's' : ''}. If the new start date is later than an intervention's end date, that end date is moved to match.
            </p>
          </div>

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
            disabled={progressState !== 'idle' || !date}
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
