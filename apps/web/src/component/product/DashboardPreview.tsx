'use client';

import Image from 'next/image';
import tmLogo from '@/assets/tmlogo.png';
import { Section, SectionLead, SectionTitle, ctaPrimary } from './primitives';

const SIDEBAR = ['Overview', 'Interventions', 'Monitoring Plots', 'Species', 'Data Explorer', 'Team', 'Exports'];

const STATS = [
  { label: 'Trees registered', value: '1.2M', note: 'Example figure' },
  { label: 'Interventions', value: '3.4k', note: '14 types available' },
  { label: 'Monitoring plots', value: '~130', note: 'Remeasurement reminders' },
];

const SPECIES_MIX = [
  { name: 'Swietenia macrophylla', pct: 34, color: '#007A49' },
  { name: 'Cedrela odorata', pct: 26, color: '#348F39' },
  { name: 'Piscidia piscipula', pct: 21, color: '#68B030' },
  { name: '19 other species', pct: 19, color: '#E1EDE8' },
];

const RECENT = [
  { accent: '#68B030', title: 'Multi tree, 240 trees', meta: 'Field volunteer · Plot 22' },
  { accent: '#F2994A', title: 'Fire patrol', meta: 'Field team · North block' },
  { accent: '#007A49', title: 'Remeasurement, Plot 14', meta: 'Field team · Plot 14' },
];

function SchematicMap() {
  return (
    <div className="relative h-[250px] overflow-hidden rounded-lg border border-tm-line bg-tm-cream">
      <svg viewBox="0 0 560 250" preserveAspectRatio="none" aria-hidden="true" className="absolute inset-0 h-full w-full">
        <defs>
          <pattern id="tmGridSchem" width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M28 0 L0 0 0 28" fill="none" stroke="#E6E9EC" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="560" height="250" fill="url(#tmGridSchem)" />
        <path d="M60 58 L214 40 L258 130 L150 172 L52 138 Z" fill="rgba(104,176,48,.14)" stroke="#68B030" strokeWidth="2" />
        <path
          d="M330 96 L470 78 L506 156 L392 188 L328 154 Z"
          fill="none"
          stroke="#007A49"
          strokeWidth="2"
          strokeDasharray="7 5"
        />
        <g fill="#007A49">
          <circle cx="96" cy="86" r="4" />
          <circle cx="140" cy="70" r="4" />
          <circle cx="182" cy="96" r="4" />
          <circle cx="112" cy="128" r="4" />
          <circle cx="168" cy="140" r="4" />
        </g>
        <g fill="#68B030">
          <circle cx="372" cy="120" r="4" />
          <circle cx="418" cy="106" r="4" />
          <circle cx="452" cy="140" r="4" />
          <circle cx="396" cy="160" r="4" />
        </g>
      </svg>
      <div className="absolute top-3 left-3 rounded-full border border-tm-line bg-white px-2.5 py-[5px] text-[10px] font-extrabold tracking-[.8px] uppercase text-tm-muted">
        Schematic, not a live map
      </div>
      <div className="absolute bottom-3 left-3 flex max-w-[88%] flex-wrap gap-1.5">
        <span className="rounded-full bg-tm-green px-2.5 py-[5px] text-[10px] font-extrabold text-white">Single tree</span>
        <span className="rounded-full bg-tm-lime px-2.5 py-[5px] text-[10px] font-extrabold text-[#2F3336]">Multi tree</span>
        <span className="rounded-full border border-tm-rule bg-white px-2.5 py-[5px] text-[10px] font-extrabold text-tm-body">
          Plot boundary
        </span>
      </div>
    </div>
  );
}

