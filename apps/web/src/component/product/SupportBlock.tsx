'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ctaPrimary, ctaSecondarySm } from './primitives';

const AMOUNTS = [10, 50, 250];
const DONATE_URL = 'https://www.plant-for-the-planet.org/donate/';

export function SupportBlock() {
  const [amount, setAmount] = useState(50);
  const [monthly, setMonthly] = useState(true);

  return (
    <section className="bg-tm-green px-5 py-14 sm:px-8 md:px-14">
      <div className="mx-auto grid max-w-[1168px] items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <div className="mb-3 text-[11px] font-extrabold tracking-[1.4px] uppercase text-[#B4D398]">
            Already using TreeMapper?
          </div>
          <h2 className="mb-3.5 text-pretty text-2xl leading-[1.15] font-extrabold tracking-[-.8px] text-white sm:text-3xl lg:text-[34px]">
            Name your price.
          </h2>
          <p className="mb-3.5 max-w-[540px] text-base leading-[1.7] text-white/85">
            TreeMapper stays free for non-profits, small teams, classrooms and Forest Cloud projects. There is no
            paywall waiting for you at scale. If the app is doing real work for your organisation, you decide what that
            is worth.
          </p>
          <p className="max-w-[540px] text-[15px] leading-[1.7] text-white/70">
            Contributions fund the Forest Cloud: the servers that store your records, the species database, the offline
            sync, and the next intervention type someone asks for.
          </p>
        </div>

        <div className="rounded-xl bg-white p-[26px] shadow-[0_4px_16px_rgba(0,0,0,.16)]">
          <div className="mb-3.5 text-[11px] font-extrabold tracking-[1.2px] uppercase text-tm-muted">
            Support Forest Cloud development
          </div>

          <div className="mb-3.5 flex gap-2.5">
            {AMOUNTS.map(value => (
              <button
                key={value}
                type="button"
                onClick={() => setAmount(value)}
                aria-pressed={amount === value}
                className={cn(
                  'flex-1 rounded-[10px] py-3.5 text-center text-[15px] font-extrabold transition-colors',
                  amount === value
                    ? 'border-[1.5px] border-tm-green bg-tm-mist text-tm-green'
                    : 'border border-tm-rule bg-tm-cream text-tm-body hover:border-tm-green/40',
                )}
              >
                €{value}
              </button>
            ))}
          </div>

          <div className="mb-2 flex items-center justify-between gap-3 rounded-[10px] border border-tm-rule px-3.5 py-3">
            <span className="text-sm font-semibold text-tm-muted">Or enter your own amount</span>
            <span className="text-sm font-extrabold text-tm-body">€</span>
          </div>

          <button
            type="button"
            onClick={() => setMonthly(v => !v)}
            aria-pressed={monthly}
            className="mb-4 flex items-center gap-2"
          >
            <span
              className={cn(
                'flex size-4 shrink-0 items-center justify-center rounded border',
                monthly ? 'border-tm-green bg-tm-edge' : 'border-tm-rule bg-white',
              )}
            >
              {monthly && <Check className="size-[11px] text-tm-green" strokeWidth={4} />}
            </span>
            <span className="text-[13px] font-semibold text-tm-body">Make it monthly</span>
          </button>

          <div className="flex flex-col gap-2.5">
            <a
              href={DONATE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={ctaPrimary('shadow-[0_3px_10px_rgba(0,122,73,.25)]')}
            >
              Support development
            </a>
            <a
              href="https://www.plant-for-the-planet.org/"
              target="_blank"
              rel="noopener noreferrer"
              className={ctaSecondarySm()}
            >
              See what your money funds
            </a>
          </div>

          <p className="mt-3.5 text-[11px] leading-[1.5] font-semibold text-tm-muted">
            Plant-for-the-Planet Foundation is a registered non-profit. Donations are tax deductible in Germany. Large
            for-profit users take a commercial licence instead.
          </p>
        </div>
      </div>
    </section>
  );
}
