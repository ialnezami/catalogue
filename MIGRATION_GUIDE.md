# Database Migration Guide: Add Language Support

This guide explains how to run the migration to add language support to your production database.

## What This Migration Does

The migration script (`scripts/migrate-add-language.js`) adds the `language` field to:

1. **Platforms Collection**: Adds `language: 'ar'` to all platforms that don't have it
2. **Settings Collection**: Adds `language` field to settings documents, pulling from the platform's language or defaulting to 'ar'
3. **Products Verification**: Checks that all products are properly linked to platforms (products inherit language from their platform)

**Important**: Products themselves don't store a language field. They inherit the language setting from their platform. This migration ensures all platforms have language support so products can display correctly.

## Prerequisites

- Node.js installed
- MongoDB connection string configured in `.env.local` or environment variables
- Access to the production database

## Environment Variables

The migration script uses these environment variables (from `.env.local`):

```env
MONGODB_URI=mongodb://your-connection-string
DB_NAME=catalogue
```

## Running the Migration

### Option 1: Using npm script (Recommended)

```bash
npm run migrate:language
```

### Option 2: Direct execution

```bash
node scripts/migrate-add-language.js
```

### Option 3: Production environment

```bash
NODE_ENV=production node scripts/migrate-add-language.js
```

## Migration Safety

✅ **Idempotent**: Safe to run multiple times  
✅ **Non-destructive**: Only adds missing fields, doesn't modify existing data  
✅ **Backward compatible**: Works with existing data  
✅ **Verification**: Includes verification steps to confirm success  

## What Happens During Migration

1. **Connects to MongoDB** using your configured connection string
2. **Scans platforms** for documents without `language` field
3. **Updates platforms** by adding `language: 'ar'` (Arabic default)
4. **Scans settings** for documents without `language` field
5. **Updates settings** by adding `language` field (from platform or default 'ar')
6. **Verifies products** are linked to valid platforms
7. **Verifies** all documents now have the language field
8. **Reports summary** of changes made and any issues found

## Example Output

```
🔄 Starting migration: Add Language Support...
📊 Database: catalogue
🔗 URI: mongodb://***@localhost:27017

✅ Connected to MongoDB

📦 Step 1: Updating platforms collection...
   Found 3 platform(s) without language field
   ✅ Updated 3 platform(s) with default language 'ar'

⚙️  Step 2: Updating settings collection...
   Found 2 setting(s) without language field
   ✅ Updated 2 setting(s) with language field

📦 Step 3: Verifying products and platforms...
   ✅ All 150 product(s) have platform field
   Products use 5 platform(s)
   5/5 of these platforms have language field

🔍 Step 4: Verifying migration...
   Platforms: 5/5 have language field
   Settings: 3/3 have language field

✅ Migration completed successfully!
✨ All documents now have the language field.
✨ All products are properly linked to platforms with language support.

📋 Migration Summary:
   - Platforms updated: 3
   - Settings updated: 2
   - Total products: 150
   - Products without platform: 0
   - Products with invalid platform: 0
   - Default language: 'ar' (Arabic)

💡 Notes:
   - Products inherit language from their platform
   - You can change the default language for platforms in the admin settings

🎉 Migration script completed
```

## Rollback

If you need to rollback (remove language fields), you can manually run:

```javascript
// Connect to MongoDB and run:
db.platforms.updateMany({}, { $unset: { language: "" } });
db.settings.updateMany({ type: "app_settings" }, { $unset: { language: "" } });
```

⚠️ **Note**: Rollback is not recommended as the application now depends on the language field.

## Troubleshooting

### Connection Error

If you get a connection error, verify:
- `MONGODB_URI` is correct in `.env.local`
- MongoDB is accessible from your location
- Network/firewall allows connection

### Permission Error

Ensure your MongoDB user has write permissions to:
- `platforms` collection
- `settings` collection

### No Changes Made

If the migration reports "all documents already have language field", the migration has already been run. This is normal and safe.

## After Migration

1. ✅ All platforms now have a `language` field (default: 'ar')
2. ✅ All settings now have a `language` field
3. ✅ Admin can change platform language in Settings page
4. ✅ Customers can select their preferred language (stored in localStorage)
5. ✅ Application defaults to platform language when customer hasn't selected one

## Support

If you encounter any issues during migration:
1. Check the error message in the console
2. Verify your MongoDB connection
3. Ensure you have the correct database permissions
4. Check that `.env.local` has the correct `MONGODB_URI` and `DB_NAME`

---

**Migration Version**: 1.0.0  
**Date**: January 2025  
**Purpose**: Add multi-language support to platforms and settings

