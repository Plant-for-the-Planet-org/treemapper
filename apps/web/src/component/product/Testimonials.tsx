import { Quote } from 'lucide-react';
import { Eyebrow, IconTile, PhotoSlot, Section, SectionLead, SectionTitle } from './primitives';

// TODO: real quotes, names and portraits from the sites.
const QUOTES = [
  {
    quote:
      'Our field teams used to come back with notebooks and we would lose half of it in transcription. Now the data is already clean when they walk in the door, and the plots give us a survival number we are willing to put in front of a funder.',
    role: 'Restoration Coordinator · Organisation',
    photo: 'Portrait of the restoration coordinator',
  },
  {
    quote:
      'Logging fire patrol and firebreaks alongside the planting changed how our board sees the work. Two thirds of what we do is protection, and for the first time it shows up in the record.',
    role: 'Project Manager · Organisation',
    photo: 'Portrait of the project manager',
  },
  {
    quote:
      'Thirty students registered trees in the schoolyard in one afternoon, with no accounts to set up and no signal in half the grounds. We opened the export in a spreadsheet the next lesson.',
    role: 'Teacher · School',
    photo: 'Portrait of the teacher',
  },
];

export function Testimonials() {
  return (
    <Section className="bg-tm-mist">
      <div className="mb-9 max-w-[760px]">
        <Eyebrow>From the field</Eyebrow>
        <SectionTitle className="mb-3.5">What do teams say about TreeMapper?</SectionTitle>
        <SectionLead>Restoration coordinators, city foresters and teachers who use it week to week.</SectionLead>
      </div>

      <div className="mb-7 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {QUOTES.map(item => (
          <figure
            key={item.role}
            className="flex flex-col rounded-xl border border-tm-rule bg-white p-[26px] shadow-[0_2px_8px_rgba(0,0,0,.08)]"
          >
            <IconTile className="mb-4 size-[34px]">
              <Quote className="size-[17px] text-tm-ink" />
            </IconTile>
            <blockquote className="mb-5 flex-1 text-pretty text-base leading-[1.65] text-tm-ink">{item.quote}</blockquote>
            <figcaption className="flex items-center gap-3 border-t border-tm-line pt-[18px]">
              <div className="size-11 shrink-0 overflow-hidden rounded-full">
                <PhotoSlot label="" className="text-[9px]" />
              </div>
              <div>
                <div className="text-sm font-extrabold text-tm-ink">Name Surname</div>
                <div className="text-xs font-semibold text-tm-muted">{item.role}</div>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>

      <p className="text-[13px] font-bold text-tm-muted">
        Placeholder quotes and portraits, until the real ones arrive with names, roles and photos from the sites.
      </p>
    </Section>
  );
}
