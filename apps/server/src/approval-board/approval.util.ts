import { SQL, eq, isNull, or } from 'drizzle-orm';
import {
  ApprovalGatedSource,
  DEFAULT_PROJECT_APPROVAL_SETTINGS,
  ProjectApprovalSettings,
  intervention,
  site,
} from '../database/schema';

/**
 * Minimal shape of a project needed to evaluate approval rules. Select these
 * two columns wherever you create an intervention or site.
 */
export type ApprovalProject = {
  approvalBoardEnabled: boolean | null;
  approvalSettings: ProjectApprovalSettings | null;
};

/**
 * Returns the project's approval settings, filling any missing fields with
 * defaults so callers never deal with partial/legacy rows.
 */
export function resolveApprovalSettings(
  project: Pick<ApprovalProject, 'approvalSettings'> | null | undefined,
): ProjectApprovalSettings {
  const stored = project?.approvalSettings;
  return {
    sources: {
      ...DEFAULT_PROJECT_APPROVAL_SETTINGS.sources,
      ...(stored?.sources ?? {}),
    },
    siteApprovalRequired:
      stored?.siteApprovalRequired ??
      DEFAULT_PROJECT_APPROVAL_SETTINGS.siteApprovalRequired,
  };
}

/**
 * Whether an intervention from `source` must go through the approval board
 * before it is published. The master switch (approvalBoardEnabled) gates
 * everything; per-source toggles refine it. Sources not in the gated set
 * (e.g. 'migration') always return false.
 */
export function interventionRequiresApproval(
  project: ApprovalProject | null | undefined,
  source: ApprovalGatedSource,
): boolean {
  if (!project?.approvalBoardEnabled) return false;
  const settings = resolveApprovalSettings(project);
  return settings.sources[source] ?? true;
}

/**
 * Whether a newly created site must go through the approval board before it is
 * published. Sites are gated by a single toggle, not per-source.
 */
export function siteRequiresApproval(
  project: ApprovalProject | null | undefined,
): boolean {
  if (!project?.approvalBoardEnabled) return false;
  return resolveApprovalSettings(project).siteApprovalRequired;
}

/**
 * Drizzle condition that keeps only interventions safe to publish on the
 * Overview map/stats and external APIs: never gated (reviewStatus IS NULL) or
 * explicitly approved. Pending/in_review/rejected are hidden.
 */
export function publishedInterventionFilter(): SQL | undefined {
  return or(
    isNull(intervention.reviewStatus),
    eq(intervention.reviewStatus, 'approved'),
  );
}

/**
 * Same null-or-approved rule for sites.
 */
export function publishedSiteFilter(): SQL | undefined {
  return or(isNull(site.reviewStatus), eq(site.reviewStatus, 'approved'));
}
