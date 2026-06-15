/**
 * Display rules for an intervention's lifecycle status.
 *
 * Source of truth is `interventionStatusEnum` on the server:
 * 'planned' | 'planning' | 'active' | 'completed' | 'failed' | 'on-hold' | 'cancelled'.
 *
 * Rules for the web UI:
 * - No status -> return null (callers should render nothing).
 * - 'planned'  -> shown as 'completed'.
 * - everything else -> shown as is.
 */
export function getDisplayInterventionStatus(
  status?: string | null,
): string | null {
  if (!status) return null;
  if (status === 'planned') return 'completed';
  return status;
}
