import { Eyebrow, Section, SectionLead, SectionTitle, ctaSecondary } from './primitives';

// TODO: swap in the real guide videos once the links and captions land.
const PLACEHOLDER_EMBED = 'https://www.youtube-nocookie.com/embed/uci6w-nPAR4?rel=0';

const GUIDES = [
  {
    length: '3 min',
    title: 'How to register a tree',
    body: 'Register a single tree and a whole planting area: GPS, species, height, diameter and photo, start to finish, with no signal.',
  },
  {
    length: '6 min',
    title: 'How to record a monitoring plot',
    body: 'Lay out a circular plot, tag every tree inside it, and come back six months later to remeasure the same trees.',
  },
  {
    length: '4 min',
    title: 'How to log an intervention',
    body: 'Record a fire patrol route, a firebreak and a fencing area, so protection work shows up in the record alongside planting.',
  },
];

export function VideoGuides() {
  return (
    <Section className="border-t border-tm-line bg-tm-cream">
      <div className="mb-8 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end lg:gap-10">
        <div className="max-w-[720px]">
          <Eyebrow>Video Guides</Eyebrow>
          <SectionTitle className="mb-3.5">How do you actually use it in the field?</SectionTitle>
          <SectionLead>
            Short walkthroughs filmed on site, made for showing a new field team on their first morning. Watch on a
            phone, offline, in any of the app&apos;s languages.
          </SectionLead>
        </div>
        <a href="https://docs.treemapper.app/en" target="_blank" rel="noopener noreferrer" className={ctaSecondary()}>
          All video guides
        </a>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {GUIDES.map(guide => (
          <div
            key={guide.title}
            className="overflow-hidden rounded-xl border border-tm-rule bg-white shadow-[0_2px_8px_rgba(0,0,0,.08)]"
          >
            <div className="aspect-video bg-tm-ink">
              <iframe
                src={PLACEHOLDER_EMBED}
                title={guide.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="block h-full w-full border-0"
              />
            </div>
            <div className="px-[22px] py-5">
              <div className="mb-2 flex items-center gap-2.5">
                <span className="rounded-full bg-tm-edge px-2.5 py-[5px] text-[10px] font-extrabold text-tm-green">
                  {guide.length}
                </span>
                <span className="text-[11px] font-extrabold tracking-[.6px] uppercase text-tm-muted">Field guide</span>
              </div>
              <h3 className="mb-[7px] text-[17px] font-extrabold text-tm-ink">{guide.title}</h3>
              <p className="text-sm leading-[1.6] text-tm-body">{guide.body}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-[18px] text-[13px] font-bold text-tm-muted">
        Placeholder video, repeated three times, until the real links and captions are in.
      </p>
    </Section>
  );
}
