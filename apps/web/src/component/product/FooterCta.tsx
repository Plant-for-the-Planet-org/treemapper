'use client';

import Image from 'next/image';

const PLAY_STORE = 'https://play.google.com/store/apps/details?id=org.pftp.treemapper';
const APP_STORE = 'https://apps.apple.com/in/app/treemapper/id1524353784';

/**
 * The two store marks live in `public/`. Both are drawn for the dark badge every
 * store ships: Google's stays full colour, and Apple's is the light grey mark
 * meant to sit on black. So the buttons are black rather than lime, with a hair
 * of white edge to lift them off the near-black footer.
 */
const STORES = [
  { label: 'Google Play', href: PLAY_STORE, src: '/playstore.png' },
  { label: 'App Store', href: APP_STORE, src: '/apple.png' },
];

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
          {STORES.map(store => (
            <a
              key={store.label}
              href={store.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 rounded-[12px] border border-white/20 bg-black px-[22px] py-3 text-sm font-extrabold text-white transition-colors hover:border-white/35 hover:bg-[#111]"
            >
              <Image
                src={store.src}
                alt=""
                width={18}
                height={18}
                className="size-[18px] shrink-0"
              />
              {store.label}
            </a>
          ))}
          <button
            type="button"
            onClick={onOpenDashboard}
            className="rounded-[12px] border-[1.5px] border-white/35 px-[22px] py-3 text-sm font-extrabold text-white transition-colors hover:bg-white/10"
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
