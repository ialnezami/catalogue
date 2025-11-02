import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { getPlatformFromRequest, withPlatformFilter, withPlatform } from '@/lib/platform';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME || 'catalogue');
    const collection = db.collection('settings');

    // Get platform from request
    const platform = getPlatformFromRequest(req);

    if (req.method === 'GET') {
      const settings = await collection.findOne(withPlatformFilter(platform, { type: 'app_settings' }));
      if (!settings) {
        // Return default settings
        return res.status(200).json({
          currency: 'USD',
          exchangeRate: 1,
          displayCurrency: 'USD',
        });
      }
      return res.status(200).json(settings);
    }

    // Check authentication for POST
    const isLoggedIn = req.cookies.admin === 'true';
    if (!isLoggedIn) {
      return res.status(401).json({ message: 'Unauthorized - Admin access required' });
    }

    if (req.method === 'POST') {
      const { exchangeRate, displayCurrency, currency } = req.body;
      
      const settings = withPlatform(platform, {
        type: 'app_settings',
        currency: currency || 'USD',
        exchangeRate: parseFloat(exchangeRate) || 1,
        displayCurrency: displayCurrency || 'SP',
        updatedAt: new Date(),
      });

      await collection.updateOne(
        withPlatformFilter(platform, { type: 'app_settings' }),
        { $set: settings },
        { upsert: true }
      );

      return res.status(200).json({ message: 'Settings updated successfully', settings });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

