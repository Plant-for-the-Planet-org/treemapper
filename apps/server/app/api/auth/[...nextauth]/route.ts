import NextAuth from 'next-auth';
import { authOptions } from '../options';

const handler = NextAuth(authOptions);

export const GET = handler;
export const POST = handler;