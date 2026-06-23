'use client';

import {
  Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { cn } from '@/lib/utils';
import { GrowthPoint, ObsSeries, STATUS_COLOR, fmt } from './plotAnalytics';

const GREEN = '#007A49';
const MONO = "'Geist Mono', ui-monospace, monospace";

/* --------------------------------------------------------------- atoms */

export const Label = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground', className)}>
    {children}
  </div>
);

export const Mono = ({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) => (
  <span className={cn('tabular-nums', className)} style={{ fontFamily: MONO, ...style }}>{children}</span>
);

export const StatusDot = ({ status, size = 8 }: { status: string; size?: number }) => (
  <span
    className="inline-block flex-none"
    style={{ width: size, height: size, borderRadius: 999, background: STATUS_COLOR[status] || STATUS_COLOR.unknown, boxShadow: '0 0 0 1.5px #fff' }}
  />
);

export const Stat = ({ label, value, unit, sub, accent }: {
  label: string; value: string; unit?: string; sub?: React.ReactNode; accent?: string;
}) => (
  <div className="flex flex-col gap-1.5 px-4 py-3.5">
    <Label>{label}</Label>
    <div className="flex items-baseline gap-1.5">
      <Mono className="text-[26px] leading-none font-semibold tracking-tight" style={{ color: accent }}>{value}</Mono>
      {unit && <span className="text-[12px] text-muted-foreground/70">{unit}</span>}
    </div>
    {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
  </div>
);

export const SectionTitle = ({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) => (
  <div className="flex items-center justify-between px-4 h-10 border-b">
    <Label>{children}</Label>
    {right}
  </div>
);

/* ------------------------------------------------------- survival ring */

export const Ring = ({ value, size = 116, thickness = 11, color = GREEN, label }: {
  value: number; size?: number; thickness?: number; color?: string; label?: string;
}) => {
  const R = size / 2;
  const r = R - thickness / 2 - 1;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(100, value)) / 100);
  return (
    <div className="relative inline-flex items-center justify-center flex-none" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={R} cy={R} r={r} fill="none" stroke="#e4e4e7" strokeWidth={thickness} />
        <circle cx={R} cy={R} r={r} fill="none" stroke={color} strokeWidth={thickness} strokeDasharray={c} strokeDashoffset={off} />
      </svg>
      <div className="absolute flex flex-col items-center">
        <Mono className="text-[23px] font-semibold leading-none">{fmt(value, 0)}<span className="text-[12px] text-muted-foreground/70">%</span></Mono>
        {label && <span className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground mt-1">{label}</span>}
      </div>
    </div>
  );
};

export const StackBar = ({ segments, height = 10 }: { segments: { label: string; value: number; color: string }[]; height?: number }) => {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  return (
    <div className="flex w-full overflow-hidden border rounded-[2px]" style={{ height }}>
      {segments.map((s) => s.value > 0 && (
        <div key={s.label} title={`${s.label} · ${s.value}`} style={{ width: `${(s.value / total) * 100}%`, background: s.color }} />
      ))}
    </div>
  );
};

/* ------------------------------------------------ composition donut (SVG) */

export const Donut = ({ data, size = 128, thickness = 19 }: {
  data: { label: string; value: number; color: string }[]; size?: number; thickness?: number;
}) => {
  const total = data.reduce((a, d) => a + d.value, 0) || 1;
  const R = size / 2;
  const r = R - thickness;
  const cx = R;
  const cy = R;
  let a0 = -Math.PI / 2;
  const arc = (a: number, b: number) => {
    const x0 = cx + R * Math.cos(a);
    const y0 = cy + R * Math.sin(a);
    const x1 = cx + R * Math.cos(b);
    const y1 = cy + R * Math.sin(b);
    const xi1 = cx + r * Math.cos(b);
    const yi1 = cy + r * Math.sin(b);
    const xi0 = cx + r * Math.cos(a);
    const yi0 = cy + r * Math.sin(a);
    const large = b - a > Math.PI ? 1 : 0;
    return `M${x0} ${y0} A${R} ${R} 0 ${large} 1 ${x1} ${y1} L${xi1} ${yi1} A${r} ${r} 0 ${large} 0 ${xi0} ${yi0} Z`;
  };
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-none">
      {data.map((d, i) => {
        const a1 = a0 + (d.value / total) * Math.PI * 2;
        const path = arc(a0 + 0.014, Math.max(a0 + 0.015, a1 - 0.014));
        a0 = a1;
        return <path key={i} d={path} fill={d.color} />;
      })}
      <text x={cx} y={cy - 2} textAnchor="middle" style={{ fontFamily: MONO, fontSize: 22, fontWeight: 600, fill: '#18181b' }}>{total}</text>
      <text x={cx} y={cy + 13} textAnchor="middle" style={{ fontSize: 8.5, letterSpacing: '0.14em', fill: '#71717a' }}>STEMS</text>
    </svg>
  );
};

/* --------------------------------------------- plot stem-map schematic */

export const PlotDiagram = ({ shape, extent, stems, radius, size = 340 }: {
  shape: string | null; extent: number; radius: number | null;
  stems: { x: number; y: number; status: string; tag: string | null; species: string | null; width: number | null }[];
  size?: number;
}) => {
  const pad = 30;
  const E = extent || 10;
  const scale = (size / 2 - pad) / E;
  const cx = size / 2;
  const cy = size / 2;
  const rings = [0.25, 0.5, 0.75, 1];
  const isCircle = shape === 'circle';
  return (
    <svg width="100%" viewBox={`0 0 ${size} ${size}`} className="block bg-muted/30" style={{ borderRadius: 2 }}>
      <line x1={cx} y1={pad - 6} x2={cx} y2={size - pad + 6} stroke="#e4e4e7" strokeWidth={1} strokeDasharray="2 4" />
      <line x1={pad - 6} y1={cy} x2={size - pad + 6} y2={cy} stroke="#e4e4e7" strokeWidth={1} strokeDasharray="2 4" />
      {isCircle ? rings.map((f, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={E * f * scale}
          fill={i === rings.length - 1 ? 'rgba(0,122,73,0.04)' : 'none'}
          stroke={i === rings.length - 1 ? GREEN : '#e4e4e7'}
          strokeWidth={i === rings.length - 1 ? 1.6 : 1}
        />
      )) : (
        <rect x={cx - E * scale} y={cy - E * scale} width={E * 2 * scale} height={E * 2 * scale} fill="rgba(0,122,73,0.04)" stroke={GREEN} strokeWidth={1.6} />
      )}
      {isCircle && radius != null && (
        <>
          <line x1={cx} y1={cy} x2={cx + E * scale} y2={cy} stroke="#055c38" strokeWidth={1.2} />
          <text x={cx + (E * scale) / 2} y={cy - 5} textAnchor="middle" style={{ fontFamily: MONO, fontSize: 9.5, fill: '#055c38' }}>r {fmt(radius, 1)} m</text>
        </>
      )}
      {stems.map((s, i) => (
        <circle
          key={i}
          cx={cx + s.x * scale}
          cy={cy - s.y * scale}
          r={Math.max(2.4, Math.min(5, (s.width ?? 0.6) * 4))}
          fill={STATUS_COLOR[s.status] || STATUS_COLOR.unknown}
          fillOpacity={s.status === 'alive' ? 0.9 : 0.85}
          stroke="#fff"
          strokeWidth={0.8}
        >
          <title>{`${s.tag || 'stem'} · ${s.species || 'Unknown'} · ${s.status}`}</title>
        </circle>
      ))}
      <g transform={`translate(${size - pad + 2}, ${pad - 4})`}>
        <text x={0} y={0} textAnchor="middle" style={{ fontSize: 9, fontWeight: 700, fill: '#71717a' }}>N</text>
        <line x1={0} y1={3} x2={0} y2={12} stroke="#71717a" strokeWidth={1.2} />
      </g>
    </svg>
  );
};

/* ----------------------------------------------------- recharts wrappers */

const tooltipStyle = {
  backgroundColor: 'white',
  border: '1px solid #e4e4e7',
  borderRadius: 4,
  fontSize: 11,
  padding: '6px 8px',
  boxShadow: '0 4px 10px -2px rgba(0,0,0,0.08)',
} as const;

export const GrowthChart = ({ data, height = 180, dataKey = 'height', unit = 'm', color = GREEN }: {
  data: GrowthPoint[]; height?: number; dataKey?: 'height' | 'width'; unit?: string; color?: string;
}) => {
  const rows = data.filter((d) => d[dataKey] != null);
  if (rows.length < 2) {
    return <div className="flex items-center justify-center text-[12px] text-muted-foreground" style={{ height }}>Not enough remeasurements to chart growth.</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={rows} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`g-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.14} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa', fontSize: 10 }} tickMargin={8} interval="preserveStartEnd" />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa', fontSize: 10 }} width={34} tickFormatter={(v) => fmt(v, 1)} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number | string) => [`${fmt(Number(v), 2)} ${unit}`, dataKey === 'height' ? 'Mean height' : 'Mean width']} cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '3 3' }} />
        <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#g-${dataKey})`} dot={{ r: 2.4, fill: '#fff', stroke: color, strokeWidth: 1.4 }} activeDot={{ r: 3.4, fill: color, stroke: '#fff', strokeWidth: 2 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export const ObservationChart = ({ series, height = 150, color = '#2563eb' }: { series: ObsSeries; height?: number; color?: string }) => {
  const rows = series.points.filter((p) => p.value != null);
  if (rows.length < 2) {
    return <div className="flex items-center justify-center text-[12px] text-muted-foreground" style={{ height }}>Single reading recorded.</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={rows} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa', fontSize: 10 }} tickMargin={8} interval="preserveStartEnd" />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa', fontSize: 10 }} width={34} tickFormatter={(v) => fmt(v, 0)} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number | string) => [`${fmt(Number(v), 1)} ${series.unit || ''}`.trim(), series.label]} cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '3 3' }} />
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={{ r: 2.2, fill: '#fff', stroke: color, strokeWidth: 1.4 }} activeDot={{ r: 3.4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
};

/** Minimal inline sparkline (custom SVG) for table rows. */
export const Spark = ({ values, color = GREEN, w = 64, h = 22 }: { values: number[]; color?: string; w?: number; h?: number }) => {
  if (!values || values.length < 2) return <span className="text-[11px] text-muted-foreground/60">—</span>;
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const px = (i: number) => (i / (values.length - 1)) * w;
  const py = (v: number) => h - 2 - ((v - lo) / (hi - lo || 1)) * (h - 4);
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${px(i).toFixed(1)} ${py(v).toFixed(1)}`).join(' ');
  return (
    <svg width={w} height={h} className="block">
      <path d={d} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={px(values.length - 1)} cy={py(values[values.length - 1])} r={2} fill={color} />
    </svg>
  );
};

/** Compact height trajectory for a single tree's expanded row. */
export const MiniGrowth = ({ data, height = 130 }: { data: { label: string; value: number | null }[]; height?: number }) => {
  const rows = data.filter((d) => d.value != null);
  if (rows.length < 2) {
    return <div className="flex items-center justify-center text-[12px] text-muted-foreground" style={{ height }}>No growth history.</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="mini-g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={GREEN} stopOpacity={0.14} />
            <stop offset="95%" stopColor={GREEN} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa', fontSize: 9 }} tickMargin={6} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa', fontSize: 9 }} width={28} tickFormatter={(v) => fmt(v, 1)} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number | string) => [`${fmt(Number(v), 2)} m`, 'Height']} />
        <Area type="monotone" dataKey="value" stroke={GREEN} strokeWidth={2} fill="url(#mini-g)" dot={{ r: 2, fill: '#fff', stroke: GREEN, strokeWidth: 1.3 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
};
