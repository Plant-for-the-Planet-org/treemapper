import { Section } from './primitives';

const APPS = [
  {
    name: 'Restoration Platform',
    blurb: 'Donate to 300+ restoration projects worldwide',
    href: 'https://www.plant-for-the-planet.org/',
    current: false,
  },
  { name: 'TreeMapper', blurb: 'To monitor forest restoration', href: '#top', current: true },
  { name: 'FireAlert', blurb: 'To rapidly stop forest fires', href: 'https://firealert.plant-for-the-planet.org/', current: false },
  { name: 'Tracer', blurb: 'For deforestation-free supply chains', href: 'https://www.plant-for-the-planet.org/', current: false },
];

export function ForestCloud() {
  return (
    <Section className="border-t border-tm-line bg-white md:py-16">
      <div className="mb-[22px] flex flex-col items-start justify-between gap-5 lg:flex-row lg:items-end lg:gap-10">
        <div>
          <div className="mb-2.5 text-[11px] font-extrabold tracking-[1.4px] uppercase text-tm-lime">Forest Cloud</div>
          <h2 className="text-2xl font-extrabold text-tm-ink">
            TreeMapper is part of the Plant-for-the-Planet Forest Cloud
          </h2>
        </div>
        <p className="max-w-[430px] text-sm leading-[1.6] text-tm-body">
          Free software for funding, managing and monitoring restoration and conservation projects worldwide.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {APPS.map(app => (
          <a
            key={app.name}
            href={app.href}
            target={app.href.startsWith('#') ? undefined : '_blank'}
            rel={app.href.startsWith('#') ? undefined : 'noopener noreferrer'}
            className={`rounded-xl border p-[18px] transition-colors ${
              app.current ? 'border-tm-edge bg-tm-mist' : 'border-tm-line hover:bg-tm-cream'
            }`}
          >
            <div className={`mb-1.5 text-sm font-extrabold ${app.current ? 'text-tm-green' : 'text-tm-ink'}`}>
              {app.name}
            </div>
            <div className={`text-xs leading-[1.5] ${app.current ? 'text-tm-body' : 'text-tm-muted'}`}>{app.blurb}</div>
          </a>
        ))}
      </div>
    </Section>
  );
}
