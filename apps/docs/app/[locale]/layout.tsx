import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ThemeProvider } from '@/components/theme-provider';
import { locales } from '@/i18n';
import '../globals.css';

export const metadata: Metadata = {
  title: 'TreeMapper Documentation',
  description: 'Comprehensive user guide for TreeMapper mobile and web applications',
  icons: {
    icon: 'https://www-cdn.plant-for-the-planet.org/wp-content/uploads/2024/05/TreeMapper-logo-e1716997059777.png',
    apple: 'https://www-cdn.plant-for-the-planet.org/wp-content/uploads/2024/05/TreeMapper-logo-e1716997059777.png',
  },
};

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Early detection of TreeMapper app
                var userAgent = navigator.userAgent || '';
                if (userAgent.includes('TreeMapper-Mobile-App')) {
                  window.TreeMapperApp = true;
                  if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', function() {
                      window.dispatchEvent(new Event('treemapper-app-detected'));
                    });
                  } else {
                    window.dispatchEvent(new Event('treemapper-app-detected'));
                  }
                }
              })();
            `,
          }}
        />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider messages={messages}>
            {children}
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
