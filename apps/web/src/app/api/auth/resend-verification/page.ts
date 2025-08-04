import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // You would typically get the user's email from the session or request body
    // For now, this is a placeholder - you'll need to implement the actual logic
    // to trigger Auth0's resend verification email
    
    const response = await fetch(`https://${process.env.AUTH0_DOMAIN}/api/v2/jobs/verification-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AUTH0_MANAGEMENT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: 'USER_ID_HERE', // You'll need to get this from somewhere
        client_id: process.env.AUTH0_CLIENT_ID,
      }),
    });

    if (response.ok) {
      res.status(200).json({ message: 'Verification email sent' });
    } else {
      res.status(400).json({ message: 'Failed to send verification email' });
    }
  } catch (error) {
    console.error('Error resending verification:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
