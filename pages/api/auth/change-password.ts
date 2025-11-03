/**
 * API Endpoint: Change Password
 * 
 * Allows super admin and regular admins to change their own password.
 * Requires current password verification for security.
 * 
 * Usage:
 *   POST /api/auth/change-password
 *   
 * Body:
 *   {
 *     "currentPassword": "old_password",
 *     "newPassword": "new_password"
 *   }
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { currentPassword, newPassword } = req.body;

  // Validate input
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current password and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters long' });
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME || 'catalogue');
    const adminsCollection = db.collection('admins');

    const isSuperAdmin = req.cookies.super_admin === 'true';
    const adminPlatform = req.cookies.admin_platform;

    let user: any = null;
    let username: string = '';

    if (isSuperAdmin) {
      // Super admin password change
      const SUPER_ADMIN_USERNAME = process.env.SUPER_ADMIN_USERNAME || 'super_admin';
      const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'super_admin876635';
      
      // First check database
      user = await adminsCollection.findOne({
        username: SUPER_ADMIN_USERNAME,
        role: 'super_admin',
        active: true
      });

      if (user) {
        // Verify current password from database
        const passwordMatch = user.password && user.password.startsWith('$2')
          ? await bcrypt.compare(currentPassword, user.password)
          : user.password === currentPassword;

        if (!passwordMatch) {
          return res.status(401).json({ message: 'Current password is incorrect' });
        }

        username = SUPER_ADMIN_USERNAME;
      } else {
        // Fallback: verify against hardcoded password
        if (currentPassword !== SUPER_ADMIN_PASSWORD) {
          return res.status(401).json({ message: 'Current password is incorrect' });
        }
        
        username = SUPER_ADMIN_USERNAME;
        // Create super admin in database if doesn't exist
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await adminsCollection.insertOne({
          username: SUPER_ADMIN_USERNAME,
          password: hashedPassword,
          role: 'super_admin',
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        return res.status(200).json({ 
          message: 'Password changed successfully',
          username: SUPER_ADMIN_USERNAME
        });
      }
    } else if (adminPlatform) {
      // Regular admin password change
      // Get username from request body (admin will provide it)
      const { username: requestUsername } = req.body;
      
      if (!requestUsername) {
        return res.status(400).json({ message: 'Username is required for admin password change' });
      }

      user = await adminsCollection.findOne({
        username: requestUsername,
        platform: adminPlatform,
        active: true
      });

      if (!user) {
        return res.status(404).json({ message: 'Admin not found for this platform' });
      }

      // Verify current password
      const passwordMatch = user.password && user.password.startsWith('$2')
        ? await bcrypt.compare(currentPassword, user.password)
        : user.password === currentPassword;

      if (!passwordMatch) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }

      username = user.username;
    } else {
      // Not super admin and no admin platform - unauthorized
      return res.status(401).json({ message: 'Unauthorized - Admin access required' });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    if (isSuperAdmin) {
      await adminsCollection.updateOne(
        { username, role: 'super_admin' },
        { 
          $set: { 
            password: hashedNewPassword,
            updatedAt: new Date()
          } 
        }
      );
    } else {
      await adminsCollection.updateOne(
        { username, platform: adminPlatform },
        { 
          $set: { 
            password: hashedNewPassword,
            updatedAt: new Date()
          } 
        }
      );
    }

    return res.status(200).json({ 
      message: 'Password changed successfully',
      username
    });

  } catch (error) {
    console.error('Error changing password:', error);
    return res.status(500).json({ 
      message: 'Failed to change password',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

