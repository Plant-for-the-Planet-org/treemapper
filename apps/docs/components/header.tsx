'use client';

import Link from 'next/link';
import Image from 'next/image';
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
            <Image
              src="https://www-cdn.plant-for-the-planet.org/wp-content/uploads/2024/05/TreeMapper-logo-e1716997059777.png"
              alt="TreeMapper"
              width={150}
              height={40}
              className="h-8 w-auto"
              unoptimized
            />
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
