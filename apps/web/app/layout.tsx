// app/layout.tsx
import { ReactNode } from 'react';
import './global.css';
import AuthProvider from '../components/AuthProvider';
import { DashboardProvider } from 'dashboard/provider/TamaguiProviderWeb'

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body style={{backgroundColor:'#f5f5f5'}} className='w-full h-full'>
        <AuthProvider>
          <DashboardProvider>
            {children}
          </DashboardProvider>
        </AuthProvider>
      </body>
    </html>
  );
}