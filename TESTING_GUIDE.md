# Multi-Tenant Testing Guide

This guide will help you test the multi-tenant system locally with Docker.

## Prerequisites

- Docker and Docker Compose installed
- Node.js and npm installed

## Setup Steps

### 1. Start MongoDB Database

```bash
# Start MongoDB in Docker
npm run docker:up

# Or manually
docker-compose up -d

# Check if it's running
docker ps
```

### 2. Update Environment Variables

Make sure your `.env.local` file has:

```env
MONGODB_URI=mongodb://admin:password123@localhost:27017/catalogue?authSource=admin
DB_NAME=catalogue
NODE_ENV=development
```

### 3. Seed Test Data

```bash
# Seed platforms, products, and admins
npm run seed:test
```

This will create:
- 2 platforms: Roze Collection and Jador Boutique
- Products for each platform
- Admin credentials for each platform

### 4. Test Multi-Tenant Data Separation

```bash
# Verify data is properly separated
npm run test:tenant
```

### 5. Start Development Server

```bash
npm run dev
```

## Testing Credentials

### Super Admin
- **URL**: http://localhost:3000/login
- **Username**: `super_admin`
- **Password**: `super_admin876635`
- **Access**: http://localhost:3000/super-admin

### Roze Platform Admin
- **URL**: http://localhost:3000/login
- **Username**: `admin`
- **Password**: `adminrozeplatform`
- **Access**: http://localhost:3000/admin/products

### Jador Platform Admin
- **URL**: http://localhost:3000/login
- **Username**: `admin`
- **Password**: `adminjadorplatform`
- **Access**: http://localhost:3000/admin/products

## Testing Scenarios

### Scenario 1: Super Admin - Create New Platform

1. Login as super admin
2. Go to http://localhost:3000/super-admin
3. Click "Create New Platform"
4. Enter platform name: "Test Shop"
5. Click "Create"
6. Click "Create Admin" for the new platform
7. Note the credentials shown

### Scenario 2: Platform Admin - View Products

1. Login as roze platform admin
2. Navigate to Products
3. You should only see Roze products (3 items)
4. Try to access via URL param: `http://localhost:3000?platform=roze`

### Scenario 3: Platform Admin - Add Product

1. Login as roze platform admin
2. Go to Products → Add Product
3. Add a new product
4. Verify it appears in Roze products only
5. The platform field should be automatically set to "roze"

### Scenario 4: POS System - Platform Isolation

1. Login as roze platform admin
2. Go to POS (http://localhost:3000/pos)
3. Add products to cart
4. Complete sale
5. Logout and login as jador admin
6. Go to Orders
7. Verify Jador orders don't show Roze orders

### Scenario 5: Data Separation Verification

Run the test script:

```bash
npm run test:tenant
```

Expected output:
- 3 platforms (default, roze, jador)
- 3 products for Roze
- 3 products for Jador
- Products isolated by platform

## Using Different Platforms

### Method 1: URL Parameter

Access with platform code:
- `http://localhost:3000?platform=roze`
- `http://localhost:3000?platform=jador`

### Method 2: Localhost Modification (for subdomain testing)

Edit `/etc/hosts` (Linux/Mac) or `C:\Windows\System32\drivers\etc\hosts` (Windows):

```
127.0.0.1 roze.localhost
127.0.0.1 jador.localhost
127.0.0.1 default.localhost
```

Then access:
- `http://roze.localhost:3000`
- `http://jador.localhost:3000`

## Database Management

### View Database

```bash
# Using MongoDB Compass
# Connection String: mongodb://admin:password123@localhost:27017/?authSource=admin

# Or using mongo shell
docker exec -it catalogue-mongodb mongosh -u admin -p password123 --authenticationDatabase admin
```

### Check Collections

```bash
docker exec -it catalogue-mongodb mongosh -u admin -p password123 --authenticationDatabase admin catalogue --eval "db.getCollectionNames()"
```

### View Products by Platform

```bash
# Roze products
docker exec -it catalogue-mongodb mongosh -u admin -p password123 --authenticationDatabase admin catalogue --eval "db.products.find({platform: 'roze'}).pretty()"

# Jador products
docker exec -it catalogue-mongodb mongosh -u admin -p password123 --authenticationDatabase admin catalogue --eval "db.products.find({platform: 'jador'}).pretty()"
```

## Troubleshooting

### MongoDB Connection Issues

```bash
# Restart MongoDB
npm run docker:down
npm run docker:up

# Check logs
npm run docker:logs
```

### Seed Data Issues

```bash
# Drop all data and re-seed
docker exec -it catalogue-mongodb mongosh -u admin -p password123 --authenticationDatabase admin catalogue --eval "db.dropDatabase()"
npm run seed:test
```

### Port Already in Use

If port 27017 is in use:

```bash
# Edit docker-compose.yml to use different port
ports:
  - "27018:27017"  # Change 27017 to 27018

# Update MONGODB_URI in .env.local
MONGODB_URI=mongodb://admin:password123@localhost:27018/catalogue?authSource=admin
```

## Database Structure

### Collections

- `products` - All products with platform field
- `orders` - All orders with platform field
- `admins` - Platform-specific admins
- `platforms` - Platform configuration
- `settings` - Platform-specific settings

### Platform Field

Every document (except platforms) has a `platform` field:
- `platform: "roze"` - Roze Collection data
- `platform: "jador"` - Jador Boutique data
- `platform: "default"` - Default/fallback data

## Next Steps

1. Test creating orders from POS
2. Verify orders are isolated by platform
3. Test settings are platform-specific
4. Create more products for each platform
5. Test search functionality with platform filtering

