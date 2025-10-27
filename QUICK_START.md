# Quick Start Guide

## 🚀 Fast Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup MongoDB

**Option A: Local MongoDB**
```bash
# macOS
brew services start mongodb-community

# Create .env.local
echo "MONGODB_URI=mongodb://localhost:27017/catalogue" > .env.local
echo "DB_NAME=catalogue" >> .env.local
```

**Option B: MongoDB Atlas (Cloud)**
1. Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Get connection string
4. Create `.env.local`:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/catalogue
DB_NAME=catalogue
```

### 3. Seed Initial Data (Optional)
```bash
node scripts/seed-products.js
```

### 4. Start Development Server
```bash
npm run dev
```

### 5. Access the Application

**Public Pages:**
- Home: http://localhost:3000
- Cart: http://localhost:3000/cart

**Admin Panel:**
- Login: http://localhost:3000/login
- Credentials:
  - Username: `admin`
  - Password: `admin876635`
- Products Management: http://localhost:3000/admin/products

---

## ✨ Key Features

### Public Features
- Browse products with filtering
- View product details
- Add to cart with quantity management
- Share cart as minimal JSON (title, price, qty, total)
- Export to WhatsApp with customer name

### Admin Features
- Secure login authentication
- Create new products
- Edit existing products
- Delete products
- Real-time updates

---

## 🔒 Security Notes

⚠️ **Change admin credentials before production deployment!**

Edit credentials in:
- `pages/api/auth/login.ts` (lines 11-12)

---

## 📝 Cart Sharing Format

The cart now exports minimal data:
```json
{
  "customerName": "Customer Name",
  "items": [
    {
      "title": "Product Title",
      "price": 99.99,
      "quantity": 2,
      "subtotal": 199.98
    }
  ],
  "total": 199.98
}
```

---

## 🆘 Troubleshooting

**MongoDB Connection Error:**
- Verify MongoDB is running: `mongosh`
- Check `.env.local` has correct MONGODB_URI

**Products Not Showing:**
- Run seed script: `node scripts/seed-products.js`
- Or manually add products via admin panel

**Admin Login Not Working:**
- Clear browser cookies
- Check credentials: `admin` / `admin876635`

**Need Help?**
- See [MONGODB_SETUP.md](./MONGODB_SETUP.md) for detailed setup
- See [readme.md](./readme.md) for full documentation

