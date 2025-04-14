import NextAuth from "next-auth";
import { options } from "../options";

// This creates the NextAuth API routes for handling authentication
const handler = NextAuth(options);

// Export the handler for both GET and POST requests
export { handler as GET, handler as POST };