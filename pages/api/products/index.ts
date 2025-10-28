import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME || 'catalogue');
    const collection = db.collection('products');

    if (req.method === 'GET') {
      const products = await collection.find({}).toArray();
      return res.status(200).json(products);
    }

    // Check authentication for POST, PUT, DELETE
    const isLoggedIn = req.cookies.admin === 'true';
    if (!isLoggedIn) {
      return res.status(401).json({ message: 'Unauthorized - Admin access required' });
    }

    if (req.method === 'POST') {
      const { title, description, price, category, image, barcode, buyPrice, qty, note } = req.body;
      
      const newProduct = {
        title,
        description,
        price: parseFloat(price),
        category,
        image,
        barcode: barcode || undefined,
        buyPrice: buyPrice ? parseFloat(buyPrice) : undefined,
        qty: qty ? parseInt(qty) : undefined,
        note: note || undefined,
        createdAt: new Date(),
      };

      const result = await collection.insertOne(newProduct);
      return res.status(201).json({ ...newProduct, id: result.insertedId.toString() });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

