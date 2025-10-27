# Camera Barcode Scanner Test Instructions

## Quick Test Steps

### 1. Access the POS Page
- Open browser and go to: **http://localhost:3000/pos**
- Or click "POS" in the navigation bar

### 2. Click the Camera Button
- You'll see a green "Camera" button next to the barcode input field
- Click it to launch the camera scanner

### 3. Grant Camera Permission
- Browser will ask: "Allow this page to use your camera?"
- Click **"Allow"**

### 4. Verify Camera is Working
- You should see:
  - A modal/dialog appears
  - Your camera feed is displayed
  - A rectangular scanning area (250x250px)
  - Text: "Position barcode within the camera view"

### 5. Test Scanning
- Option A: **Real barcode** - Point camera at product barcode
- Option B: **QR code** - Scan a QR code (also works)
- Option C: **Test barcode** - Generate online barcode for testing

### 6. Expected Behavior
- Camera starts
- Barcode detected (auto-stops)
- Product added to cart
- Scanner closes automatically

## Troubleshooting

### Camera Not Appearing
**Problem**: No camera feed shows up
**Solutions**:
1. Check browser console (F12) for errors
2. Verify camera is not being used by another app
3. Try different browser (Chrome/Edge recommended)
4. Check HTTPS - some browsers require secure connection

### Permission Denied
**Problem**: Camera permission denied
**Solutions**:
1. Click camera icon in browser address bar
2. Select "Always allow" for this site
3. Or go to browser settings → Site Settings → Camera

### Scanner Opens But Doesn't Scan
**Problem**: Camera shows but doesn't detect barcodes
**Solutions**:
1. Ensure good lighting
2. Hold barcode steady
3. Try different angles
4. Check barcode isn't damaged

## Browser Console Check

Open browser console (F12) and check for:

### Expected Messages
```
✅ Html5QrcodeScanner initialized
✅ Camera permission granted
✅ Scanning started
```

### Error Messages to Watch For
```
❌ Error: Camera access denied
❌ Error: Failed to start camera
❌ Error: Html5Qrcode error
```

## Manual Testing Without Camera

If camera doesn't work, you can still test the app:

1. **Manual Entry**: Type barcode number in input field
2. **Search**: Type product name to search
3. **Click Product**: Click on product from search results

## Test Data

To test with real products, make sure you have products with barcodes:

1. Go to **Admin → Products**
2. Click **"Edit"** on a product
3. Fill in **Barcode** field (e.g., "123456789")
4. **Save**

Then test scanning that barcode!

## Status: Ready to Test

✅ App is running at http://localhost:3000
✅ Camera button is visible
✅ Scanner modal is implemented
✅ All dependencies installed (html5-qrcode)
✅ Code has no linter errors

**Next Step**: Open the POS page and click the camera button!

