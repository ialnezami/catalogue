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
        // Get platform language from platforms collection
        const platformsCollection = db.collection('platforms');
        const platformDoc = await platformsCollection.findOne({ code: platform });
        const platformLanguage = platformDoc?.language || 'ar';
        
        // Return default settings with default hero text
        return res.status(200).json({
          currency: 'USD',
          exchangeRate: 1,
          displayCurrency: 'USD',
          language: platformLanguage,
          heroTitle: 'اكتشفي مجموعتنا', // Arabic default
          heroSubtitle: 'قطع أنيقة للمرأة العصرية', // Arabic default
          heroTitleEn: 'Discover Our Collection', // English default
          heroSubtitleEn: 'Elegant pieces for the modern woman', // English default
        });
      }
      // Ensure language is included even if not in settings
      if (!settings.language) {
        const platformsCollection = db.collection('platforms');
        const platformDoc = await platformsCollection.findOne({ code: platform });
        settings.language = platformDoc?.language || 'ar';
      }
      // Ensure hero text fields exist with defaults
      if (!settings.heroTitle) {
        settings.heroTitle = 'اكتشفي مجموعتنا';
      }
      if (!settings.heroSubtitle) {
        settings.heroSubtitle = 'قطع أنيقة للمرأة العصرية';
      }
      if (!settings.heroTitleEn) {
        settings.heroTitleEn = 'Discover Our Collection';
      }
      if (!settings.heroSubtitleEn) {
        settings.heroSubtitleEn = 'Elegant pieces for the modern woman';
      }
      return res.status(200).json(settings);
    }

    // Check authentication for POST
    const isLoggedIn = req.cookies.admin === 'true';
    if (!isLoggedIn) {
      return res.status(401).json({ message: 'Unauthorized - Admin access required' });
    }

    if (req.method === 'POST') {
      const { exchangeRate, displayCurrency, currency, language, heroTitle, heroSubtitle, heroTitleEn, heroSubtitleEn } = req.body;
      
      const settings = withPlatform(platform, {
        type: 'app_settings',
        currency: currency || 'USD',
        exchangeRate: parseFloat(exchangeRate) || 1,
        displayCurrency: displayCurrency || 'SP',
        language: language || 'ar',
        heroTitle: heroTitle || 'اكتشفي مجموعتنا',
        heroSubtitle: heroSubtitle || 'قطع أنيقة للمرأة العصرية',
        heroTitleEn: heroTitleEn || 'Discover Our Collection',
        heroSubtitleEn: heroSubtitleEn || 'Elegant pieces for the modern woman',
        updatedAt: new Date(),
      });

      await collection.updateOne(
        withPlatformFilter(platform, { type: 'app_settings' }),
        { $set: settings },
        { upsert: true }
      );

      // Also update platform language
      if (language) {
        const platformsCollection = db.collection('platforms');
        await platformsCollection.updateOne(
          { code: platform },
          { $set: { language: language } }
        );
      }

      return res.status(200).json({ message: 'Settings updated successfully', settings });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

