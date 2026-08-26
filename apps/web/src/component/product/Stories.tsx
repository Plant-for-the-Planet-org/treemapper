import { Eyebrow, PhotoSlot, Section, SectionLead, SectionTitle, ctaSecondary } from './primitives';

// TODO: replace with real blog posts once the write-ups exist.
const STORIES = [
  {
    kicker: 'Restoration · Yucatán',
    title: 'How a 15-person field team standardised 40 planting sites',
    body: 'Placeholder summary. Swap in the real story of the switch from paper forms to TreeMapper and what it did to their reporting.',
    photo: 'Photo from the Yucatán restoration site',
  },
  {
    kicker: 'Urban forestry · Germany',
    title: 'A city tree inventory that stays current between budgets',
    body: "Placeholder summary. Replace with the municipal team's account of logging maintenance and removals in the field.",
    photo: 'Photo of urban tree inventory work',
  },
  {
    kicker: 'Schools · Ghana',
    title: 'Thirty students, one afternoon, one clean dataset',
    body: "Placeholder summary. Replace with the class's own account of mapping the schoolyard and analysing the export in the next lesson.",
    photo: 'Photo of students registering trees',
  },
];

export function Stories() {
  return (
    <Section className="bg-white">
      <div className="mb-8 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end lg:gap-10">
        <div className="max-w-[720px]">
          <Eyebrow>From the Blog</Eyebrow>
          <SectionTitle className="mb-3.5">Stories from teams using TreeMapper</SectionTitle>
          <SectionLead>
            Longer write-ups of how a project set up its plots, what its survival numbers looked like, and what it
            changed as a result.
          </SectionLead>
        </div>
        <a
          href="https://www.plant-for-the-planet.org/blog/"
          target="_blank"
          rel="noopener noreferrer"
          className={ctaSecondary()}
        >
          Read the blog
        </a>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {STORIES.map(story => (
          <div
            key={story.title}
            className="overflow-hidden rounded-xl border border-tm-rule shadow-[0_2px_8px_rgba(0,0,0,.08)]"
          >
            <div className="aspect-[16/10]">
              <PhotoSlot label={story.photo} />
            </div>
            <div className="px-[22px] py-5">
              <div className="mb-2 text-[11px] font-extrabold tracking-[.6px] uppercase text-tm-muted">
                {story.kicker}
              </div>
              <h3 className="mb-2 text-pretty text-[17px] font-extrabold text-tm-ink">{story.title}</h3>
              <p className="mb-3 text-sm leading-[1.6] text-tm-body">{story.body}</p>
              <span className="text-xs font-extrabold text-tm-green">Read the story</span>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
