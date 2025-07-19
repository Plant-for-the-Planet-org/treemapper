import './global.css';
import Auth0Provider from './providers/Auth0Provider';
import ResponsiveDashboardWrapper from '../components/ResponsiveDashboardWrapper';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { SharedQueryProvider } from 'shared-core/api/client/QueryProvider'


import type { Metadata } from 'next';

// This ensures the title stays consistent across all pages
export const metadata: Metadata = {
  title: 'TreeMapper Dashboard', // Fixed title that won't change
  description: 'Manage and monitor your tree mapping projects',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' }
    ],
    apple: '/apple-touch-icon.png',
  },
  // Optional: Prevent other pages from overriding the title
  // Remove this if you want some flexibility
  other: {
    'format-detection': 'telephone=no',
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-gray-50 min-h-screen">
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
        <SharedQueryProvider>
          <Auth0Provider>
            <ResponsiveDashboardWrapper>
              {children}
            </ResponsiveDashboardWrapper>
          </Auth0Provider>
        </SharedQueryProvider>
      </body>
    </html>
  );
}