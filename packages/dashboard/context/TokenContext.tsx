// contexts/TokenContext.tsx
"use client";
import { createContext, useContext, ReactNode } from 'react';

interface TokenContextType {
  accessToken: string;
}

const TokenContext = createContext<TokenContextType>({ accessToken: '' });

export const TokenProvider = ({ 
  children, 
  accessToken 
}: { 
  children: ReactNode; 
  accessToken: string;
}) => {
  return (
    <TokenContext.Provider value={{ accessToken }}>
      {children}
    </TokenContext.Provider>
  );
};

export const useToken = () => useContext(TokenContext);