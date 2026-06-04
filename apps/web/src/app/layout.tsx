import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { Open_Sans } from 'next/font/google'
import I18nProvider from '@/providers/I18nProvider';
import ThemeProvider from '@/providers/ThemeProvider';
import MobileAppRedirect from '@/component/MobileAppRedirect';
import { AuthInitializer } from '@/component/auth/AuthInitializer';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const openSans = Open_Sans({
  subsets: ['latin'],
  variable: '--font-open-sans'
})

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'TreeMapper Dashboard',
  description: 'Manage and monitor your TreeMapper data',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' }
    ],
    apple: '/apple-touch-icon.png',
  },
  other: {
    'format-detection': 'telephone=no',
    // Add iOS smart app banner
    'apple-itunes-app': 'app-id=YOUR_APP_ID, app-argument=https://dev.treemapper.app/dashboard',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable)} suppressHydrationWarning>
      <head>
        {/* Apple App Site Association meta tag */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://apps.apple.com" />
        
        {/* Universal Link verification */}
        <link rel="apple-app-site-association" href="/.well-known/apple-app-site-association" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Mobile App Redirect Component */}
        <Suspense fallback={null}>
          <MobileAppRedirect />
        </Suspense>

        <ThemeProvider>
          <TooltipProvider delayDuration={300}>
            <Suspense fallback={null}>
              <AuthInitializer />
            </Suspense>
            <I18nProvider>
              {children}
            </I18nProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}