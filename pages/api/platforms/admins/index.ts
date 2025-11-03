import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME || 'catalogue');
    const collection = db.collection('admins');

    if (req.method === 'GET') {
      const admins = await collection.find({}).sort({ platform: 1 }).toArray();
      return res.status(200).json(admins);
    }

    // Check super admin authentication
    const isSuperAdmin = req.cookies.super_admin === 'true';
    if (!isSuperAdmin) {
      return res.status(401).json({ message: 'Unauthorized - Super Admin access required' });
    }

    if (req.method === 'POST') {
      const { username, platform, password } = req.body;

      // Validate required fields
      if (!username || !platform || !password) {
        return res.status(400).json({ message: 'Username, platform, and password are required' });
      }

      // Check if username already exists (username must be unique across all platforms)
      const existing = await collection.findOne({ username });
      if (existing) {
        return res.status(400).json({ message: 'Username already exists! Usernames must be unique across all platforms.' });
      }

      const admin = {
        username,
        platform,
        password,
        active: true,
        createdAt: new Date(),
      };

      const result = await collection.insertOne(admin);
      return res.status(201).json({ ...admin, id: result.insertedId.toString() });
    }

    if (req.method === 'PUT') {
      const { username, password } = req.body;

      // Update admin password by username
      const result = await collection.updateOne(
        { username },
        { 
          $set: { 
            password,
            updatedAt: new Date()
          } 
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ message: 'Admin not found' });
      }

      return res.status(200).json({ message: 'Password updated successfully' });
    }

    if (req.method === 'DELETE') {
      const { username } = req.query;

      if (!username || typeof username !== 'string') {
        return res.status(400).json({ message: 'Username is required' });
      }

      // Don't allow deleting super admin
      const admin = await collection.findOne({ username });
      if (admin && admin.role === 'super_admin') {
        return res.status(403).json({ message: 'Cannot delete super admin' });
      }

      const result = await collection.deleteOne({ username });

      if (result.deletedCount === 0) {
        return res.status(404).json({ message: 'Admin not found' });
      }

      return res.status(200).json({ message: 'Admin deleted successfully' });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

