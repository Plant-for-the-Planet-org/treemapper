'use client';

import Image from 'next/image';
import { Menu } from 'lucide-react';
import tmLogo from '@/assets/tmlogo.png';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { productFont } from './font';
import { ctaPrimarySm } from './primitives';

/** Dot centres of the app switcher grid, straight from the design. */
const SWITCHER_DOTS = [5, 12, 19];

/**
 * App switcher mark: a 3x3 grid of dots. Lucide's `Grid3x3` is a ruled grid,
 * a different glyph, so the design's own circles are drawn here instead.
 */
function AppSwitcherIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      {SWITCHER_DOTS.flatMap(cy =>
        SWITCHER_DOTS.map(cx => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2" />),
      )}
    </svg>
  );
}

const NAV_LINKS = [
  { label: 'App', href: '#what-is' },
  { label: 'Dashboard', href: '#dashboard' },
  { label: 'Interventions', href: '#interventions' },
  { label: 'Monitoring', href: '#monitoring-plots' },
  { label: 'Data', href: '#data' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Docs', href: 'https://docs.treemapper.app/en' },
];

export function SiteNav({
  isAuthenticated,
  onSignIn,
  onOpenDashboard,
}: {
  isAuthenticated: boolean;
  onSignIn: () => void;
  onOpenDashboard: () => void;
}) {
  return (
    <nav className="relative z-20 flex h-[76px] items-center justify-between border-b border-tm-line bg-white px-5 sm:px-8 md:px-10">
      <div className="flex items-center gap-6">
        <a href="#top" className="flex items-center gap-[11px]">
          <Image src={tmLogo} alt="TreeMapper logo" width={32} height={32} className="rounded-[7px]" priority />
          <span className="text-xl font-extrabold tracking-[-.3px] text-tm-ink">TreeMapper</span>
        </a>
        <div className="hidden items-center gap-6 text-[13px] font-bold text-tm-body lg:flex">
          {NAV_LINKS.map(link => (
            <a key={link.label} href={link.href} className="transition-colors hover:text-tm-green">
              {link.label}
            </a>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3.5">
        <a
          href="https://www.plant-for-the-planet.org/"
          target="_blank"
          rel="noopener noreferrer"
          title="Switch app"
          className="hidden size-[38px] items-center justify-center rounded-[10px] border border-tm-rule bg-tm-cream text-tm-ink transition-colors hover:border-tm-edge hover:bg-tm-mist sm:flex"
        >
          <AppSwitcherIcon className="size-5" />
          <span className="sr-only">Switch app</span>
        </a>

        {!isAuthenticated && (
          <button
            type="button"
            onClick={onSignIn}
            className="hidden text-[13px] font-bold text-tm-body transition-colors hover:text-tm-green sm:block"
          >
            Sign In
          </button>
        )}

        {/* Below sm the nav only has room for the logo and the menu. */}
        <button
          type="button"
          onClick={onOpenDashboard}
          className={ctaPrimarySm('hidden rounded-[10px] px-[18px] py-[11px] text-[13px] sm:inline-flex')}
        >
          Open Dashboard
        </button>

        <Sheet>
          <SheetTrigger className="flex size-[38px] items-center justify-center rounded-[10px] border border-tm-rule bg-tm-cream text-tm-ink lg:hidden">
            <Menu className="size-5" />
            <span className="sr-only">Open menu</span>
          </SheetTrigger>
          <SheetContent side="right" className={cn(productFont.className, 'bg-white')}>
            <SheetHeader>
              {/* SheetTitle ships `font-heading`, which resolves to Inter. An inline
                  style is the only override a utility class cannot lose to. */}
              <SheetTitle className="text-tm-ink" style={productFont.style}>
                TreeMapper
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-1 px-4">
              {NAV_LINKS.map(link => (
                <a
                  key={link.label}
                  href={link.href}
                  className="rounded-[8px] px-3 py-3 text-[15px] font-bold text-tm-body hover:bg-tm-mist hover:text-tm-green"
                >
                  {link.label}
                </a>
              ))}
              {!isAuthenticated && (
                <button
                  type="button"
                  onClick={onSignIn}
                  className="mt-2 rounded-[8px] px-3 py-3 text-left text-[15px] font-bold text-tm-green hover:bg-tm-mist"
                >
                  Sign In
                </button>
              )}
              <button type="button" onClick={onOpenDashboard} className={ctaPrimarySm('mt-2 rounded-[10px] sm:hidden')}>
                Open Dashboard
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
