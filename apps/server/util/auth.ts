// utils/auth.ts
import { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../pages/api/auth/[...nextauth]';

// Helper to use in getServerSideProps for protected pages
export async function requireAuth(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {
      redirect: {
        destination: `/login?callbackUrl=${encodeURIComponent(context.resolvedUrl)}`,
        permanent: false,
      },
    };
  }

  return {
    props: { session },
  };
}

// Example of how to use this in a page:
/*
export async function getServerSideProps(context) {
  return requireAuth(context);
}
*/

// Helper to check if user is authenticated in API routes
export async function isAuthenticated(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  return !!session;
}