import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME || 'catalogue');
    const collection = db.collection('platforms');

    if (req.method === 'GET') {
      // Optional: filter by active status
      const { active } = req.query;
      const query: any = {};
      
      if (active !== undefined) {
        query.active = active === 'true';
      }
      
      const platforms = await collection.find(query).sort({ name: 1 }).toArray();
      return res.status(200).json(platforms);
    }

    // Check super admin authentication
    const isSuperAdmin = req.cookies.super_admin === 'true';
    if (!isSuperAdmin) {
      return res.status(401).json({ message: 'Unauthorized - Super Admin access required' });
    }

    if (req.method === 'POST') {
      const { name, code, description, logo, language } = req.body;

      // Check if platform code already exists
      const existing = await collection.findOne({ code });
      if (existing) {
        return res.status(400).json({ message: 'Platform code already exists' });
      }

      const platform = {
        name,
        code,
        description: description || '',
        logo: logo || '',
        language: language || 'ar', // Default to Arabic
        active: true, // Default to active
        createdAt: new Date(),
      };

      const result = await collection.insertOne(platform);
      return res.status(201).json({ ...platform, id: result.insertedId.toString() });
    }

    if (req.method === 'PATCH') {
      const { code, active } = req.body;

      if (!code) {
        return res.status(400).json({ message: 'Platform code is required' });
      }

      if (typeof active !== 'boolean') {
        return res.status(400).json({ message: 'Active status must be a boolean' });
      }

      const result = await collection.updateOne(
        { code },
        { 
          $set: { 
            active,
            updatedAt: new Date()
          } 
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ message: 'Platform not found' });
      }

      return res.status(200).json({ message: `Platform ${active ? 'activated' : 'deactivated'} successfully` });
    }

    if (req.method === 'DELETE') {
      const { code } = req.query;

      if (!code || typeof code !== 'string') {
        return res.status(400).json({ message: 'Platform code is required' });
      }

      // Don't allow deleting default platform
      if (code === 'default') {
        return res.status(403).json({ message: 'Cannot delete default platform' });
      }

      // Delete the platform
      const platformResult = await collection.deleteOne({ code });

      if (platformResult.deletedCount === 0) {
        return res.status(404).json({ message: 'Platform not found' });
      }

      // Also delete associated admin (optional - you might want to keep it)
      const adminsCollection = db.collection('admins');
      await adminsCollection.deleteMany({ platform: code });

      return res.status(200).json({ message: 'Platform deleted successfully' });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

