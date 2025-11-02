# CSV Import from URL Feature

## ✅ What's New

I've added the ability to import products from CSV URLs (like Google Sheets) in addition to file upload!

## How to Use

### URL Import

1. Login to admin panel
2. Go to Products Management
3. Click "Import CSV"
4. In the import modal, you'll see a new section: **"📡 Import from URL"**
5. Paste your CSV URL (e.g., Google Sheets CSV export URL)
6. Click "Import"

### File Upload (Existing)

1. Click "Import CSV" button
2. Click "Upload File" or drag & drop
3. Select your CSV file

## Supported URL Sources

✅ **Google Sheets CSV Export**
- Publish your Google Sheet
- Get the CSV export URL
- Paste it directly

✅ **Any Public CSV URL**
- Raw CSV files on GitHub
- Cloud storage links
- Web servers hosting CSV

## CSV Format

Same format for both URL and file upload:

```
title,description,price,category,image,barcode,buyPrice,qty,note
Rose Gold Ring,Elegant ring with diamond,299.99,Rings,ring-1.jpg,123456789,150.00,10,Special edition
Silver Necklace,Beautiful necklace with pendant,199.99,Necklaces,necklace-1.jpg,123456790,100.00,5,From Italy
```

**Required columns**: `title, description, price, category, image`  
**Optional columns**: `barcode, buyPrice, qty, note`

## Important Notes

### Platform Isolation

✅ **CSV imports (URL or file) automatically use your platform**
- Platform is set from your admin login cookie
- Products are isolated to your platform only
- No need to manually assign platform

### Preview Before Import

✅ **Both methods show preview**
- Review products before importing
- Edit fields if needed
- Select which products to import

## Example: Google Sheets Setup

### Step 1: Create Google Sheet
```
| title | description | price | category | image |
|-------|-------------|-------|----------|-------|
| Product 1 | Description | 99.99 | Category | url.jpg |
```

### Step 2: Publish as CSV
1. File → Share → Publish to web
2. Format: CSV
3. Click Publish
4. Copy the URL

### Step 3: Import
1. Paste URL in admin panel
2. Click Import
3. Review & confirm

## Troubleshooting

### URL Import Fails?
- ✅ Check URL is publicly accessible
- ✅ Verify CSV format is correct
- ✅ Check browser console for errors
- ✅ Try file upload as alternative

### CORS Errors?
Some URLs may have CORS restrictions. Try:
- Use Google Sheets (has proper CORS)
- Host CSV on your own server
- Use file upload instead

### Platform Issue?
If you see wrong products:
- Verify you're logged in as correct admin
- Check which platform you're on: `/admin/products`
- Run `npm run audit:platforms` to check data

## Benefits

✅ **Live Data Updates** - Update Google Sheet, re-import anytime  
✅ **Easy Collaboration** - Multiple people edit in Google Sheets  
✅ **No Re-upload Needed** - Change Sheet, just re-import  
✅ **Platform Safe** - Automatic platform assignment  
✅ **Preview & Edit** - Review before importing  

## Comparison

| Feature | File Upload | URL Import |
|---------|-------------|------------|
| One-time import | ✅ | ✅ |
| Live updates | ❌ | ✅ |
| Offline use | ✅ | ❌ |
| Easy collaboration | ❌ | ✅ |
| Preview/edit | ✅ | ✅ |
| Platform isolation | ✅ | ✅ |

## Technical Details

- Uses same parsing logic as file upload
- Fetches CSV via `fetch()` API
- Shows loading state during fetch
- Same preview modal for both methods
- Platform automatically assigned from admin cookie
- Products saved via `/api/products` POST endpoint

