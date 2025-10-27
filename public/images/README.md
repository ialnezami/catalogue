# Product Images

Place your product images in this directory.

## Required Images

Based on `data/products.json`, you need the following images:

1. `necklace1.jpg` - Rose Gold Delicate Necklace
2. `scarf1.jpg` - Silk Scarf with Floral Pattern
3. `ring1.jpg` - Rose Quartz Crystal Ring
4. `bag1.jpg` - Leather Crossbody Bag
5. `earrings1.jpg` - Pearl Stud Earrings
6. `wrap1.jpg` - Cashmere Wrap

## Image Specifications

- **Recommended Size**: 800x800px or larger
- **Format**: JPG, PNG, or WebP
- **Aspect Ratio**: 1:1 (square) recommended
- **File Size**: Keep under 1MB per image for optimal loading

## Adding Images

Simply copy your product images to this directory with the exact file names listed above.

## Alternative: Using Placeholder Images

If you don't have images yet, you can use placeholder services:
- https://via.placeholder.com/800
- https://picsum.photos/800
- https://placehold.co/800x800

Example:
```bash
# Download placeholder images (on macOS/Linux)
for name in necklace1 scarf1 ring1 bag1 earrings1 wrap1; do
  curl -o "${name}.jpg" "https://picsum.photos/800"
done
```
