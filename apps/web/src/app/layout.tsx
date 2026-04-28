import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// import { SharedQueryProvider } from '@shared-core/api/index'
import { Open_Sans } from 'next/font/google'
import ResponsiveDashboardWrapper from "@/component/ResponsiveDashboardWrapper";
import Auth0Provider from '@/providers/Auth0Provider';
import I18nProvider from '@/providers/I18nProvider';
import MobileAppRedirect from '@/component/MobileAppRedirect';

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
    <html lang="en" className={openSans.variable}>
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
        <MobileAppRedirect />
        
        <ResponsiveDashboardWrapper>
          <Auth0Provider>
            <I18nProvider>
              {/* <SharedQueryProvider> */}
              {children}
              {/* </SharedQueryProvider> */}
            </I18nProvider>
          </Auth0Provider>
        </ResponsiveDashboardWrapper>
      </body>
    </html>
  );
}