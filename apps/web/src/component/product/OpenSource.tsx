import { Check } from 'lucide-react';
import { Section, SectionTitle, ctaPrimary, ctaSecondary } from './primitives';

const ROADMAP = [
  { title: 'Multi-user projects and roles', status: 'Shipped', done: true },
  { title: 'Custom form builder with QR sharing', status: 'Shipped', done: true },
  { title: 'Offline satellite basemap packs', status: 'In progress', done: false },
  { title: 'Embeddable widgets for partner programmes', status: 'Sponsored build, in scoping', done: false },
  { title: 'Classroom mode with teacher review', status: 'Planned', done: false },
];

export function OpenSource() {
  return (
    <Section className="bg-tm-mist" innerClassName="grid items-center gap-11 lg:grid-cols-[1.05fr_1fr]">
      <div>
        <div className="mb-[18px] inline-block rounded-full border border-tm-edge bg-white px-3 py-[7px] text-[11px] font-extrabold tracking-[1.4px] uppercase text-tm-green">
          Open source
        </div>
        <SectionTitle className="mb-4">Want TreeMapper to do something it doesn&apos;t do yet?</SectionTitle>
        <p className="mb-[18px] max-w-[520px] text-[17px] leading-[1.65] text-tm-body">
          Every line of TreeMapper is public, so you can read it, open an issue or send a pull request. If your work
          needs something specific, such as an embeddable widget for a partner programme, you can sponsor that build
          directly and it ships to everyone.
        </p>
        <p className="mb-6 max-w-[520px] text-[15px] leading-[1.65] text-tm-muted">
          You can also support the foundation, which keeps TreeMapper free for non-profits, small teams and classrooms.
        </p>
        <div className="flex flex-wrap gap-3">
          <a href="mailto:treemapper@plant-for-the-planet.org" className={ctaPrimary()}>
            Sponsor a feature
          </a>
          <a
            href="https://github.com/Plant-for-the-Planet-org"
            target="_blank"
            rel="noopener noreferrer"
            className={ctaSecondary()}
          >
            Contribute on GitHub
          </a>
          <a
            href="https://www.plant-for-the-planet.org/donate/"
            target="_blank"
            rel="noopener noreferrer"
            className={ctaSecondary()}
          >
            Support the foundation
          </a>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-tm-rule bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-tm-line px-5 py-[15px]">
          <span className="text-sm font-extrabold text-tm-ink">What we are building</span>
          <span className="text-[11px] font-bold text-tm-muted">Public roadmap</span>
        </div>
        {ROADMAP.map((item, i) => (
          <div
            key={item.title}
            className={`flex items-start gap-3 px-5 py-[15px] ${i < ROADMAP.length - 1 ? 'border-b border-tm-line' : ''}`}
          >
            {item.done ? (
              <span className="mt-px flex size-5 shrink-0 items-center justify-center rounded-full bg-tm-edge">
                <Check className="size-3 text-tm-green" strokeWidth={3} />
              </span>
            ) : (
              <span className="mt-px size-5 shrink-0 rounded-full border border-tm-rule bg-tm-cream" />
            )}
            <div className="flex-1">
              <div className="text-[13px] font-extrabold text-tm-ink">{item.title}</div>
              <div className="text-[11px] font-bold text-tm-muted">{item.status}</div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
