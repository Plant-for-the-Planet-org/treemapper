// Shared presentational helpers for the approval board UI.
// Pure styling/formatting only -- no business logic lives here.

import type { ApprovalStatus, ReviewStatus } from '@shared-core/types/approval.types';

// Per-column accent palette, keyed by the legacy column status.
export const STATUS_STYLES: Record<
  ApprovalStatus,
  { dot: string; text: string; tint: string; ring: string }
> = {
  new_request: {
    dot: 'bg-amber-500',
    text: 'text-amber-600',
    tint: 'bg-amber-50/70',
    ring: 'ring-amber-200',
  },
  in_review: {
    dot: 'bg-blue-500',
    text: 'text-blue-600',
    tint: 'bg-blue-50/70',
    ring: 'ring-blue-200',
  },
  approved: {
    dot: 'bg-emerald-500',
    text: 'text-emerald-600',
    tint: 'bg-emerald-50/70',
    ring: 'ring-emerald-200',
  },
  rejected: {
    dot: 'bg-rose-500',
    text: 'text-rose-600',
    tint: 'bg-rose-50/70',
    ring: 'ring-rose-200',
  },
};

// Subset of review statuses that get an inline pill on the card.
export const REVIEW_STATUS_PILL: Partial<
  Record<ReviewStatus, { label: string; className: string }>
> = {
  changes_requested: {
    label: 'Changes requested',
    className: 'border-amber-300 text-amber-700 bg-amber-50',
  },
  in_revision: {
    label: 'In revision',
    className: 'border-amber-300 text-amber-700 bg-amber-50',
  },
  resubmitted: {
    label: 'Resubmitted',
    className: 'border-blue-300 text-blue-700 bg-blue-50',
  },
  published: {
    label: 'Published',
    className: 'border-emerald-300 text-emerald-700 bg-emerald-50',
  },
};

// Deterministic avatar tint so the same person keeps the same colour.
const AVATAR_COLORS = [
  'bg-emerald-100 text-emerald-700',
  'bg-blue-100 text-blue-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-violet-100 text-violet-700',
  'bg-cyan-100 text-cyan-700',
  'bg-orange-100 text-orange-700',
  'bg-teal-100 text-teal-700',
];

export function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function titleCase(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
