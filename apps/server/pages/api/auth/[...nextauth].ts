// pages/api/auth/[...nextauth].ts
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { NextApiRequest, NextApiResponse } from 'next';

// You'll need to create this API handler to verify credentials
async function authenticateUser(credentials: Record<string, string>) {
  // Replace this with your actual authentication logic
  // This could be an API call to your backend service
  try {
    // Example API call to your auth endpoint
    // const response = await fetch('https://your-api.com/auth', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(credentials),
    // });
    // const user = await response.json();
    
    // For testing, we'll use a simple check
    if (credentials.email === 'user@example.com' && credentials.password === 'password') {
      return {
        id: '1',
        name: 'Test User',
        email: 'user@example.com',
        // You might include other user data or tokens here
      };
    }
    return null;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials) return null;
        
        const user = await authenticateUser(credentials);
        return user;
      },
    }),
    // You can add more providers here (Google, GitHub, etc.)
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      // Add custom claims to the JWT token
      if (user) {
        token.id = user.id;
        // You can add custom data here, like roles or permissions
        // token.customData = user.customData;
      }
      return token;
    },
    async session({ session, token }) {
      // Add custom session properties
      if (session.user) {
        session.user.id = token.id as string;
        // session.user.customData = token.customData;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',        // Custom login page
    signOut: '/logout',      // Custom logout page
    error: '/login',         // Error page
  },
  // Enable debug in development
  debug: process.env.NODE_ENV === 'development',
});