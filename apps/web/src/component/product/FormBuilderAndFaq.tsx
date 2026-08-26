import { Check } from 'lucide-react';
import { Section, SectionLead, SectionTitle, ctaSecondarySm } from './primitives';

const BUILDER_POINTS = [
  {
    title: 'Any field type you need',
    body: 'Numbers with units, dropdowns, yes or no, dates, free text, photos and repeatable groups for sample trees.',
  },
  {
    title: 'Share by QR code',
    body: 'Field staff scan once and the form appears in their app, so a whole team collects the same fields the same way.',
  },
  {
    title: 'Required fields and validation',
    body: 'Mark what cannot be skipped and set sensible ranges, so bad measurements get caught in the field rather than in the analysis.',
  },
  {
    title: 'Custom fields export too',
    body: 'Everything you add appears in the dashboard and in your GeoJSON and CSV exports as normal properties.',
  },
];

const FAQS = [
  {
    q: 'Is TreeMapper free?',
    a: 'TreeMapper is free to start for anyone, with no card and no trial period, and it stays free for non-profits, small teams, classrooms and every organisation running its restoration work through the Forest Cloud. Large for-profit users take a commercial licence, which funds the development that keeps it free for everyone else. The code itself is open source.',
  },
  {
    q: 'Does TreeMapper work offline?',
    a: 'Yes. Registrations, measurements and photos are stored on the device and upload automatically once you are back in range, so remote planting sites with no mobile coverage are the normal case rather than an edge case. You can download map areas in advance.',
  },
  {
    q: 'How many people can I invite to a project?',
    a: 'As many as you need. Invite your whole field team, contractors, volunteers or an entire school classroom to the same project, with roles that control who can register, who can edit and verify, and who only has read access to the dashboard.',
  },
  {
    q: 'Who owns the data collected in TreeMapper?',
    a: 'You do. Your records stay yours and can be exported in full as GeoJSON or CSV at any time, or pulled through the public API. You decide what is published on a public project page and what stays private to your team.',
  },
  {
    q: 'Can TreeMapper track tree survival rate?',
    a: 'Yes. Set up permanent monitoring plots, remeasure them on a schedule, and TreeMapper calculates survival and growth for you. Paired baseline plots let you show results against a no-intervention comparison rather than a bare planting number.',
  },
  {
    q: 'What can you register besides trees?',
    a: 'Fourteen intervention types, including fire patrol, firebreaks, fencing, direct seeding, enrichment planting, grass suppression, invasive species removal, soil improvement, liberating regenerants and general maintenance, so protection and management work is documented alongside planting.',
  },
];

function FormPreview() {
  const fields = [
    { kind: 'Field 1 · Number', label: 'Height', hint: 'cm', active: true },
    { kind: 'Field 2 · Dropdown', label: 'Vigour', hint: 'Good · Fair · Poor' },
    { kind: 'Field 3 · Yes or no', label: 'Browsing damage', hint: 'Required' },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-tm-rule bg-white shadow-[0_2px_8px_rgba(0,0,0,.06)]">
      <div className="flex items-center justify-between gap-3 border-b border-tm-line px-4 py-3.5">
        <span className="text-[13px] font-extrabold text-tm-ink">Additional Data · Seedling check</span>
        <span className="rounded-full bg-tm-edge px-2.5 py-[5px] text-[10px] font-extrabold whitespace-nowrap text-tm-green">
          Published
        </span>
      </div>
      <div className="flex flex-col gap-3 p-4">
        {fields.map(field => (
          <div key={field.label}>
            <div className="mb-[5px] text-[11px] font-extrabold text-tm-muted">{field.kind}</div>
            <div
              className={`flex justify-between rounded-lg px-3 py-[11px] text-[13px] font-semibold text-tm-body ${
                field.active ? 'border-[1.5px] border-tm-green' : 'border border-tm-rule'
              }`}
            >
              <span>{field.label}</span>
              <span className="text-tm-muted">{field.hint}</span>
            </div>
          </div>
        ))}
        <div className="rounded-lg border-[1.5px] border-dashed border-tm-edge px-3 py-[11px] text-center text-[13px] font-extrabold text-tm-green">
          Add another field
        </div>
      </div>
    </div>
  );
}

export function FormBuilderAndFaq({ onOpenFormBuilder }: { onOpenFormBuilder: () => void }) {
  return (
    <Section className="bg-white">
      <div className="mb-9 max-w-[720px]">
        <SectionTitle className="mb-3.5">Can you build your own data collection forms?</SectionTitle>
        <SectionLead>
          Yes. The form builder lets you add exactly the fields your protocol needs, then share the form with your
          field team by QR code. No developer, no separate survey tool, and the answers land in the same dataset as the
          trees.
        </SectionLead>
      </div>

      <div className="mb-20 grid items-center gap-10 lg:mb-28 lg:grid-cols-[1.05fr_1fr]">
        <div>
          <div className="mb-6 flex flex-col gap-4">
            {BUILDER_POINTS.map(point => (
              <div key={point.title} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-tm-edge">
                  <Check className="size-3 text-tm-green" strokeWidth={3} />
                </span>
                <div>
                  <div className="mb-[3px] text-[15px] font-extrabold text-tm-ink">{point.title}</div>
                  <div className="text-sm leading-[1.6] text-tm-body">{point.body}</div>
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={onOpenFormBuilder} className={ctaSecondarySm()}>
            Open the form builder
          </button>
        </div>

        <FormPreview />
      </div>

      <div className="mb-9 max-w-[720px]">
        <SectionTitle className="mb-3.5">Frequently asked questions about TreeMapper</SectionTitle>
        <SectionLead>
          The questions restoration teams, funders and teachers ask us most often, answered directly.
        </SectionLead>
      </div>

      <div className="grid gap-px overflow-hidden rounded-xl border border-tm-line bg-tm-line md:grid-cols-2">
        {FAQS.map(faq => (
          <div key={faq.q} className="bg-white p-[26px]">
            <h3 className="mb-2.5 text-[17px] font-extrabold text-tm-ink">{faq.q}</h3>
            <p className="text-sm leading-[1.7] text-tm-body">{faq.a}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
