# Google Sheets Integration Guide

This application can use Google Sheets as a database instead of `products.json`. This allows you to update products without redeploying the app.

## 📋 Setup Instructions

### Step 1: Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it something like "Product Catalogue"

### Step 2: Set Up Column Headers

In the first row, add these columns (in this exact order):
| id | title | description | price | category | image |
|---|---|---|---|---|---|---|
| 1 | Rose Gold Necklace | Elegant necklace | 89.99 | jewelry | https://... |
| 2 | Silk Scarf | Beautiful scarf | 65.00 | accessories | https://... |

### Step 3: Populate with Your Products

Add your products following the structure:
- **id**: Unique identifier (1, 2, 3...)
- **title**: Product name
- **description**: Product description
- **price**: Price as number (e.g., 89.99)
- **category**: Category name (jewelry, accessories, bags)
- **image**: Full URL to product image

### Step 4: Publish Your Sheet

1. Click **File** → **Share** → **Publish to web**
2. Select **Link** tab
3. Choose **CSV** format
4. Select **Sheet1** (or your sheet name)
5. Click **Publish**
6. **Copy the generated URL**

### Step 5: Update Your App

1. Open `lib/googleSheets.ts`
2. Replace `YOUR_GOOGLE_SHEETS_CSV_URL` with your published URL
3. Save the file
4. The app will now fetch data from Google Sheets!

## 🔗 Getting the CSV URL

The published URL will look like:
```
https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/export?format=csv&gid=0
```

Or for a specific sheet:
```
https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/export?format=csv&gid=SHEET_GID
```

### To Get the Sheet GID:
1. Open your Google Sheet
2. Look at the browser URL
3. Find the `#gid=` parameter in the URL
4. Use that GID in your CSV URL

## ✅ Example

If your Google Sheet URL is:
```
https://docs.google.com/spreadsheets/d/ABC123xyz/edit#gid=0
```

Your CSV URL should be:
```
https://docs.google.com/spreadsheets/d/ABC123xyz/export?format=csv&gid=0
```

## 📝 Important Notes

- Google Sheets updates are reflected immediately (no redeployment needed)
- Fallback to `products.json` if Google Sheets fails
- Requires internet connection to fetch data
- CSV format is used for easy parsing
- Images can be URLs (Cloudinary, Unsplash, etc.)

## 🚀 Benefits

✅ Live data updates without code changes  
✅ Easy product management through Google Sheets UI  
✅ Multiple people can edit products  
✅ Version history and collaboration  
✅ No database setup required  

## 🔄 Switching Back to JSON

If you want to use `products.json` instead, simply revert the changes to the pages that import `fetchProductsFromGoogleSheets`.

