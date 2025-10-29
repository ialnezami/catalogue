import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { getPlatformFromRequest } from '@/lib/platform';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { username, password } = req.body;
  
  // Super admin credentials
  const SUPER_ADMIN_USERNAME = 'super_admin';
  const SUPER_ADMIN_PASSWORD = 'super_admin876635';
  
  // Check for super admin
  if (username === SUPER_ADMIN_USERNAME && password === SUPER_ADMIN_PASSWORD) {
    res.setHeader('Set-Cookie', [
      'admin=true; Path=/; HttpOnly; SameSite=Strict',
      'super_admin=true; Path=/; HttpOnly; SameSite=Strict'
    ]);
    return res.status(200).json({ success: true, role: 'super_admin' });
  }
  
  // Check admin credentials in database (username must be unique)
  try {
    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME || 'catalogue');
    const collection = db.collection('admins');
    
    // Find admin by username only (username must be unique across all platforms)
    const admin = await collection.findOne({ 
      username,
      active: true 
    });
    
    if (admin && admin.password === password) {
      // Get platform from admin record
      const platform = admin.platform;
      
      res.setHeader('Set-Cookie', [
        'admin=true; Path=/; HttpOnly; SameSite=Strict',
        `admin_platform=${platform}; Path=/; HttpOnly; SameSite=Strict`
      ]);
      return res.status(200).json({ success: true, role: 'admin', platform });
    }
  } catch (error) {
    console.error('Database auth error:', error);
  }

  return res.status(401).json({ message: 'Invalid credentials' });
}

