// src/app/api/auth/options.ts
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    // Test-only credentials provider - automatically signs in
    CredentialsProvider({
      id: "test-credentials",
      name: "Test Login",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "Any username for testing" },
        password: { label: "Password", type: "password", placeholder: "Any password for testing" },
      },
      async authorize(credentials) {
        // For testing, always return a mock user without verification
        return {
          id: "test-user-123",
          name: "Test Admin User",
          email: "testadmin@example.com",
          username: credentials?.username || "testuser",
          avatar: "",
          access_token: "mock-access-token-for-testing",
          refresh_token: "mock-refresh-token-for-testing",
          roles: ["Admin"],
          userStatus: "Active",
          phoneNo: "1234567890",
        };
      },
    }),

    // You can keep the regular providers commented out for now
    /* 
    // Regular credentials provider (username/password)
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Original authorization code here
      },
    }),

    // OTP-based provider
    CredentialsProvider({
      id: "otp",
      name: "OTP Login",
      credentials: {
        phoneNumber: { label: "Phone Number", type: "text" },
        otp: { label: "OTP", type: "text" },
        key: { label: "Key", type: "text" },
        otpType: { label: "OTP Type", type: "text" },
      },
      async authorize(credentials) {
        // Original OTP authorization code here
      },
    }),
    */
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Include all user data in the token
        token.user = user;
        token.access_token = user.access_token;
        token.refresh_token = user.refresh_token;
        token.roles = user.roles;
        token.userStatus = user.userStatus;
        token.phoneNo = user.phoneNo;
      }
      return token;
    },
    async session({ session, token }) {
      // Include all token data in the session
      session.user = {
        ...session.user,
        id: token.user?.id || "test-user-id",
        roles: token.user?.roles || ["Admin"],
        userStatus: token.user?.userStatus || "Active",
        phoneNo: token.user?.phoneNo || "1234567890",
      };
      session.access_token = token.access_token || "mock-access-token";
      session.refresh_token = token.refresh_token || "mock-refresh-token";
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/auth/error", // Custom error page
  },
  debug: process.env.NODE_ENV === "development",
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || "test-secret-please-change-in-production",
};