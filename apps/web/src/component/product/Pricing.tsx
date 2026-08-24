'use client';

import { Check } from 'lucide-react';
import { Section, SectionLead, SectionTitle } from './primitives';

type Cell = string | true;

const PLANS = [
  {
    kicker: 'Free to start',
    price: '€0',
    blurb: 'Anyone, any project. No card, no trial clock.',
    cta: 'Start free',
    highlight: false,
  },
  {
    kicker: 'Always free',
    price: '€0',
    blurb: 'Non-profits, small teams and classrooms, forever.',
    cta: 'Check if you qualify',
    highlight: true,
  },
  {
    kicker: 'Commercial',
    price: 'Custom',
    blurb: 'Large and for-profit users, funding the roadmap.',
    cta: 'Talk to us',
    highlight: false,
  },
];

const ROWS: { label: string; sub?: string; values: [Cell, Cell, Cell] }[] = [
  {
    label: 'Projects, sites and trees',
    sub: 'Fair use applies, with no counting and no quota to buy back',
    values: ['Unlimited', 'Unlimited', 'Unlimited'],
  },
  {
    label: 'Offline registration in the field',
    sub: 'Record trees with no signal, sync when you are back',
    values: [true, true, true],
  },
  {
    label: 'Monitoring plots and survival rate',
    sub: 'Permanent plots, scheduled remeasurement, growth over time',
    values: [true, true, true],
  },
  {
    label: '14 intervention types beyond planting',
    sub: 'Fire patrol, firebreaks, fencing, direct seeding, maintenance and more',
    values: [true, true, true],
  },
  { label: 'Species database with local names', values: [true, true, true] },
  {
    label: 'Custom form builder with QR sharing',
    sub: 'Build your own field forms, share them without an account',
    values: [true, true, true],
  },
  {
    label: 'GeoJSON and CSV export, plus public API',
    sub: 'Your raw data, out in full, whenever you want it',
    values: [true, true, true],
  },
  { label: 'Public project page', values: [true, true, true] },
  { label: 'Team members and roles', values: ['Up to 5', 'Up to 20', 'Unlimited'] },
  { label: 'Onboarding and support', values: ['Community', 'Community', 'Included'] },
  { label: 'Priority feature development', values: ['—', 'Sponsor a build', 'Included'] },
];

/** Column tint: the middle plan is the highlighted one. */
const colClass = (i: number) =>
  i === 1
    ? 'bg-tm-mist border-l border-r border-tm-edge'
    : i === 0
      ? 'border-l border-tm-line'
      : '';

export function Pricing({ onStartFree }: { onStartFree: () => void }) {
  return (
    <Section id="pricing" className="border-t border-tm-line bg-tm-cream">
      <div className="mx-auto mb-10 max-w-[720px] text-center">
        <SectionTitle className="mb-3.5">How much does TreeMapper cost?</SectionTitle>
        <SectionLead>
          Free to start, and free to stay free for the organisations that need it most. Larger commercial users fund
          the development that everyone else benefits from.
        </SectionLead>
      </div>

      <div className="mx-auto max-w-[1060px] overflow-x-auto rounded-2xl border border-tm-rule bg-white">
        <div className="min-w-[820px]">
          {/* Plan headers */}
          <div className="grid grid-cols-[1.7fr_1fr_1fr_1fr] border-b border-tm-rule">
            <div className="p-6" />
            {PLANS.map((plan, i) => (
              <div key={plan.kicker} className={`p-6 px-[18px] text-center ${colClass(i)}`}>
                <div
                  className={`mb-2 text-[11px] font-extrabold tracking-[1.2px] uppercase ${
                    i === 0 ? 'text-tm-lime' : i === 1 ? 'text-tm-green' : 'text-tm-body'
                  }`}
                >
                  {plan.kicker}
                </div>
                <div
                  className={`mb-1 text-[28px] font-extrabold tracking-[-.6px] ${
                    plan.highlight ? 'text-tm-green' : 'text-tm-ink'
                  }`}
                >
                  {plan.price}
                </div>
                <div className="text-[13px] leading-[1.5] text-tm-body">{plan.blurb}</div>
              </div>
            ))}
          </div>

          {/* Feature rows */}
          <div className="grid grid-cols-[1.7fr_1fr_1fr_1fr]">
            <div className="border-b border-tm-line bg-tm-cream px-6 py-3 text-[11px] font-extrabold tracking-[1.2px] uppercase text-tm-body">
              What is built in
            </div>
            <div className="border-b border-tm-line border-l border-l-tm-line bg-tm-cream" />
            <div className="border-b border-tm-edge border-l border-r border-tm-edge bg-tm-mist" />
            <div className="border-b border-tm-line bg-tm-cream" />

            {ROWS.map(row => (
              <div key={row.label} className="contents">
                <div className="border-b border-tm-line px-6 py-[15px] text-sm font-bold text-tm-ink">
                  {row.label}
                  {row.sub && (
                    <div className="mt-[3px] text-[13px] leading-[1.5] font-normal text-tm-body">{row.sub}</div>
                  )}
                </div>
                {row.values.map((value, i) => (
                  <div
                    key={i}
                    className={`border-b px-[18px] py-[15px] text-center text-sm font-bold text-tm-body ${
                      i === 1 ? 'border-b-tm-edge' : 'border-b-tm-line'
                    } ${colClass(i)}`}
                  >
                    {value === true ? (
                      <Check className="inline-block size-[17px] text-tm-green" strokeWidth={3} />
                    ) : (
                      <span className={value === '—' ? 'text-tm-muted' : undefined}>{value}</span>
                    )}
                  </div>
                ))}
              </div>
            ))}

            {/* CTA row */}
            <div className="px-6 py-5" />
            {PLANS.map((plan, i) => (
              <div key={plan.cta} className={`px-[18px] py-5 text-center ${colClass(i)}`}>
                <button
                  type="button"
                  onClick={onStartFree}
                  className={
                    i === 0
                      ? 'inline-block rounded-[10px] bg-tm-green px-5 py-3 text-sm font-extrabold text-white transition-colors hover:bg-tm-green-dark'
                      : 'inline-block rounded-[10px] border-[1.5px] border-tm-edge bg-white px-5 py-[11px] text-sm font-extrabold text-tm-green transition-colors hover:bg-tm-mist'
                  }
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="mx-auto mt-4 max-w-[1060px] text-center text-[13px] leading-[1.6] text-tm-body">
        Unlimited means unlimited under fair use. There is no registration quota and nothing to buy back. If your
        volume is heavy enough to affect other users, we will talk to you before anything changes.
      </p>
    </Section>
  );
}
