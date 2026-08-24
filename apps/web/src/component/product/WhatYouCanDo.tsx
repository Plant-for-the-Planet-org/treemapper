import { CloudOff, Download, Leaf, Sprout, TrendingUp, Users } from 'lucide-react';
import { IconTile, Section, SectionLead, SectionTitle } from './primitives';

const CAPABILITIES = [
  {
    icon: Sprout,
    title: 'Register anything you plant',
    body: 'Single trees, whole planting days as polygons, or 14 intervention types from fire patrol to fencing.',
  },
  {
    icon: CloudOff,
    title: 'Work with no signal',
    body: 'Fully offline on Android and iOS, with downloaded maps. Everything syncs when you are back in range.',
  },
  {
    icon: TrendingUp,
    title: 'Prove survival, not just planting',
    body: 'Permanent plots, remeasurement reminders and paired baselines turn counts into defensible rates.',
  },
  {
    icon: Leaf,
    title: 'Identify from 60,000+ species',
    body: 'A shared scientific species database, plus your own favourites with local names and photos.',
  },
  {
    icon: Users,
    title: 'Bring your whole team',
    body: 'Invite field staff, contractors, volunteers or an entire classroom, with roles for register, verify and read only.',
  },
  {
    icon: Download,
    title: 'Take the data anywhere',
    body: 'Raw GeoJSON and CSV exports with geometry intact, or pull records live through the public API.',
  },
];

function StepHeader({ n, title }: { n: number; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <span className="flex size-7 items-center justify-center rounded-lg bg-tm-lime text-[13px] font-extrabold text-[#2F3336]">
        {n}
      </span>
      <h3 className="text-[17px] font-extrabold text-tm-ink">{title}</h3>
    </div>
  );
}

function FieldMapArt() {
  return (
    <div className="relative mb-4 h-[170px] overflow-hidden rounded-lg bg-tm-canopy">
      <svg viewBox="0 0 300 170" aria-hidden="true" className="absolute inset-0 h-full w-full">
        <rect width="300" height="170" fill="#EAF1E2" />
        <path d="M0 132 C60 122 110 142 170 138 C220 135 260 146 300 142 L300 170 L0 170 Z" fill="#CFE3EE" />
        <g fill="#8FB474">
          <use href="#tmClump" transform="translate(56,66) scale(.8)" />
          <use href="#tmClump" transform="translate(150,44) scale(.7)" />
          <use href="#tmClump" transform="translate(228,80) scale(.75)" />
          <use href="#tmClump" transform="translate(104,104) scale(.6)" />
        </g>
        <g fill="#B4D398" transform="translate(0,-4)">
          <use href="#tmClump" transform="translate(56,66) scale(.8)" />
          <use href="#tmClump" transform="translate(150,44) scale(.7)" />
          <use href="#tmClump" transform="translate(228,80) scale(.75)" />
          <use href="#tmClump" transform="translate(104,104) scale(.6)" />
        </g>
        <path
          d="M92 62 L190 48 L214 100 L150 124 L86 106 Z"
          fill="rgba(0,122,73,.12)"
          stroke="#007A49"
          strokeWidth="1.8"
          strokeDasharray="6 4"
        />
      </svg>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/pins/SingleTreePin.svg" alt="" className="absolute left-[30%] top-[34%] h-[30px]" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/pins/MultiTreePin.svg" alt="" className="absolute right-[28%] bottom-[28%] h-8" />
      <span className="absolute bottom-3 left-3 rounded-full bg-tm-lime px-2.5 py-1.5 text-[10px] font-extrabold text-[#2F3336]">
        Works offline
      </span>
    </div>
  );
}

