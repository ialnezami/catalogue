import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getPlatformFromRequest, withPlatformFilter } from '@/lib/platform';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME || 'catalogue');
    const collection = db.collection('products');

    const { id } = req.query;
    const platform = getPlatformFromRequest(req);

    if (req.method === 'GET') {
      const product = await collection.findOne(withPlatformFilter(platform, { _id: new ObjectId(id as string) }));
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      return res.status(200).json(product);
    }

    // Check authentication for PUT, DELETE
    const isLoggedIn = req.cookies.admin === 'true';
    if (!isLoggedIn) {
      return res.status(401).json({ message: 'Unauthorized - Admin access required' });
    }

    if (req.method === 'PUT') {
      const { title, description, price, category, image, barcode, buyPrice, qty, note } = req.body;
      
      const updateData: any = {
        title,
        description,
        price: parseFloat(price),
        category,
        image,
        updatedAt: new Date(),
      };

      // Add optional fields if provided
      if (barcode) {
        updateData.barcode = barcode;
      } else {
        updateData.barcode = undefined;
      }
      
      if (buyPrice) {
        updateData.buyPrice = parseFloat(buyPrice);
      } else {
        updateData.buyPrice = undefined;
      }
      
      if (qty !== undefined && qty !== '') {
        updateData.qty = parseInt(qty);
      } else {
        updateData.qty = undefined;
      }
      
      if (note) {
        updateData.note = note;
      } else {
        updateData.note = undefined;
      }

      const result = await collection.updateOne(
        withPlatformFilter(platform, { _id: new ObjectId(id as string) }),
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ message: 'Product not found' });
      }

      return res.status(200).json({ message: 'Product updated successfully' });
    }

    if (req.method === 'DELETE') {
      const result = await collection.deleteOne(withPlatformFilter(platform, { _id: new ObjectId(id as string) }));
      
      if (result.deletedCount === 0) {
        return res.status(404).json({ message: 'Product not found' });
      }

      return res.status(200).json({ message: 'Product deleted successfully' });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

