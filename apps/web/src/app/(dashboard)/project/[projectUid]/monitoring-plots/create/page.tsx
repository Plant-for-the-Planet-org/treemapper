'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-toastify';
import useProjectStore from '@shared-core/store/useProjectStore';
import { createMonitoringPlot, getUserProjectSites } from '@shared-core/fetchApi/api.fetch';
import { useToken } from '@/context/useTokenContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  DraftObservation, DraftTree, PlotDraft, STEP_LABELS, STEP_ORDER, SiteOption, WizardStep,
} from './types';
import { ColumnMapping } from './utils/csvFields';
import {
  OBSERVATION_FIELDS, TREE_FIELDS, parseObservations, parseTrees,
} from './utils/parseCsv';
import { downloadObservationTemplate, downloadTreeTemplate } from './utils/csvTemplates';
import { applySpeciesMatches, lookupSpecies, SpeciesHit } from './utils/speciesMatch';
import { carriedWarnings, recomputeTree } from './utils/validate';
import { buildPayload, validateDraft } from './utils/buildPayload';
import PlotDetailsStep from './components/PlotDetailsStep';
import CsvStep from './components/CsvStep';
import ReviewStep from './components/ReviewStep';

/**
 * Create one monitoring plot from the dashboard.
 *
 * Four steps: the plot and its boundary, an optional tree CSV, an optional
 * observation CSV, then a review where every row can be edited before saving. The
 * save is a single request; the server writes the plot, its trees, their
 * measurement records and the observations in one transaction, so there is no
 * half-saved plot to clean up.
 *
 * The draft id is generated once per visit and sent as the payload's clientId. The
 * server keys idempotency on it, so retrying after a dropped response returns the
 * plot that was already created instead of making a second one.
 */

