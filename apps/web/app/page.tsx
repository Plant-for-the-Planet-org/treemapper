import { redirect } from 'next/navigation';

// This is a simple server component that redirects to dashboard 
// (as a fallback in case middleware doesn't handle it)
export default function RootPage() {
  redirect('/dashboard');
}