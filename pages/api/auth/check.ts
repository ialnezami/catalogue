import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const isLoggedIn = req.cookies.admin === 'true';
  const isSuperAdmin = req.cookies.super_admin === 'true';
  const adminPlatform = req.cookies.admin_platform;
  
  return res.status(200).json({ 
    isLoggedIn, 
    isSuperAdmin,
    adminPlatform 
  });
}

