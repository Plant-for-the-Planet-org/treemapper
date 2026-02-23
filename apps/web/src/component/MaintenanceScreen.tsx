"use client";

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Wrench } from 'lucide-react';

interface Props {
  restoreTime?: string;
}

function formatRestoreTime(dateStr: string): string {
  try {
    const date = new Date(Number(dateStr) * 1000);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  } catch {
    return dateStr;
  }
}

export default function MaintenanceScreen({ restoreTime }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <Image
        src="/maintenance.png"
        alt=""
        fill
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 bg-black/40" />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative text-center max-w-md w-full mx-4"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-white mx-auto mb-6">
          <Wrench size={32} />
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">
          Scheduled Maintenance
        </h1>

        <p className="text-white/80 mb-6 leading-relaxed">
          The dashboard is temporarily unavailable while we perform maintenance.
          We'll be back up shortly.Thank you for your patience.
        </p>

        {restoreTime && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-5">
            <p className="text-xs uppercase tracking-wide text-white/60 mb-1">
              Expected to be back online
            </p>
            <p className="text-white font-semibold text-base">
              {formatRestoreTime(restoreTime)}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
