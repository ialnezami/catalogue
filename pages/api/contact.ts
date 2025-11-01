import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME || 'catalogue');
    const collection = db.collection('contact_messages');

    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const messageData = {
      name,
      email,
      subject,
      message,
      createdAt: new Date(),
      read: false,
    };

    const result = await collection.insertOne(messageData);

    return res.status(201).json({ 
      success: true, 
      id: result.insertedId.toString(),
      message: 'Message sent successfully'
    });
  } catch (error) {
    console.error('Contact API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

