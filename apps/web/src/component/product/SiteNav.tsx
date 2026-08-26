'use client';

import Image from 'next/image';
import { Grid3x3, Menu } from 'lucide-react';
import tmLogo from '@/assets/tmlogo.png';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ctaPrimarySm } from './primitives';

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
          <Grid3x3 className="size-5" />
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
          className={ctaPrimarySm('hidden px-[18px] py-[11px] text-[13px] sm:inline-flex')}
        >
          Open Dashboard
        </button>

        <Sheet>
          <SheetTrigger className="flex size-[38px] items-center justify-center rounded-[10px] border border-tm-rule bg-tm-cream text-tm-ink lg:hidden">
            <Menu className="size-5" />
            <span className="sr-only">Open menu</span>
          </SheetTrigger>
          <SheetContent side="right" className="bg-white">
            <SheetHeader>
              <SheetTitle className="text-tm-ink">TreeMapper</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-1 px-4">
              {NAV_LINKS.map(link => (
                <a
                  key={link.label}
                  href={link.href}
                  className="rounded-lg px-3 py-3 text-[15px] font-bold text-tm-body hover:bg-tm-mist hover:text-tm-green"
                >
                  {link.label}
                </a>
              ))}
              {!isAuthenticated && (
                <button
                  type="button"
                  onClick={onSignIn}
                  className="mt-2 rounded-lg px-3 py-3 text-left text-[15px] font-bold text-tm-green hover:bg-tm-mist"
                >
                  Sign In
                </button>
              )}
              <button type="button" onClick={onOpenDashboard} className={ctaPrimarySm('mt-2 sm:hidden')}>
                Open Dashboard
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
