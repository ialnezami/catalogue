import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
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
      const { items, customerName, subtotal, discount, tax, total, exchangeRate, displayCurrency, currency } = req.body;
      
      // Fetch full product details including buyPrice for profit calculation
      const productsCollection = db.collection('products');
      const orderItems = await Promise.all(
        items.map(async (item: any) => {
          const product = await productsCollection.findOne(
            withPlatformFilter(platform, { _id: new ObjectId(item.productId) })
          );
          
          const sellPrice = item.price || product?.price || 0;
          const buyPrice = product?.buyPrice || 0;
          const quantity = item.quantity || 1;
          const itemSubtotal = sellPrice * quantity;
          const itemProfit = (sellPrice - buyPrice) * quantity;
          
          return {
            productId: item.productId,
            title: item.title || product?.title || '',
            price: sellPrice, // USD price
            buyPrice: buyPrice || 0, // Cost price in USD
            quantity: quantity,
            subtotal: itemSubtotal, // USD subtotal
            profit: itemProfit, // Profit in USD
          };
        })
      );
      
      // Calculate totals
      const calculatedSubtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
      const calculatedTotal = calculatedSubtotal - (discount || 0) + (tax || 0);
      const totalProfit = orderItems.reduce((sum, item) => sum + item.profit, 0);
      
      const order = withPlatform(platform, {
        customerName: customerName || 'Guest',
        items: orderItems,
        subtotal: subtotal || calculatedSubtotal,
        discount: discount || 0,
        tax: tax || 0,
        total: total || calculatedTotal,
        totalProfit: totalProfit,
        status: 'pending', // New orders start as pending
        exchangeRate: exchangeRate || 15000,
        displayCurrency: displayCurrency || 'SP',
        currency: currency || 'USD',
        paymentAmount: 0,
        change: 0,
        timestamp: new Date(),
        createdAt: new Date(),
      });
      
      const result = await collection.insertOne(order);
      return res.status(201).json({ ...order, id: result.insertedId.toString() });
    }

    if (req.method === 'PATCH') {
      // PATCH for updating order status (admin only)
      const isLoggedIn = req.cookies.admin === 'true';
      if (!isLoggedIn) {
        return res.status(401).json({ message: 'Unauthorized - Admin access required' });
      }

      // Validate platform access
      try {
        const { validateAdminPlatformAccess } = await import('@/lib/platform');
        platform = validateAdminPlatformAccess(req);
      } catch (error) {
        return res.status(403).json({ 
          message: error instanceof Error ? error.message : 'Forbidden - Platform access denied' 
        });
      }

      const { orderId, status } = req.body;
      
      if (!orderId || !status) {
        return res.status(400).json({ message: 'Order ID and status are required' });
      }

      if (!['pending', 'accepted', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status. Must be pending, accepted, or rejected' });
      }

      const result = await collection.updateOne(
        withPlatformFilter(platform, { _id: new ObjectId(orderId) }),
        { 
          $set: { 
            status,
            updatedAt: new Date()
          } 
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ message: 'Order not found' });
      }

      return res.status(200).json({ message: 'Order status updated successfully' });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

