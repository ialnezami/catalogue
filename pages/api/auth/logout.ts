import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  res.setHeader('Set-Cookie', [
    'admin=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0',
    'super_admin=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0',
    'admin_platform=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0'
  ]);
  return res.status(200).json({ success: true });
}

