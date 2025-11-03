# Post-Deployment Initialization Guide

This guide explains how to ensure the super admin user is created automatically after deployment on Vercel.

## Overview

After deploying to Vercel, you need to ensure that:
1. A super admin user exists in the database
2. The default platform exists (if needed)

## Quick Start (Recommended)

### After First Deployment

Simply call this endpoint once after your first deployment:

```bash
curl -X POST https://your-app.vercel.app/api/admin/init-on-deploy
```

Or use your browser/Vercel dashboard to call:
```
POST https://your-app.vercel.app/api/admin/init-on-deploy
```

**That's it!** The super admin will be created if it doesn't exist.

## Methods

### Method 1: Manual API Call (Easiest)

After deployment, call this endpoint:

```bash
# Using curl (no auth required if ENSURE_ADMIN_SECRET_TOKEN is not set)
curl -X POST https://your-app.vercel.app/api/admin/init-on-deploy \
  -H "Content-Type: application/json"

# Or with auth token (if ENSURE_ADMIN_SECRET_TOKEN is set in Vercel)
curl -X POST https://your-app.vercel.app/api/admin/init-on-deploy \
  -H "Authorization: Bearer YOUR_SECRET_TOKEN" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "tasks": {
    "ensureSuperAdmin": {
      "status": "created",
      "message": "Super admin created successfully",
      "username": "super_admin"
    },
    "ensureDefaultPlatform": {
      "status": "created",
      "message": "Default platform created"
    }
  },
  "success": true,
  "errors": []
}
```

### Method 2: Vercel Deployment Hook

1. Go to your Vercel project → **Settings** → **Git**
2. Scroll to **Deploy Hooks**
3. Create a new hook with:
   - **Name**: `Initialize Super Admin`
   - **URL**: `https://your-app.vercel.app/api/admin/init-on-deploy`
   - **Trigger**: After deployment
4. The hook will automatically call the endpoint after each deployment

### Method 3: Vercel Cron Job

The `vercel.json` file includes a daily cron job that checks and ensures the super admin exists. This runs automatically every day at midnight UTC.

### Method 4: Run Script Locally

If you have access to your MongoDB connection, run:

```bash
npm run ensure:super-admin
```

Or manually:

```bash
NODE_ENV=production node scripts/ensure-super-admin.js
```

## Environment Variables

Add these to your Vercel project settings (optional, defaults will be used if not set):

```
SUPER_ADMIN_USERNAME=super_admin
SUPER_ADMIN_PASSWORD=super_admin876635
ENSURE_ADMIN_SECRET_TOKEN=your-secret-token-here
```

**⚠️ Important**: For production, set a strong `ENSURE_ADMIN_SECRET_TOKEN` to secure the initialization endpoint.

## Default Credentials

- **Username**: `super_admin`
- **Password**: `super_admin876635`

**⚠️ Security Note**: Change the default password immediately after first login!

## Verification

After initialization, verify the super admin exists:

1. Go to your app: `https://your-app.vercel.app/login`
2. Login with:
   - Username: `super_admin`
   - Password: `super_admin876635`
3. You should be redirected to `/super-admin`

## Troubleshooting

### Super admin not created

1. Check Vercel function logs for errors
2. Verify MongoDB connection string is correct
3. Ensure environment variables are set in Vercel
4. Check that the initialization endpoint is accessible

### Can't login

1. Verify the admin was created: Check MongoDB `admins` collection for user with `role: 'super_admin'`
2. If using hashed passwords, ensure bcrypt is working
3. Check login API logs for authentication errors

## Manual Database Check

If you have MongoDB access, you can verify:

```javascript
// In MongoDB shell or MongoDB Compass
db.admins.find({ role: 'super_admin' })
```

Expected result:
```json
{
  "_id": ObjectId("..."),
  "username": "super_admin",
  "password": "$2a$10$...", // hashed
  "role": "super_admin",
  "active": true,
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("...")
}
```

## Security Best Practices

1. **Change Default Password**: Always change the default password after first login
2. **Use Environment Variables**: Don't hardcode credentials in code
3. **Secure Init Endpoint**: Set `ENSURE_ADMIN_SECRET_TOKEN` for production
4. **Regular Audits**: Periodically check who has super admin access
5. **Strong Passwords**: Use strong passwords even for default accounts

## API Endpoints

### POST `/api/admin/init-on-deploy`

Initializes the system after deployment:
- Creates super admin if missing
- Creates default platform if missing
- Returns status of each task

**Headers**:
- `Authorization: Bearer <ENSURE_ADMIN_SECRET_TOKEN>` (optional but recommended)

**Response**:
```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "tasks": {
    "ensureSuperAdmin": {
      "status": "created",
      "message": "Super admin created successfully",
      "username": "super_admin"
    },
    "ensureDefaultPlatform": {
      "status": "skipped",
      "message": "Default platform already exists"
    }
  },
  "success": true,
  "errors": []
}
```

### POST `/api/admin/ensure-super-admin`

Only ensures super admin exists (doesn't create platform).

## Next Steps

After successful initialization:

1. ✅ Login as super admin
2. ✅ Change the default password
3. ✅ Create your first platform
4. ✅ Create platform admin users
5. ✅ Configure platform settings

