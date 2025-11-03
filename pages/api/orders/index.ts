import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { getPlatformFromRequest, withPlatformFilter, withPlatform } from '@/lib/platform';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME || 'catalogue');
    const collection = db.collection('orders');

    // Get platform from request (public access for GET)
    let platform = getPlatformFromRequest(req);

    if (req.method === 'GET') {
      // Check if admin is accessing orders
      const isLoggedIn = req.cookies.admin === 'true';
      if (isLoggedIn) {
        // For authenticated admins, validate platform access
        try {
          const { validateAdminPlatformAccess } = await import('@/lib/platform');
          platform = validateAdminPlatformAccess(req);
        } catch (error) {
          return res.status(403).json({ 
            message: error instanceof Error ? error.message : 'Forbidden - Platform access denied' 
          });
        }
      }
      const orders = await collection.find(withPlatformFilter(platform)).sort({ timestamp: -1 }).limit(100).toArray();
      return res.status(200).json(orders);
    }

    if (req.method === 'POST') {
      // POST is for public order creation, use platform from URL param
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

