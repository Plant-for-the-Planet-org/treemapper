'use client';

import { Section, SectionTitle, ctaPrimarySm, ctaSecondarySm } from './primitives';

/** The nutrition-label style fact card that sits beside the definition. */
const FACT_GROUPS: { heading?: string; rows: { label: string; value: string; indent?: boolean }[] }[] = [
  {
    rows: [
      { label: 'Non-profits, small teams, Forest Cloud', value: 'Free', indent: true },
      { label: 'Large for-profit use', value: 'Commercial licence', indent: true },
    ],
  },
  {
    heading: 'What it does',
    rows: [
      { label: 'Registers', value: 'Trees, plots and 14 intervention types' },
      { label: 'Records per tree', value: 'Coordinates, species, date, photo' },
      { label: 'Monitoring', value: 'Permanent plots and remeasurement' },
    ],
  },
  {
    heading: 'Where it runs',
    rows: [
      { label: 'Platforms', value: 'Android, iOS, web dashboard' },
      { label: 'Works offline', value: 'Yes, syncs when back online', indent: true },
      { label: 'Species database', value: '60,000+ scientific names' },
    ],
  },
  {
    heading: 'Your data',
    rows: [
      { label: 'Export formats', value: 'GeoJSON, CSV, public API' },
      { label: 'Geometry', value: 'Points and polygons, intact', indent: true },
      { label: 'Data ownership', value: 'Yours' },
      { label: 'Source code', value: 'Open source · commercial licence for large for-profit use' },
    ],
  },
];

function FactsCard() {
  return (
    <div className="border-[2.5px] border-tm-ink bg-white px-[18px] pt-4 pb-3.5">
      <div className="text-3xl leading-[1.05] font-extrabold tracking-[-.8px] text-tm-ink">TreeMapper Facts</div>
      <div className="mt-1 text-xs font-bold text-tm-body">Plant-for-the-Planet Foundation · Tree monitoring app</div>
      <div className="mt-2 h-[9px] bg-tm-ink" />

      <div className="flex items-baseline justify-between pt-[9px] pb-0.5">
        <span className="text-[19px] font-extrabold text-tm-ink">Price</span>
        <span className="text-[26px] font-extrabold tracking-[-.6px] text-tm-green">Free</span>
      </div>

      {FACT_GROUPS.map((group, gi) => (
        <div key={group.heading ?? gi}>
          {group.heading && (
            <>
              <div className="mt-2 h-[5px] bg-tm-ink" />
              <div className="pt-2 pb-0.5 text-[11px] font-extrabold tracking-[1.2px] uppercase text-tm-muted">
                {group.heading}
              </div>
            </>
          )}
          {group.rows.map(row => (
            <div
              key={row.label}
              className="flex items-baseline justify-between gap-3.5 border-t border-tm-rule pt-[7px] pb-1.5"
            >
              <span
                className={
                  row.indent ? 'pl-4 text-[13px] font-normal text-tm-body' : 'text-[13px] font-extrabold text-tm-ink'
                }
              >
                {row.label}
              </span>
              <span className="flex-1 text-right text-[13px] font-bold text-tm-body">{row.value}</span>
            </div>
          ))}
        </div>
      ))}

      <div className="mt-2 h-0.5 bg-tm-ink" />
      <p className="pt-2 text-[11px] leading-[1.5] font-semibold text-tm-muted">
        Best for restoration projects, urban forestry teams, funders and school classes. No credit card, no seat limit
        on volunteers.
      </p>
    </div>
  );
}

export function WhatIsTreeMapper({ onStartFree }: { onStartFree: () => void }) {
  return (
    <Section
      id="what-is"
      className="bg-tm-cream"
      innerClassName="grid items-start gap-11 lg:grid-cols-[1.15fr_1fr]"
    >
      <div>
        <SectionTitle className="mb-4">What is TreeMapper?</SectionTitle>
        <p className="mb-[22px] text-[17px] leading-[1.65] text-tm-body">
          <strong className="font-extrabold">TreeMapper turns field work into evidence.</strong> It is a tree
          monitoring app that records every tree and every intervention where it actually happened, with coordinates,
          species, date and photo, then tracks what survived and hands you the raw geodata whenever you ask for it.
          Restoration organisations, companies, city forestry teams and school classes all collect to the same
          standard.
        </p>
        <p className="mb-5 text-base leading-[1.7] text-tm-body">
          Field data is collected on Android and iOS, works fully offline, and syncs when a connection returns. Because
          every record carries coordinates, a date, a species and a photo, what you end up with is an auditable dataset
          rather than a report someone has to take on trust.
        </p>

        <div className="mb-[22px] aspect-video overflow-hidden rounded-xl border border-tm-rule bg-tm-ink">
          <iframe
            src="https://www.youtube-nocookie.com/embed/uci6w-nPAR4?rel=0"
            title="How TreeMapper works"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="block h-full w-full border-0"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={onStartFree} className={ctaPrimarySm()}>
            Start free
          </button>
          <a href="#capabilities" className={ctaSecondarySm()}>
            See what it can do
          </a>
        </div>
      </div>

      <FactsCard />
    </Section>
  );
}
