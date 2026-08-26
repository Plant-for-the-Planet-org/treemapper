import { GitCompare, Percent, Ruler } from 'lucide-react';
import { Eyebrow, IconTile, Pill, Section, SectionLead, SectionTitle, ctaPrimarySm, ctaSecondarySm } from './primitives';

const PLOT_TAGS = ['Circular plots', 'Rectangular plots', 'Plot Groups', 'Paired baselines', 'Remeasurement schedule'];

const WHAT_A_PLOT_TELLS = [
  {
    icon: Percent,
    title: 'Survival rate you can defend',
    body: 'Every tagged tree is alive, deceased or newly recruited at each visit, so the rate is counted rather than estimated.',
  },
  {
    icon: Ruler,
    title: 'Growth, not just presence',
    body: 'Height and diameter on the same trees over time show whether a stand is thriving or merely hanging on.',
  },
  {
    icon: GitCompare,
    title: 'A baseline to compare against',
    body: 'Pair a treated plot with an untouched control plot and your results read as a difference, not an isolated number.',
  },
];

/** Tagged sample trees inside the circular plot: 4 alive, 1 recruit, 1 deceased. */
const SAMPLE_TREES = [
  { x: 168, y: 92, s: 0.34, n: 1, fill: '#007A49', text: '#FFFFFF' },
  { x: 252, y: 100, s: 0.3, n: 2, fill: '#007A49', text: '#FFFFFF' },
  { x: 160, y: 166, s: 0.28, n: 3, fill: '#007A49', text: '#FFFFFF' },
  { x: 254, y: 168, s: 0.32, n: 4, fill: '#007A49', text: '#FFFFFF' },
  { x: 210, y: 60, s: 0.26, n: 5, fill: '#68B030', text: '#2F3336' },
  { x: 210, y: 192, s: 0.24, n: 6, fill: '#EB5757', text: '#FFFFFF' },
];

