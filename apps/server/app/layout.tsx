// app/layout.tsx
import { ReactNode } from 'react';
import './global.css';

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <div className="app-container">
          <div className="app-content">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}