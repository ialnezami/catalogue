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

      // Check if admin already exists for this platform
      const existing = await collection.findOne({ username, platform });
      if (existing) {
        return res.status(400).json({ message: 'Admin already exists for this platform' });
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

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

