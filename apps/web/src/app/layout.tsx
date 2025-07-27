import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// import { SharedQueryProvider } from '@shared-core/api/index'
import { Open_Sans } from 'next/font/google'
import ResponsiveDashboardWrapper from "@/component/ResponsiveDashboardWrapper";
import Auth0Provider from '@/providers/Auth0Provider';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
  title: 'TreeMapper Dashboard', // Fixed title that won't change
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
  }
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={openSans.variable}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
        <ResponsiveDashboardWrapper>
          <Auth0Provider>
            {/* <SharedQueryProvider> */}
              {children}
            {/* </SharedQueryProvider> */}
          </Auth0Provider>
        </ResponsiveDashboardWrapper>
      </body>
    </html>
  );
}
