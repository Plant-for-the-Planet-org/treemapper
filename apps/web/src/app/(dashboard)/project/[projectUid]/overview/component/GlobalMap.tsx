import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import 'maplibre-gl/dist/maplibre-gl.css';
import Map, { Source, Layer, Marker, ScaleControl } from 'react-map-gl/maplibre';
import { motion, AnimatePresence } from 'framer-motion';
import type { DateRange as PickerRange } from 'react-day-picker';
import {
    Trees,
    Activity,
    Calendar,
    CalendarDays,
    ChevronDown,
    Ruler,
    Heart,
    AlertCircle,
    RefreshCw,
    Loader2,
    X,
    Search,
    Plus,
    Minus,
    Layers,
    Copy,
    Check,
    MapPin,
    User,
    History,
    ArrowRight,
    ArrowLeft,
    Download,
    CloudCheck,
    CloudAlert,
    Maximize2,
    Minimize2,
    Scan,
    ListFilter,
    PanelLeftClose,
    PanelLeftOpen,
} from 'lucide-react';
import * as turf from '@turf/turf';
import { cn } from '@/lib/utils';
import type {
    MapIntervention,
    MapTree,
    TreeRecord,
    SiteFeature,
    SiteFeatureCollection,
    ProjectMapBounds,
    InterventionDetailResponse,
    MapState,
    MapError,
} from './map/types';
import {
    HALO_COLOR,
    CASING_COLOR,
    SITE_BOUNDARY_COLOR,
    CLUSTER_COLOR,
    TREE_STATUS_COLORS,
    TREE_STATUS_ORDER,
    BASEMAP_STYLES,
    BASEMAP_OPTIONS,
    type BasemapKey,
} from './map/constants';
import {
    getInterventionColor,
    getInterventionLabel,
    getInterventionIcon,
    getTreeStatusColor,
    getSiteLabelPoint,
    formatDate,
    formatCompact,
    buildTreeImageUrl,
    buildSpeciesImageUrl,
    formatHeight,
    formatWidth,
    formatNum,
    resolveArea,
    initialsOf,
    getMarkerPosition,
    zoomToIntervention,
} from './map/utils';
import {
    fetchProjectInterventions,
    fetchProjectSites,
    fetchTreeDetail,
    fetchTreeRecords,
    fetchInterventionDetail,
} from './map/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Calendar as DayCalendar } from '@/components/ui/calendar';

// Static map props. These MUST be module-level constants (stable references).
// react-map-gl compares `style` / `interactiveLayerIds` by reference and
// re-applies the style (reloading every raster tile) whenever the reference
// changes. Inlining them as object/array literals recreated them on every
// render, so any state change (e.g. selecting an intervention) reloaded the
// whole map and produced a visible flicker. (`mapStyle` stays stable via the
// module-level BASEMAP_STYLES lookup.)
const MAP_CONTAINER_STYLE = { width: '100%', height: '100%' };

const INTERACTIVE_LAYER_IDS = [
    'interventions-polygons-fill',
    'interventions-polygons-outline',
    'interventions-points-circle',
    'interventions-centroids-circle',
    'trees-points-circle',
];

// Sources whose features are interventions (used for the hover tooltip).
const INTERVENTION_SOURCES = new Set(['interventions-polygons', 'interventions-points', 'interventions-centroids']);

// One look for every floating map control: white, 1px border, 8px radius,
// small shadow, 40px targets (same as the shadcn outline button).
const CONTROL_GROUP = 'flex flex-col overflow-hidden rounded-lg border border-border bg-background shadow-sm';
const CONTROL_BUTTON = 'flex size-10 items-center justify-center text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset';
const TOOLBAR_BUTTON = 'h-10 rounded-lg bg-background shadow-sm border-border font-medium';

// Map width in the 4-column grid: the list and the detail pane take one
// column each when shown.
const mapSpanClass = (listOpen: boolean, detailOpen: boolean): string => {
    const span = 4 - (listOpen ? 1 : 0) - (detailOpen ? 1 : 0);
    return span === 4 ? 'col-span-4' : span === 3 ? 'col-span-3' : 'col-span-2';
};

// ==================== COMPONENTS ====================

// Sync / capture indicator, matching the interventions list page: a planning
// badge, a green cloud-check when fully synced, or an amber cloud-alert when not.
const SyncStatus: React.FC<{ status: string; captureStatus?: string }> = ({ status, captureStatus }) => {
    if (status === 'planning') {
        return (
            <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                Planning
            </Badge>
        );
    }
    if (captureStatus === 'complete') {
        return <CloudCheck className="h-3.5 w-3.5 text-primary" aria-label="Synced" />;
    }
    return <CloudAlert className="h-3.5 w-3.5 text-amber-600" aria-label="Not synced" />;
};


// Small square that shows an intervention color the same way the map does:
// light fill + solid edge. Point types (single tree) get a round swatch.
const TypeSwatch: React.FC<{ type: string; size?: number; muted?: boolean }> = ({ type, size = 14, muted = false }) => {
    const color = getInterventionColor(type);
    const round = type === 'single-tree-registration' || type === 'sample-tree-registration';
    return (
        <span
            aria-hidden="true"
            className="shrink-0 box-border"
            style={{
                width: size,
                height: size,
                borderRadius: round ? size / 2 : 3,
                background: muted ? 'transparent' : `${color}40`,
                border: muted ? '2px dashed #A1A1AA' : `2px solid ${color}`,
            }}
        />
    );
};

// Site picker. Picking a site flies to it and dims everything outside it.
const SiteSelect: React.FC<{
    sites: SiteFeature[];
    selectedSiteId: number | null;
    onSelectSite: (id: number | null) => void;
}> = ({ sites, selectedSiteId, onSelectSite }) => {
    if (sites.length === 0) return null;
    const selectedName = sites.find(s => s.id === selectedSiteId)?.properties.name;
    return (
        <Select
            value={selectedSiteId != null ? String(selectedSiteId) : 'all'}
            onValueChange={v => onSelectSite(v === 'all' ? null : Number(v))}
        >
            <SelectTrigger
                aria-label="Site"
                title={selectedName ?? 'All sites'}
                className={cn(TOOLBAR_BUTTON, 'w-[220px] max-w-full px-3 data-[size=default]:h-10')}
            >
                <span className="flex flex-1 items-center gap-2 min-w-0 overflow-hidden">
                    <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                    {/* Long site names are cut with an ellipsis; the full name is in the tooltip. */}
                    <span className="min-w-0 flex-1 truncate text-left">
                        <SelectValue placeholder="All sites" />
                    </span>
                </span>
            </SelectTrigger>
            <SelectContent className="max-w-[320px]">
                <SelectItem value="all">All sites ({sites.length})</SelectItem>
                {sites.map(s => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.properties.name}</SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
};

// Date filter. Filters on the intervention start date.
interface MapDateRange { from: Date; to: Date }

const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const endOfDay = (d: Date) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };
const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return startOfDay(d); };
const shortDate = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const DATE_PRESETS: { label: string; range: () => MapDateRange | null }[] = [
    { label: 'All time', range: () => null },
    { label: 'Last 30 days', range: () => ({ from: daysAgo(30), to: endOfDay(new Date()) }) },
    { label: 'Last 12 months', range: () => ({ from: daysAgo(365), to: endOfDay(new Date()) }) },
    { label: 'This year', range: () => ({ from: new Date(new Date().getFullYear(), 0, 1), to: endOfDay(new Date()) }) },
];

// Earliest month the custom range calendar lets you jump to.
const CALENDAR_START = new Date(2000, 0, 1);

const sameDay = (a: Date, b: Date) => startOfDay(a).getTime() === startOfDay(b).getTime();

const DateFilter: React.FC<{
    range: MapDateRange | null;
    onChange: (range: MapDateRange | null) => void;
}> = ({ range, onChange }) => {
    const [open, setOpen] = useState(false);
    // Draft custom range. Nothing filters the map until Apply.
    const [draft, setDraft] = useState<PickerRange | undefined>(undefined);
    const [month, setMonth] = useState<Date>(new Date());

    // Which preset matches the current range, if any. Otherwise it is custom.
    const activePreset = useMemo(() => {
        if (!range) return 'All time';
        return DATE_PRESETS.find(p => {
            const r = p.range();
            return r && sameDay(r.from, range.from) && sameDay(r.to, range.to);
        })?.label ?? null;
    }, [range]);

    // Reset the draft to the applied range each time the popover opens.
    const handleOpenChange = (next: boolean) => {
        if (next) {
            setDraft(range ? { from: range.from, to: range.to } : undefined);
            setMonth(range?.from ?? new Date());
        }
        setOpen(next);
    };

    // Own click logic: first click sets the start, second sets the end.
    // (react-day-picker would make the first click a one-day range.)
    const handleDayClick = (day: Date) => {
        setDraft(prev => {
            if (!prev?.from || prev.to) return { from: day, to: undefined };
            return day < prev.from ? { from: day, to: prev.from } : { from: prev.from, to: day };
        });
    };

    const applyCustom = () => {
        if (!draft?.from || !draft.to) return;
        onChange({ from: startOfDay(draft.from), to: endOfDay(draft.to) });
        setOpen(false);
    };

    const label = !range
        ? 'All time'
        : activePreset ?? `${shortDate(range.from)} - ${shortDate(range.to)}`;

    const hint = !draft?.from
        ? 'Pick a start date'
        : !draft.to
            ? `${shortDate(draft.from)} - pick an end date`
            : `${shortDate(draft.from)} - ${shortDate(draft.to)}`;

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button variant="outline" className={cn(TOOLBAR_BUTTON, 'gap-2 px-3')} aria-label="Date range">
                    <CalendarDays className="w-4 h-4 text-muted-foreground" />
                    <span className="whitespace-nowrap">{label}</span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-0">
                <div className="flex">
                    <div className="flex flex-col gap-0.5 p-2 border-r border-border min-w-[140px]">
                        {DATE_PRESETS.map(p => (
                            <button
                                key={p.label}
                                type="button"
                                onClick={() => { onChange(p.range()); setOpen(false); }}
                                className={cn(
                                    'text-left text-sm px-2.5 py-1.5 rounded-md hover:bg-muted text-foreground',
                                    activePreset === p.label && 'bg-muted font-medium',
                                )}
                            >
                                {p.label}
                            </button>
                        ))}
                        <div
                            className={cn(
                                'text-left text-sm px-2.5 py-1.5 rounded-md text-foreground',
                                range && !activePreset && 'bg-muted font-medium',
                            )}
                        >
                            Custom range
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <DayCalendar
                            mode="range"
                            captionLayout="dropdown"
                            startMonth={CALENDAR_START}
                            endMonth={new Date(new Date().getFullYear(), 11, 31)}
                            month={month}
                            onMonthChange={setMonth}
                            selected={draft}
                            onDayClick={handleDayClick}
                        />
                        <div className="flex items-center justify-between gap-3 border-t border-border px-3 py-2">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">{hint}</span>
                            <div className="flex gap-1.5">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDraft(undefined)}
                                    disabled={!draft?.from}
                                >
                                    Clear
                                </Button>
                                <Button size="sm" onClick={applyCustom} disabled={!draft?.from || !draft.to}>
                                    Apply
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};

