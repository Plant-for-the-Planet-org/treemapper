import { cn } from '@/lib/utils';

/**
 * Shared bits for the TreeMapper product page.
 *
 * The page runs on its own `tm-*` palette (see globals.css) rather than the
 * shadcn theme tokens, because it is public marketing surface and must look
 * identical no matter what theme the dashboard is in.
 */

const ctaBase =
  'inline-flex items-center justify-center gap-2 rounded-xl font-extrabold whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-60';

export const ctaPrimary = (className?: string) =>
  cn(
    ctaBase,
    'bg-tm-green px-6 py-[15px] text-[15px] text-white shadow-[0_3px_10px_rgba(0,122,73,.22)] hover:bg-tm-green-dark',
    className,
  );

export const ctaSecondary = (className?: string) =>
  cn(
    ctaBase,
    'border-[1.5px] border-tm-edge bg-white px-6 py-[14px] text-[15px] text-tm-green hover:bg-tm-mist',
    className,
  );

export const ctaPrimarySm = (className?: string) =>
  cn(ctaBase, 'bg-tm-green px-[22px] py-[13px] text-sm text-white hover:bg-tm-green-dark', className);

export const ctaSecondarySm = (className?: string) =>
  cn(
    ctaBase,
    'border-[1.5px] border-tm-edge bg-white px-[22px] py-3 text-sm text-tm-green hover:bg-tm-mist',
    className,
  );

export function Section({
  id,
  className,
  innerClassName,
  children,
}: {
  id?: string;
  className?: string;
  innerClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={cn('px-5 py-14 sm:px-8 md:px-14 md:py-[72px]', className)}>
      <div className={cn('mx-auto max-w-[1168px]', innerClassName)}>{children}</div>
    </section>
  );
}

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('mb-3 text-[11px] font-extrabold tracking-[1.4px] uppercase text-tm-green', className)}>
      {children}
    </div>
  );
}

export function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h2
      className={cn(
        'text-pretty text-2xl leading-[1.15] font-extrabold tracking-[-.8px] text-tm-ink sm:text-3xl lg:text-[34px]',
        className,
      )}
    >
      {children}
    </h2>
  );
}

export function SectionLead({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('text-base leading-[1.65] text-tm-body', className)}>{children}</p>;
}

/** Rounded outline chip used for feature tags and format lists. */
export function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'rounded-full border border-tm-rule bg-white px-[13px] py-2 text-xs font-extrabold text-tm-body',
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Square tinted tile that holds a lucide icon in the feature grids. */
export function IconTile({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex size-10 items-center justify-center rounded-[10px] border border-tm-edge bg-tm-mist text-tm-ink',
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Stand-in for photography the concept leaves open. Deliberately labelled so a
 * placeholder never reads as a broken image once this goes in front of people.
 */
export function PhotoSlot({ label, className }: { label: string; className?: string }) {
  return (
    <div
      className={cn(
        'flex h-full w-full items-center justify-center bg-tm-canopy p-4 text-center text-[11px] font-bold text-tm-muted',
        className,
      )}
    >
      {label}
    </div>
  );
}
