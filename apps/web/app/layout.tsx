// app/layout.tsx
import MigrationModal from '../components/MigrationModal';
import './global.css';
import Auth0Provider from './providers/Auth0Provider';
import { ToastContainer } from 'react-toastify';

export const metadata = {
  title: 'Admin Dashboard',
  description: 'Admin Dashboard with Auth0 Authentication',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ToastContainer />
        <Auth0Provider>{children}</Auth0Provider>
        <MigrationModal
          // onLogout={()=>{}}
          // onProceed={()=>{}}
        />
      </body>
    </html>
  );
}