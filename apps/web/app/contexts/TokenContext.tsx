// contexts/TokenContext.tsx
"use client";
import { createContext, useContext, ReactNode } from 'react';

interface TokenContextType {
  accessToken: string | null;
}

const TokenContext = createContext<TokenContextType>({ accessToken: null });

export const TokenProvider = ({ 
  children, 
  accessToken 
}: { 
  children: ReactNode; 
  accessToken: string | null;
}) => {
  return (
    <TokenContext.Provider value={{ accessToken }}>
      {children}
    </TokenContext.Provider>
  );
};

export const useToken = () => useContext(TokenContext);