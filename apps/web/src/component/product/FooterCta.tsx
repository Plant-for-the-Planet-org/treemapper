'use client';

const PLAY_STORE = 'https://play.google.com/store/apps/details?id=org.pftp.treemapper';
const APP_STORE = 'https://apps.apple.com/in/app/treemapper/id1524353784';

/** Kept from the old login footer so the legal links do not disappear. */
const LEGAL = [
  {
    label: 'Imprint',
    href: 'https://www.plant-for-the-planet.org/imprint/',
  },
  { label: 'Privacy', href: 'https://www.plant-for-the-planet.org/privacy-terms/' },
  { label: 'Terms', href: 'https://www.plant-for-the-planet.org/terms-and-conditions/' },
];

export function FooterCta({ onOpenDashboard }: { onOpenDashboard: () => void }) {
  return (
    <footer id="download">
      <div className="flex flex-col items-start justify-between gap-6 bg-tm-ink px-5 py-10 sm:px-8 md:flex-row md:items-center md:px-14">
        <div>
          <div className="mb-1.5 text-xl font-extrabold text-white sm:text-[21px]">
            Any ideas how we can improve TreeMapper?
          </div>
          <a
            href="mailto:treemapper@plant-for-the-planet.org"
            className="text-sm text-white/70 underline-offset-4 hover:text-white hover:underline"
          >
            Tell us at treemapper@plant-for-the-planet.org
          </a>
        </div>

        <div className="flex flex-wrap gap-3">
          <a
            href={PLAY_STORE}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl bg-tm-lime px-[22px] py-[13px] text-sm font-extrabold text-[#2F3336] transition-opacity hover:opacity-90"
          >
            Google Play
          </a>
          <a
            href={APP_STORE}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl bg-tm-lime px-[22px] py-[13px] text-sm font-extrabold text-[#2F3336] transition-opacity hover:opacity-90"
          >
            App Store
          </a>
          <button
            type="button"
            onClick={onOpenDashboard}
            className="rounded-xl border-[1.5px] border-white/35 px-[22px] py-3 text-sm font-extrabold text-white transition-colors hover:bg-white/10"
          >
            Open Dashboard
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center justify-between gap-3 bg-tm-ink px-5 pb-8 text-xs text-white/50 sm:flex-row sm:px-8 md:px-14">
        <span>© {new Date().getFullYear()} Plant-for-the-Planet Foundation</span>
        <div className="flex gap-5">
          {LEGAL.map(link => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold hover:text-white"
            >
              {link.label}
            </a>
          ))}
          <a
            href="https://docs.treemapper.app/en"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold hover:text-white"
          >
            Docs
          </a>
        </div>
      </div>
    </footer>
  );
}
