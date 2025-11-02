# Multi-Tenant Platform Isolation Issue - Fix Guide

## The Problem

If you see the same products across different platforms (e.g., `?platform=test1` and `?platform=test2` show the same products), this means products in your database don't have proper platform isolation.

## Root Cause

Products created before the multi-tenant system was added, or products imported without proper platform tracking, don't have the `platform` field. When MongoDB filters by `platform`, these products are returned for ALL platforms.

## Solution

I've created two scripts to help you diagnose and fix this:

### Step 1: Audit Your Products

Run this command to see which products have platform assigned and which don't:

```bash
npm run audit:platforms
```

This will show you:
- Total number of products
- Products grouped by platform
- Products WITHOUT platform (these are the problem!)

### Step 2: Fix Missing Platforms

If you found products without platform, run:

```bash
npm run fix:platforms
```

This will assign all products without platform to the `"default"` platform. You can then:
1. Use `/admin/products?platform=default` to see those products
2. Manually move them to the correct platform using the admin panel
3. Or delete/update them as needed

## Manual Check

If you have direct MongoDB access:

```javascript
// Connect to MongoDB
db.products.find({ platform: { $exists: false } }).count()
// Should return 0

// See all platforms
db.products.distinct("platform")
// Should show: ["test1", "test2", "default", etc.]
```

## Creating Products Going Forward

**Always use the admin panel** when adding products. The system automatically assigns the correct platform based on:
1. Your admin login cookie (`admin_platform`)
2. URL parameter (`?platform=X`)
3. Subdomain detection

Products added via CSV import or admin panel will automatically get the platform assigned.

## Verification

After running the fix:

1. Visit `http://localhost:3000/?platform=test1`
2. Visit `http://localhost:3000/?platform=test2`
3. They should show **DIFFERENT** products (or empty lists if no products exist for those platforms)

## API Platform Detection

The platform detection works as follows (in priority order):

1. **Admin Cookie** - `admin_platform` cookie set when you login as admin
2. **URL Parameter** - `?platform=test1`
3. **Subdomain** - `test1.yoursite.com`
4. **Default** - Falls back to `"default"` platform

## Troubleshooting

### Still seeing same products?

1. **Clear your browser cache** - Old API responses might be cached
2. **Check MongoDB directly** - Verify products have `platform` field
3. **Restart dev server** - `npm run dev` to ensure changes are picked up

### Need to assign products to specific platforms?

Use the admin panel:
1. Login as admin: `/login`
2. Select platform via `?platform=test1`
3. View products at `/admin/products?platform=test1`
4. Delete products that don't belong or create correct ones

### Need to bulk assign?

You can write a MongoDB update script:

```javascript
// Assign products to specific platform
db.products.updateMany(
  { _id: ObjectId("product_id_here") },
  { $set: { platform: "test1" } }
)
```

## Testing Multi-Tenant Isolation

Use the test script to verify everything works:

```bash
npm run test:tenant
```

This will show:
- All platforms in database
- Products per platform
- Orders per platform
- Admins per platform
- Settings per platform

Expected result: Each platform has its own isolated data.

