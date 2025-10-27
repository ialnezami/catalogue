# Product Catalogue Application

A modern product catalogue and shopping cart application built with Next.js and React.js.

## Features

### Product Management
- Display products with images, titles, descriptions, and prices
- Browse accessories and products catalog
- Filter products by category, price range, or other criteria
- Each product has a unique ID for detailed views

### Shopping Cart
- Add products to cart
- Export cart data as JSON
- Share cart content via WhatsApp

### Pages & Navigation
- All products page - Browse all products with filtering options
- Product detail page - View individual product details by ID

## Technology Stack

- **Frontend Framework**: Next.js
- **UI Library**: React.js
- **Data Storage**: JSON files
- **Assets**: Image folder for product photos

## Architecture

The application uses a simple file-based data storage approach:
- **Products Database**: JSON file containing product information (id, title, description, price, category, etc.)
- **Images**: Image folder storing product photos
- **Cart State**: Client-side state management for shopping cart
- **Export**: Convert cart state to JSON format for sharing
- **Routing**: Dynamic routes for individual product pages using product ID

## Design

- **Theme**: Dark mode with elegant rose color accents (#ec4899)
- **Target Audience**: Women's accessories and jewelry
- **Style**: Modern, feminine, and sophisticated
- **Language**: Arabic (RTL support)
- **Features**: Clear cart button, WhatsApp sharing, JSON export

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
```

2. Add product images to `public/images/` directory:
   - necklace1.jpg
   - scarf1.jpg
   - ring1.jpg
   - bag1.jpg
   - earrings1.jpg
   - wrap1.jpg

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser (or the port shown in terminal)

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
│   └── images/          # Product images
├── data/
│   └── products.json    # Product database
├── components/          # React components
│   ├── Layout.tsx
│   ├── ProductCard.tsx
│   └── ProductFilters.tsx
├── contexts/
│   └── CartContext.tsx  # Shopping cart state management
├── pages/              # Next.js pages
│   ├── _app.tsx        # App wrapper with providers
│   ├── index.tsx       # All products page
│   ├── cart.tsx        # Shopping cart page
│   └── products/
│       └── [id].tsx    # Product detail page by ID
├── styles/
│   └── globals.css     # Global styles with dark theme
├── types/
│   └── index.ts        # TypeScript type definitions
└── package.json
```
