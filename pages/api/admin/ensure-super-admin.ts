/**
 * API Endpoint: Ensure Super Admin
 * 
 * This endpoint ensures that a super admin user exists in the database.
 * It's safe to call multiple times (idempotent).
 * 
 * This endpoint can be called after deployment to ensure super admin exists.
 * For security, it should only be called in production during deployment setup,
 * or can be triggered by Vercel deployment hooks.
 * 
 * Usage:
 *   POST /api/admin/ensure-super-admin
 *   
 * Environment Variables:
 *   SUPER_ADMIN_USERNAME - Super admin username (defaults to 'super_admin')
 *   SUPER_ADMIN_PASSWORD - Super admin password (defaults to 'super_admin876635')
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Optional: Add basic security check (e.g., secret token or only allow in production)
  // For now, we'll allow it to be called but you should secure this in production
  const securityToken = process.env.ENSURE_ADMIN_SECRET_TOKEN;
  if (securityToken && req.headers.authorization !== `Bearer ${securityToken}`) {
    return res.status(401).json({ message: 'Unauthorized - Invalid security token' });
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME || 'catalogue');
    
    // Use 'admins' collection with a role field to store super admin
    const adminsCollection = db.collection('admins');
    
    const SUPER_ADMIN_USERNAME = process.env.SUPER_ADMIN_USERNAME || 'super_admin';
    const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'super_admin876635';
    
    // Check if super admin already exists
    const existingSuperAdmin = await adminsCollection.findOne({ 
      username: SUPER_ADMIN_USERNAME,
      role: 'super_admin'
    });
    
    if (existingSuperAdmin) {
      return res.status(200).json({ 
        message: 'Super admin already exists',
        username: SUPER_ADMIN_USERNAME,
        exists: true
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);
    
    // Create super admin
    const superAdmin = {
      username: SUPER_ADMIN_USERNAME,
      password: hashedPassword,
      role: 'super_admin',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await adminsCollection.insertOne(superAdmin);
    
    return res.status(201).json({ 
      message: 'Super admin created successfully',
      username: SUPER_ADMIN_USERNAME,
      created: true,
      note: 'Please change the default password after first login'
    });
    
  } catch (error) {
    console.error('Error ensuring super admin:', error);
    return res.status(500).json({ 
      message: 'Failed to ensure super admin',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