function PlotDiagram() {
  return (
    <svg
      viewBox="0 0 420 250"
      aria-label="Circular monitoring plot with tagged sample trees"
      className="absolute inset-0 block h-full w-full"
    >
      <rect width="420" height="250" fill="#EAF1E2" />
      <g fill="#8FB474" opacity=".55">
        <use href="#tmClump" transform="translate(38,44) scale(.5)" />
        <use href="#tmClump" transform="translate(372,52) scale(.46)" />
        <use href="#tmClump" transform="translate(46,214) scale(.44)" />
        <use href="#tmClump" transform="translate(382,206) scale(.48)" />
      </g>
      <circle cx="210" cy="125" r="96" fill="rgba(0,122,73,.10)" stroke="#007A49" strokeWidth="2.5" strokeDasharray="9 6" />
      <circle cx="210" cy="125" r="52" fill="none" stroke="rgba(0,122,73,.35)" strokeWidth="1.5" />
      <circle cx="210" cy="125" r="4.5" fill="#007A49" />
      <path d="M210 125 L306 125" stroke="#007A49" strokeWidth="1.5" strokeDasharray="4 4" />
      <text x="252" y="118" fontSize="11" fontWeight="700" fill="#007A49">
        5 m
      </text>
      <text x="196" y="146" fontSize="10" fontWeight="700" fill="#4D5153">
        centre
      </text>

      <g fill="#7EA468">
        {SAMPLE_TREES.map(t => (
          <use key={`s-${t.n}`} href="#tmClump" transform={`translate(${t.x},${t.y}) scale(${t.s})`} />
        ))}
      </g>
      <g fill="#B4D398" transform="translate(0,-4)">
        {SAMPLE_TREES.map(t => (
          <use key={`l-${t.n}`} href="#tmClump" transform={`translate(${t.x},${t.y}) scale(${t.s})`} />
        ))}
      </g>

      <g fontSize="9" fontWeight="800" textAnchor="middle">
        {SAMPLE_TREES.map(t => (
          <g key={`tag-${t.n}`}>
            <circle cx={t.x} cy={t.y} r="9" fill={t.fill} />
            <text x={t.x} y={t.y + 3} fill={t.text}>
              {t.n}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}

export function MonitoringPlots() {
  return (
    <Section id="monitoring-plots" className="border-t border-tm-line bg-tm-cream">
      <div className="mb-9 max-w-[760px]">
        <Eyebrow>Monitoring Plots</Eyebrow>
        <SectionTitle className="mb-3.5">What is a monitoring plot, and what does it tell you about the forest?</SectionTitle>
        <SectionLead>
          A monitoring plot is a small area you measure again and again, in the same place, on a schedule. Instead of
          guessing what happened across a hundred hectares, you measure a few square metres properly and let the plot
          speak for the stand around it. It is the difference between a planting number and a survival rate.
        </SectionLead>
      </div>

      <div className="grid items-start gap-11 lg:grid-cols-[1fr_1.05fr]">
        <div>
          <div className="overflow-hidden rounded-xl border border-tm-rule bg-white shadow-[0_2px_8px_rgba(0,0,0,.08)]">
            <div className="flex items-center justify-between gap-3 border-b border-tm-line px-4 py-3.5">
              <span className="text-[13px] font-extrabold text-tm-ink">Monitoring Plot 14 · Circular, r = 5 m</span>
              <span className="rounded-full bg-tm-edge px-2.5 py-[5px] text-[10px] font-extrabold whitespace-nowrap text-tm-green">
                Permanent
              </span>
            </div>

            <div className="relative h-[250px] bg-tm-canopy">
              <PlotDiagram />
              <div className="absolute bottom-3.5 left-3.5 flex flex-wrap gap-2">
                <span className="rounded-full bg-tm-green px-2.5 py-[5px] text-[10px] font-extrabold text-white">Alive 4</span>
                <span className="rounded-full bg-tm-lime px-2.5 py-[5px] text-[10px] font-extrabold text-[#2F3336]">
                  New recruit 1
                </span>
                <span className="rounded-full bg-[#EB5757] px-2.5 py-[5px] text-[10px] font-extrabold text-white">
                  Deceased 1
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 border-t border-tm-line">
              <div className="border-r border-tm-line p-4">
                <div className="text-[22px] font-extrabold tracking-[-.5px] text-tm-green">
                  83<span className="text-sm text-tm-muted">%</span>
                </div>
                <div className="mt-0.5 text-[11px] font-bold text-tm-muted">Survival, month 18</div>
              </div>
              <div className="border-r border-tm-line p-4">
                <div className="text-[22px] font-extrabold tracking-[-.5px] text-tm-green">
                  142<span className="text-sm text-tm-muted"> cm</span>
                </div>
                <div className="mt-0.5 text-[11px] font-bold text-tm-muted">Mean height</div>
              </div>
              <div className="p-4">
                <div className="text-[22px] font-extrabold tracking-[-.5px] text-tm-green">4</div>
                <div className="mt-0.5 text-[11px] font-bold text-tm-muted">Remeasurements</div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2.5">
            {PLOT_TAGS.map(tag => (
              <Pill key={tag}>{tag}</Pill>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-[18px] text-xl font-extrabold text-tm-ink">What a plot lets you say about the forest</h3>
          <div className="grid gap-px overflow-hidden rounded-xl border border-tm-rule bg-tm-rule">
            {WHAT_A_PLOT_TELLS.map(({ icon: Icon, title, body }) => (
              <div key={title} className="bg-white p-5">
                <IconTile className="mb-3 size-9">
                  <Icon className="size-[18px] text-tm-ink" />
                </IconTile>
                <h4 className="mb-1.5 text-sm font-extrabold text-tm-ink">{title}</h4>
                <p className="text-[13px] leading-[1.6] text-tm-body">{body}</p>
              </div>
            ))}
          </div>

          <p className="mt-[18px] mb-5 text-sm leading-[1.7] text-tm-body">
            Plots also give you canopy cover and natural regeneration, remeasurement reminders, and the ground truth a
            satellite or drone analysis needs to be calibrated against.
          </p>

          <div className="flex flex-wrap gap-3">
            <a
              href="https://docs.treemapper.app/en"
              target="_blank"
              rel="noopener noreferrer"
              className={ctaPrimarySm()}
            >
              How monitoring plots work
            </a>
            <a href="#dashboard" className={ctaSecondarySm()}>
              Create your first plot
            </a>
          </div>
        </div>
      </div>
    </Section>
  );
}
