'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { Search } from '@/components/search';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';

export function Header() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const [isTreeMapperApp, setIsTreeMapperApp] = useState(false);

  useEffect(() => {
    // Check if we're in TreeMapper app via User-Agent
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const win = globalThis.window;
    if (win === undefined) return;

    const userAgent = win.navigator.userAgent;
    const isApp = userAgent.includes('TreeMapper-Mobile-App') || 
                  (win as any).TreeMapperApp === true;

    setIsTreeMapperApp(isApp);

    // Listen for the detection event
    const handleAppDetected = () => {
      setIsTreeMapperApp(true);
    };

    win.addEventListener('treemapper-app-detected', handleAppDetected);
    
    // Also check immediately if TreeMapperApp is already set
    if ((win as any).TreeMapperApp) {
      setIsTreeMapperApp(true);
    }

    return () => {
      win.removeEventListener('treemapper-app-detected', handleAppDetected);
    };
  }, []);

  const handleBackClick = () => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const win = globalThis.window;
    if (win === undefined) return;

    if ((win as any).ReactNativeWebView) {
      // We're in a React Native WebView, send message to native
      win.dispatchEvent(new Event('treemapper-back-click'));
    } else if ((win as any).webkit?.messageHandlers) {
      // iOS WKWebView
      (win as any).webkit.messageHandlers.goBack?.postMessage({});
    } else {
      // Fallback: go back in browser history
      win.history.back();
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          {isTreeMapperApp ? (
            <button
              onClick={handleBackClick}
              className="flex items-center gap-2 px-2 py-1 hover:bg-accent rounded-md transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Back</span>
            </button>
          ) : (
            <>
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
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isTreeMapperApp && (
            <div className="hidden md:block w-64">
              <Search />
            </div>
          )}
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
