import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

interface PlatformRequest {
  platformName: string;
  platformDescription?: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  businessType?: string;
  message?: string;
  status?: 'pending' | 'approved' | 'rejected';
  createdAt?: Date;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME || 'catalogue');
    const collection = db.collection('platform_requests');

    if (req.method === 'POST') {
      // Create new platform request
      const requestData: PlatformRequest = {
        ...req.body,
        status: 'pending',
        createdAt: new Date(),
      };

      const result = await collection.insertOne(requestData);
      return res.status(201).json({ 
        success: true, 
        id: result.insertedId.toString(),
        message: 'Platform request submitted successfully'
      });
    }

    if (req.method === 'GET') {
      // Check if user is super admin
      const isSuperAdmin = req.cookies.super_admin === 'true';
      
      if (!isSuperAdmin) {
        return res.status(403).json({ message: 'Super admin access required' });
      }

      const status = req.query.status as string;
      const filter: any = {};
      if (status) {
        filter.status = status;
      }

      const requests = await collection.find(filter).sort({ createdAt: -1 }).toArray();
      return res.status(200).json(requests);
    }

    if (req.method === 'PUT') {
      // Update request status (approve/reject)
      const isSuperAdmin = req.cookies.super_admin === 'true';
      
      if (!isSuperAdmin) {
        return res.status(403).json({ message: 'Super admin access required' });
      }

      const { id, status, action } = req.body;

      if (!id || !status) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const updateData: any = { status };

      // If approving, create the platform
      if (status === 'approved' && action === 'approve') {
        const request = await collection.findOne({ _id: new ObjectId(id) });
        
        if (!request) {
          return res.status(404).json({ message: 'Request not found' });
        }

        // Create platform
        const platformsCollection = db.collection('platforms');
        const code = request.platformName.toLowerCase().replace(/\s+/g, '');
        
        // Check if platform already exists
        const existingPlatform = await platformsCollection.findOne({ code });
        if (existingPlatform) {
          return res.status(400).json({ message: 'Platform with this code already exists' });
        }

        await platformsCollection.insertOne({
          name: request.platformName,
          code: code,
          description: request.platformDescription || '',
          logo: '',
          createdAt: new Date(),
        });

        // Create admin for the platform
        const adminsCollection = db.collection('admins');
        const username = `${code}_admin`;
        const password = `admin${code}platform`;

        await adminsCollection.insertOne({
          username,
          platform: code,
          password,
          active: true,
          createdAt: new Date(),
        });

        updateData.approvedAt = new Date();
        updateData.platformCode = code;
      }

      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ message: 'Request not found' });
      }

      return res.status(200).json({ 
        success: true,
        message: status === 'approved' ? 'Request approved and platform created' : 'Request updated'
      });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

