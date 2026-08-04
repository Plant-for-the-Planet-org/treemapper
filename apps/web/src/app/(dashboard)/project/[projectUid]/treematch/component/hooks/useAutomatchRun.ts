'use client'

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  getUserProjectSites, getTreematchRules, putTreematchRules,
  postTreematchAutomatchRun, getTreematchAutomatchRun, getTreematchLatestAutomatchRun,
  postTreematchAutomatchApply, deleteTreematchAutomatchRun, postTreematchAutomatchStop,
} from '@shared-core/fetchApi/api.fetch';
import {
  AutomatchPlanPair, AutomatchRun, DraftRule, Site, TreeMatchRule,
} from '../types';
import type { Feedback } from './useFeedback';

// A run plans in the background: the POST returns as soon as the row exists and
// the sweep of the donation backend carries on server-side. Each page it reads
// is a serialized ~700ms round trip, so this polls at a human pace rather than
// a tight one, and gives up rather than hanging forever.
//
// The ceiling has to clear the server's own budget or it fires on healthy runs:
// one donation list runs to 100 pages at ~0.7s each, over a minute by itself,
// and every extra sweep signature in the rules stacks another list on top.
// Giving up only stops this page watching; the run carries on server-side and
// reopening Auto-match picks it back up.
const RUN_POLL_MS = 1500;
const RUN_POLL_TIMEOUT_MS = 10 * 60 * 1000;

// Rule uids change on every save, so "has anything changed" compares the bodies
// and ignores both the uid and the client-only key.
const stripLocalIds = (list: DraftRule[]) =>
  list.map(({ localId, uid, ...rest }) => rest);

// API rule -> editable draft. The client key is stable for the row's lifetime;
// the server uid is kept so a save can be told apart from a first write.
const toDraft = (rule: TreeMatchRule, idx: number): DraftRule => ({
  localId: `saved_${rule.uid}_${idx}`,
  uid: rule.uid,
  enabled: rule.enabled,
  label: rule.label,
  when: rule.when,
  prefer: rule.prefer,
  orderBy: rule.orderBy,
  action: rule.action,
});

export interface AppliedPlan {
  /** trees added per plant location, for the optimistic bump */
  byUid: Record<string, number>;
  /** TTC's accepted absolute totals per contribution */
  applied: Record<string, number>;
  trees: number;
  donations: number;
}

interface Params {
  projectUid: string;
  accessToken: string;
  /** the left pane's sites, reused when it is showing this project */
  sites: Site[];
  crossProject: boolean;
  feedback: Feedback;
  /** a failed write moved one of the panes; reload the one that moved */
  reloadLocations: () => void;
  reloadDonations: () => void;
  onApplied: (result: AppliedPlan) => void;
}

/**
 * Auto-match: the rule list, the run that plans from it, and applying that plan.
 *
 * A run plans and stops. Nothing reaches TTC until the plan is applied, and
 * applying goes through the same write path as a manual match, so this adds no
 * second way to record an allocation.
 */
