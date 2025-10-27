import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const isLoggedIn = req.cookies.admin === 'true';
  return res.status(200).json({ isLoggedIn });
}

