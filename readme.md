# Product Catalogue Application

A modern product catalogue and shopping cart application built with Next.js, React.js, and MongoDB.

## Features

### Product Management
- Display products with images, titles, descriptions, and prices
- Browse accessories and products catalog
- Filter products by category, price range, or other criteria
- Each product has a unique ID for detailed views
- **Admin Panel**: Full CRUD operations for product management
- **Protected Routes**: Admin authentication required for product management

### Shopping Cart
- Add products to cart
- Export cart data as minimal JSON (title, price, quantity, subtotal, total)
- Share cart content via WhatsApp with customer name
- Quantity management in cart

### Admin Features
- Login page with secure authentication
- Create, Read, Update, Delete products
- Protected admin routes
- Real-time product management

### Pages & Navigation
- **Public**: All products page - Browse all products with filtering options
- **Public**: Product detail page - View individual product details by ID
- **Public**: Shopping cart page
- **Protected**: Admin login page
- **Protected**: Admin products management page

## Technology Stack

- **Frontend Framework**: Next.js
- **UI Library**: React.js
- **Database**: MongoDB (local or Atlas)
- **Authentication**: Cookie-based session management
- **Assets**: Image folder for product photos
- **Icons**: Lucide React

## Architecture

The application uses MongoDB for data persistence with a hybrid approach:
- **Products Database**: MongoDB collection with product information (id, title, description, price, category, etc.)
- **Images**: Image folder storing product photos
- **Cart State**: Client-side state management for shopping cart
- **Export**: Convert cart state to minimal JSON format for sharing (title, price, qty only)
- **Routing**: Dynamic routes for individual product pages using product ID
- **Authentication**: Cookie-based admin authentication
- **API Routes**: RESTful API for CRUD operations
- **Middleware**: Route protection for admin pages

## Design

- **Theme**: Dark mode with elegant rose color accents (#ec4899)
- **Target Audience**: Women's accessories and jewelry
- **Style**: Modern, feminine, and sophisticated
- **Language**: Arabic (RTL support)
- **Features**: Clear cart button, WhatsApp sharing, JSON export

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm package manager
- MongoDB installed locally or MongoDB Atlas account

### Installation

1. **Install dependencies**:
```bash
npm install
```

2. **Setup MongoDB**:
   - See [MONGODB_SETUP.md](./MONGODB_SETUP.md) for detailed instructions
   - Create a `.env.local` file:
     ```
     MONGODB_URI=mongodb://localhost:27017/catalogue
     DB_NAME=catalogue
     ```
   - For MongoDB Atlas, use your cloud connection string

3. **Add product images to `public/images/` directory**:
   - necklace1.jpg
   - scarf1.jpg
   - ring1.jpg
   - bag1.jpg
   - earrings1.jpg
   - wrap1.jpg

4. **(Optional) Seed initial products**:
```bash
node scripts/seed-products.js
```

5. **Run the development server**:
```bash
npm run dev
```

6. **Open your browser**:
   - Public: [http://localhost:3000](http://localhost:3000)
   - Admin: [http://localhost:3000/login](http://localhost:3000/login)
   - Login credentials:
     - Username: `admin`
     - Password: `admin876635`

## Deployment

### Vercel Deployment

This project is configured for easy deployment on Vercel:

1. **Push to GitHub** (if not already done):
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

2. **Deploy on Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will automatically detect Next.js
   - Click "Deploy"

3. **Environment Variables** (if needed):
   - Add any environment variables in Vercel project settings

4. **After Deployment**:
   - Your app will be live at `https://your-project.vercel.app`
   - Automatic deployments on every push to main branch
   - Preview deployments for pull requests

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
catalogue/
├── public/
│   └── images/              # Product images
├── components/             # React components
│   ├── Layout.tsx
│   ├── ProductCard.tsx
│   └── ProductFilters.tsx
├── contexts/
│   └── CartContext.tsx     # Shopping cart state management
├── lib/
│   └── mongodb.ts          # MongoDB connection
├── pages/                  # Next.js pages
│   ├── _app.tsx            # App wrapper with providers
│   ├── index.tsx           # All products page (public)
│   ├── cart.tsx            # Shopping cart page (public)
│   ├── login.tsx           # Admin login page
│   ├── admin/
│   │   └── products.tsx    # Admin products management (protected)
│   ├── products/
│   │   └── [id].tsx        # Product detail page (public)
│   └── api/                # API routes
│       ├── auth/           # Authentication endpoints
│       └── products/       # Product CRUD endpoints
├── styles/
│   └── globals.css         # Global styles with dark theme
├── types/
│   └── index.ts            # TypeScript type definitions
├── scripts/
│   └── seed-products.js    # Database seeding script
├── middleware.ts           # Route protection middleware
└── package.json
```

## Security Notes

⚠️ **Important**: Change the default admin credentials before deploying to production!

- Current credentials: `admin` / `admin876635`
- These should be changed to secure, unique values in production
- Consider implementing proper session management or JWT tokens
- Add environment variable protection

## Key Features

### Cart JSON Export Format
The cart sharing now uses a minimal format:
```json
{
  "customerName": "John Doe",
  "items": [
    {
      "title": "Product Name",
      "price": 99.99,
      "quantity": 2,
      "subtotal": 199.98
    }
  ],
  "total": 199.98
}
```
