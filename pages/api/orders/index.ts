import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { getPlatformFromRequest, withPlatformFilter, withPlatform } from '@/lib/platform';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME || 'catalogue');
    const collection = db.collection('orders');

    const platform = getPlatformFromRequest(req);

    if (req.method === 'GET') {
      const orders = await collection.find(withPlatformFilter(platform)).sort({ timestamp: -1 }).limit(100).toArray();
      return res.status(200).json(orders);
    }

    if (req.method === 'POST') {
      const order = withPlatform(platform, req.body);
      const result = await collection.insertOne(order);
      return res.status(201).json({ ...order, id: result.insertedId.toString() });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

