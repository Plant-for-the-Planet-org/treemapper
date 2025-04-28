// app/layout.tsx
import './global.css';
import Auth0Provider  from './providers/Auth0Provider';

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
        <Auth0Provider>{children}</Auth0Provider>
      </body>
    </html>
  );
}