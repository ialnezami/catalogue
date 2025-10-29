# Platform Required Mandatory Restriction

## Summary
All routes now **require** a platform parameter. If no platform is provided in the URL, the user will see a blank error page.

## Changes Made

### 1. Home Page (`pages/index.tsx`)
- Added platform detection from URL parameter
- Shows "Platform Required" page if no platform is provided
- Example: `/?platform=roze`

### 2. POS Page (`pages/pos.tsx`)
- Added mandatory platform check on mount
- Shows "Platform Required" page if no platform is provided
- Example: `/pos?platform=roze`

### 3. Admin Products Page (`pages/admin/products.tsx`)
- Added mandatory platform check on mount
- Shows "Platform Required" page if no platform is provided
- All product operations (load, create, update, delete) require platform
- Example: `/admin/products?platform=roze`

## User Experience

When accessing any page without a platform parameter, users will see:
```
Platform Required

[Error message explaining the requirement]

Example: ?platform=roze
```

## API Protection

All API endpoints already filter by platform:
- `/api/products`
- `/api/products/[id]`
- `/api/orders`
- `/api/settings`

## Testing

Test the platform requirement by:
1. Accessing `http://localhost:3000` - should show error page
2. Accessing `http://localhost:3000?platform=roze` - should show products
3. Accessing `http://localhost:3000/pos` - should show error page
4. Accessing `http://localhost:3000/pos?platform=roze` - should show POS
5. Accessing `http://localhost:3000/admin/products` - should show error page
6. Accessing `http://localhost:3000/admin/products?platform=roze` - should show admin panel

## Benefits

- **Data Isolation**: Forces all requests to specify which platform's data to access
- **Security**: Prevents accidental access to wrong data
- **Clear Errors**: Users understand immediately what's missing
- **Multi-Tenancy**: Enables multiple shops to use the same system safely

