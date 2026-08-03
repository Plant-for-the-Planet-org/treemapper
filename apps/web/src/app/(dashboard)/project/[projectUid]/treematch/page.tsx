'use client'

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeftRight, Download, Lock, Play, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToken } from '@/context/useTokenContext';
import { postTreematchMatches } from '@shared-core/fetchApi/api.fetch';
import useProjectStore from '@shared-core/store/useProjectStore';
import { useTopBarActions } from '@/component/header/TopBarActions';

import { StatsRibbon } from './component/StatsRibbon';
import { LocationsPane } from './component/LocationsPane';
import { MatchBalance } from './component/MatchBalance';
import { DonationsPane } from './component/DonationsPane';
import { ExportDialog } from './component/ExportDialog';
import { MatchConfirmDialog, PreviewAllocation } from './component/MatchConfirmDialog';
import { RulesDialog } from './component/RulesDialog';
import { AutomatchPlanDialog } from './component/AutomatchPlanDialog';
import { useFeedback } from './component/hooks/useFeedback';
import { useTreematchLocations } from './component/hooks/useTreematchLocations';
import { useTreematchDonations } from './component/hooks/useTreematchDonations';
import { useMatchSelection } from './component/hooks/useMatchSelection';
import { useAutomatchRun } from './component/hooks/useAutomatchRun';
import {
  COUNTRY_OPTIONS, MAX_MATCH_PAIRS, MatchPair,
  contribAvailable, fmtNum, fmtTrees,
} from './component/types';

// TreeMatch is owner-only. The sidebar hides the section for everyone else;
// this repeats the check so a direct URL gets the same answer, and it wraps the
// screen rather than sitting inside it so none of its hooks mount and none of
// its requests fire for someone who may not make them.
//
// The project list is already in the store by the time this renders: the
// dashboard layout holds its children behind a spinner until it has loaded, so
// a missing project here means no access rather than "not yet".
export default function TreeMatchPage() {
  const { projectUid } = useParams<{ projectUid: string }>();
  const myProjects = useProjectStore(s => s.projects);
  const project = myProjects.find(p => p.uid === projectUid);
  const isOwner = project?.userRole === 'owner';

  if (!isOwner) {
    return (
      <div className="w-full flex-1 min-h-0 flex items-center justify-center bg-muted/30 p-6">
        <div className="max-w-sm rounded-xl border border-border bg-background px-6 py-8 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-muted">
            <Lock size={18} className="text-muted-foreground" />
          </div>
          <h2 className="text-[15px] font-semibold text-foreground">TreeMatch is owner-only</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Matching donations to planted trees is limited to the project owner.
            Ask them if you need something matched.
          </p>
        </div>
      </div>
    );
  }

  // The name is only used to word messages about the project, so a project that
  // somehow is not in the store falls back rather than blocking the screen.
  return <TreeMatchWorkspace projectUid={projectUid} projectName={project?.name || 'This project'} />;
}

/**
 * The screen itself: two panes that own their own data, a selection that reads
 * both, and auto-match beside them. This holds what genuinely spans all of them,
 * which is the manual match write and the dialogs it opens.
 */
