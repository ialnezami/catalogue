import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { username, password } = req.body;

  // Hardcoded admin credentials
  if (username === 'admin' && password === 'admin876635') {
    // In a production app, you'd use JWT tokens or sessions
    // For simplicity, we'll just set a session cookie
    res.setHeader('Set-Cookie', 'admin=true; Path=/; HttpOnly; SameSite=Strict');
    return res.status(200).json({ success: true });
  }

  return res.status(401).json({ message: 'Invalid credentials' });
}

