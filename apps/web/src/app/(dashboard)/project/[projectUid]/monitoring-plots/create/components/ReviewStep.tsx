'use client';

import { useMemo, useState } from 'react';
import {
  AlertCircle, AlertTriangle, MapPin, Pencil, Trash2, TreePine, Trash,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  DraftObservation, DraftTree, ORIGIN_LABELS, PlotDraft, observationIsValid, treeIsValid,
} from '../types';
import { formatArea, isInsideBoundary, polygonArea } from '../utils/plotGeometry';
import { SpeciesHit, unmatchedSpeciesNames } from '../utils/speciesMatch';
import PlotBoundaryMap, { MapPoint, ORIGIN_COLOR } from './PlotBoundaryMap';
import SpeciesPicker from './SpeciesPicker';
import TreeEditDialog from './TreeEditDialog';
import ObservationEditDialog from './ObservationEditDialog';

const fmtDate = (iso: string) => (iso
  ? new Date(iso).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—');

const Dot = ({ origin }: { origin: string }) => (
  <span
    className="inline-block w-2 h-2 rounded-full flex-none"
    style={{ backgroundColor: ORIGIN_COLOR[origin] ?? ORIGIN_COLOR.planted }}
  />
);

/**
 * Step 4. Everything the wizard has gathered, laid out as editable cards, with
 * the save action at the end. Rows carrying errors are excluded from the save and
 * are called out so the user can fix or drop them; warnings are advisory and do
 * not block anything.
 */
const ReviewStep = ({
  plot,
  trees,
  observations,
  token,
  saving,
  saveError,
  onEditPlot,
  onUpdateTree,
  onDeleteTree,
  onUpdateObservation,
  onDeleteObservation,
  onApplySpeciesToAll,
  onRemoveInvalid,
  onSave,
  blockingIssues,
}: {
  plot: PlotDraft;
  trees: DraftTree[];
  observations: DraftObservation[];
  token: string;
  saving: boolean;
  saveError: string;
  onEditPlot: () => void;
  onUpdateTree: (tree: DraftTree) => void;
  onDeleteTree: (id: string) => void;
  onUpdateObservation: (observation: DraftObservation) => void;
  onDeleteObservation: (id: string) => void;
  onApplySpeciesToAll: (name: string, hit: SpeciesHit | null) => void;
  onRemoveInvalid: () => void;
  onSave: () => void;
  blockingIssues: string[];
}) => {
  const [editingTree, setEditingTree] = useState<DraftTree | null>(null);
  const [editingObservation, setEditingObservation] = useState<DraftObservation | null>(null);

  const validTrees = trees.filter(treeIsValid);
  const invalidTrees = trees.length - validTrees.length;
  const validObservations = observations.filter(observationIsValid);
  const invalidObservations = observations.length - validObservations.length;
  const warningCount = trees.filter((t) => t.warnings.length > 0).length;
  const unmatched = useMemo(() => unmatchedSpeciesNames(trees), [trees]);
  const matchedCount = trees.filter((t) => t.speciesMatch === 'matched').length;

  const points: MapPoint[] = trees
    .filter((t) => t.latitude != null && t.longitude != null)
    .map((t) => ({
      id: t.id,
      latitude: t.latitude as number,
      longitude: t.longitude as number,
      origin: t.origin,
      label: t.tag || t.speciesName,
      outside: !isInsideBoundary(plot.geometry, t.longitude as number, t.latitude as number),
    }));

  const totalMeasurements = trees.reduce((a, t) => a + t.measurements.length, 0);

  return (
    <div className="space-y-5">
      <TreeEditDialog
        open={!!editingTree}
        tree={editingTree}
        token={token}
        boundary={plot.geometry}
        onClose={() => setEditingTree(null)}
        onSave={onUpdateTree}
      />
      <ObservationEditDialog
        open={!!editingObservation}
        observation={editingObservation}
        onClose={() => setEditingObservation(null)}
        onSave={onUpdateObservation}
      />

      {/* Plot summary */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-5 border rounded-[3px] bg-card">
          <div className="flex items-center justify-between px-4 py-2.5 border-b">
            <h3 className="text-[13px] font-semibold">Plot</h3>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px]" onClick={onEditPlot}>
              <Pencil className="w-3 h-3 mr-1" /> Edit
            </Button>
          </div>
          <div className="p-4 space-y-2.5">
            <div>
              <p className="text-[15px] font-semibold">{plot.name || 'Unnamed plot'}</p>
              <p className="text-[11.5px] text-muted-foreground capitalize mt-0.5">
                {[plot.plotType, plot.shape].filter(Boolean).join(' · ')}
              </p>
            </div>
            <Separator />
            <dl className="space-y-1.5 text-[12.5px]">
              <Row label="Dimensions" value={
                plot.shape === 'circle' && plot.radius ? `radius ${plot.radius} m`
                  : plot.shape === 'rectangle' && plot.length && plot.width ? `${plot.length} × ${plot.width} m`
                    : 'from boundary file'
              } />
              <Row label="Area" value={formatArea(polygonArea(plot.geometry))} />
              <Row label="Established" value={fmtDate(plot.establishedOn)} />
              <Row label="Boundary" value={plot.boundarySource === 'file' ? (plot.uploadedFileName ?? 'file') : 'drawn on map'} />
              {plot.center && (
                <Row
                  label="Centre"
                  value={`${plot.center[1].toFixed(5)}, ${plot.center[0].toFixed(5)}`}
                  mono
                />
              )}
            </dl>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-7">
          <PlotBoundaryMap
            boundary={plot.geometry}
            center={plot.center}
            points={points}
            readOnly
            height={300}
          />
          {points.some((p) => p.outside) && (
            <p className="text-[11.5px] text-amber-600 mt-2 inline-flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 mt-px flex-none" />
              {points.filter((p) => p.outside).length} tree(s) sit outside the boundary. They
              still save, but check the coordinates.
            </p>
          )}
        </div>
      </div>

      {/* Counts */}
      <div className="border rounded-[3px] bg-card grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0">
        <Tile label="Trees" value={`${validTrees.length}`} sub={invalidTrees ? `${invalidTrees} with errors` : 'all valid'} />
        <Tile label="Measurements" value={`${totalMeasurements}`} sub="across all trees" />
        <Tile label="Observations" value={`${validObservations.length}`} sub={invalidObservations ? `${invalidObservations} with errors` : 'all valid'} />
        <Tile label="Species matched" value={`${matchedCount} / ${trees.length}`} sub={unmatched.length ? `${unmatched.length} name(s) unmatched` : 'all matched'} />
      </div>

      {/* Species fixes */}
      {unmatched.length > 0 && (
        <div className="border rounded-[3px] bg-card">
          <div className="px-4 py-2.5 border-b">
            <h3 className="text-[13px] font-semibold">Unmatched species</h3>
            <p className="text-[11.5px] text-muted-foreground mt-0.5">
              Pick the right species to apply it to every tree with that name. Leave one
              alone and those trees save as an unknown species, keeping the name.
            </p>
          </div>
          <div className="divide-y">
            {unmatched.map((u) => (
              <div key={u.name} className="flex items-center gap-3 px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] italic truncate">{u.name || '(no species given)'}</p>
                  <p className="text-[10.5px] text-muted-foreground">
                    {u.count} tree{u.count === 1 ? '' : 's'}
                  </p>
                </div>
                {u.name && (
                  <SpeciesPicker
                    token={token}
                    value={null}
                    displayName={u.name}
                    className="w-[280px]"
                    onSelect={(hit) => onApplySpeciesToAll(u.name, hit)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trees */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-[14px] font-semibold inline-flex items-center gap-1.5">
            <TreePine className="w-4 h-4 text-[#007A49]" /> Trees ({trees.length})
          </h3>
          {(invalidTrees > 0 || invalidObservations > 0) && (
            <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={onRemoveInvalid}>
              <Trash className="w-3 h-3 mr-1" /> Remove all rows with errors
            </Button>
          )}
        </div>

        {trees.length === 0 ? (
          <div className="border rounded-[3px] bg-card py-10 text-center">
            <p className="text-[13px] text-muted-foreground">
              No trees. The plot saves with its boundary only.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {trees.map((t) => {
              const bad = !treeIsValid(t);
              const last = t.measurements[t.measurements.length - 1];
              return (
                <div
                  key={t.id}
                  className={cn(
                    'border rounded-[3px] bg-card p-3 space-y-2',
                    bad && 'border-destructive/60',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold font-mono truncate">
                        {t.tag || '(no tag)'}
                      </p>
                      <p className={cn(
                        'text-[11.5px] italic truncate',
                        t.speciesMatch === 'matched' ? 'text-foreground/80' : 'text-muted-foreground',
                      )}>
                        {t.speciesName || 'Unknown species'}
                        {t.speciesMatch !== 'matched' && t.speciesName && ' (unknown)'}
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5 flex-none">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setEditingTree(t)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => onDeleteTree(t.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-[11.5px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Dot origin={t.origin} /> {ORIGIN_LABELS[t.origin]}
                    </span>
                    <span>{t.measurements.length} meas.</span>
                    {last && (
                      <span className="font-mono">
                        {last.height != null ? `${last.height} m` : '—'}
                        {last.width != null ? ` / ${last.width} cm` : ''}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground/80 font-mono">
                    <MapPin className="w-3 h-3 flex-none" />
                    {t.latitude != null && t.longitude != null
                      ? `${t.latitude.toFixed(5)}, ${t.longitude.toFixed(5)}`
                      : 'no coordinates'}
                  </div>

                  {t.errors.map((e) => (
                    <p key={e} className="text-[11px] text-destructive inline-flex items-start gap-1">
                      <AlertCircle className="w-3 h-3 mt-px flex-none" /> {e}
                    </p>
                  ))}
                  {t.measurements.flatMap((m) => m.errors).slice(0, 2).map((e) => (
                    <p key={e} className="text-[11px] text-destructive inline-flex items-start gap-1">
                      <AlertCircle className="w-3 h-3 mt-px flex-none" /> {e}
                    </p>
                  ))}
                  {t.warnings.map((w) => (
                    <p key={w} className="text-[11px] text-amber-600 inline-flex items-start gap-1">
                      <AlertTriangle className="w-3 h-3 mt-px flex-none" /> {w}
                    </p>
                  ))}
                  {t.rows.length > 0 && (
                    <p className="text-[10px] text-muted-foreground/60">
                      row{t.rows.length === 1 ? '' : 's'} {t.rows.join(', ')}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Observations */}
      {observations.length > 0 && (
        <div>
          <h3 className="text-[14px] font-semibold mb-2.5">
            Observations ({observations.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {observations.map((o) => {
              const bad = !observationIsValid(o);
              return (
                <div
                  key={o.id}
                  className={cn(
                    'border rounded-[3px] bg-card p-3 space-y-1.5',
                    bad && 'border-destructive/60',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[12.5px] font-medium capitalize truncate">
                      {o.type.replace(/_/g, ' ') || '(no type)'}
                    </p>
                    <div className="flex items-center gap-0.5 flex-none">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setEditingObservation(o)}
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={() => onDeleteObservation(o.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-[16px] font-semibold font-mono">
                    {o.value ?? '—'}
                    <span className="text-[11px] text-muted-foreground font-normal ml-1">{o.unit}</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground">{fmtDate(o.observedAt)}</p>
                  {o.errors.map((e) => (
                    <p key={e} className="text-[11px] text-destructive">{e}</p>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Save */}
      <div className="border rounded-[3px] bg-card p-4">
        {blockingIssues.length > 0 && (
          <div className="mb-3 space-y-1">
            {blockingIssues.map((i) => (
              <p key={i} className="text-[12.5px] text-destructive inline-flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 mt-px flex-none" /> {i}
              </p>
            ))}
          </div>
        )}
        {saveError && (
          <p className="mb-3 text-[12.5px] text-destructive inline-flex items-start gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 mt-px flex-none" /> {saveError}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[12.5px] text-muted-foreground">
            Saving creates the plot with {validTrees.length} tree
            {validTrees.length === 1 ? '' : 's'} and {validObservations.length} observation
            {validObservations.length === 1 ? '' : 's'}.
            {(invalidTrees > 0 || invalidObservations > 0) && (
              <span className="text-destructive">
                {' '}
                {invalidTrees + invalidObservations} row(s) with errors will be left out.
              </span>
            )}
            {warningCount > 0 && ` ${warningCount} tree(s) have warnings.`}
          </p>
          <Button onClick={onSave} disabled={saving || blockingIssues.length > 0}>
            {saving ? 'Saving…' : 'Save plot'}
          </Button>
        </div>
      </div>
    </div>
  );
};

const Row = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
  <div className="flex items-baseline justify-between gap-3">
    <dt className="text-muted-foreground">{label}</dt>
    <dd className={cn('text-right', mono && 'font-mono text-[11.5px]')}>{value}</dd>
  </div>
);

const Tile = ({ label, value, sub }: { label: string; value: string; sub: string }) => (
  <div className="px-4 py-3">
    <p className="text-[10.5px] uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className="text-[20px] font-semibold leading-tight mt-0.5">{value}</p>
    <p className="text-[10.5px] text-muted-foreground mt-0.5">{sub}</p>
  </div>
);

export default ReviewStep;