const newDraftId = () => `web_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const emptyPlot = (): PlotDraft => ({
  name: '',
  plotType: 'intervention',
  shape: 'circle',
  radius: null,
  length: null,
  width: null,
  center: null,
  geometry: null,
  boundarySource: 'map',
  uploadedFileName: null,
  siteUid: null,
  establishedOn: new Date().toISOString(),
});

const CreatePlotPage = () => {
  const router = useRouter();
  const selectedProject = useProjectStore((s) => s.selectedProject);
  const { accessToken } = useToken();
  const token = accessToken || '';
  const projectUid = selectedProject?.uid as string | undefined;
  const canManage = ['owner', 'admin', 'contributor'].includes(selectedProject?.userRole || '');

  const draftId = useRef(newDraftId());

  const [step, setStep] = useState<WizardStep>('details');
  const [plot, setPlot] = useState<PlotDraft>(emptyPlot);
  const [trees, setTrees] = useState<DraftTree[]>([]);
  const [observations, setObservations] = useState<DraftObservation[]>([]);
  const [treeFile, setTreeFile] = useState<string | null>(null);
  const [observationFile, setObservationFile] = useState<string | null>(null);
  const [matchingSpecies, setMatchingSpecies] = useState(false);

  const [sites, setSites] = useState<SiteOption[]>([]);
  const [siteGeometries, setSiteGeometries] = useState<Record<string, any>>({});

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  // Success is tracked separately from the hid: the confirmation must show even if
  // the response somehow arrives without one.
  const [saved, setSaved] = useState(false);
  const [savedHid, setSavedHid] = useState<string | null>(null);

  // Sites give both the dropdown options and something to open the map on, so the
  // user is not hunting for their plot from a world view.
  useEffect(() => {
    if (!projectUid || !token) return;
    getUserProjectSites(token, projectUid)
      .then((res) => {
        if (res?.statusCode !== 200) return;
        const rows: any[] = Array.isArray(res.data) ? res.data : res.data?.sites ?? [];
        setSites(rows
          .filter((s) => s?.uid)
          .map((s) => ({ uid: s.uid, name: s.name || 'Unnamed site' })));
        const geometries: Record<string, any> = {};
        for (const s of rows) {
          const raw = s?.originalGeometry ?? s?.location ?? s?.geometry;
          if (!raw) continue;
          try {
            geometries[s.uid] = typeof raw === 'string' ? JSON.parse(raw) : raw;
          } catch {
            // A site with unreadable geometry just does not focus the map.
          }
        }
        setSiteGeometries(geometries);
      })
      .catch(() => {
        // Sites are optional context; the wizard works without them.
      });
  }, [projectUid, token]);

  const focusGeometry = useMemo(() => {
    if (plot.siteUid && siteGeometries[plot.siteUid]) return siteGeometries[plot.siteUid];
    const first = Object.values(siteGeometries)[0];
    return first ?? null;
  }, [plot.siteUid, siteGeometries]);

  const blockingIssues = useMemo(() => validateDraft(plot, trees), [plot, trees]);
  const detailsComplete = !!plot.geometry && !!plot.name.trim();

  // ─── step handlers ──────────────────────────────────────────────────────────

  const handleTreeCsv = async (file: File, mapping: ColumnMapping) => {
    const parsed = await parseTrees(file, mapping);
    const withBoundary = parsed.map((t) => recomputeTree(t, plot.geometry, carriedWarnings(t)));
    setTrees(withBoundary);
    setTreeFile(file.name);

    const names = withBoundary.map((t) => t.speciesName).filter(Boolean);
    if (names.length === 0) return;

    setMatchingSpecies(true);
    try {
      const matches = await lookupSpecies(token, names);
      setTrees((current) => applySpeciesMatches(current, matches));
    } finally {
      setMatchingSpecies(false);
    }
  };

  const handleObservationCsv = async (file: File, mapping: ColumnMapping) => {
    setObservations(await parseObservations(file, mapping));
    setObservationFile(file.name);
  };

  // Boundary edits change which trees fall outside it, so warnings are refreshed
  // whenever the review step is opened.
  const goToStep = (next: WizardStep) => {
    if (next === 'review') {
      setTrees((current) => current.map((t) => recomputeTree(t, plot.geometry, carriedWarnings(t))));
    }
    setStep(next);
  };

  const applySpeciesToAll = (name: string, hit: SpeciesHit | null) => {
    const key = name.trim().toLowerCase();
    setTrees((current) => current.map((t) => {
      if (t.speciesName.trim().toLowerCase() !== key) return t;
      return hit
        ? {
          ...t,
          scientificSpeciesUid: hit.uid,
          speciesName: hit.scientificName,
          speciesMatch: 'matched' as const,
        }
        : { ...t, scientificSpeciesUid: null, speciesMatch: 'unmatched' as const };
    }));
  };

  const removeInvalid = () => {
    setTrees((current) => current.filter(
      (t) => t.errors.length === 0 && t.measurements.every((m) => m.errors.length === 0),
    ));
    setObservations((current) => current.filter((o) => o.errors.length === 0));
  };

  const handleSave = async () => {
    if (!projectUid) return;
    setSaving(true);
    setSaveError('');
    try {
      const payload = buildPayload(draftId.current, plot, trees, observations, {
        treeFile,
        observationFile,
      });
      const res = await createMonitoringPlot(token, projectUid, payload);
      const created = res?.data;
      if (!created?.id) {
        setSaveError(res?.message || 'The plot could not be saved. Please try again.');
        return;
      }
      setSavedHid(created.hid || null);
      setSaved(true);
      toast.success('Plot created');
    } catch (err: any) {
      setSaveError(err?.message || 'The plot could not be saved. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const backToPlots = () => router.push(`/project/${projectUid}/monitoring-plots`);

  // ─── guards ─────────────────────────────────────────────────────────────────

  if (!projectUid) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Select a project first.</p>
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="p-6 space-y-3">
        <p className="text-sm text-muted-foreground">
          You need contributor access or above to create a plot.
        </p>
        <Button variant="outline" size="sm" onClick={backToPlots}>Back to plots</Button>
      </div>
    );
  }

  if (saved) {
    return (
      <div className="w-full flex-1 min-h-0 overflow-y-auto bg-muted/30">
        <div className="max-w-[560px] mx-auto p-6 pt-16 text-center">
          <CheckCircle2 className="w-12 h-12 text-[#007A49] mx-auto mb-4" />
          <h1 className="text-[20px] font-semibold">Plot created</h1>
          <p className="text-[13px] text-muted-foreground mt-1.5">
            {plot.name} was saved
            {savedHid && <> as <span className="font-mono">{savedHid}</span></>}.
          </p>
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button onClick={backToPlots}>Go to plots</Button>
            <Button
              variant="outline"
              onClick={() => {
                draftId.current = newDraftId();
                setPlot(emptyPlot());
                setTrees([]);
                setObservations([]);
                setTreeFile(null);
                setObservationFile(null);
                setSaved(false);
                setSavedHid(null);
                setSaveError('');
                setStep('details');
              }}
            >
              Create another
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const stepIndex = STEP_ORDER.indexOf(step);

  return (
    <div className="w-full flex-1 min-h-0 overflow-y-auto bg-muted/30">
      <div className="p-4 sm:p-6 max-w-[1280px] mx-auto">
        <button
          onClick={backToPlots}
          className="inline-flex items-center gap-1 text-[12.5px] text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to plots
        </button>

        <div className="flex flex-wrap items-end justify-between gap-4 pb-4">
          <div>
            <h1 className="text-[24px] font-semibold tracking-tight">Create plot</h1>
            <p className="text-[13px] text-muted-foreground mt-1">
              Set up the plot, then bring its trees and observations in from a spreadsheet.
            </p>
          </div>
        </div>

        {/* Stepper */}
        <div className="border rounded-[3px] bg-card mb-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0">
            {STEP_ORDER.map((s, i) => {
              const done = i < stepIndex;
              const active = s === step;
              const reachable = i === 0 || detailsComplete;
              return (
                <button
                  key={s}
                  type="button"
                  disabled={!reachable}
                  onClick={() => reachable && goToStep(s)}
                  className={cn(
                    'flex items-center gap-2.5 px-4 py-3 text-left transition-colors',
                    active && 'bg-muted/60',
                    reachable ? 'hover:bg-muted/40' : 'opacity-50 cursor-not-allowed',
                  )}
                >
                  <span className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold flex-none',
                    done ? 'bg-[#007A49] text-white'
                      : active ? 'bg-foreground text-background'
                        : 'bg-muted text-muted-foreground',
                  )}>
                    {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
                  </span>
                  <span className="min-w-0">
                    <span className={cn(
                      'block text-[12.5px] font-medium truncate',
                      !active && !done && 'text-muted-foreground',
                    )}>
                      {STEP_LABELS[s]}
                    </span>
                    {s === 'trees' && trees.length > 0 && (
                      <span className="block text-[10.5px] text-muted-foreground">
                        {trees.length} loaded
                      </span>
                    )}
                    {s === 'observations' && observations.length > 0 && (
                      <span className="block text-[10.5px] text-muted-foreground">
                        {observations.length} loaded
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Steps */}
        {step === 'details' && (
          <PlotDetailsStep
            draft={plot}
            onChange={(patch) => setPlot((p) => ({ ...p, ...patch }))}
            sites={sites}
            focusGeometry={focusGeometry}
          />
        )}

        {step === 'trees' && (
          <CsvStep
            title="Trees"
            description="One row per measurement. Repeat a tree's tag across rows to bring in its measurement history."
            fields={TREE_FIELDS}
            onDownloadTemplate={downloadTreeTemplate}
            onParse={handleTreeCsv}
            loadedCount={trees.length}
            loadedFileName={treeFile}
            errorCount={trees.filter(
              (t) => t.errors.length > 0 || t.measurements.some((m) => m.errors.length > 0),
            ).length}
            onClear={() => { setTrees([]); setTreeFile(null); }}
          >
            {matchingSpecies && (
              <p className="text-[12.5px] text-muted-foreground text-center">
                Matching species names…
              </p>
            )}
          </CsvStep>
        )}

        {step === 'observations' && (
          <CsvStep
            title="Observations"
            description="Plot-level readings such as soil moisture or canopy cover. One row per reading."
            fields={OBSERVATION_FIELDS}
            onDownloadTemplate={downloadObservationTemplate}
            onParse={handleObservationCsv}
            loadedCount={observations.length}
            loadedFileName={observationFile}
            errorCount={observations.filter((o) => o.errors.length > 0).length}
            onClear={() => { setObservations([]); setObservationFile(null); }}
          />
        )}

        {step === 'review' && (
          <ReviewStep
            plot={plot}
            trees={trees}
            observations={observations}
            token={token}
            saving={saving}
            saveError={saveError}
            blockingIssues={blockingIssues}
            onEditPlot={() => setStep('details')}
            onUpdateTree={(updated) => setTrees(
              (current) => current.map((t) => (t.id === updated.id ? updated : t)),
            )}
            onDeleteTree={(id) => setTrees((current) => current.filter((t) => t.id !== id))}
            onUpdateObservation={(updated) => setObservations(
              (current) => current.map((o) => (o.id === updated.id ? updated : o)),
            )}
            onDeleteObservation={(id) => setObservations(
              (current) => current.filter((o) => o.id !== id),
            )}
            onApplySpeciesToAll={applySpeciesToAll}
            onRemoveInvalid={removeInvalid}
            onSave={handleSave}
          />
        )}

        {/* Nav */}
        {step !== 'review' && (
          <div className="flex items-center justify-between gap-3 mt-5 pt-4 border-t">
            <Button
              variant="outline"
              disabled={stepIndex === 0}
              onClick={() => goToStep(STEP_ORDER[stepIndex - 1])}
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back
            </Button>
            <div className="flex items-center gap-3">
              {step === 'details' && !detailsComplete && (
                <p className="text-[12px] text-muted-foreground">
                  {!plot.name.trim() ? 'Add a name' : 'Set the boundary'} to continue
                </p>
              )}
              <Button
                disabled={step === 'details' && !detailsComplete}
                onClick={() => goToStep(STEP_ORDER[stepIndex + 1])}
              >
                {step === 'observations' ? 'Review' : 'Next'}
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatePlotPage;
