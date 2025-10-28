import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME || 'catalogue');
    const collection = db.collection('platforms');

    if (req.method === 'GET') {
      const platforms = await collection.find({}).sort({ name: 1 }).toArray();
      return res.status(200).json(platforms);
    }

    // Check super admin authentication
    const isSuperAdmin = req.cookies.super_admin === 'true';
    if (!isSuperAdmin) {
      return res.status(401).json({ message: 'Unauthorized - Super Admin access required' });
    }

    if (req.method === 'POST') {
      const { name, code, description } = req.body;

      // Check if platform code already exists
      const existing = await collection.findOne({ code });
      if (existing) {
        return res.status(400).json({ message: 'Platform code already exists' });
      }

      const platform = {
        name,
        code,
        description: description || '',
        createdAt: new Date(),
      };

      const result = await collection.insertOne(platform);
      return res.status(201).json({ ...platform, id: result.insertedId.toString() });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