function TreeMatchWorkspace({ projectUid, projectName }: { projectUid: string; projectName: string }) {
  const { accessToken } = useToken();

  const feedback = useFeedback();
  const locations = useTreematchLocations(projectUid, accessToken);
  const donations = useTreematchDonations(projectUid, accessToken, feedback);
  const selection = useMatchSelection({
    interventions: locations.items,
    contributions: donations.items,
    locationGeneration: locations.generation,
    donationGeneration: donations.generation,
  });

  const [exportOpen, setExportOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // The match error belongs in the confirm dialog, where the retry happens.
  const [matchError, setMatchError] = useState<string | null>(null);

  const automatch = useAutomatchRun({
    projectUid,
    accessToken,
    sites: locations.sites,
    crossProject: locations.crossProject,
    feedback,
    reloadLocations: locations.reload,
    reloadDonations: donations.reload,
    onApplied: ({ byUid, applied, trees, donations: donationCount }) => {
      locations.noteMatched(byUid, trees);
      donations.applyTotals(applied);
      // The plan may have used donations that are not on a loaded page, so what
      // is on screen can lag. Reload it on the next visit rather than now.
      donations.markStale();
      feedback.notify(`Auto-matched ${fmtTrees(trees)} trees across ${fmtNum(donationCount)} donation(s).`);
    },
  });

  // Planted and matched are project-wide and come from the server, independent
  // of the filters. Open donation trees can only be summed over loaded pages.
  const openDonationTrees = useMemo(
    () => donations.items.reduce((sum, c) => sum + contribAvailable(c), 0),
    [donations.items],
  );

  /**
   * Record the match. The request carries (donation, location) pairs only: the
   * server derives each donation's new absolute total by summing its own rows,
   * so this client can never send a stale total. It writes those totals to the
   * donation backend inside the same transaction, so either everything landed
   * or nothing did.
   */
  const applyMatch = async (allocs: PreviewAllocation[]) => {
    if (!projectUid || !accessToken || allocs.length === 0) return;

    const byPair = new Map<string, MatchPair>();
    const byUid: Record<string, number> = {};
    allocs.forEach(a => {
      const key = `${a.contributionId}:${a.interventionUid}`;
      const existing = byPair.get(key);
      if (existing) existing.trees += a.trees;
      else byPair.set(key, { contributionId: a.contributionId, interventionUid: a.interventionUid, trees: a.trees });
      byUid[a.interventionUid] = (byUid[a.interventionUid] || 0) + a.trees;
    });
    const matches = [...byPair.values()];

    // The dialog blocks this too; this is the backstop.
    if (matches.length > MAX_MATCH_PAIRS) {
      setMatchError(`One match can carry ${fmtNum(MAX_MATCH_PAIRS)} donation-to-location links. Select fewer and record it in more than one go.`);
      return;
    }

    setSubmitting(true);
    setMatchError(null);
    feedback.clearError();
    try {
      const response = await postTreematchMatches(accessToken, projectUid, matches);
      const status = Number(response?.statusCode ?? 0);
      if (status !== 200 || !response?.data) {
        setMatchError(response?.message || 'Failed to record the match');
        // Nothing was written either way. A 409 means a plant location no longer
        // has that many trees free, so the left pane is what moved; anything
        // else came from the donation backend.
        if (status === 409) locations.reload(); else donations.reload();
        return;
      }

      const trees = allocs.reduce((sum, a) => sum + a.trees, 0);
      // No per-location numbers come back, so the left pane is bumped locally
      // and corrected by the next fetch. The right pane takes the donation
      // backend's accepted absolute totals, so there is nothing to guess at.
      locations.noteMatched(byUid, trees);
      donations.applyTotals((response.data.applied || {}) as Record<string, number>);

      selection.clear();
      setConfirmOpen(false);
      feedback.notify(`Matched ${fmtTrees(trees)} trees across ${fmtNum(matches.length)} plant location link(s).`);
    } catch (err) {
      console.error('TreeMatch match failed:', err);
      setMatchError(err instanceof Error ? err.message : 'Failed to record the match');
    } finally {
      setSubmitting(false);
    }
  };

  // Page actions live in the shared dashboard top bar, not a second header band.
  //
  // The top bar keeps whatever array it was last handed, so everything these
  // actions read has to be listed below. With no deps they froze at their
  // mount-time values: the label never became "Review plan" (so a run left open
  // by an earlier visit was unreachable and the next run 409'd), and the click
  // handler kept the empty site list, which disabled "a specific site" in the
  // rules editor for the whole session.
  useTopBarActions(
    [
      {
        // A run picked up on arrival polls with no dialog open, so the button is
        // the only thing that can say it is happening. Pressing it opens the
        // rules, where the progress panel lives.
        label: automatch.run?.status === 'planned'
          ? 'Review plan'
          : automatch.running ? 'Planning…' : 'Auto-match',
        icon: Wand2,
        variant: 'outline' as const,
        onClick: () => (automatch.run?.status === 'planned'
          ? automatch.setPlanOpen(true)
          : automatch.openRules()),
      },
      { label: 'Export', icon: Download, variant: 'primary' as const, onClick: () => setExportOpen(true) },
    ],
    [
      automatch.run?.status, automatch.running, automatch.rulesLoaded,
      accessToken, projectUid, locations.crossProject, locations.sites,
    ],
  );

  return (
    <div className="w-full flex-1 min-h-0 flex flex-col overflow-hidden bg-muted/30">
      {/* Stats ribbon. The title + actions live in the shared dashboard top bar. */}
      <div className="flex-shrink-0 px-4 pt-3">
        <StatsRibbon
          planted={locations.plantedTrees}
          matched={locations.matchedTrees}
          unmatched={Math.max(0, locations.plantedTrees - locations.matchedTrees)}
          openDonationTrees={openDonationTrees}
          sourceProjectName={locations.crossProject
            ? (locations.projectName ?? 'the selected project')
            : undefined}
        />
      </div>

      {feedback.lastAction && (
        <div className="flex-shrink-0 px-4 pt-2">
          <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-1.5">
            {feedback.lastAction}
          </div>
        </div>
      )}
      {feedback.actionError && (
        <div className="flex-shrink-0 px-4 pt-2">
          <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-3 py-1.5">
            {feedback.actionError}
          </div>
        </div>
      )}

      {/* The panes sat either side of a connector rail; with that gone they need
        * a gap of their own. */}
      <div className="flex-1 min-h-0 flex gap-3 overflow-hidden px-4 py-3">
        <LocationsPane
          locations={locations}
          pageProjectUid={projectUid}
          selected={selection.selInterv}
          isBlocked={selection.intervBlocked}
          onToggle={selection.toggleInterv}
          supplyCoversDemand={selection.supplyCoversDemand}
        />

        <DonationsPane
          donations={donations}
          projectName={projectName}
          selected={selection.selContrib}
          isBlocked={selection.contribBlocked}
          onToggle={selection.toggleContrib}
          amounts={selection.matchAmounts}
          onAmountChange={selection.setAmount}
          onAmountReset={selection.resetAmount}
          demandCoversSupply={selection.demandCoversSupply}
        />
      </div>

      {/* Bottom action bar */}
      <div className="flex-shrink-0 border-t border-border bg-background px-4 py-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="text-sm text-muted-foreground flex items-center gap-1.5 whitespace-nowrap">
            <span className="font-semibold text-foreground">{selection.selIntervList.length}</span>
            plant location{selection.selIntervList.length === 1 ? '' : 's'}
            <ArrowLeftRight size={13} className="text-muted-foreground/70" />
            <span className="font-semibold text-foreground">{selection.selContribList.length}</span>
            donation{selection.selContribList.length === 1 ? '' : 's'}
          </div>

          {/* Only once both sides have a usable selection is there a balance to
            * report; before that the two numbers above say everything there is. */}
          {selection.canMatch && (
            <MatchBalance supply={selection.supply} demand={selection.demand} />
          )}

          <div className="flex-1" />

          <Button
            size="lg" className="rounded-lg px-5"
            disabled={!selection.canMatch}
            onClick={() => { setMatchError(null); setConfirmOpen(true); }}
          >
            <Play size={14} />
            {selection.canMatch ? `Match ${fmtTrees(selection.matchable)} trees` : 'Match trees'}
          </Button>
        </div>
      </div>

      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        interventions={locations.items}
        contributions={donations.items}
      />
      <MatchConfirmDialog
        open={confirmOpen}
        onOpenChange={(v) => { if (!submitting) { setConfirmOpen(v); if (!v) setMatchError(null); } }}
        interventions={selection.selIntervList}
        contributions={selection.selContribList}
        amounts={selection.matchAmounts}
        submitting={submitting}
        error={matchError}
        onConfirm={applyMatch}
      />
      <RulesDialog
        open={automatch.rulesOpen}
        onOpenChange={(v) => { automatch.setRulesOpen(v); if (!v) automatch.setRulesError(null); }}
        // Auto-match reads the same donation backend the right pane does, so a
        // project it does not have yet gets the same answer here, said the same
        // way, instead of a run that fails on its first sweep.
        notOnPlatform={donations.notOnPlatform}
        projectName={projectName}
        rules={automatch.rules}
        onRulesChange={automatch.setRules}
        sites={automatch.ruleSites}
        countries={COUNTRY_OPTIONS}
        maxTrees={automatch.maxTrees}
        onMaxTreesChange={automatch.setMaxTrees}
        dirty={automatch.rulesDirty}
        saving={automatch.rulesSaving}
        running={automatch.running}
        progress={automatch.run?.progress}
        elapsedSeconds={automatch.elapsed}
        stopRequested={automatch.run?.stopRequested}
        stopping={automatch.stopping}
        error={automatch.rulesError}
        onSave={() => { void automatch.saveRules(); }}
        onRun={() => { void automatch.runRules(); }}
        onStop={() => { void automatch.stopRun(); }}
      />
      <AutomatchPlanDialog
        open={automatch.planOpen}
        onOpenChange={(v) => { automatch.setPlanOpen(v); if (!v) automatch.setPlanError(null); }}
        run={automatch.run}
        applying={automatch.applying}
        discarding={automatch.discarding}
        error={automatch.planError}
        onApply={(keep) => { void automatch.applyPlan(keep); }}
        onDiscard={() => { void automatch.discardPlan(); }}
      />
    </div>
  );
}
