import { Briefcase, Building2, GraduationCap, Microscope, Trees, Users } from 'lucide-react';
import { Section, SectionLead, SectionTitle } from './primitives';

const AUDIENCES = [
  {
    icon: Trees,
    title: 'Forest restoration organisations',
    body: 'Permanent monitoring plots and paired baselines produce survival and growth numbers you can defend in a funder report or a paper.',
    cta: 'Start monitoring',
  },
  {
    icon: Briefcase,
    title: 'Companies funding tree planting',
    body: 'Every tree you fund carries a location, a date, a species and a photo, so your sustainability claims rest on records rather than a summary.',
    cta: 'See the evidence',
  },
  {
    icon: Building2,
    title: 'Cities and urban forestry teams',
    body: 'Build a street tree inventory that stays current, log maintenance and removals in the field, and hand the GeoJSON to the municipal GIS.',
    cta: 'Map your trees',
  },
  {
    icon: Microscope,
    title: 'Researchers and university students',
    body: 'Collect standardised plot data for a thesis or field study, add your own measurement fields, and export raw GeoJSON straight into R, Python or QGIS.',
    cta: 'Use it for fieldwork',
  },
  {
    icon: GraduationCap,
    title: 'Schools and classrooms',
    body: 'Invite a whole class, give everyone the same simple form, and turn the schoolyard or local woodland into a dataset students can analyse in a lesson.',
    cta: 'Teach with it',
  },
  {
    icon: Users,
    title: 'Community groups and volunteers',
    body: 'Run a planting day with shared devices, keep one clean record of what went in the ground, and show your neighbourhood what happened next.',
    cta: 'Organise a planting',
  },
];

export function Audiences() {
  return (
    <Section className="bg-white">
      <div className="mb-9 max-w-[760px]">
        <SectionTitle className="mb-3.5">Who uses TreeMapper?</SectionTitle>
        <SectionLead>
          The app is deliberately simple enough that a volunteer, a student or a first-day field hire can use it
          straight away, and you can invite your whole team, class or research group to the same project.
        </SectionLead>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {AUDIENCES.map(({ icon: Icon, title, body, cta }) => (
          <div key={title} className="rounded-xl border border-tm-line p-6">
            <div className="mb-4 flex size-[46px] items-center justify-center rounded-xl border border-tm-edge bg-tm-mist">
              <Icon className="size-6 text-tm-ink" />
            </div>
            <h3 className="mb-2 text-[17px] font-extrabold text-tm-ink">{title}</h3>
            <p className="mb-3.5 text-[13px] leading-[1.65] text-tm-body">{body}</p>
            <span className="text-xs font-extrabold text-tm-green">{cta}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}
