# MongoDB Setup Guide

This project has been migrated from Google Sheets to MongoDB for product management.

## Prerequisites

- Node.js and npm installed
- MongoDB installed locally or access to a MongoDB Atlas cluster

## Local MongoDB Setup

1. **Install MongoDB** (if not already installed):
   - macOS: `brew install mongodb-community`
   - Windows: Download from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
   - Linux: Follow [MongoDB Install Guide](https://docs.mongodb.com/manual/installation/)

2. **Start MongoDB**:
   ```bash
   # macOS
   brew services start mongodb-community
   
   # Or run manually
   mongod
   ```

3. **Create Environment File**:
   Create a `.env.local` file in the project root:
   ```bash
   MONGODB_URI=mongodb://localhost:27017/catalogue
   DB_NAME=catalogue
   ```

## MongoDB Atlas Setup (Cloud)

1. **Create a MongoDB Atlas Account**:
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up for a free account

2. **Create a Cluster**:
   - Click "Build a Database"
   - Choose the free tier
   - Select a cloud provider and region
   - Click "Create"

3. **Configure Network Access**:
   - Go to "Network Access"
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development) or add specific IPs

4. **Create Database User**:
   - Go to "Database Access"
   - Click "Add New Database User"
   - Create a user with read/write permissions

5. **Get Connection String**:
   - Go to "Database" > "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your actual password

6. **Update .env.local**:
   ```bash
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/catalogue?retryWrites=true&w=majority
   DB_NAME=catalogue
   ```

## Install Dependencies

```bash
npm install
```

## Initialize Database

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Login to Admin Panel**:
   - Navigate to `http://localhost:3000/login`
   - Username: `admin`
   - Password: `admin876635`

3. **Add Products**:
   - After logging in, you'll be redirected to `/admin/products`
   - Click "Add Product" to create your first product
   - Fill in all fields (title, description, price, category, image URL)
   - Click "Create"

## Migration from Google Sheets

If you have existing products in Google Sheets or JSON:

1. **Export to JSON** (if using Google Sheets):
   - Download your spreadsheet as JSON
   - Or use the existing `data/products.json`

2. **Import to MongoDB**:
   You can use the MongoDB Compass import feature, or we can create a migration script.

## Project Structure

- **Admin Panel**: `/admin/products` (protected route)
- **Login Page**: `/login`
- **Public Product Catalog**: `/`
- **Cart**: `/cart`

## Admin Credentials

- **Username**: `admin`
- **Password**: `admin876635`

⚠️ **Important**: Change these credentials in a production environment!

## API Endpoints

- `GET /api/products` - Get all products
- `POST /api/products` - Create a product (admin only)
- `GET /api/products/[id]` - Get single product
- `PUT /api/products/[id]` - Update product (admin only)
- `DELETE /api/products/[id]` - Delete product (admin only)

## Database Schema

The `products` collection uses the following schema:

```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  price: Number,
  category: String,
  image: String,
  createdAt: Date,
  updatedAt: Date (optional)
}
```

## Troubleshooting

### Connection Issues
- Verify MongoDB is running: `mongosh` or `mongo`
- Check your connection string in `.env.local`
- Ensure network access is configured (Atlas)

### Admin Login Issues
- Clear browser cookies and try again
- Check browser console for errors

### Products Not Loading
- Verify MongoDB connection
- Check API routes are working: `http://localhost:3000/api/products`
- Check server logs for errors

