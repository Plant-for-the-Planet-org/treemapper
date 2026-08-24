import { Eyebrow, Section, SectionLead, SectionTitle, ctaPrimary } from './primitives';

const GROUPS = [
  {
    accent: '#68B030',
    title: 'Planting and seeding',
    body: 'Single trees, multi-tree areas, direct seeding, enrichment planting, seed rain traps and soil improvement.',
    count: '6 types',
  },
  {
    accent: '#F2994A',
    title: 'Protection',
    body: 'Fire patrol, fire suppression, firebreaks, fencing, stopping harvesting and invasive species removal.',
    count: '6 types',
  },
  {
    accent: '#56CCF2',
    title: 'Regeneration and management',
    body: 'Marking and liberating regenerants, grass suppression, maintenance, plus a custom Other type.',
    count: '5 types',
  },
];

/** Each type keeps this colour in the app, on the dashboard map and in exports. */
const TYPES = [
  { label: 'Single Tree Plantation', color: '#007A49' },
  { label: 'Multi Tree Plantation', color: '#68B030' },
  { label: 'Direct Seeding', color: '#6FCF97' },
  { label: 'Enrichment Planting', color: '#EB67CE' },
  { label: 'Seed Rain', color: '#2F80ED' },
  { label: 'Soil Improvement', color: '#6D4230' },
  { label: 'Fire Patrol', color: '#F2994A' },
  { label: 'Fire Suppression', color: '#F2C94C' },
  { label: 'Firebreaks', color: '#E86F56' },
  { label: 'Fencing', color: '#48AADD' },
  { label: 'Stop Tree Harvesting', color: '#4F4F4F' },
  { label: 'Removal of Invasive Species', color: '#EB5757' },
  { label: 'Marking Regenerant', color: '#27AE60' },
  { label: 'Liberating Regenerant', color: '#56CCF2' },
  { label: 'Grass Suppression', color: '#219653' },
  { label: 'Maintenance', color: '#6C63FF' },
  { label: 'Other', color: '#9B51E0' },
];

const DOCS = 'https://docs.treemapper.app/en';

export function Interventions() {
  return (
    <Section id="interventions" className="bg-white">
      <div className="mb-8 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end lg:gap-10">
        <div className="max-w-[720px]">
          <Eyebrow>Interventions</Eyebrow>
          <SectionTitle className="mb-3.5">What is an intervention, and which ones can you record?</SectionTitle>
          <SectionLead>
            Planting is one intervention among many. Patrolling for fire, cutting a firebreak, releasing a regenerant
            from grass, fencing out livestock, improving soil: this is most of the work, and most of the cost.
            TreeMapper gives every type its own geometry, fields and colour, so the full history of a site is visible
            instead of just the days you planted.
          </SectionLead>
        </div>
        <a href={DOCS} target="_blank" rel="noopener noreferrer" className={ctaPrimary()}>
          See all intervention types
        </a>
      </div>

      <div className="mb-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {GROUPS.map(group => (
          <div key={group.title} className="flex overflow-hidden rounded-lg border border-tm-line bg-tm-cream">
            <div className="w-1.5 shrink-0" style={{ background: group.accent }} />
            <div className="px-[22px] py-5">
              <h3 className="mb-[7px] text-base font-extrabold text-tm-ink">{group.title}</h3>
              <p className="mb-3 text-[13px] leading-[1.6] text-tm-body">{group.body}</p>
              <div className="text-xs font-extrabold text-tm-muted">{group.count}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-tm-rule bg-tm-cream p-6">
        <div className="mb-4 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-baseline sm:gap-5">
          <div className="text-[13px] font-extrabold text-tm-ink">
            Every type, and the colour it keeps in the app, on the dashboard map and in your exports
          </div>
          <a
            href={DOCS}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-extrabold whitespace-nowrap text-tm-green hover:underline"
          >
            Read what each one records
          </a>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {TYPES.map(type => (
            <a
              key={type.label}
              href={DOCS}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full border border-tm-rule bg-white px-[13px] py-2 text-[12.5px] font-bold text-tm-body transition-colors hover:border-tm-green/40"
            >
              <span className="size-[9px] rounded-full" style={{ background: type.color }} />
              {type.label}
            </a>
          ))}
        </div>
      </div>
    </Section>
  );
}
