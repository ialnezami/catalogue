/**
 * API Endpoint: Initialize on Deploy
 * 
 * This endpoint runs initialization tasks after deployment:
 * - Ensures super admin exists
 * - Can be extended to run other initialization tasks
 * 
 * This endpoint can be called automatically after Vercel deployment
 * by adding it to your Vercel deployment hooks or as a cron job.
 * 
 * Usage:
 *   POST /api/admin/init-on-deploy
 *   
 * Headers:
 *   Authorization: Bearer <ENSURE_ADMIN_SECRET_TOKEN> (optional, recommended for production)
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Optional: Add basic security check
  const securityToken = process.env.ENSURE_ADMIN_SECRET_TOKEN;
  if (securityToken && req.headers.authorization !== `Bearer ${securityToken}`) {
    return res.status(401).json({ message: 'Unauthorized - Invalid security token' });
  }

  const results: any = {
    timestamp: new Date().toISOString(),
    tasks: {},
    success: true,
    errors: []
  };

  try {
    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME || 'catalogue');
    const adminsCollection = db.collection('admins');
    
    const SUPER_ADMIN_USERNAME = process.env.SUPER_ADMIN_USERNAME || 'super_admin';
    const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'super_admin876635';
    
    // Task 1: Ensure Super Admin exists
    try {
      const existingSuperAdmin = await adminsCollection.findOne({ 
        username: SUPER_ADMIN_USERNAME,
        role: 'super_admin'
      });
      
      if (existingSuperAdmin) {
        results.tasks.ensureSuperAdmin = {
          status: 'skipped',
          message: 'Super admin already exists',
          username: SUPER_ADMIN_USERNAME
        };
      } else {
        // Hash password
        const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);
        
        // Create super admin
        await adminsCollection.insertOne({
          username: SUPER_ADMIN_USERNAME,
          password: hashedPassword,
          role: 'super_admin',
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        
        results.tasks.ensureSuperAdmin = {
          status: 'created',
          message: 'Super admin created successfully',
          username: SUPER_ADMIN_USERNAME
        };
      }
    } catch (error) {
      results.success = false;
      results.errors.push({
        task: 'ensureSuperAdmin',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      results.tasks.ensureSuperAdmin = {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Task 2: Ensure default platform exists (if needed)
    try {
      const platformsCollection = db.collection('platforms');
      const defaultPlatform = await platformsCollection.findOne({ code: 'default' });
      
      if (!defaultPlatform) {
        await platformsCollection.insertOne({
          name: 'Default',
          code: 'default',
          description: 'Default platform',
          logo: '',
          language: 'ar',
          createdAt: new Date()
        });
        
        results.tasks.ensureDefaultPlatform = {
          status: 'created',
          message: 'Default platform created'
        };
      } else {
        results.tasks.ensureDefaultPlatform = {
          status: 'skipped',
          message: 'Default platform already exists'
        };
      }
    } catch (error) {
      results.errors.push({
        task: 'ensureDefaultPlatform',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      results.tasks.ensureDefaultPlatform = {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    const statusCode = results.success ? 200 : 500;
    return res.status(statusCode).json(results);
    
  } catch (error) {
    console.error('Error in init-on-deploy:', error);
    return res.status(500).json({ 
      message: 'Initialization failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      results
    });
  }
}