// Legend that doubles as the filter. Lists only the intervention types this
// project uses, with counts. Tree status shows while trees are on the map.
const MapLegend: React.FC<{
    typeCounts: { type: string; count: number }[];
    hiddenTypes: Set<string>;
    onToggleType: (type: string) => void;
    onShowAll: () => void;
    showTreeStatus: boolean;
    expanded: boolean;
    onExpandedChange: (v: boolean) => void;
}> = ({ typeCounts, hiddenTypes, onToggleType, onShowAll, showTreeStatus, expanded, onExpandedChange }) => {
    if (typeCounts.length === 0) return null;
    const visible = typeCounts.filter(t => !hiddenTypes.has(t.type)).length;

    if (!expanded) {
        return (
            <Button
                variant="outline"
                onClick={() => onExpandedChange(true)}
                className={cn(TOOLBAR_BUTTON, 'gap-2 px-3')}
                aria-label="Open interventions legend"
            >
                <ListFilter className="w-4 h-4 text-muted-foreground" />
                Interventions
                <span className="rounded px-1.5 py-0.5 text-xs bg-muted text-muted-foreground tabular-nums">
                    {visible} of {typeCounts.length}
                </span>
            </Button>
        );
    }

    return (
        <div className="w-[264px] max-h-full overflow-y-auto rounded-[10px] border border-border bg-background p-2 shadow-md">
            <div className="flex items-center justify-between px-2 pt-1 pb-1.5">
                <span className="text-xs font-semibold text-foreground">Interventions</span>
                <div className="flex items-center gap-2">
                    {hiddenTypes.size > 0 && (
                        <button
                            type="button"
                            onClick={onShowAll}
                            className="text-xs font-medium text-muted-foreground underline underline-offset-2 hover:text-foreground"
                        >
                            Show all
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => onExpandedChange(false)}
                        aria-label="Collapse legend"
                        className="flex text-muted-foreground hover:text-foreground"
                    >
                        <PanelLeftClose className="w-4 h-4" />
                    </button>
                </div>
            </div>
            <div className="flex flex-col">
                {typeCounts.map(({ type, count }) => {
                    const on = !hiddenTypes.has(type);
                    return (
                        <button
                            key={type}
                            type="button"
                            aria-pressed={on}
                            onClick={() => onToggleType(type)}
                            className="flex items-center gap-2.5 w-full h-8 px-2 rounded-md hover:bg-muted text-left"
                        >
                            <TypeSwatch type={type} muted={!on} />
                            <span className={cn('flex-1 truncate text-[13px]', on ? 'text-foreground' : 'text-muted-foreground/70')}>
                                {getInterventionLabel(type)}
                            </span>
                            <span className={cn('text-xs tabular-nums', on ? 'text-muted-foreground' : 'text-muted-foreground/70')}>
                                {formatNum(count)}
                            </span>
                        </button>
                    );
                })}
            </div>
            {showTreeStatus && (
                <>
                    <div className="h-px bg-border my-2" />
                    <div className="px-2 pb-1.5 text-xs font-semibold text-foreground">Tree status</div>
                    <div className="flex flex-col">
                        {TREE_STATUS_ORDER.map(s => (
                            <div key={s} className="flex items-center gap-2.5 h-7 px-2 text-[13px] text-foreground capitalize">
                                <span
                                    aria-hidden="true"
                                    className="size-2.5 rounded-full shrink-0 ring-2 ring-white shadow-[0_0_0_3px_var(--border)]"
                                    style={{ backgroundColor: TREE_STATUS_COLORS[s] }}
                                />
                                {s}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

// Floating map controls, grouped by job: layers, framing, zoom.
const MapControls: React.FC<{
    basemap: BasemapKey;
    onBasemap: (b: BasemapKey) => void;
    hasSites: boolean;
    showSiteBoundaries: boolean;
    onShowSiteBoundaries: (v: boolean) => void;
    onFit: () => void;
    isFullscreen: boolean;
    onToggleFullscreen: () => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
}> = ({ basemap, onBasemap, hasSites, showSiteBoundaries, onShowSiteBoundaries, onFit, isFullscreen, onToggleFullscreen, onZoomIn, onZoomOut }) => (
    <div className="flex flex-col items-end gap-2">
        <div className={CONTROL_GROUP}>
            <Popover>
                <PopoverTrigger asChild>
                    <button type="button" className={CONTROL_BUTTON} aria-label="Basemap and layers" title="Basemap and layers">
                        <Layers className="w-[18px] h-[18px]" />
                    </button>
                </PopoverTrigger>
                <PopoverContent side="left" align="end" className="w-56 p-3 gap-3">
                    <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1.5">Basemap</div>
                        <div className="grid grid-cols-3 gap-1">
                            {BASEMAP_OPTIONS.map(opt => (
                                <button
                                    key={opt.key}
                                    type="button"
                                    onClick={() => onBasemap(opt.key)}
                                    aria-pressed={basemap === opt.key}
                                    className={cn(
                                        'px-2 py-1.5 text-xs rounded-md border transition-colors',
                                        basemap === opt.key
                                            ? 'bg-foreground text-background border-foreground'
                                            : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted',
                                    )}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    {hasSites && (
                        <label className="flex items-center justify-between gap-2 pt-3 border-t border-border cursor-pointer">
                            <span className="text-sm text-foreground">Site boundaries</span>
                            <Switch checked={showSiteBoundaries} onCheckedChange={onShowSiteBoundaries} />
                        </label>
                    )}
                </PopoverContent>
            </Popover>
        </div>
        <div className={CONTROL_GROUP}>
            <button type="button" onClick={onFit} className={CONTROL_BUTTON} aria-label="Fit to project" title="Fit to project">
                <Scan className="w-[18px] h-[18px]" />
            </button>
            <div className="h-px bg-border" />
            <button
                type="button"
                onClick={onToggleFullscreen}
                className={CONTROL_BUTTON}
                aria-label={isFullscreen ? 'Exit full screen' : 'Full screen'}
                title={isFullscreen ? 'Exit full screen' : 'Full screen'}
            >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
        </div>
        <div className={CONTROL_GROUP}>
            <button type="button" onClick={onZoomIn} className={CONTROL_BUTTON} aria-label="Zoom in" title="Zoom in">
                <Plus className="w-[18px] h-[18px]" />
            </button>
            <div className="h-px bg-border" />
            <button type="button" onClick={onZoomOut} className={CONTROL_BUTTON} aria-label="Zoom out" title="Zoom out">
                <Minus className="w-[18px] h-[18px]" />
            </button>
        </div>
    </div>
);

const InterventionSidebar: React.FC<{
    interventions: MapIntervention[];
    selectedId: number | null;
    onSelect: (intervention: MapIntervention) => void;
    hidSearch: string;
    onHidSearch: (v: string) => void;
    total: number;
    onCollapse: () => void;
}> = ({ interventions, selectedId, onSelect, hidSearch, onHidSearch, total, onCollapse }) => {
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (selectedId == null) return;
        const el = listRef.current?.querySelector(`[data-id="${selectedId}"]`);
        el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, [selectedId]);

    return (
        <div className="col-span-1 h-full flex flex-col bg-card text-card-foreground border border-border rounded-2xl overflow-hidden">
            {/* Header: search */}
            <div className="shrink-0 border-b border-border">
                <div className="px-3 pt-3 pb-2 flex items-center gap-2">
                    <div className="relative flex-1 min-w-0">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <Input
                            value={hidSearch}
                            onChange={e => onHidSearch(e.target.value)}
                            placeholder="Search by HID..."
                            className="h-9 pl-8 pr-8"
                        />
                        {hidSearch && (
                            <Button
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => onHidSearch('')}
                                className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground"
                            >
                                <X className="w-3.5 h-3.5" />
                            </Button>
                        )}
                    </div>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={onCollapse}
                        aria-label="Hide interventions list"
                        title="Hide list"
                        className="shrink-0 text-muted-foreground"
                    >
                        <PanelLeftClose className="w-4 h-4" />
                    </Button>
                </div>
                <div className="px-3 pb-2">
                    <span className="text-xs text-muted-foreground">
                        {interventions.length === total
                            ? `${formatNum(total)} interventions`
                            : `${formatNum(interventions.length)} of ${formatNum(total)} shown`}
                    </span>
                </div>
            </div>

            {/* Scrollable intervention list */}
            <div ref={listRef} className="flex-1 overflow-y-auto p-2 space-y-1.5">
                {interventions.map(i => {
                    const Icon = getInterventionIcon(i.type);
                    const selected = selectedId === i.id;
                    const hasArea = i.area || i.location.type === 'Polygon' || i.location.type === 'MultiPolygon';
                    return (
                        <Card
                            key={i.id}
                            data-id={i.id}
                            onClick={() => onSelect(i)}
                            className={cn(
                                'py-0 gap-0 rounded-lg shadow-none ring-0 border cursor-pointer transition-colors',
                                selected ? 'bg-primary/10 border-primary/30' : 'border-border hover:bg-muted/50',
                            )}
                        >
                            <CardContent className="p-2.5">
                                <div className="flex items-start gap-2.5">
                                    <div className={cn(
                                        'p-2 rounded-md shrink-0',
                                        selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                                    )}>
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-1.5 mb-1">
                                            <span className="font-mono text-[11px] bg-muted px-1.5 py-0.5 rounded text-foreground/80 truncate">
                                                {i.hid}
                                            </span>
                                            <span className="shrink-0">
                                                <SyncStatus status={i.status} captureStatus={i.captureStatus} />
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate mb-1">
                                            <TypeSwatch type={i.type} size={10} />
                                            <span className="truncate">{getInterventionLabel(i.type)}</span>
                                        </div>
                                        <div className="flex items-center gap-x-3 gap-y-1 flex-wrap text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Trees className="h-3 w-3" />
                                                <span className="font-medium text-foreground/80">{(i.totalTreeCount ?? 0).toLocaleString()}</span>
                                                <span>trees</span>
                                            </span>
                                            {hasArea && <span>{resolveArea(i)}</span>}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
                {interventions.length === 0 && (
                    <div className="py-10 text-center text-xs text-muted-foreground">No interventions found</div>
                )}
            </div>
        </div>
    );
};

const ErrorDisplay: React.FC<{
    error: MapError;
    onRetry?: () => void;
    onDismiss?: () => void;
}> = ({ error, onRetry, onDismiss }) => (
    <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-popover text-popover-foreground rounded-lg shadow-xl border border-destructive/30 max-w-md"
    >
        <div className="p-4">
            <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                    <h3 className="font-medium text-foreground mb-1">Map Error</h3>
                    <p className="text-sm text-muted-foreground mb-3">{error.message}</p>
                    {error.recoverable && onRetry && (
                        <button
                            onClick={onRetry}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        >
                            <RefreshCw className="w-3 h-3" />
                            Retry
                        </button>
                    )}
                </div>
                {onDismiss && (
                    <button onClick={onDismiss} className="text-muted-foreground hover:text-muted-foreground shrink-0">
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    </motion.div>
);

const LoadingDisplay: React.FC<{ message?: string }> = ({ message = 'Loading map...' }) => (
    <div className="absolute inset-0 bg-muted flex items-center justify-center z-40">
        <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{message}</p>
        </div>
    </div>
);

// Small copy-to-clipboard button that briefly flips to a check on success.
const CopyButton: React.FC<{ value: string; title?: string; className?: string }> = ({ value, title = 'Copy', className }) => {
    const [copied, setCopied] = useState(false);
    const copy = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch { /* clipboard unavailable */ }
    };
    return (
        <button
            type="button"
            onClick={copy}
            title={copied ? 'Copied' : title}
            className={`inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ${className ?? 'w-6 h-6'}`}
        >
            {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
    );
};

// Avatar that shows the person's photo, falling back to their initials.
const OwnerAvatar: React.FC<{ name?: string | null; image?: string | null; size?: number }> = ({ name, image, size = 24 }) => {
    const [err, setErr] = useState(false);
    const px = { width: size, height: size };
    if (image && !err) {
        return (
            <img
                src={image}
                alt={name ?? 'owner'}
                referrerPolicy="no-referrer"
                onError={() => setErr(true)}
                className="rounded-full object-cover bg-muted shrink-0"
                style={px}
            />
        );
    }
    return (
        <span
            className="rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium shrink-0"
            style={{ ...px, fontSize: Math.max(10, size * 0.42) }}
        >
            {initialsOf(name)}
        </span>
    );
};

// One tree in the panel's scrollable list. Shows the photo, identity, latest
// measurements, owner, and a copy-coordinates action. Clicking opens the tree.
// Compact grid cell for a sample tree: photo thumbnail with a status dot and a
// label overlay. Clicking opens the tree detail; full data lives on the
// intervention page.
const TreeGridItem: React.FC<{ tree: MapTree; onSelect: (tree: MapTree) => void }> = ({ tree, onSelect }) => {
    const [imgErr, setImgErr] = useState(false);
    const photo = buildTreeImageUrl(tree);
    const statusColor = getTreeStatusColor(tree.status);
    const label = tree.tag ? `Tag ${tree.tag}` : tree.hid;

    return (
        <button
            type="button"
            onClick={() => onSelect(tree)}
            title={label}
            className="group relative aspect-square rounded-md overflow-hidden bg-muted border border-border hover:border-primary/40 transition-colors"
        >
            {photo && !imgErr ? (
                <img
                    src={photo}
                    alt={label}
                    loading="lazy"
                    onError={() => setImgErr(true)}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground/50">
                    <Trees className="w-5 h-5" strokeWidth={1.5} />
                </div>
            )}
            <span
                className="absolute top-1.5 right-1.5 w-3 h-3 rounded-full ring-2 ring-white/80 shadow"
                style={{ backgroundColor: statusColor }}
                title={tree.status}
            />
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent px-1.5 pt-3 pb-1 text-[10px] font-medium text-white truncate">
                {label}
            </span>
        </button>
    );
};

const PanelFact: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div className="flex flex-col gap-1.5 rounded-lg border border-border p-3 min-w-0">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className="text-[15px] font-semibold text-foreground tabular-nums truncate">{value}</span>
    </div>
);

const PanelSection: React.FC<{ title: React.ReactNode; children: React.ReactNode }> = ({ title, children }) => (
    <div className="px-5 pt-5">
        <div className="text-xs font-semibold text-foreground mb-2">{title}</div>
        {children}
    </div>
);

const InterventionPanel: React.FC<{
    intervention: MapIntervention;
    trees: MapTree[];
    isLoading?: boolean;
    projectUid: string;
    siteName?: string | null;
    onClose: () => void;
    onSelectTree: (tree: MapTree) => void;
}> = ({ intervention, trees, isLoading = false, projectUid, siteName, onClose, onSelectTree }) => {
    // No "supporting donations" list here: which donations paid for a given
    // intervention is TTC's data, and TreeMapper deliberately keeps no
    // per-intervention donor read, so there is nothing truthful to show.
    const centroidCoords = useMemo(() => {
        try {
            let c: any;
            if (intervention.centroid) {
                c = intervention.centroid.coordinates;
            } else if (intervention.location.type === 'Point') {
                c = intervention.location.coordinates;
            } else {
                c = turf.centroid(intervention.location as any).geometry.coordinates;
            }
            return { lat: c[1].toFixed(5), lng: c[0].toFixed(5) };
        } catch {
            return null;
        }
    }, [intervention]);

    // Health split and species, from the sample trees we have loaded.
    const health = useMemo(() => {
        const counts: Record<string, number> = {};
        trees.forEach(t => { counts[t.status] = (counts[t.status] ?? 0) + 1; });
        return TREE_STATUS_ORDER
            .map(s => ({ status: s, count: counts[s] ?? 0 }))
            .filter(h => h.count > 0);
    }, [trees]);

    const species = useMemo(() => {
        const counts: Record<string, number> = {};
        trees.forEach(t => {
            const name = t.speciesName || t.commonName;
            if (name) counts[name] = (counts[name] ?? 0) + 1;
        });
        return Object.entries(counts).sort((a, b) => b[1] - a[1]);
    }, [trees]);

    // Download the intervention geometry as a GeoJSON Feature, named by HID.
    const downloadGeoJSON = () => {
        const feature = {
            type: 'Feature',
            properties: {
                hid: intervention.hid,
                type: intervention.type,
                totalTreeCount: intervention.totalTreeCount ?? 0,
            },
            geometry: intervention.location,
        };
        const blob = new Blob([JSON.stringify(feature, null, 2)], { type: 'application/geo+json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${intervention.hid}.geojson`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    const isArea = intervention.location.type === 'Polygon' || intervention.location.type === 'MultiPolygon';

    return (
        <aside aria-label="Intervention details" className="w-full h-full bg-card text-card-foreground flex flex-col overflow-hidden">
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between gap-2 pl-5 pr-3 py-2.5 border-b border-border">
                <div className="flex items-center gap-1.5 min-w-0 text-xs font-medium text-muted-foreground">
                    <span className="truncate">Intervention · <span className="font-mono">{intervention.hid}</span></span>
                    <CopyButton value={intervention.hid} title="Copy HID" />
                </div>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={onClose}
                    aria-label="Close details"
                    className="text-muted-foreground shrink-0"
                >
                    <X className="w-4 h-4" />
                </Button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto pb-5">
                {/* Title */}
                <div className="px-5 pt-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2.5">
                        <TypeSwatch type={intervention.type} />
                        <h2 className="text-lg font-semibold leading-tight tracking-tight text-foreground">
                            {getInterventionLabel(intervention.type)}
                        </h2>
                    </div>
                    {siteName && <div className="text-[13px] text-muted-foreground">{siteName}</div>}
                    <div className="flex items-center gap-2">
                        <SyncStatus status={intervention.status} captureStatus={intervention.captureStatus} />
                        <span className="text-xs text-muted-foreground">
                            {intervention.status === 'planning' ? '' : intervention.captureStatus === 'complete' ? 'Synced' : 'Not synced'}
                        </span>
                    </div>
                </div>

                {/* Key facts */}
                <div className="grid grid-cols-2 gap-2 px-5 pt-4">
                    <PanelFact label="Start date" value={formatDate(intervention.interventionStartDate)} />
                    {isArea
                        ? <PanelFact label="Area" value={resolveArea(intervention)} />
                        : <PanelFact label="Coordinates" value={centroidCoords ? `${centroidCoords.lat}, ${centroidCoords.lng}` : '—'} />}
                    <PanelFact label="Trees" value={formatNum(intervention.totalTreeCount ?? 0)} />
                    <PanelFact label="Sample trees" value={formatNum(intervention.totalSampleTreeCount ?? trees.length)} />
                </div>

                {intervention.description && (
                    <PanelSection title="Description">
                        <p className="text-sm text-foreground">{intervention.description}</p>
                    </PanelSection>
                )}

                {/* Health split of the sample trees */}
                {!isLoading && health.length > 0 && (
                    <PanelSection title="Sample tree health">
                        <div className="flex h-2 overflow-hidden rounded gap-0.5" role="img" aria-label={health.map(h => `${h.status} ${h.count}`).join(', ')}>
                            {health.map(h => (
                                <div key={h.status} style={{ flex: h.count, backgroundColor: TREE_STATUS_COLORS[h.status] }} />
                            ))}
                        </div>
                        <div className="flex flex-wrap gap-x-3.5 gap-y-1 mt-2 text-xs text-muted-foreground">
                            {health.map(h => (
                                <span key={h.status} className="flex items-center gap-1.5 capitalize">
                                    <span className="size-2 rounded-full" style={{ backgroundColor: TREE_STATUS_COLORS[h.status] }} />
                                    {h.status} {formatNum(h.count)}
                                </span>
                            ))}
                        </div>
                    </PanelSection>
                )}

                {!isLoading && species.length > 0 && (
                    <PanelSection title="Species in sample">
                        <div>
                            {species.slice(0, 6).map(([name, count]) => (
                                <div key={name} className="flex items-center justify-between h-[30px] border-b border-muted text-[13px]">
                                    <span className="italic text-foreground truncate">{name}</span>
                                    <span className="text-muted-foreground tabular-nums">{formatNum(count)}</span>
                                </div>
                            ))}
                            {species.length > 6 && (
                                <div className="pt-1.5 text-xs text-muted-foreground">+{species.length - 6} more</div>
                            )}
                        </div>
                    </PanelSection>
                )}

                {/* Sample trees: compact grid. Full per-tree data lives on the
                    intervention page; this is a quick visual + drill-in. */}
                <PanelSection
                    title={<>Sample trees {!isLoading && (
                        <span className="text-muted-foreground font-normal">
                            ({intervention.totalSampleTreeCount && intervention.totalSampleTreeCount !== trees.length
                                ? `${formatNum(trees.length)} of ${formatNum(intervention.totalSampleTreeCount)}`
                                : formatNum(trees.length)})
                        </span>
                    )}</>}
                >
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                            <Loader2 className="w-6 h-6 animate-spin" strokeWidth={1.5} />
                            <span className="text-xs mt-2">Loading details...</span>
                        </div>
                    ) : trees.length === 0 ? (
                        <div className="flex items-center gap-1.5 py-1.5 text-xs text-muted-foreground">
                            <Trees className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                            No sample trees recorded
                        </div>
                    ) : (
                        <div className="grid grid-cols-4 gap-2">
                            {trees.map(tree => (
                                <TreeGridItem key={tree.id} tree={tree} onSelect={onSelectTree} />
                            ))}
                        </div>
                    )}
                </PanelSection>

                {/* Added by */}
                {intervention.owner?.displayName && (
                    <div className="flex items-center gap-2 px-5 pt-5">
                        <OwnerAvatar name={intervention.owner.displayName} image={intervention.owner.image} size={26} />
                        <div className="min-w-0">
                            <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <User className="w-3 h-3" /> Added by
                            </div>
                            <div className="text-sm text-foreground truncate">{intervention.owner.displayName}</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer actions, always visible */}
            <div className="shrink-0 border-t border-border px-5 py-3 flex gap-2">
                <Button asChild className="flex-1 h-10">
                    <Link href={`/project/${projectUid}/intervention?id=${intervention.uid}`}>
                        Open intervention
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </Button>
                <Button variant="outline" className="h-10" onClick={downloadGeoJSON} title="Download GeoJSON">
                    <Download className="w-4 h-4" />
                    GeoJSON
                </Button>
            </div>
        </aside>
    );
};

const DetailStat: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: React.ReactNode;
}> = ({ icon, label, value }) => (
    <div className="flex items-start gap-2">
        <div className="mt-0.5 text-muted-foreground shrink-0">{icon}</div>
        <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
            <div className="text-sm text-foreground truncate">{value}</div>
        </div>
    </div>
);

const TreeTooltip: React.FC<{
    tree: MapTree;
    onClose: () => void;
    isLoadingDetail?: boolean;
    records?: TreeRecord[];
    isLoadingRecords?: boolean;
    historyLoaded?: boolean;
    onLoadHistory?: () => void;
}> = ({ tree, onClose, isLoadingDetail = false, records = [], isLoadingRecords = false, historyLoaded = false, onLoadHistory }) => {
    const statusColor = getTreeStatusColor(tree.status);
    const treeImage = buildTreeImageUrl(tree);
    const speciesImage = buildSpeciesImageUrl(tree.speciesImage);
    const [treeImgError, setTreeImgError] = useState(false);
    const [speciesImgError, setSpeciesImgError] = useState(false);
    const [showFullImage, setShowFullImage] = useState(false);
    // Parallax: the photo moves at 40% of the scroll speed inside its clipped
    // banner, so the details slide up over it. Written straight to the DOM
    // (no re-render per scroll) and skipped when the user prefers less motion.
    const parallaxRef = useRef<HTMLDivElement>(null);
    const reduceMotion = useMemo(
        () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
        [],
    );
    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const el = parallaxRef.current;
        if (!el || reduceMotion) return;
        const y = Math.max(0, e.currentTarget.scrollTop);
        el.style.transform = `translate3d(0, ${y * 0.4}px, 0) scale(${1 + Math.min(y, 300) / 1500})`;
    }, [reduceMotion]);

    const showTreeImage = treeImage && !treeImgError;
    const showSpeciesImage = speciesImage && !speciesImgError;

    const height = formatHeight(tree.height);
    const width = formatWidth(tree.width);
    const coords = tree.location?.type === 'Point'
        ? `${tree.location.coordinates[1].toFixed(6)}, ${tree.location.coordinates[0].toFixed(6)}`
        : null;

    return (
        <div className="w-full h-full bg-card text-card-foreground flex flex-col overflow-hidden">
            {/* Back to intervention (fixed) */}
            <button
                onClick={onClose}
                className="shrink-0 flex items-center gap-1.5 px-3 py-2 border-b border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to intervention
            </button>

            <div
                className="overflow-y-auto flex-1 min-h-0 overscroll-contain"
                onWheel={(e) => e.stopPropagation()}
                onScroll={handleScroll}
                style={{ scrollbarWidth: 'thin', scrollbarColor: '#e5e7eb transparent' }}
            >
                {/* Photo banner. 4:3, so most field photos keep their framing.
                    The whole photo is shown (contain) over a blurred copy of
                    itself, so portrait shots never get cropped or leave grey bars. */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                    {showTreeImage ? (
                        <button
                            type="button"
                            onClick={() => setShowFullImage(true)}
                            aria-label="Open full photo"
                            className="group absolute inset-0 block cursor-zoom-in"
                        >
                            <div ref={parallaxRef} className="absolute inset-0 will-change-transform">
                                <img
                                    src={treeImage as string}
                                    alt=""
                                    aria-hidden="true"
                                    className="absolute inset-0 w-full h-full object-cover scale-125 blur-2xl opacity-70"
                                />
                                <img
                                    src={treeImage as string}
                                    alt={tree.tag || tree.hid}
                                    className="absolute inset-0 w-full h-full object-contain"
                                    onError={() => setTreeImgError(true)}
                                />
                            </div>
                            <span className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                            <span className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                <Maximize2 className="w-3.5 h-3.5" />
                            </span>
                        </button>
                    ) : isLoadingDetail ? (
                        <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                            <Loader2 className="w-7 h-7 animate-spin" strokeWidth={1.5} />
                            <span className="text-xs mt-1.5">Loading photo...</span>
                        </div>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/50">
                            <Trees className="w-9 h-9" strokeWidth={1.5} />
                            <span className="text-xs mt-1 text-muted-foreground">No tree photo</span>
                        </div>
                    )}

                    {/* Status badge */}
                    <div
                        className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize backdrop-blur-sm bg-white/90 text-zinc-900"
                    >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColor }} />
                        {tree.status}
                    </div>
                </div>

                {/* Title */}
                <div className="px-4 pt-2.5 pb-2.5 border-b border-border">
                    <div className="font-semibold text-foreground leading-tight">{tree.tag || tree.hid}</div>
                    <div className="flex items-center gap-2 mt-1">
                        {tree.tag && <span className="font-mono text-xs text-muted-foreground">{tree.hid}</span>}
                        <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded capitalize">
                            {tree.treeType}
                        </span>
                    </div>
                </div>

                {/* Species */}
                {(tree.speciesName || tree.commonName) && (
                    <div className="px-4 py-2.5 border-b border-border flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-primary/10 flex items-center justify-center">
                            {showSpeciesImage ? (
                                <img
                                    src={speciesImage as string}
                                    alt={tree.speciesName || ''}
                                    className="w-full h-full object-cover"
                                    onError={() => setSpeciesImgError(true)}
                                />
                            ) : (
                                <Trees className="w-5 h-5 text-primary" strokeWidth={1.5} />
                            )}
                        </div>
                        <div className="min-w-0">
                            {tree.speciesName && (
                                <div className="text-sm font-medium text-foreground truncate">{tree.speciesName}</div>
                            )}
                            {tree.commonName && (
                                <div className="text-xs text-muted-foreground truncate">{tree.commonName}</div>
                            )}
                            {tree.speciesFamily && (
                                <div className="text-[11px] text-muted-foreground truncate">{tree.speciesFamily}</div>
                            )}
                        </div>
                    </div>
                )}

                {/* Details grid */}
                <div className="px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-2.5">
                    {height && (
                        <DetailStat icon={<Ruler className="w-4 h-4" />} label="Height" value={height} />
                    )}
                    {width && (
                        <DetailStat icon={<Ruler className="w-4 h-4 rotate-90" />} label="Diameter" value={width} />
                    )}
                    {tree.currentHealthScore != null && (
                        <DetailStat
                            icon={<Heart className="w-4 h-4" />}
                            label="Health"
                            value={`${tree.currentHealthScore}/100`}
                        />
                    )}
                    {tree.plantingDate && (
                        <DetailStat
                            icon={<Calendar className="w-4 h-4" />}
                            label="Planted"
                            value={formatDate(tree.plantingDate)}
                        />
                    )}
                    {tree.lastMeasurementDate && (
                        <DetailStat
                            icon={<Activity className="w-4 h-4" />}
                            label="Last measured"
                            value={formatDate(tree.lastMeasurementDate)}
                        />
                    )}
                    {coords && (
                        <div className="col-span-2 flex items-start gap-2">
                            <div className="mt-0.5 text-muted-foreground shrink-0"><MapPin className="w-4 h-4" /></div>
                            <div className="min-w-0 flex-1">
                                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Coordinates</div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-foreground truncate">{coords}</span>
                                    <CopyButton value={coords} title="Copy coordinates" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* History — record timeline, loaded on demand */}
                <div className="px-4 pb-3 border-t border-border pt-2.5">
                    <div className="text-sm font-medium text-foreground flex items-center gap-1.5 mb-2.5">
                        <History className="w-4 h-4 text-muted-foreground" />
                        History
                        {historyLoaded && !isLoadingRecords && <span className="text-muted-foreground font-normal">({records.length})</span>}
                    </div>

                    {isLoadingRecords ? (
                        <div className="flex items-center gap-2 py-1 text-muted-foreground">
                            <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
                            <span className="text-xs">Loading history...</span>
                        </div>
                    ) : !historyLoaded ? (
                        <Button variant="outline" size="sm" className="w-full" onClick={onLoadHistory}>
                            Show history
                        </Button>
                    ) : records.length === 0 ? (
                        <div className="text-xs text-muted-foreground py-0.5">No history yet</div>
                    ) : (
                        <ol className="relative border-l border-border ml-1.5 space-y-3">
                            {records.map(rec => {
                                const recH = formatHeight(rec.height);
                                const recW = formatWidth(rec.width);
                                const statusChanged = rec.newStatus && rec.newStatus !== rec.previousStatus;
                                return (
                                    <li key={rec.id} className="ml-4">
                                        <span
                                            className="absolute -left-[5px] w-2.5 h-2.5 rounded-full ring-2 ring-card"
                                            style={{ backgroundColor: getTreeStatusColor(rec.newStatus || '') }}
                                        />
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs font-medium text-foreground capitalize">
                                                {rec.recordType?.replace(/_/g, ' ') || 'Record'}
                                            </span>
                                            {rec.recordedAt && (
                                                <span className="text-[11px] text-muted-foreground">{formatDate(rec.recordedAt)}</span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-[11px] text-muted-foreground">
                                            {recH && <span className="inline-flex items-center gap-0.5"><Ruler className="w-3 h-3" /> {recH}</span>}
                                            {recW && <span>⌀ {recW}</span>}
                                            {statusChanged && (
                                                <span className="inline-flex items-center gap-1 capitalize">
                                                    {rec.previousStatus || '—'}
                                                    <ArrowRight className="w-3 h-3" />
                                                    {rec.newStatus}
                                                </span>
                                            )}
                                        </div>
                                        {rec.statusReason && (
                                            <div className="text-[11px] text-muted-foreground mt-0.5">Reason: {rec.statusReason}</div>
                                        )}
                                        {rec.notes && (
                                            <div className="text-[11px] text-muted-foreground mt-0.5">{rec.notes}</div>
                                        )}
                                        {rec.recordedByName && (
                                            <div className="text-[11px] text-muted-foreground mt-0.5">by {rec.recordedByName}</div>
                                        )}
                                    </li>
                                );
                            })}
                        </ol>
                    )}
                </div>
            </div>

            {showTreeImage && (
                <Dialog open={showFullImage} onOpenChange={setShowFullImage}>
                    <DialogContent className="max-w-4xl w-full p-2 bg-transparent ring-0 sm:max-w-4xl">
                        <DialogTitle className="sr-only">{tree.tag || tree.hid} photo</DialogTitle>
                        <img
                            src={treeImage as string}
                            alt={tree.tag || tree.hid}
                            className="w-full max-h-[85vh] object-contain rounded-lg"
                        />
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};

// All site + intervention map layers. Their paint/layout is static except for
// `hasSelection` (none vs some selected) and the basemap: selection and hover
// of a single feature are conveyed through feature-state (set imperatively on
// the map), NOT through React state. Wrapping them in React.memo keeps the
// rendered <Source>/<Layer> elements referentially identical across selection
// re-renders, so react-map-gl skips reconciliation and shapes never blink.
//
// Style rules (see the "Map style rules" design board):
// - Polygons: light fill (24%) + thin stroke in the intervention color, on a
//   soft dark casing so every color reads on satellite. No blur.
// - Hover: stronger fill (40%) and a thicker stroke.
// - Selected: white halo + 2.5px stroke. Everything else dims to 40%.
// - Sites: white dashed line on a soft dark casing; names are HTML chips.
const fillOpacity = (hasSelection: boolean): any => [
    'case',
    ['boolean', ['feature-state', 'selected'], false], 0.30,
    ['boolean', ['feature-state', 'hover'], false], 0.40,
    hasSelection ? 0.07 : 0.24,
];

const StaticMapLayers: React.FC<{
    showSiteBoundaries: boolean;
    sites: SiteFeatureCollection;
    siteMask: GeoJSON.Feature | null;
    polygonGeoJSON: GeoJSON.FeatureCollection;
    centroidGeoJSON: GeoJSON.FeatureCollection;
    pointGeoJSON: GeoJSON.FeatureCollection;
    hasSelection: boolean;
}> = React.memo(({ showSiteBoundaries, sites, siteMask, polygonGeoJSON, centroidGeoJSON, pointGeoJSON, hasSelection }) => (
    <>
        {/* Site boundaries, under the interventions */}
        {showSiteBoundaries && sites.features.length > 0 && (
            <Source id="site-boundaries" type="geojson" data={sites}>
                <Layer
                    id="site-boundaries-casing"
                    type="line"
                    paint={{ 'line-color': CASING_COLOR, 'line-width': 4, 'line-opacity': 0.35 }}
                    layout={{ 'line-join': 'round' }}
                />
                <Layer
                    id="site-boundaries-outline"
                    type="line"
                    paint={{
                        'line-color': SITE_BOUNDARY_COLOR,
                        'line-width': 1.5,
                        'line-dasharray': [5, 3.5],
                    }}
                    layout={{ 'line-join': 'round' }}
                />
            </Source>
        )}

        {/* Intervention polygons, visible from zoom 9 */}
        {polygonGeoJSON.features.length > 0 && (
            <Source id="interventions-polygons" type="geojson" data={polygonGeoJSON}>
                <Layer
                    id="interventions-polygons-fill"
                    type="fill"
                    minzoom={9}
                    paint={{ 'fill-color': ['get', 'color'], 'fill-opacity': fillOpacity(hasSelection) }}
                />
                {/* Soft dark casing (default/hover) or a darker rim under the
                    white halo (selected). Hidden on dimmed shapes. */}
                <Layer
                    id="interventions-polygons-casing"
                    type="line"
                    minzoom={9}
                    layout={{ 'line-join': 'round' }}
                    paint={{
                        'line-color': CASING_COLOR,
                        'line-width': [
                            'case',
                            ['boolean', ['feature-state', 'selected'], false], 8,
                            ['boolean', ['feature-state', 'hover'], false], 4.5,
                            3.5,
                        ],
                        'line-opacity': [
                            'case',
                            ['boolean', ['feature-state', 'selected'], false], 0.35,
                            ['boolean', ['feature-state', 'hover'], false], 0.55,
                            hasSelection ? 0 : 0.5,
                        ],
                    }}
                />
                {/* White halo, selected only */}
                <Layer
                    id="interventions-polygons-halo"
                    type="line"
                    minzoom={9}
                    layout={{ 'line-join': 'round' }}
                    paint={{
                        'line-color': HALO_COLOR,
                        'line-width': 5.5,
                        'line-opacity': ['case', ['boolean', ['feature-state', 'selected'], false], 1, 0],
                    }}
                />
                {/* Colored stroke */}
                <Layer
                    id="interventions-polygons-outline"
                    type="line"
                    minzoom={9}
                    layout={{ 'line-join': 'round' }}
                    paint={{
                        'line-color': ['get', 'color'],
                        'line-width': [
                            'case',
                            ['boolean', ['feature-state', 'selected'], false], 2.5,
                            ['boolean', ['feature-state', 'hover'], false], 2.5,
                            hasSelection ? 1.25 : 1.75,
                        ],
                        'line-opacity': [
                            'case',
                            ['boolean', ['feature-state', 'selected'], false], 1,
                            ['boolean', ['feature-state', 'hover'], false], 1,
                            hasSelection ? 0.4 : 1,
                        ],
                    }}
                />
            </Source>
        )}

        {/* Polygon centroids as small colored dots at low zoom */}
        {centroidGeoJSON.features.length > 0 && (
            <Source id="interventions-centroids" type="geojson" data={centroidGeoJSON}>
                <Layer
                    id="interventions-centroids-circle"
                    type="circle"
                    maxzoom={9}
                    paint={{
                        'circle-color': ['get', 'color'],
                        'circle-radius': ['interpolate', ['linear'], ['zoom'], 0, 4, 6, 5, 9, 7],
                        'circle-opacity': hasSelection ? 0.5 : 1,
                        'circle-stroke-width': ['case', ['boolean', ['feature-state', 'hover'], false], 2.5, 1.75],
                        'circle-stroke-color': HALO_COLOR,
                    }}
                />
            </Source>
        )}

        {/* Dim everything outside the picked site, so the eye stays inside it.
            Drawn above polygons so shapes outside the site dim too. */}
        {siteMask && (
            <Source id="site-mask" type="geojson" data={siteMask}>
                <Layer id="site-mask-fill" type="fill" paint={{ 'fill-color': '#000000', 'fill-opacity': 0.3 }} />
            </Source>
        )}

        {/* Point interventions. Clusters are drawn as HTML markers (see
            ClusterMarkers); this layer draws single points only. */}
        {pointGeoJSON.features.length > 0 && (
            <Source
                id="interventions-points"
                type="geojson"
                data={pointGeoJSON}
                cluster={true}
                clusterMaxZoom={14}
                clusterRadius={50}
                clusterProperties={{ totalTreeCount: ['+', ['get', 'totalTreeCount']] }}
            >
                <Layer
                    id="interventions-points-circle"
                    type="circle"
                    filter={['!', ['has', 'point_count']]}
                    paint={{
                        'circle-color': ['get', 'color'],
                        'circle-radius': [
                            'case',
                            ['boolean', ['feature-state', 'selected'], false], 8,
                            ['boolean', ['feature-state', 'hover'], false], 7,
                            5.5,
                        ],
                        'circle-stroke-width': ['case', ['boolean', ['feature-state', 'selected'], false], 3, 2],
                        'circle-stroke-color': HALO_COLOR,
                        'circle-opacity': [
                            'case',
                            ['boolean', ['feature-state', 'selected'], false], 1,
                            hasSelection ? 0.45 : 1,
                        ],
                        'circle-stroke-opacity': [
                            'case',
                            ['boolean', ['feature-state', 'selected'], false], 1,
                            hasSelection ? 0.45 : 1,
                        ],
                    }}
                />
            </Source>
        )}
    </>
));
StaticMapLayers.displayName = 'StaticMapLayers';

// A cluster of point interventions, as read from the clustered source.
interface ClusterInfo { id: number; lng: number; lat: number; count: number; trees: number }

// Dark round cluster with the total tree count. HTML, so it needs no map
// glyphs and matches the dashboard type. Three sizes: <100, <1,000, 1,000+.
const ClusterBubble: React.FC<{ cluster: ClusterInfo; onClick: () => void }> = ({ cluster, onClick }) => {
    const value = cluster.trees > 0 ? cluster.trees : cluster.count;
    const size = value >= 1000 ? 52 : value >= 100 ? 44 : 36;
    return (
        <button
            type="button"
            onClick={e => { e.stopPropagation(); onClick(); }}
            aria-label={`${formatNum(value)} ${cluster.trees > 0 ? 'trees' : 'interventions'}. Zoom in`}
            title={`${formatNum(cluster.count)} interventions · ${formatNum(cluster.trees)} trees`}
            className="flex items-center justify-center rounded-full text-white font-semibold tabular-nums shadow-md ring-2 ring-white/90 transition-transform hover:scale-105 cursor-pointer"
            style={{ width: size, height: size, backgroundColor: `${CLUSTER_COLOR}D1`, fontSize: size >= 44 ? 12 : 11 }}
        >
            {formatCompact(value)}
        </button>
    );
};

// One name chip per site, sitting just above the site's top edge.
const SiteLabel: React.FC<{ name: string; active: boolean; onClick: () => void }> = ({ name, active, onClick }) => (
    <button
        type="button"
        onClick={e => { e.stopPropagation(); onClick(); }}
        className={cn(
            'h-[26px] px-2.5 rounded-full text-xs font-semibold whitespace-nowrap shadow-[0_1px_3px_rgba(0,0,0,0.25)] cursor-pointer transition-colors',
            active ? 'bg-foreground text-background' : 'bg-white/95 text-zinc-950 hover:bg-white',
        )}
    >
        {name}
    </button>
);

// ==================== MAIN COMPONENT ====================
const ProjectMap: React.FC<{
    projectId: string;
    token: string;
    /** Optional overlay rendered at the map's top-right (e.g. the live-activity toggle). */
    mapTopRight?: React.ReactNode;
}> = ({ projectId, token, mapTopRight }) => {
    const [interventions, setInterventions] = useState<MapIntervention[]>([]);
    const [trees, setTrees] = useState<MapTree[]>([]);
    const [sites, setSites] = useState<SiteFeatureCollection>({ type: 'FeatureCollection', features: [] });
    const [showSiteBoundaries, setShowSiteBoundaries] = useState(true);
    const [basemap, setBasemap] = useState<BasemapKey>('satellite');
    const [selectedSiteId, setSelectedSiteId] = useState<number | null>(null);
    const [bounds, setBounds] = useState<ProjectMapBounds | null>(null);
    const [hidSearch, setHidSearch] = useState('');
    // Legend filter + date filter.
    const [hiddenTypes, setHiddenTypes] = useState<Set<string>>(() => new Set());
    const [dateRange, setDateRange] = useState<MapDateRange | null>(null);
    const [legendOpen, setLegendOpen] = useState(true);
    // Interventions list on the left. Collapsible; the choice is remembered
    // in this browser.
    const [sidebarOpen, setSidebarOpen] = useState(true);
    useEffect(() => {
        try {
            if (window.localStorage.getItem('overview-map-list-open') === 'false') setSidebarOpen(false);
        } catch { /* storage unavailable */ }
    }, []);
    const toggleSidebar = useCallback((open: boolean) => {
        setSidebarOpen(open);
        try { window.localStorage.setItem('overview-map-list-open', String(open)); } catch { /* storage unavailable */ }
    }, []);
    // HTML cluster bubbles, read from the clustered source after each move.
    const [clusters, setClusters] = useState<ClusterInfo[]>([]);
    // Hover tooltip: the id lives in state (changes rarely); the position is
    // written straight to the DOM on mouse move so hovering never re-renders.
    const [hoveredId, setHoveredId] = useState<number | null>(null);
    const [hoverPointer, setHoverPointer] = useState(false);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const lastPointRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    // Full screen covers the whole map view (list + map + detail pane), not
    // only the map, so the list and details stay usable.
    const fullscreenRef = useRef<HTMLDivElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [mapState, setMapState] = useState<MapState>({
        selectedInterventionId: null,
        selectedTreeId: null,
        showTreeDetails: false,
    });
    const hoveredFeatureRef = React.useRef<{ source: string; id: number | string } | null>(null);
    const prevSelectedIdRef = React.useRef<number | null>(null);
    // Whether the right detail pane was already open on the previous selection.
    // Used to decide if camera framing must wait for the open/resize animation.
    const paneWasOpenRef = React.useRef(false);
    // Tree ids whose full detail has already been fetched, so a re-click does
    // not refetch.
    const detailedTreeIdsRef = React.useRef<Set<number>>(new Set());
    const [isLoadingTreeDetail, setIsLoadingTreeDetail] = useState(false);
    // Remeasurement / status records for the currently open tree, keyed by tree
    // id so a stale fetch from a previous tree never shows under the new one.
    const [treeRecords, setTreeRecords] = useState<{ treeId: number; records: TreeRecord[] } | null>(null);
    const [isLoadingRecords, setIsLoadingRecords] = useState(false);
    // Full intervention detail (intervention + owner + trees) fetched on select,
    // and the loading flag that drives the panel loader.
    const [detail, setDetail] = useState<InterventionDetailResponse | null>(null);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    const mapRef = useRef<any>(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<MapError | null>(null);

    const loadInterventions = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await fetchProjectInterventions(projectId, token);
            const loaded = response.data.interventions;
            setInterventions(loaded);
            setBounds(response.data.bounds);
        } catch (err: any) {
            setError({
                type: 'network',
                message: err?.message || 'Failed to load interventions',
                details: err,
                recoverable: true,
            });
        } finally {
            setIsLoading(false);
        }
    }, [projectId, token]);

    useEffect(() => { loadInterventions(); }, [loadInterventions]);

    const loadSites = useCallback(async () => {
        try {
            const collection = await fetchProjectSites(projectId, token);
            setSites(collection);
        } catch (err) {
            // Boundaries are supplementary; never block the map on a sites failure.
            console.warn('Failed to load site boundaries:', err);
        }
    }, [projectId, token]);

    const fitProject = useCallback(() => {
        if (!bounds) return;
        try {
            mapRef.current?.fitBounds(bounds.bounds, {
                padding: { top: 80, bottom: 80, left: 80, right: 80 },
                duration: 1000,
                maxZoom: 15,
            });
        } catch { /* ignore */ }
    }, [bounds]);

    const handleSelectSite = useCallback((id: number | null) => {
        setSelectedSiteId(id);
        if (id == null) { fitProject(); return; }
        const site = sites.features.find(s => s.id === id);
        if (!site) return;
        try {
            const [minLng, minLat, maxLng, maxLat] = turf.bbox(site.geometry as any);
            mapRef.current?.fitBounds([minLng, minLat, maxLng, maxLat], {
                padding: { top: 80, bottom: 80, left: 80, right: 80 },
                duration: 1000,
                maxZoom: 16,
            });
        } catch { /* ignore */ }
    }, [sites.features, fitProject]);

    useEffect(() => { loadSites(); }, [loadSites]);

    useEffect(() => {
        if (mapLoaded && bounds && interventions.length > 0) {
            try {
                mapRef.current?.fitBounds(bounds.bounds, {
                    padding: { top: 80, bottom: 80, left: 80, right: 80 },
                    duration: 1500,
                    maxZoom: 15,
                });
            } catch { /* ignore */ }
        }
    }, [mapLoaded, bounds, interventions.length]);

    // Interventions inside the date range (start date). The overview already
    // receives only public, approved interventions from the server.
    const datedInterventions = useMemo(() => {
        if (!dateRange) return interventions;
        const from = dateRange.from.getTime();
        const to = dateRange.to.getTime();
        return interventions.filter(i => {
            const t = new Date(i.interventionStartDate).getTime();
            return isFinite(t) && t >= from && t <= to;
        });
    }, [interventions, dateRange]);

    // Legend rows: the types this project uses, most common first, counted
    // inside the date range.
    const typeCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        interventions.forEach(i => { counts[i.type] = 0; });
        datedInterventions.forEach(i => { counts[i.type] = (counts[i.type] ?? 0) + 1; });
        return Object.entries(counts)
            .map(([type, count]) => ({ type, count }))
            .sort((a, b) => b.count - a.count || getInterventionLabel(a.type).localeCompare(getInterventionLabel(b.type)));
    }, [interventions, datedInterventions]);

    const toggleType = useCallback((type: string) => {
        setHiddenTypes(prev => {
            const next = new Set(prev);
            if (next.has(type)) next.delete(type); else next.add(type);
            return next;
        });
    }, []);

    // Interventions after date, legend and HID filters. Drives the map and the list.
    const filteredInterventions = useMemo(() => {
        const q = hidSearch.toLowerCase();
        const base = datedInterventions.filter(i =>
            !hiddenTypes.has(i.type) && (!q || i.hid.toLowerCase().includes(q)),
        );
        // Recent first: most recently registered interventions at the top.
        return [...base].sort(
            (a, b) => new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime(),
        );
    }, [datedInterventions, hiddenTypes, hidSearch]);

    const polygonGeoJSON = useMemo(() => ({
        type: 'FeatureCollection' as const,
        features: filteredInterventions
            .filter(i => i.location.type === 'Polygon' || i.location.type === 'MultiPolygon')
            .map(i => ({
                type: 'Feature' as const,
                id: i.id,
                properties: {
                    id: i.id,
                    hid: i.hid,
                    color: getInterventionColor(i.type),
                },
                geometry: i.location,
            })),
    }), [filteredInterventions]);

    const pointGeoJSON = useMemo(() => ({
        type: 'FeatureCollection' as const,
        features: filteredInterventions
            .filter(i => i.location.type === 'Point')
            .map(i => ({
                type: 'Feature' as const,
                id: i.id,
                properties: {
                    id: i.id,
                    hid: i.hid,
                    color: getInterventionColor(i.type),
                    totalTreeCount: i.totalTreeCount ?? 0,
                },
                geometry: i.location,
            })),
    }), [filteredInterventions]);

    // Centroid dots for polygons at low zoom
    const centroidGeoJSON = useMemo(() => ({
        type: 'FeatureCollection' as const,
        features: filteredInterventions
            .filter(i => i.location.type === 'Polygon' || i.location.type === 'MultiPolygon')
            .map(i => {
                const c = i.centroid ?? turf.centroid(i.location as any).geometry;
                return {
                    type: 'Feature' as const,
                    id: i.id,
                    properties: { id: i.id, hid: i.hid, color: getInterventionColor(i.type) },
                    geometry: { type: 'Point' as const, coordinates: (c as any).coordinates },
                };
            }),
    }), [filteredInterventions]);

    // World-minus-site polygon, used to dim everything outside the picked site.
    const siteMask = useMemo(() => {
        if (selectedSiteId == null) return null;
        const site = sites.features.find(s => s.id === selectedSiteId);
        if (!site) return null;
        try {
            return turf.mask(turf.feature(site.geometry) as any) as GeoJSON.Feature;
        } catch {
            return null;
        }
    }, [selectedSiteId, sites.features]);

    // Site name chips, placed above each site's top edge.
    const siteLabels = useMemo(() => sites.features
        .map(s => ({ id: s.id, name: s.properties.name, point: getSiteLabelPoint(s.geometry) }))
        .filter((l): l is { id: number; name: string; point: [number, number] } => !!l.point && !!l.name),
    [sites.features]);

    const siteNameOf = useCallback((intervention: MapIntervention): string | null => {
        try {
            const pt = turf.point(getMarkerPosition(intervention));
            const site = sites.features.find(s => turf.booleanPointInPolygon(pt, s.geometry as any));
            return site?.properties.name ?? null;
        } catch {
            return null;
        }
    }, [sites.features]);

    // Read clusters from the clustered source, deduped by cluster id. Only
    // updates state when the set of clusters really changed.
    const clusterKeyRef = useRef('');
    const updateClusters = useCallback(() => {
        const map = mapRef.current?.getMap?.() ?? mapRef.current;
        if (!map?.getSource?.('interventions-points')) {
            if (clusterKeyRef.current !== '') { clusterKeyRef.current = ''; setClusters([]); }
            return;
        }
        try {
            const feats = map.querySourceFeatures('interventions-points', { filter: ['has', 'point_count'] });
            const seen: Record<number, ClusterInfo> = {};
            feats.forEach((f: any) => {
                const id = f.properties?.cluster_id;
                if (id == null || seen[id]) return;
                const [lng, lat] = f.geometry.coordinates;
                seen[id] = { id, lng, lat, count: f.properties.point_count ?? 0, trees: f.properties.totalTreeCount ?? 0 };
            });
            const list = Object.values(seen);
            const key = list.map(c => `${c.id}:${c.count}`).sort().join('|');
            if (key !== clusterKeyRef.current) {
                clusterKeyRef.current = key;
                setClusters(list);
            }
        } catch { /* source not ready */ }
    }, []);

    useEffect(() => {
        if (!mapLoaded) return;
        const map = mapRef.current?.getMap?.() ?? mapRef.current;
        if (!map?.on) return;
        const onSourceData = (e: any) => {
            if (e.sourceId === 'interventions-points' && e.isSourceLoaded) updateClusters();
        };
        map.on('moveend', updateClusters);
        map.on('sourcedata', onSourceData);
        updateClusters();
        return () => {
            map.off?.('moveend', updateClusters);
            map.off?.('sourcedata', onSourceData);
        };
    }, [mapLoaded, updateClusters, pointGeoJSON]);

    const expandCluster = useCallback((cluster: ClusterInfo) => {
        const map = mapRef.current;
        const source = map?.getSource?.('interventions-points') as any;
        if (!source?.getClusterExpansionZoom) return;
        Promise.resolve(source.getClusterExpansionZoom(cluster.id))
            .then((zoom: number) => {
                map.easeTo({ center: [cluster.lng, cluster.lat], zoom: zoom + 0.5, duration: 500 });
            })
            .catch(() => {});
    }, []);

    const selectIntervention = useCallback((intervention: MapIntervention | null) => {
        const prevId = prevSelectedIdRef.current;
        const map = mapRef.current;
        if (!intervention) {
            setMapState(s => ({ ...s, selectedInterventionId: null, selectedTreeId: null, showTreeDetails: false }));
            setTrees([]);
            try {
                if (prevId != null && map) {
                    map.setFeatureState({ source: 'interventions-points', id: prevId }, { selected: false });
                    map.setFeatureState({ source: 'interventions-polygons', id: prevId }, { selected: false });
                }
                prevSelectedIdRef.current = null;
            } catch { /* ignore */ }
            return;
        }
        setMapState(s => ({ ...s, selectedInterventionId: intervention.id, selectedTreeId: null, showTreeDetails: false }));
        // Camera framing is handled by an effect once the right pane has opened
        // and the map has resized, so the target stays centred in the visible map.
        try {
            if (prevId != null && map) {
                map.setFeatureState({ source: 'interventions-points', id: prevId }, { selected: false });
                map.setFeatureState({ source: 'interventions-polygons', id: prevId }, { selected: false });
            }
            if (map) {
                map.setFeatureState({ source: 'interventions-points', id: intervention.id }, { selected: true });
                map.setFeatureState({ source: 'interventions-polygons', id: intervention.id }, { selected: true });
            }
            prevSelectedIdRef.current = intervention.id;
        } catch { /* ignore */ }
    }, []);

    // If the selected intervention gets filtered out (legend or date), close it.
    useEffect(() => {
        const id = mapState.selectedInterventionId;
        if (id != null && !filteredInterventions.some(i => i.id === id)) selectIntervention(null);
    }, [filteredInterventions, mapState.selectedInterventionId, selectIntervention]);

    // Re-apply the selected feature-state after a filter or basemap change
    // re-creates the sources (feature-state does not survive that).
    useEffect(() => {
        const map = mapRef.current;
        const id = mapState.selectedInterventionId;
        if (!map || !mapLoaded || id == null) return;
        const t = setTimeout(() => {
            try {
                if (map.getSource('interventions-points')) map.setFeatureState({ source: 'interventions-points', id }, { selected: true });
                if (map.getSource('interventions-polygons')) map.setFeatureState({ source: 'interventions-polygons', id }, { selected: true });
            } catch { /* ignore */ }
        }, 50);
        return () => clearTimeout(t);
    }, [polygonGeoJSON, pointGeoJSON, basemap, mapLoaded, mapState.selectedInterventionId]);

    const handleMapLoad = useCallback(() => {
        setMapLoaded(true);
    }, []);

    const handleMapClick = useCallback((event: any) => {
        const feature = event.features?.[0];
        if (!feature) return;
        const layerId = feature.layer?.id;
        // Sample tree click: open the tree detail and recenter on it.
        if (layerId === 'trees-points-circle') {
            const treeId = feature.properties?.id;
            const tree = trees.find(t => t.id === treeId);
            if (!tree) return;
            setMapState(prev => ({ ...prev, selectedTreeId: tree.id, showTreeDetails: true }));
            if (tree.location?.type === 'Point') {
                const [lng, lat] = tree.location.coordinates as [number, number];
                if (isFinite(lng) && isFinite(lat)) {
                    mapRef.current?.easeTo({ center: [lng, lat], duration: 600 });
                }
            }
            return;
        }
        if (!feature.properties?.id) return;
        const intervention = interventions.find(i => i.id === feature.properties.id);
        if (!intervention) return;
        if (mapState.selectedInterventionId === intervention.id) {
            selectIntervention(null);
        } else {
            selectIntervention(intervention);
        }
    }, [interventions, trees, mapState.selectedInterventionId, selectIntervention]);

    const handleMouseMove = useCallback((event: any) => {
        lastPointRef.current = { x: event.point?.x ?? 0, y: event.point?.y ?? 0 };
        if (tooltipRef.current) {
            tooltipRef.current.style.transform = `translate(${lastPointRef.current.x + 14}px, ${lastPointRef.current.y + 14}px)`;
        }
        try {
            const map = mapRef.current;
            const feature = event.features?.[0];
            const prev = hoveredFeatureRef.current;
            if (feature && (feature.properties?.id ?? feature.id) != null) {
                const id = feature.properties?.id ?? feature.id;
                const source = feature.source || feature.layer?.source;
                if (prev && (prev.id !== id || prev.source !== source)) {
                    map?.setFeatureState({ source: prev.source, id: prev.id }, { hover: false });
                    hoveredFeatureRef.current = null;
                }
                if (!prev || prev.id !== id || prev.source !== source) {
                    map?.setFeatureState({ source, id }, { hover: true });
                    hoveredFeatureRef.current = { source, id };
                }
                const nextHover = INTERVENTION_SOURCES.has(source) ? Number(id) : null;
                setHoveredId(h => (h === nextHover ? h : nextHover));
                setHoverPointer(true);
            } else {
                if (prev) {
                    map?.setFeatureState({ source: prev.source, id: prev.id }, { hover: false });
                    hoveredFeatureRef.current = null;
                }
                setHoveredId(h => (h === null ? h : null));
                setHoverPointer(false);
            }
        } catch { /* ignore */ }
    }, []);

    const handleMouseLeave = useCallback(() => {
        try {
            const prev = hoveredFeatureRef.current;
            if (prev && mapRef.current) {
                mapRef.current.setFeatureState({ source: prev.source, id: prev.id }, { hover: false });
                hoveredFeatureRef.current = null;
            }
        } catch { /* ignore */ }
        setHoveredId(null);
        setHoverPointer(false);
    }, []);

    const hoveredIntervention = useMemo(
        () => (hoveredId == null ? undefined : interventions.find(i => i.id === hoveredId)),
        [interventions, hoveredId],
    );

    const selectedIntervention = useMemo(
        () => interventions.find(i => i.id === mapState.selectedInterventionId),
        [interventions, mapState.selectedInterventionId],
    );

    // Frame the selected intervention in the *visible* map. The right detail
    // pane is a grid column, so selecting shrinks the map's span; if we fit
    // before the grid reflows, the target drifts off-centre. When the pane is
    // opening (closed -> open) we wait a beat for the reflow + canvas resize;
    // when it is already open we fit immediately.
    useEffect(() => {
        const map = mapRef.current;
        if (!selectedIntervention) { paneWasOpenRef.current = false; return; }
        if (!map || !mapLoaded) return;
        const wasOpen = paneWasOpenRef.current;
        paneWasOpenRef.current = true;
        const frame = () => {
            try { map.resize(); } catch { /* map not ready */ }
            zoomToIntervention(selectedIntervention, map);
        };
        if (wasOpen) { frame(); return; }
        const t = setTimeout(frame, 90);
        return () => clearTimeout(t);
    }, [mapState.selectedInterventionId, mapLoaded, selectedIntervention]);

    // A single point at the selected point intervention, driving the animated
    // "pulse" ring. Polygons are marked by their white halo instead.
    const selectedPulseGeoJSON = useMemo(() => {
        if (!selectedIntervention || selectedIntervention.location.type !== 'Point') {
            return { type: 'FeatureCollection' as const, features: [] };
        }
        const [lng, lat] = getMarkerPosition(selectedIntervention);
        if (!isFinite(lng) || !isFinite(lat)) {
            return { type: 'FeatureCollection' as const, features: [] };
        }
        return {
            type: 'FeatureCollection' as const,
            features: [{
                type: 'Feature' as const,
                geometry: { type: 'Point' as const, coordinates: [lng, lat] },
                properties: {},
            }],
        };
    }, [selectedIntervention]);

    const selectedTree = useMemo(
        () => trees.find(t => t.id === mapState.selectedTreeId),
        [trees, mapState.selectedTreeId],
    );

    // Sample trees as a clickable GeoJSON layer (more reliable + performant than
    // DOM markers). Colored by status; selection is driven by feature-state.
    const treesGeoJSON = useMemo(() => ({
        type: 'FeatureCollection' as const,
        features: trees
            .filter(t => t.location?.type === 'Point')
            .map(t => ({
                type: 'Feature' as const,
                id: t.id,
                properties: { id: t.id, color: getTreeStatusColor(t.status) },
                geometry: t.location,
            })),
    }), [trees]);

    // Keep the selected tree's feature-state in sync so the layer can highlight
    // it (bigger dot + white ring).
    const prevSelectedTreeIdRef = useRef<number | null>(null);
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        const prev = prevSelectedTreeIdRef.current;
        try {
            if (prev != null) map.setFeatureState({ source: 'trees-points', id: prev }, { selected: false });
            if (mapState.selectedTreeId != null) {
                map.setFeatureState({ source: 'trees-points', id: mapState.selectedTreeId }, { selected: true });
            }
        } catch { /* source not ready */ }
        prevSelectedTreeIdRef.current = mapState.selectedTreeId;
    }, [mapState.selectedTreeId, treesGeoJSON]);

    // When a tree marker is clicked, fetch its full detail once and merge the
    // result (resolved image, tag, species) back into the tree. The bulk list
    // often lacks the photo, so this is what makes the image appear.
    useEffect(() => {
        const id = mapState.selectedTreeId;
        if (id == null) return;
        const tree = trees.find(t => t.id === id);
        if (!tree || detailedTreeIdsRef.current.has(id)) return;

        detailedTreeIdsRef.current.add(id);
        let cancelled = false;
        (async () => {
            setIsLoadingTreeDetail(true);
            try {
                const detail = await fetchTreeDetail(tree.hid, projectId, token);
                if (!cancelled && detail) {
                    setTrees(prev => prev.map(t => (t.id === id ? { ...t, ...detail } : t)));
                }
            } catch (err) {
                console.warn('Failed to load tree detail:', err);
                // Allow a retry on the next click.
                detailedTreeIdsRef.current.delete(id);
            } finally {
                if (!cancelled) setIsLoadingTreeDetail(false);
            }
        })();
        return () => { cancelled = true; };
    }, [mapState.selectedTreeId, trees, projectId, token]);

    // Tree history (remeasurement records) is loaded on demand, not on select.
    // Reset it whenever the open tree changes so each tree starts collapsed.
    useEffect(() => {
        setTreeRecords(null);
        setIsLoadingRecords(false);
    }, [mapState.selectedTreeId]);

    // Fetch the selected tree's history when the user asks. Tagged with the tree
    // id so a slow response for an earlier tree never renders under a newer one.
    const loadTreeHistory = useCallback(async () => {
        const id = mapState.selectedTreeId;
        if (id == null) return;
        const tree = trees.find(t => t.id === id);
        if (!tree) return;
        setIsLoadingRecords(true);
        try {
            const records = await fetchTreeRecords(tree.hid, projectId, token);
            setTreeRecords({ treeId: id, records });
        } catch (err) {
            console.warn('Failed to load tree records:', err);
            setTreeRecords({ treeId: id, records: [] });
        } finally {
            setIsLoadingRecords(false);
        }
    }, [mapState.selectedTreeId, trees, projectId, token]);

    // When an intervention is selected (map or sidebar list), fetch its full
    // detail and plot its trees. A loader covers the panel while the call is in
    // flight. Clears when the selection is cleared.
    useEffect(() => {
        const id = mapState.selectedInterventionId;
        if (id == null) {
            setDetail(null);
            setIsLoadingDetail(false);
            return;
        }
        let cancelled = false;
        setIsLoadingDetail(true);
        setDetail(null);
        setTrees([]);
        detailedTreeIdsRef.current.clear();
        (async () => {
            try {
                const res = await fetchInterventionDetail(id, projectId, token);
                if (cancelled || !res) return;
                setDetail(res);
                setTrees(Array.isArray(res.trees) ? res.trees : []);
            } catch (err) {
                console.warn('Failed to load intervention detail:', err);
            } finally {
                if (!cancelled) setIsLoadingDetail(false);
            }
        })();
        return () => { cancelled = true; };
    }, [mapState.selectedInterventionId, projectId, token]);

    // Prefer the freshly fetched detail (richer: owner, resolved image) but fall
    // back to the bulk list item while the detail call is loading.
    const detailIntervention = detail?.intervention ?? selectedIntervention;
    const rightPaneOpen = !!detailIntervention;

    // The right detail pane is a grid column, so opening/closing it changes the
    // map's span (and width). maplibre tracks size via ResizeObserver, but nudge
    // a resize after the reflow so the canvas fills cleanly.
    useEffect(() => {
        const id = setTimeout(() => {
            try { mapRef.current?.resize(); } catch { /* map not ready */ }
        }, 90);
        return () => clearTimeout(id);
    }, [rightPaneOpen, sidebarOpen]);

    // The map gets narrow while the detail pane is open, so the legend folds
    // into a button then, and comes back as it was when the pane closes.
    const legendBeforePaneRef = useRef<boolean | null>(null);
    useEffect(() => {
        if (rightPaneOpen) {
            if (legendBeforePaneRef.current === null) {
                legendBeforePaneRef.current = legendOpen;
                setLegendOpen(false);
            }
        } else if (legendBeforePaneRef.current !== null) {
            setLegendOpen(legendBeforePaneRef.current);
            legendBeforePaneRef.current = null;
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rightPaneOpen]);

    // Animate a "pulse" ring on a selected point intervention.
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapLoaded || mapState.selectedInterventionId == null) return;
        let raf = 0;
        const start = performance.now();
        const PERIOD = 1500; // ms per pulse
        const animate = (now: number) => {
            const t = ((now - start) % PERIOD) / PERIOD; // 0 -> 1
            const radius = 10 + t * 26;
            const opacity = 0.8 * (1 - t);
            try {
                if (map.getLayer('selected-pulse-ring')) {
                    map.setPaintProperty('selected-pulse-ring', 'circle-radius', radius);
                    map.setPaintProperty('selected-pulse-ring', 'circle-stroke-opacity', opacity);
                }
            } catch { /* layer not ready yet */ }
            raf = requestAnimationFrame(animate);
        };
        raf = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(raf);
    }, [mapLoaded, mapState.selectedInterventionId]);

    // Full screen for the map card.
    useEffect(() => {
        const onChange = () => {
            setIsFullscreen(document.fullscreenElement === fullscreenRef.current);
            setTimeout(() => { try { mapRef.current?.resize(); } catch { /* ignore */ } }, 50);
        };
        document.addEventListener('fullscreenchange', onChange);
        return () => document.removeEventListener('fullscreenchange', onChange);
    }, []);

    const toggleFullscreen = useCallback(() => {
        try {
            if (document.fullscreenElement) document.exitFullscreen();
            else fullscreenRef.current?.requestFullscreen?.();
        } catch { /* fullscreen not allowed */ }
    }, []);

    if (isLoading) {
        return (
            <div className="relative w-full h-screen">
                <LoadingDisplay message="Loading interventions..." />
            </div>
        );
    }

    if (error && !error.recoverable) {
        return (
            <div className="w-full h-screen flex items-center justify-center bg-muted">
                <div className="text-center max-w-sm">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                    <h2 className="text-lg font-semibold text-foreground mb-2">Unable to load map</h2>
                    <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="text-white px-4 py-2 rounded-lg text-sm transition-opacity hover:opacity-90"
                        style={{ backgroundColor: '#007A49' }}
                    >
                        Reload
                    </button>
                </div>
            </div>
        );
    }

    return (
        // 4-column grid mirroring the stat-card grid above, so the left list and
        // right detail card line up exactly with the stat cards. Left = 1 col,
        // map = 2 or 3 cols, right detail = 1 col when open.
        <div
            ref={fullscreenRef}
            className={cn('w-full h-full grid grid-cols-4 grid-rows-1 gap-3', isFullscreen && 'bg-background p-3')}
        >
            {/* Left: interventions list (search + scrollable list) */}
            {sidebarOpen && (
                <InterventionSidebar
                    interventions={filteredInterventions}
                    selectedId={mapState.selectedInterventionId}
                    onSelect={selectIntervention}
                    hidSearch={hidSearch}
                    onHidSearch={setHidSearch}
                    total={interventions.length}
                    onCollapse={() => toggleSidebar(false)}
                />
            )}

            {/* Center: map */}
            <div
                className={cn('relative h-full rounded-2xl overflow-hidden bg-muted', mapSpanClass(sidebarOpen, !!detailIntervention))}
            >
            <Map
                ref={mapRef}
                onLoad={handleMapLoad}
                mapStyle={BASEMAP_STYLES[basemap]}
                initialViewState={{
                    longitude: bounds?.center[0] ?? 0,
                    latitude: bounds?.center[1] ?? 0,
                    zoom: 5,
                }}
                style={MAP_CONTAINER_STYLE}
                interactiveLayerIds={INTERACTIVE_LAYER_IDS}
                cursor={hoverPointer ? 'pointer' : 'grab'}
                onClick={handleMapClick}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onError={() => { /* suppress tile load errors */ }}
            >
                <StaticMapLayers
                    showSiteBoundaries={showSiteBoundaries}
                    sites={sites}
                    siteMask={siteMask}
                    polygonGeoJSON={polygonGeoJSON}
                    centroidGeoJSON={centroidGeoJSON}
                    pointGeoJSON={pointGeoJSON}
                    hasSelection={mapState.selectedInterventionId != null}
                />

                {/* Pulsing ring on a selected point intervention */}
                {selectedPulseGeoJSON.features.length > 0 && (
                    <Source id="selected-pulse" type="geojson" data={selectedPulseGeoJSON}>
                        <Layer
                            id="selected-pulse-ring"
                            type="circle"
                            paint={{
                                'circle-radius': 10,
                                'circle-color': 'rgba(0,0,0,0)',
                                'circle-stroke-color': HALO_COLOR,
                                'circle-stroke-width': 2.5,
                                'circle-stroke-opacity': 0.8,
                            }}
                        />
                    </Source>
                )}

                {/* Sample trees: dots by status with a white ring */}
                {treesGeoJSON.features.length > 0 && (
                    <Source id="trees-points" type="geojson" data={treesGeoJSON}>
                        <Layer
                            id="trees-points-circle"
                            type="circle"
                            paint={{
                                'circle-color': ['get', 'color'],
                                'circle-radius': [
                                    'case',
                                    ['boolean', ['feature-state', 'selected'], false], 8,
                                    ['boolean', ['feature-state', 'hover'], false], 6,
                                    4.5,
                                ],
                                'circle-stroke-color': HALO_COLOR,
                                'circle-stroke-width': [
                                    'case',
                                    ['boolean', ['feature-state', 'selected'], false], 3,
                                    1.75,
                                ],
                            }}
                        />
                    </Source>
                )}

                {/* Site name chips */}
                {showSiteBoundaries && siteLabels.map(l => (
                    <Marker key={`site-${l.id}`} longitude={l.point[0]} latitude={l.point[1]} anchor="bottom" offset={[0, -6]}>
                        <SiteLabel
                            name={l.name}
                            active={selectedSiteId === l.id}
                            onClick={() => handleSelectSite(selectedSiteId === l.id ? null : l.id)}
                        />
                    </Marker>
                ))}

                {/* Cluster bubbles */}
                {clusters.map(c => (
                    <Marker key={`cluster-${c.id}`} longitude={c.lng} latitude={c.lat} anchor="center">
                        <ClusterBubble cluster={c} onClick={() => expandCluster(c)} />
                    </Marker>
                ))}

                <ScaleControl position="bottom-left" unit="metric" />
            </Map>

            {/* Hover tooltip: type, date, area or trees */}
            {hoveredIntervention && (
                <div
                    ref={tooltipRef}
                    role="tooltip"
                    className="pointer-events-none absolute left-0 top-0 z-30 rounded-lg bg-zinc-950 px-2.5 py-2 text-xs text-white shadow-lg whitespace-nowrap"
                    style={{ transform: `translate(${lastPointRef.current.x + 14}px, ${lastPointRef.current.y + 14}px)` }}
                >
                    <div className="flex items-center gap-1.5 font-semibold">
                        <span className="size-2 rounded-sm" style={{ backgroundColor: getInterventionColor(hoveredIntervention.type) }} />
                        {getInterventionLabel(hoveredIntervention.type)}
                    </div>
                    <div className="text-zinc-400 mt-0.5">
                        {formatDate(hoveredIntervention.interventionStartDate)}
                        {' · '}
                        {hoveredIntervention.location.type === 'Point'
                            ? `${formatNum(hoveredIntervention.totalTreeCount ?? 0)} trees`
                            : resolveArea(hoveredIntervention)}
                    </div>
                </div>
            )}

            {/* Error */}
            <AnimatePresence>
                {error?.recoverable && (
                    <ErrorDisplay
                        error={error}
                        onRetry={loadInterventions}
                        onDismiss={() => setError(null)}
                    />
                )}
            </AnimatePresence>

            {/* Top-left: what you see (site, dates), then the legend filter */}
            <div className="absolute top-3 left-3 bottom-24 z-20 flex flex-col gap-2 pointer-events-none max-w-[calc(100%-180px)]">
                <div className="flex flex-wrap gap-2 [&>*]:pointer-events-auto">
                    {!sidebarOpen && (
                        <Button
                            variant="outline"
                            onClick={() => toggleSidebar(true)}
                            className={cn(TOOLBAR_BUTTON, 'gap-2 px-3')}
                            aria-label="Show interventions list"
                            title="Show list"
                        >
                            <PanelLeftOpen className="w-4 h-4 text-muted-foreground" />
                            <span className="tabular-nums">{formatNum(filteredInterventions.length)}</span>
                        </Button>
                    )}
                    <SiteSelect
                        sites={sites.features}
                        selectedSiteId={selectedSiteId}
                        onSelectSite={handleSelectSite}
                    />
                    <DateFilter range={dateRange} onChange={setDateRange} />
                </div>
                <div className="flex-1 min-h-0 flex items-start">
                    <div className="pointer-events-auto max-h-full overflow-y-auto rounded-[10px]">
                        <MapLegend
                            typeCounts={typeCounts}
                            hiddenTypes={hiddenTypes}
                            onToggleType={toggleType}
                            onShowAll={() => setHiddenTypes(new Set())}
                            // Tree status legend hidden for now. Restore with:
                            // showTreeStatus={treesGeoJSON.features.length > 0}
                            showTreeStatus={false}
                            expanded={legendOpen}
                            onExpandedChange={setLegendOpen}
                        />
                    </div>
                </div>
            </div>

            {/* Top-right overlay slot (e.g. live-activity toggle) */}
            {mapTopRight && (
                <div className="absolute top-3 right-3 z-20">
                    {mapTopRight}
                </div>
            )}

            {/* Bottom-right: how you move (layers, framing, zoom) */}
            <div className="absolute bottom-10 right-3 z-20">
                <MapControls
                    basemap={basemap}
                    onBasemap={setBasemap}
                    hasSites={sites.features.length > 0}
                    showSiteBoundaries={showSiteBoundaries}
                    onShowSiteBoundaries={setShowSiteBoundaries}
                    onFit={() => (selectedSiteId != null ? handleSelectSite(selectedSiteId) : fitProject())}
                    isFullscreen={isFullscreen}
                    onToggleFullscreen={toggleFullscreen}
                    onZoomIn={() => mapRef.current?.zoomIn()}
                    onZoomOut={() => mapRef.current?.zoomOut()}
                />
            </div>
            </div>

            {/* Right: detail pane (a 1-col grid cell, shown when something is
                selected). Drills intervention -> tree -> records in place; the
                map's col-span shrinks to make room. */}
            {detailIntervention && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="col-span-1 h-full bg-card text-card-foreground border border-border rounded-2xl overflow-hidden flex flex-col"
                >
                    {selectedTree && mapState.showTreeDetails ? (
                        <TreeTooltip
                            key={selectedTree.id}
                            tree={selectedTree}
                            isLoadingDetail={isLoadingTreeDetail}
                            records={treeRecords?.treeId === selectedTree.id ? treeRecords.records : []}
                            isLoadingRecords={isLoadingRecords}
                            historyLoaded={treeRecords?.treeId === selectedTree.id}
                            onLoadHistory={loadTreeHistory}
                            onClose={() => {
                                setMapState(prev => ({ ...prev, selectedTreeId: null, showTreeDetails: false }));
                            }}
                        />
                    ) : (
                        <InterventionPanel
                            intervention={detailIntervention}
                            trees={detail?.trees ?? trees}
                            isLoading={isLoadingDetail}
                            projectUid={projectId}
                            siteName={siteNameOf(detailIntervention)}
                            onClose={() => selectIntervention(null)}
                            onSelectTree={(tree) => {
                                setMapState(prev => ({ ...prev, selectedTreeId: tree.id, showTreeDetails: true }));
                                const map = mapRef.current;
                                if (map && tree.location?.type === 'Point') {
                                    const [lng, lat] = tree.location.coordinates as [number, number];
                                    map.easeTo({ center: [lng, lat], zoom: Math.max(map.getZoom?.() ?? 16, 17), duration: 600 });
                                }
                            }}
                        />
                    )}
                </motion.div>
            )}
        </div>
    );
};

export default ProjectMap;