function SyncPanelArt() {
  const rows = [
    { dot: '#68B030', label: '42 registrations uploaded', meta: 'Synced', metaClass: 'text-tm-green' },
    { dot: '#F2C94C', label: 'Plot 14 remeasurement due', meta: '3 days', metaClass: 'text-tm-muted' },
    { dot: '#48AADD', label: 'Compared with baseline plot', meta: '+18%', metaClass: 'text-tm-muted' },
  ];
  const bars = [
    { h: '40%', c: '#DCEBCB' },
    { h: '60%', c: '#DCEBCB' },
    { h: '78%', c: '#68B030' },
    { h: '96%', c: '#007A49' },
    { h: '70%', c: '#007A49' },
  ];

  return (
    <div className="mb-4 flex h-[170px] flex-col gap-2.5 rounded-lg border border-tm-line bg-white p-3.5">
      {rows.map(row => (
        <div key={row.label} className="flex items-center gap-2.5">
          <span className="size-2 rounded-full" style={{ background: row.dot }} />
          <span className="flex-1 text-xs font-semibold text-tm-body">{row.label}</span>
          <span className={`text-[10px] font-extrabold ${row.metaClass}`}>{row.meta}</span>
        </div>
      ))}
      <div className="h-px bg-tm-line" />
      <div className="flex flex-1 items-end gap-[5px]">
        {bars.map((bar, i) => (
          <span key={i} className="flex-1" style={{ height: bar.h, background: bar.c }} />
        ))}
      </div>
    </div>
  );
}

const EXPORT_SNIPPET = `{
  "type": "Feature",
  "properties": {
    "type": "multi",
    "plantDate": "2026-05-25",
    "treeCount": 150,
    "species": "Cedrela odorata"
  },
  "geometry": { "type": "Polygon" }
}`;

function ExportArt() {
  return (
    <div className="mb-4 h-[170px] overflow-hidden rounded-lg bg-tm-ink p-3.5">
      <div className="mb-2.5 font-mono text-[9px] leading-none font-bold tracking-[1px] text-tm-lime">
        GET /treemapper/plantLocations
      </div>
      <pre className="font-mono text-[9.5px] leading-[1.72] whitespace-pre text-white/85">{EXPORT_SNIPPET}</pre>
    </div>
  );
}

export function WhatYouCanDo() {
  return (
    <Section id="capabilities" className="bg-white">
      <div className="mx-auto mb-9 max-w-[760px] text-center">
        <SectionTitle className="mb-3.5">What can you do with TreeMapper?</SectionTitle>
        <SectionLead>Six things it does that a spreadsheet and a camera roll cannot.</SectionLead>
      </div>

      <div className="mb-20 grid gap-px overflow-hidden rounded-xl border border-tm-rule bg-tm-rule sm:grid-cols-2 lg:grid-cols-3 lg:mb-28">
        {CAPABILITIES.map(({ icon: Icon, title, body }) => (
          <div key={title} className="bg-white p-[26px]">
            <IconTile className="mb-3.5">
              <Icon className="size-[21px] text-tm-ink" strokeWidth={2} />
            </IconTile>
            <h3 className="mb-[7px] text-[15px] font-extrabold text-tm-ink">{title}</h3>
            <p className="text-[13px] leading-[1.6] text-tm-body">{body}</p>
          </div>
        ))}
      </div>

      <div className="mb-10 max-w-[720px]">
        <SectionTitle className="mb-3.5">How do you monitor planted trees with TreeMapper?</SectionTitle>
        <SectionLead>
          Three steps, and the only one that costs your team time is the first. Locate, snap, measure. Everything after
          that is calculated for you.
        </SectionLead>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-tm-line bg-tm-cream p-[26px]">
          <StepHeader n={1} title="Register trees in the field" />
          <FieldMapArt />
          <p className="text-sm leading-[1.65] text-tm-body">
            Record a single tree, draw a polygon around a whole planting day, or log an intervention such as fire
            patrol, fencing or grass suppression. GPS, species, photo and measurements, in seconds, with no
            connectivity.
          </p>
        </div>

        <div className="rounded-xl border border-tm-line bg-tm-cream p-[26px]">
          <StepHeader n={2} title="Track survival over time" />
          <SyncPanelArt />
          <p className="text-sm leading-[1.65] text-tm-body">
            Set up permanent monitoring plots and paired baseline plots, get remeasurement reminders, and let
            TreeMapper calculate survival rate and growth as the data comes in.
          </p>
        </div>

        <div className="rounded-xl border border-tm-line bg-tm-cream p-[26px]">
          <StepHeader n={3} title="Report and export the data" />
          <ExportArt />
          <p className="text-sm leading-[1.65] text-tm-body">
            Publish a public project page, embed a live map on your own website, or export raw GeoJSON and CSV with the
            geometry intact for QGIS, ArcGIS, R and remote sensing workflows.
          </p>
        </div>
      </div>
    </Section>
  );
}
