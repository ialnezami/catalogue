# Barcode Scanner Guide

## Overview

The POS system now includes a **live camera barcode scanner** that uses your device's camera to scan barcodes and automatically add products to the cart.

## Features

✅ **Live Camera Scanner** - Use device camera for barcode scanning  
✅ **Automatic Product Lookup** - Finds product in database by barcode  
✅ **Auto-Add to Cart** - Automatically adds scanned product to cart  
✅ **Manual Input** - Still supports manual barcode entry  
✅ **Product Search** - Search by name, category, or barcode

## How to Use

### Method 1: Camera Scanner (Recommended)

1. **Open POS Page**: Go to `/pos`
2. **Click Camera Button**: Click the green "Camera" button next to the barcode input field
3. **Allow Camera Permission**: Browser will ask for camera permission (accept it)
4. **Position Barcode**: Hold the product's barcode in front of the camera
5. **Auto-Detect**: Scanner automatically detects the barcode
6. **Auto-Add**: Product is automatically added to your cart
7. **Scanner Closes**: Scanner closes automatically after successful scan

### Method 2: Manual Entry

1. **Type Barcode**: Enter barcode number in the input field
2. **Auto-Detect**: When barcode is 8+ characters, it auto-searches
3. **Product Added**: If found, product is added to cart

### Method 3: Search by Name

1. **Type Product Name**: Enter product name in search field
2. **Click Product**: Click on the product from results
3. **Added to Cart**: Product is added to cart

## Technical Details

### Package Used
- **html5-qrcode** - Industry-standard barcode/QR code scanning library
- Supports: UPC-A, UPC-E, EAN-13, EAN-8, Code 128, Code 93, Code 39, ITF-14, Codabar, QR codes

### Implementation
```javascript
// Scans for barcodes using camera
const html5QrcodeScanner = new Html5QrcodeScanner(
  'barcode-scanner',
  {
    fps: 10,
    qrbox: { width: 250, height: 250 },
    aspectRatio: 1.0,
    supportedScanTypes: [1, 2] // QR_CODE and BARCODE
  }
);
```

### Database Integration
- Scanned barcode is matched against product `barcode` field
- Product must exist in database with valid barcode
- Auto-adds to cart if match found

## Setup Requirements

### Adding Products with Barcodes

1. **Login as Admin**: Go to `/login`
2. **Create/Edit Product**: 
   - Go to Products Management
   - Click "Add Product" or "Edit"
   - Fill in product details
   - **Important**: Enter barcode in "Barcode" field
3. **Save**: Product is now searchable by barcode

### Database Fields Used
- `barcode` - Product barcode (required for scanning)
- `title` - Product name
- `price` - Selling price
- `qty` - Stock quantity (shown if available)

## Browser Support

- ✅ Chrome/Edge - Full support
- ✅ Firefox - Full support
- ✅ Safari (iOS 11+) - Full support
- ✅ Safari (macOS) - Full support

## Permissions

The browser will request camera permission on first use:
- **Accept**: Camera scanner works
- **Deny**: Use manual entry or search instead

## Troubleshooting

### Camera Not Working
- **Check permissions**: Browser settings → Camera
- **Use HTTPS**: Some browsers require secure connection
- **Fallback**: Use manual entry or search

### Barcode Not Found
- **Verify barcode exists**: Check product in database
- **Check barcode format**: Ensure correct barcode format
- **Try manual entry**: Type barcode manually

### Scanner Not Scanning
- **Ensure good lighting**: Better light = better scanning
- **Hold steady**: Keep camera and barcode steady
- **Check distance**: Not too close, not too far
- **Try different angle**: Rotate barcode slightly

## Security

- Camera access is **local only** (not recorded or uploaded)
- No external services used
- All processing happens in browser
- Scanned data used only to find products

## Performance

- **Fast scanning**: ~10 frames per second
- **Low CPU usage**: Optimized for performance
- **Auto-close**: Closes after successful scan
- **Manual close**: Close button to exit anytime

