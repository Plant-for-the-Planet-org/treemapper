import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

export const options: NextAuthOptions = {
  providers: [
    // Development Bypass Provider - remove in production
    CredentialsProvider({
      id: "dev-bypass",
      name: "Development Bypass",
      credentials: {
        devUsername: { 
          label: "Development Username", 
          type: "text", 
          placeholder: "Enter any name for development" 
        },
      },
      async authorize() {
        // Only enable this in development environment
        if (process.env.NODE_ENV !== "production") {
          return {
            id: "dev-user-1",
            name: "Development User",
            email: "dev@example.com",
            image: "https://via.placeholder.com/150"
          };
        }
        return null;
      },
    }),
    
    // Google Provider - add your keys when ready
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "placeholder-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "placeholder-client-secret",
      // Skip Google auth flow if keys not provided
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        // Add provider info to token
        if (account) {
          token.provider = account.provider;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        // Add provider info to session
        (session as any).provider = token.provider;
        // For development purposes, add a flag to indicate if this is a bypass session
        if (token.provider === "dev-bypass") {
          (session as any).isDevelopmentBypass = true;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  secret: process.env.NEXTAUTH_SECRET,
};