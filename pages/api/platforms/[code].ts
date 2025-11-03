import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME || 'catalogue');
    const collection = db.collection('platforms');

    if (req.method === 'GET') {
      const { code } = req.query;

      if (!code || typeof code !== 'string') {
        return res.status(400).json({ message: 'Platform code is required' });
      }

      const platform = await collection.findOne({ code });

      if (!platform) {
        return res.status(404).json({ message: 'Platform not found' });
      }

      return res.status(200).json(platform);
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

