import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { getPlatformFromRequest } from '@/lib/platform';
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { username, password } = req.body;
  
  // Super admin credentials (fallback to hardcoded if not in env)
  const SUPER_ADMIN_USERNAME = process.env.SUPER_ADMIN_USERNAME || 'super_admin';
  const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'super_admin876635';
  
  // Check for super admin in database first
  try {
    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME || 'catalogue');
    const collection = db.collection('admins');
    
    const superAdmin = await collection.findOne({ 
      username: SUPER_ADMIN_USERNAME,
      role: 'super_admin',
      active: true 
    });
    
    if (superAdmin) {
      // Use bcrypt to verify password if it's hashed
      const passwordMatch = superAdmin.password && superAdmin.password.startsWith('$2')
        ? await bcrypt.compare(password, superAdmin.password)
        : superAdmin.password === password;
      
      if (passwordMatch) {
        // Set cookies to expire in 30 days
        const maxAge = 30 * 24 * 60 * 60; // 30 days in seconds
        res.setHeader('Set-Cookie', [
          `admin=true; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}`,
          `super_admin=true; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}`
        ]);
        return res.status(200).json({ success: true, role: 'super_admin' });
      }
    }
  } catch (error) {
    console.error('Database super admin check error:', error);
    // Fall through to hardcoded check below
  }
  
  // Fallback to hardcoded super admin (for backward compatibility)
  if (username === SUPER_ADMIN_USERNAME && password === SUPER_ADMIN_PASSWORD) {
    // Set cookies to expire in 30 days
    const maxAge = 30 * 24 * 60 * 60; // 30 days in seconds
    res.setHeader('Set-Cookie', [
      `admin=true; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}`,
      `super_admin=true; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}`
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
    
    if (admin) {
      // Verify password - check if hashed (starts with $2) or plain text
      const passwordMatch = admin.password && admin.password.startsWith('$2')
        ? await bcrypt.compare(password, admin.password)
        : admin.password === password;
      
      if (passwordMatch) {
      // Get platform from admin record
      const platform = admin.platform;
      
      // Set cookies to expire in 30 days
      const maxAge = 30 * 24 * 60 * 60; // 30 days in seconds
      res.setHeader('Set-Cookie', [
        `admin=true; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}`,
        `admin_platform=${platform}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}`
      ]);
        return res.status(200).json({ success: true, role: 'admin', platform });
      }
    }
  } catch (error) {
    console.error('Database auth error:', error);
  }

  return res.status(401).json({ message: 'Invalid credentials' });
}

