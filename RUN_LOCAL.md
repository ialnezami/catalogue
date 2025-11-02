# 🚀 Running the Multi-Tenant Catalogue App Locally

## ✅ Server Status

Your app is currently running on: **http://localhost:3000**

## 📋 Quick Access Guide

### Main URLs

- **Homepage**: http://localhost:3000
- **Login**: http://localhost:3000/login
- **Super Admin**: http://localhost:3000/super-admin
- **Admin Products**: http://localhost:3000/admin/products
- **Admin Orders**: http://localhost:3000/admin/orders
- **POS System**: http://localhost:3000/pos

### Test Credentials

#### 1. Super Admin (Create Platforms & Admins)
```
URL: http://localhost:3000/login
Username: super_admin
Password: super_admin876635

After login → Redirects to http://localhost:3000/super-admin
```

#### 2. Roze Collection Admin
```
URL: http://localhost:3000/login
Username: admin
Password: adminrozeplatform

After login → Redirects to http://localhost:3000/admin/products?platform=roze
Products: 3 items (Evening Dress, Summer Top, Designer Handbag)
```

#### 3. Jador Boutique Admin
```
URL: http://localhost:3000/login
Username: admin
Password: adminjadorplatform

After login → Redirects to http://localhost:3000/admin/products?platform=jador
Products: 3 items (Modern Jacket, Slim Jeans, Classic Watch)
```

## 🧪 Testing Scenarios

### Test 1: Login as Super Admin
1. Go to http://localhost:3000/login
2. Enter credentials (super_admin / super_admin876635)
3. Click Login
4. **Expected**: Redirects to Super Admin panel showing Roze and Jador platforms

### Test 2: Login as Roze Admin
1. Go to http://localhost:3000/login
2. Enter credentials (admin / adminrozeplatform)
3. Click Login
4. **Expected**: Redirects to Products page showing only 3 Roze products
5. **Verify**: Can add products (auto-tagged with platform="roze")

### Test 3: Login as Jador Admin
1. Go to http://localhost:3000/login
2. Enter credentials (admin / adminjadorplatform)
3. Click Login
4. **Expected**: Redirects to Products page showing only 3 Jador products (different from Roze)
5. **Verify**: Cannot see Roze products

### Test 4: Create a Sale in POS
1. Login as Roze admin
2. Go to POS: http://localhost:3000/pos?platform=roze
3. Add products to cart
4. Complete the sale
5. **Expected**: Order saved with platform="roze"
6. Go to Orders: http://localhost:3000/admin/orders?platform=roze
7. **Verify**: See the order you just created

### Test 5: Data Isolation
1. Login as Roze admin → Create order
2. Logout
3. Login as Jador admin
4. Go to Orders
5. **Expected**: Cannot see Roze orders (different data)

## 🔧 Server Commands

```bash
# Start the server
npm run dev

# Stop the server
# Press Ctrl+C in terminal or:
pkill -f "next dev"

# Check if server is running
ps aux | grep "next dev"

# View server logs
# Check terminal where you ran "npm run dev"
```

## 🌐 Platform-Specific URLs

### Roze Collection
- Homepage: http://localhost:3000?platform=roze
- POS: http://localhost:3000/pos?platform=roze
- Admin: http://localhost:3000/admin/products?platform=roze
- Orders: http://localhost:3000/admin/orders?platform=roze

### Jador Boutique
- Homepage: http://localhost:3000?platform=jador
- POS: http://localhost:3000/pos?platform=jador
- Admin: http://localhost:3000/admin/products?platform=jador
- Orders: http://localhost:3000/admin/orders?platform=jador

## 📊 Database Verification

To verify multi-tenant data is working:

```bash
# Test data isolation
node scripts/test-multi-tenant.js

# Expected output:
# - Roze platform: 3 products
# - Jador platform: 3 products
# - Data is properly isolated
```

## ✨ Features Available

✅ **Multi-Tenant Data Isolation**
- Each platform has separate products, orders, and settings
- Data tagged with `platform` field in database
- No cross-platform data leakage

✅ **Platform-Specific Authentication**
- Each platform admin has unique password
- Format: `admin{platformcode}platform`
- Super admin can create new platforms

✅ **Super Admin Panel**
- View all platforms
- Create new platforms
- Create admins for platforms
- URL: http://localhost:3000/super-admin

✅ **POS System with PDF Receipt**
- Scan barcodes or add products manually
- Complete sales with proper platform tagging
- Generate PDF receipts
- Orders saved to database with platform field

✅ **Admin Panel**
- Manage products (filtered by platform)
- View orders (filtered by platform)
- Platform-specific settings

## 🐛 Troubleshooting

### Server not starting?
```bash
# Kill existing processes
pkill -f "next dev"

# Start fresh
npm run dev
```

### Port already in use?
```bash
# Find what's using port 3000
lsof -i :3000

# Kill it
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

### Can't connect to database?
```bash
# Check MongoDB connection string in .env.local
MONGODB_URI=mongodb+srv://your-connection-string

# The app uses MongoDB Atlas (cloud) by default
```

### Login not working?
- Check that credentials match exactly
- Usernames and passwords are case-sensitive
- Try clearing browser cookies

## 📝 Current Test Data

### Platforms Created:
1. **Roze Collection** (code: roze)
   - Admin: admin / adminrozeplatform
   - Products: 3 items

2. **Jador Boutique** (code: jador)
   - Admin: admin / adminjadorplatform
   - Products: 3 items

### Products Per Platform:
- Roze: Elegant Evening Dress, Casual Summer Top, Designer Handbag
- Jador: Modern Jacket, Slim Fit Jeans, Classic Watch

## 🎉 Ready to Test!

Your multi-tenant application is running and ready for testing. Open http://localhost:3000/login to get started!

