# POS System Guide

## Overview

The POS (Point of Sale) system is now fully integrated into your catalogue application. It provides barcode scanning, manual product search, order processing with discounts, and complete order history tracking.

## Features

### 1. **POS Page** (`/pos`)
- **Barcode Scanner**: Automatically scan barcodes to add products
- **Manual Search**: Search products by name, barcode, or category
- **Cart Management**: Add/remove items, adjust quantities
- **Item-Level Discounts**: Apply discounts to individual items
- **Order-Level Discounts**: Apply overall discounts to entire order
- **Payment Processing**: Enter payment amount and calculate change
- **Order Saving**: All orders are saved to MongoDB

### 2. **Orders History** (`/admin/orders`)
- **Order Statistics**: Total orders, revenue, and items sold
- **Order List**: View all past orders sorted by date
- **Order Details**: Click any order to see full details
- **Payment Information**: See subtotal, discount, total, payment, and change

## How to Use

### POS System

1. **Access POS**:
   - Go to `/pos` from any page
   - Or click "POS" in the navigation bar

2. **Add Products**:
   - **By Barcode**: Type or scan barcode in the scanner field (auto-adds when barcode is recognized)
   - **By Search**: Type product name, category, or barcode in search field, then click the product

3. **Manage Cart**:
   - Use +/- buttons to adjust quantities
   - Add item-level discounts in the discount field
   - Remove items with trash icon

4. **Apply Discounts**:
   - **Item Discount**: Enter discount amount for each item
   - **Order Discount**: Enter overall discount amount

5. **Complete Sale**:
   - Enter payment amount
   - Calculate change automatically
   - Click "Complete Sale" to save order

### Orders History

1. **Access Orders**: 
   - Go to `/admin/orders`
   - Or click "Orders" from admin products page

2. **View Statistics**:
   - Total Orders count
   - Total Revenue
   - Total Items Sold

3. **View Order Details**:
   - Click any order to see full details
   - See all items, prices, discounts, payment info

## Navigation

- **POS**: Direct link in navigation bar
- **Admin Products**: Product management with CRUD operations
- **Orders**: Order history and statistics

## Technical Details

### Database Collections

**Orders Collection**:
```javascript
{
  _id: ObjectId,
  items: [
    {
      productId: String,
      title: String,
      price: Number,
      quantity: Number,
      discount: Number,
      subtotal: Number
    }
  ],
  subtotal: Number,
  discount: Number,
  total: Number,
  paymentAmount: Number,
  change: Number,
  timestamp: Date
}
```

### API Endpoints

- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create new order

### Admin-Only Fields (Public pages hide these)
- Barcode
- Buy Price
- Quantity (Stock)
- Internal Notes

## Workflow

1. **Product Setup**: 
   - Login as admin
   - Add products with barcodes, buy prices, quantities, notes
   - Products available immediately in POS

2. **Sales Processing**:
   - Open POS system
   - Scan/search for products
   - Add to cart
   - Apply discounts if needed
   - Complete sale with payment

3. **Tracking**:
   - View all orders in Orders History
   - Track revenue and sales statistics
   - Review individual order details

## Security

- POS is publicly accessible (no login required for basic use)
- Orders are automatically saved
- Admin features remain protected

## Future Enhancements

Potential features to add:
- Receipt printing
- Customer information tracking
- Inventory management (reduce qty on sale)
- Multiple payment methods
- Refund processing
- Sales reports and analytics