export function useAutomatchRun({
  projectUid, accessToken, sites, crossProject, feedback,
  reloadLocations, reloadDonations, onApplied,
}: Params) {
  // Rules are edited as a whole list and saved as a whole list, so they are held
  // as drafts with a client-only key: the server hands out fresh uids on every
  // save.
  const [rulesOpen, setRulesOpen] = useState(false);
  const [rules, setRules] = useState<DraftRule[]>([]);
  const [savedRules, setSavedRules] = useState<DraftRule[]>([]);
  const [rulesLoaded, setRulesLoaded] = useState(false);
  // Auto-match fills this project's plant locations only, so a rule's preferred
  // site has to be one of this project's sites. The left pane's `sites` follows
  // whichever project it is showing, so it cannot always be reused.
  const [ruleSites, setRuleSites] = useState<Site[]>([]);
  const [rulesSaving, setRulesSaving] = useState(false);
  const [rulesError, setRulesError] = useState<string | null>(null);
  const [maxTrees, setMaxTrees] = useState('');

  // A run holds the project's only run slot until it is applied or discarded,
  // so an open plan is picked up again on the next visit rather than stranded.
  const [run, setRun] = useState<AutomatchRun | null>(null);
  const [planOpen, setPlanOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [applying, setApplying] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [stopping, setStopping] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  // Stops the poll loop if the page unmounts mid-run. Set back to true on
  // mount, not just cleared on unmount: StrictMode runs mount, cleanup, mount
  // in development, so a cleanup-only ref stays false for the rest of the
  // session and every poll gives up before its first request.
  const pollAlive = useRef(true);
  useEffect(() => {
    pollAlive.current = true;
    return () => { pollAlive.current = false; };
  }, []);

  // The elapsed readout ticks locally rather than off the poll: a run's progress
  // only changes when a donation page lands (~0.7s), and a counter that freezes
  // between them reads as a stall. It counts from the run's own start time, not
  // from when this page began watching, so a run picked up again after a reload
  // does not restart at zero.
  const runStartedAt = run?.startedAt;
  useEffect(() => {
    if (!running) { setElapsed(0); return; }
    const started = runStartedAt ? new Date(runStartedAt).getTime() : Date.now();
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - started) / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [running, runStartedAt]);

  const rulesDirty = useMemo(
    () => JSON.stringify(stripLocalIds(rules)) !== JSON.stringify(stripLocalIds(savedRules)),
    [rules, savedRules],
  );

  // Run problems are reported twice on purpose. The rules dialog is what is open
  // while a run is planning, so it needs the message; but the user is invited to
  // close that dialog and wait, and then the page banner is the only thing left
  // that can carry it.
  const reportRunProblem = (message: string) => {
    setRulesError(message);
    feedback.fail(message);
  };

  // Poll a run until it stops planning. The sweep is server-side, so this only
  // watches; nothing is written by any of it.
  const pollRun = async (runUid: string): Promise<AutomatchRun | null> => {
    const deadline = Date.now() + RUN_POLL_TIMEOUT_MS;
    for (;;) {
      if (!pollAlive.current) return null;
      if (Date.now() > deadline) {
        // Nothing has gone wrong with the run itself, so say what really
        // happened and name the action that picks it up again: opening
        // Auto-match re-reads the latest run and resumes this poll.
        reportRunProblem(
          'This page stopped following the run. The run is still going on the server. Open Auto-match again to pick it up.',
        );
        return null;
      }
      await new Promise(resolve => setTimeout(resolve, RUN_POLL_MS));
      if (!pollAlive.current) return null;

      const response = await getTreematchAutomatchRun(accessToken, projectUid, runUid);
      if (response?.statusCode !== 200 || !response?.data) {
        reportRunProblem(response?.message || 'Lost track of the run. Open Auto-match again to pick it up.');
        return null;
      }
      const next: AutomatchRun = response.data;
      setRun(next);
      if (next.status !== 'planning') return next;
    }
  };

  // Pick up a run this page is not already watching. A planned run holds the
  // project's only run slot until it is applied or discarded, and a planning one
  // means a sweep is still going, so both have to be surfaced rather than left
  // to fail the next run with a 409 nobody expects.
  //
  // Called on arrival and again whenever the rules are opened, which is what
  // makes the poll timeout recoverable: the run outlives this page's willingness
  // to watch it, and reopening Auto-match starts watching again.
  const resumeLatestRun = async (shouldAbort: () => boolean = () => false) => {
    if (!accessToken || !projectUid || running) return;
    try {
      const response = await getTreematchLatestAutomatchRun(accessToken, projectUid);
      if (shouldAbort() || response?.statusCode !== 200) return;
      const latest: AutomatchRun | null = response.data ?? null;
      if (latest?.status === 'planned') { setRun(latest); return; }
      if (latest?.status !== 'planning') return;

      setRun(latest);
      setRunning(true);
      try {
        const finished = await pollRun(latest.uid);
        if (finished?.status === 'planned') { setRulesOpen(false); setPlanOpen(true); }
      } finally {
        setRunning(false);
      }
    } catch (err) {
      console.error('Error fetching the last auto-match run:', err);
    }
  };

  // Rules and any open plan load together on the first visit to the dialog, not
  // on mount: neither is needed to match by hand, and both are extra requests.
  const openRules = async () => {
    setRulesOpen(true);
    // A run may have outlived this page's poll, or been started somewhere else.
    // Check before the user presses Run and gets a 409 with no way back to it.
    void resumeLatestRun();
    if (rulesLoaded || !accessToken || !projectUid) return;
    try {
      // The left pane already holds this project's sites unless it has been
      // pointed at another one, so only that case costs an extra request.
      if (crossProject) {
        const siteResponse = await getUserProjectSites(accessToken, projectUid);
        if (siteResponse?.statusCode === 200) setRuleSites(siteResponse.data || []);
      } else {
        setRuleSites(sites);
      }

      const response = await getTreematchRules(accessToken, projectUid);
      if (response?.statusCode === 200) {
        const drafts = (response.data?.items || []).map(toDraft);
        setRules(drafts);
        setSavedRules(drafts);
        setRulesLoaded(true);
      } else {
        setRulesError(response?.message || 'Failed to load the rules');
      }
    } catch (err) {
      console.error('Error fetching auto-match rules:', err);
      setRulesError(err instanceof Error ? err.message : 'Failed to load the rules');
    }
  };

  // Returns the saved list so runRules can save and run in one go.
  const saveRules = async (): Promise<DraftRule[] | null> => {
    if (!accessToken || !projectUid) return null;
    setRulesSaving(true);
    setRulesError(null);
    try {
      const response = await putTreematchRules(
        accessToken,
        projectUid,
        rules.map(r => ({
          enabled: r.enabled,
          label: r.label.trim() || 'Rule',
          when: r.when,
          // `prefer` is rebuilt field by field rather than passed through: the
          // read resolves `siteName` for the editor, but the write DTO does not
          // have it and the API validates with forbidNonWhitelisted, so sending
          // it back rejects the whole save with a 400.
          // The API still accepts `onlyApproved`, but the editor no longer
          // offers it, so nothing written here carries it. Rebuilding the
          // object rather than spreading is what drops it from a rule stored
          // before it was removed, on the next save.
          prefer: {
            type: r.prefer.type,
            ...(r.prefer.type === 'site' && r.prefer.siteUid ? { siteUid: r.prefer.siteUid } : {}),
          },
          orderBy: r.orderBy,
          action: r.action,
        })),
      );
      if (response?.statusCode !== 200 || !response?.data) {
        setRulesError(response?.message || 'Failed to save the rules');
        return null;
      }
      // Fresh uids come back, so the response replaces the local list rather
      // than being merged into it.
      const drafts = (response.data.items || []).map(toDraft);
      setRules(drafts);
      setSavedRules(drafts);
      setRulesLoaded(true);
      return drafts;
    } catch (err) {
      console.error('Error saving auto-match rules:', err);
      setRulesError(err instanceof Error ? err.message : 'Failed to save the rules');
      return null;
    } finally {
      setRulesSaving(false);
    }
  };

  const runRules = async () => {
    if (!accessToken || !projectUid) return;
    setPlanError(null);
    setRulesError(null);

    // The plan is built from what the server has, so unsaved edits are saved
    // first rather than silently ignored.
    if (rulesDirty && !(await saveRules())) return;

    setRunning(true);
    try {
      const trees = Number.parseInt(maxTrees, 10);
      const response = await postTreematchAutomatchRun(
        accessToken,
        projectUid,
        Number.isFinite(trees) && trees > 0 ? { maxTrees: trees } : {},
      );
      // The route answers 202 (the row exists, the sweep is still going), but
      // the server wraps every success as statusCode 200 in the body and only
      // reports the real code on failure. A 409 here means a plan from an
      // earlier visit is still open.
      if (Number(response?.statusCode) !== 200 || !response?.data) {
        setRulesError(response?.message || 'Could not start the run');
        return;
      }

      const started: AutomatchRun = response.data;
      setRun(started);
      const finished = started.status === 'planning' ? await pollRun(started.uid) : started;
      if (!finished) return;

      if (finished.status === 'failed') {
        setRulesError(finished.error || 'The run failed');
        return;
      }
      if (finished.status !== 'planned') return;

      setRulesOpen(false);
      setPlanOpen(true);
    } catch (err) {
      console.error('Auto-match run failed:', err);
      setRulesError(err instanceof Error ? err.message : 'Could not start the run');
    } finally {
      setRunning(false);
    }
  };

  // Stop a sweep that is still reading. The run stays in 'planning' until the
  // page in flight lands, so the poller carries on and opens the plan as usual.
  const stopRun = async () => {
    if (!run || !accessToken || !projectUid) return;
    setStopping(true);
    try {
      const response = await postTreematchAutomatchStop(accessToken, projectUid, run.uid);
      if (Number(response?.statusCode) !== 200) {
        // Stop is pressed inside the progress panel, which the user is told they
        // can close, so a failure has to survive that dialog going away.
        reportRunProblem(response?.message || 'Could not stop the run');
        return;
      }
      setRun(prev => (prev ? { ...prev, stopRequested: true } : prev));
    } catch (err) {
      console.error('Stopping the auto-match run failed:', err);
      reportRunProblem(err instanceof Error ? err.message : 'Could not stop the run');
    } finally {
      setStopping(false);
    }
  };

  // Applying goes through the same write path as a manual match, so the panes
  // are updated exactly as they are there; `onApplied` does that wiring.
  //
  // `keep` is the subset the review dialog is left holding after the user has
  // removed links. The server matches those against the plan it stored and
  // takes the tree amounts from there, so this only ever narrows the write.
  const applyPlan = async (keep?: AutomatchPlanPair[]) => {
    if (!run?.plan || !accessToken || !projectUid) return;
    const pairs = keep ?? run.plan.pairs;
    if (!pairs.length) return;
    const isSubset = pairs.length !== run.plan.pairs.length;
    setApplying(true);
    setPlanError(null);
    try {
      const response = await postTreematchAutomatchApply(
        accessToken,
        projectUid,
        run.uid,
        isSubset
          ? pairs.map(p => ({ contributionId: p.contributionId, interventionUid: p.interventionUid }))
          : undefined,
      );
      const status = Number(response?.statusCode ?? 0);
      if (status !== 200 || !response?.data) {
        setPlanError(response?.message || 'Failed to record the plan');
        // Nothing was written. A 409 means a location no longer has that many
        // trees free, so the left pane moved; anything else came from the
        // donation backend. Either way the plan is spent.
        if (status === 409) reloadLocations(); else reloadDonations();
        setRun(null);
        return;
      }

      const byUid: Record<string, number> = {};
      pairs.forEach(p => { byUid[p.interventionUid] = (byUid[p.interventionUid] || 0) + p.trees; });

      setPlanOpen(false);
      setRun(null);
      onApplied({
        byUid,
        applied: (response.data.applied || {}) as Record<string, number>,
        trees: pairs.reduce((sum, p) => sum + p.trees, 0),
        donations: new Set(pairs.map(p => p.contributionId)).size,
      });
    } catch (err) {
      console.error('Applying the auto-match plan failed:', err);
      setPlanError(err instanceof Error ? err.message : 'Failed to record the plan');
    } finally {
      setApplying(false);
    }
  };

  const discardPlan = async () => {
    if (!run || !accessToken || !projectUid) return;
    setDiscarding(true);
    setPlanError(null);
    try {
      const response = await deleteTreematchAutomatchRun(accessToken, projectUid, run.uid);
      if (response?.statusCode !== 200) {
        setPlanError(response?.message || 'Failed to discard the plan');
        return;
      }
      setPlanOpen(false);
      setRun(null);
    } catch (err) {
      console.error('Discarding the auto-match plan failed:', err);
      setPlanError(err instanceof Error ? err.message : 'Failed to discard the plan');
    } finally {
      setDiscarding(false);
    }
  };

  // Surface an open run on arrival, a run still planning included: a reload
  // during a sweep used to leave it invisible until it expired.
  useEffect(() => {
    let cancelled = false;
    void resumeLatestRun(() => cancelled);
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, projectUid]);

  // Switching projects invalidates every auto-match view.
  useEffect(() => {
    setRules([]);
    setSavedRules([]);
    setRuleSites([]);
    setRulesLoaded(false);
    setRulesError(null);
    setRun(null);
    setPlanOpen(false);
    setPlanError(null);
  }, [projectUid]);

  return {
    // rules editor
    rulesOpen, setRulesOpen, rules, setRules, ruleSites, rulesDirty, rulesSaving,
    rulesError, setRulesError, rulesLoaded, maxTrees, setMaxTrees,
    // run
    run, running, elapsed, stopping,
    planOpen, setPlanOpen, planError, setPlanError, applying, discarding,
    // actions
    openRules, saveRules, runRules, stopRun, applyPlan, discardPlan,
  };
}

export type AutomatchState = ReturnType<typeof useAutomatchRun>;
