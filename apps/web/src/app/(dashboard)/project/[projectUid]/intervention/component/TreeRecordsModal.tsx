'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Activity, HeartOff, Ruler, MessageSquare, Image as ImageIcon, User, Loader, AlertTriangle } from 'lucide-react';
import { getTreeRecords } from '@shared-core/fetchApi/api.fetch';
import { cdnUrl } from '@/lib/cdn';

interface TreeRecord {
  id: number;
  uid: string;
  recordType: string;
  recordedAt: string;
  previousStatus: string | null;
  newStatus: string | null;
  statusReason: string | null;
  height: number | null;
  width: number | null;
  notes: string | null;
  image: string | null;
  recordedByName: string | null;
  recordedByEmail: string | null;
  createdAt: string;
}

interface TreeRecordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  treeHid: string;
  treeTag?: string;
  accessToken: string;
  selectedProject: string;
}

const RECORD_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; Icon: React.ElementType }> = {
  death: {
    label: 'Death',
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    Icon: HeartOff,
  },
  measurement: {
    label: 'Measurement',
    color: 'text-[#007A49]',
    bg: 'bg-green-50',
    border: 'border-green-200',
    Icon: Activity,
  },
};

const fallback = {
  label: 'Record',
  color: 'text-gray-600',
  bg: 'bg-gray-50',
  border: 'border-gray-200',
  Icon: Activity,
};

export default function TreeRecordsModal({
  isOpen,
  onClose,
  treeHid,
  treeTag,
  accessToken,
  selectedProject,
}: TreeRecordsModalProps) {
  const [records, setRecords] = useState<TreeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setRecords([]);
    setError(null);
    setIsLoading(true);

    getTreeRecords(accessToken, treeHid, selectedProject)
      .then((res: any) => {
        const data = res?.data?.data || res?.data;
        setRecords(data?.records ?? []);
      })
      .catch(() => setError('Failed to load records'))
      .finally(() => setIsLoading(false));
  }, [isOpen, treeHid, selectedProject, accessToken]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Activity Records</h2>
              <p className="text-xs text-gray-500 mt-0.5">{treeTag || treeHid}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
            {isLoading && (
              <div className="flex items-center justify-center py-16 text-gray-400">
                <Loader size={22} className="animate-spin mr-2" />
                <span className="text-sm">Loading records...</span>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertTriangle size={16} className="shrink-0" />
                {error}
              </div>
            )}

            {!isLoading && !error && records.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Activity size={32} className="mb-3 opacity-40" />
                <p className="text-sm">No records yet</p>
              </div>
            )}

            {!isLoading && records.length > 0 && (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-100" />

                <div className="space-y-4">
                  {records.map((rec) => {
                    const cfg = RECORD_CONFIG[rec.recordType] ?? fallback;
                    const { Icon } = cfg;
                    const date = new Date(rec.recordedAt);

                    return (
                      <div key={rec.uid} className="relative pl-10">
                        {/* Timeline dot */}
                        <div className={`absolute left-2 top-3 w-4 h-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center ${cfg.bg}`}>
                          <Icon size={8} className={cfg.color} />
                        </div>

                        <div className={`rounded-lg border ${cfg.border} ${cfg.bg} p-4 space-y-3`}>
                          {/* Title row */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Icon size={14} className={cfg.color} />
                              <span className={`text-xs font-semibold uppercase tracking-wide ${cfg.color}`}>
                                {cfg.label}
                              </span>
                              {rec.previousStatus && rec.newStatus && rec.previousStatus !== rec.newStatus && (
                                <span className="text-xs text-gray-500">
                                  {rec.previousStatus} → {rec.newStatus}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-gray-400 shrink-0">
                              {date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>

                          {/* Measurements */}
                          {(rec.height != null || rec.width != null) && (
                            <div className="flex items-center gap-4">
                              <Ruler size={12} className="text-gray-400 shrink-0" />
                              {rec.height != null && (
                                <span className="text-xs text-gray-700">Height: <strong>{rec.height} m</strong></span>
                              )}
                              {rec.width != null && (
                                <span className="text-xs text-gray-700">Width: <strong>{rec.width} cm</strong></span>
                              )}
                            </div>
                          )}

                          {/* Notes / reason */}
                          {rec.notes && (
                            <div className="flex items-start gap-2">
                              <MessageSquare size={12} className="text-gray-400 mt-0.5 shrink-0" />
                              <p className="text-xs text-gray-700">{rec.notes}</p>
                            </div>
                          )}

                          {/* Image */}
                          {rec.image && (
                            <div className="flex items-center gap-2">
                              <ImageIcon size={12} className="text-gray-400 shrink-0" />
                              <img
                                src={cdnUrl('tree', rec.image) ?? ''}
                                alt="Record photo"
                                className="h-20 w-28 object-cover rounded-md border border-gray-200"
                              />
                            </div>
                          )}

                          {/* Recorded by */}
                          {(rec.recordedByName || rec.recordedByEmail) && (
                            <div className="flex items-center gap-2 pt-1 border-t border-gray-200/60">
                              <User size={11} className="text-gray-400 shrink-0" />
                              <span className="text-xs text-gray-500">
                                {rec.recordedByName || rec.recordedByEmail}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer count */}
          {records.length > 0 && (
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
              {records.length} record{records.length !== 1 ? 's' : ''}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
