'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Search } from '@/components/search';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageSwitcher } from '@/components/language-switcher';

export function Header() {
  const t = useTranslations('nav');
  const locale = useLocale();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-primary"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5"></path>
              <path d="M2 12l10 5 10-5"></path>
            </svg>
            <span className="font-bold text-lg">TreeMapper</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link
              href={`/${locale}`}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('home')}
            </Link>
            <Link
              href={`/${locale}/docs/introduction`}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('docs')}
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:block w-64">
            <Search />
          </div>
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
