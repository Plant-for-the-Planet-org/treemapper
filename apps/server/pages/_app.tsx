// pages/_app.tsx
import { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import { TamaguiProvider } from 'tamagui';
import tamaguiConfig from '../tamagui.config'; // Adjust path if needed

// Import global styles if you have any
// import '../styles/globals.css';

export default function App({ 
  Component, 
  pageProps: { session, ...pageProps } 
}: AppProps) {
  return (
    <SessionProvider session={session}>
      <TamaguiProvider config={tamaguiConfig}>
        <Component {...pageProps} />
      </TamaguiProvider>
    </SessionProvider>
  );
}