export function DashboardPreview({ onOpenDashboard }: { onOpenDashboard: () => void }) {
  return (
    <Section id="dashboard" className="bg-tm-mist">
      <div className="mb-9 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end lg:gap-10">
        <div className="max-w-[660px]">
          <div className="mb-3.5 flex items-center gap-2.5">
            <span className="rounded-[5px] bg-tm-lime px-2 py-1 text-[10px] font-extrabold tracking-[.8px] text-[#2F3336]">
              NEW
            </span>
            <span className="text-[11px] font-extrabold tracking-[1.4px] uppercase text-tm-green">
              TreeMapper Dashboard
            </span>
          </div>
          <SectionTitle className="mb-3">What does the TreeMapper dashboard show you?</SectionTitle>
          <SectionLead>
            Every tree and intervention your team registered, in one browser tab. Filter by project, species,
            intervention type or date. Compare treated plots against baselines. Spot the sites that are struggling
            before the next planting season.
          </SectionLead>
        </div>
        <button type="button" onClick={onOpenDashboard} className={ctaPrimary()}>
          Open the Dashboard
        </button>
      </div>

      <div className="grid overflow-hidden rounded-xl border border-tm-rule bg-white shadow-[0_4px_16px_rgba(0,0,0,.1)] lg:grid-cols-[200px_1fr]">
        <div className="hidden border-r border-tm-line bg-tm-cream py-[18px] lg:block">
          <div className="flex items-center gap-2.5 px-[18px] pb-[18px]">
            <Image src={tmLogo} alt="" width={22} height={22} className="rounded-md" />
            <span className="text-sm font-extrabold text-tm-ink">TreeMapper</span>
          </div>
          <div className="flex flex-col">
            {SIDEBAR.map((item, i) => (
              <span
                key={item}
                className={
                  i === 0
                    ? 'border-l-[3px] border-tm-green bg-tm-edge px-[18px] py-[11px] text-[13px] font-extrabold text-tm-green'
                    : 'border-l-[3px] border-transparent px-[18px] py-[11px] text-[13px] font-semibold text-tm-body'
                }
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div>
          <div className="flex h-14 items-center justify-between gap-3 overflow-hidden border-b border-tm-line px-5">
            <div className="flex items-center gap-2.5">
              <span className="text-[15px] font-extrabold whitespace-nowrap text-tm-ink">Example project</span>
              <span className="hidden rounded-full border border-tm-line bg-tm-cream px-2.5 py-[5px] text-[11px] font-bold whitespace-nowrap text-tm-body sm:inline">
                All plots
              </span>
              <span className="hidden rounded-full border border-tm-line bg-tm-cream px-2.5 py-[5px] text-[11px] font-bold whitespace-nowrap text-tm-body md:inline">
                Last 12 months
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="hidden sm:flex">
                <span className="size-[26px] rounded-full border-2 border-white bg-tm-edge" />
                <span className="-ml-2 size-[26px] rounded-full border-2 border-white bg-[#DCEBCB]" />
                <span className="-ml-2 size-[26px] rounded-full border-2 border-white bg-tm-line" />
                <span className="-ml-2 flex size-[26px] items-center justify-center rounded-full border-2 border-white bg-tm-green text-[9px] font-extrabold text-white">
                  +9
                </span>
              </span>
              <span className="rounded-[10px] bg-tm-green px-3.5 py-2 text-xs font-extrabold whitespace-nowrap text-white">
                Export GeoJSON
              </span>
            </div>
          </div>

          <div className="grid gap-4 px-5 py-[18px] lg:grid-cols-[1.35fr_1fr]">
            <div className="grid grid-cols-2 gap-3 lg:col-span-full lg:grid-cols-4">
              {STATS.map(stat => (
                <div key={stat.label} className="rounded-lg border border-tm-line p-3.5">
                  <div className="text-[10px] font-extrabold tracking-[.8px] uppercase text-tm-muted">{stat.label}</div>
                  <div className="mt-1.5 text-[23px] font-extrabold text-tm-ink">{stat.value}</div>
                  <div className="mt-0.5 text-[11px] font-extrabold text-tm-muted">{stat.note}</div>
                </div>
              ))}
              <div className="rounded-lg border border-tm-edge bg-tm-mist p-3.5">
                <div className="text-[10px] font-extrabold tracking-[.8px] uppercase text-tm-green">Survival rate</div>
                <div className="mt-1.5 text-[23px] font-extrabold text-tm-green">%</div>
                <div className="mt-0.5 text-[11px] font-extrabold text-tm-body">Calculated from your plots</div>
              </div>
            </div>

            <SchematicMap />

            <div className="flex flex-col gap-4">
              <div className="rounded-lg border border-tm-line p-3.5">
                <div className="mb-3 text-xs font-extrabold text-tm-ink">Species mix</div>
                <div className="flex flex-col gap-2.5">
                  {SPECIES_MIX.map(species => (
                    <div key={species.name}>
                      <div className="mb-1 flex justify-between text-[11px] font-semibold text-tm-body">
                        <span>{species.name}</span>
                        <span>{species.pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-tm-line">
                        <div
                          className="h-1.5 rounded-full"
                          style={{ width: `${species.pct}%`, background: species.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex-1 rounded-lg border border-tm-line p-3.5">
                <div className="mb-3 text-xs font-extrabold text-tm-ink">Recent registrations</div>
                <div className="flex flex-col gap-[11px]">
                  {RECENT.map(item => (
                    <div key={item.title} className="flex items-center gap-2.5">
                      <span className="h-[26px] w-[3px] rounded-sm" style={{ background: item.accent }} />
                      <div className="flex-1">
                        <div className="text-[11px] font-extrabold text-tm-ink">{item.title}</div>
                        <div className="text-[10px] font-semibold text-tm-muted">{item.meta}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
