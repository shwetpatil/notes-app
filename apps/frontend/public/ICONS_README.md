# PWA Icons

## Current Status
Placeholder SVG icons have been created. For better PWA compatibility, convert these to PNG format.

## How to Generate PNG Icons

### Option 1: Online Tool (Easiest)
1. Visit https://realfavicongenerator.net/ or https://www.pwabuilder.com/imageGenerator
2. Upload `icon.svg`
3. Download the generated icons
4. Replace the .svg files with .png files

### Option 2: Using ImageMagick (if installed)
```bash
cd apps/frontend/public
for size in 192 256 384 512; do
  convert icon.svg -resize ${size}x${size} icon-${size}x${size}.png
  rm icon-${size}x${size}.svg
done
```

### Option 3: Design Tool
1. Open `icon.svg` in Figma, Sketch, or Illustrator
2. Export as PNG in sizes: 192x192, 256x256, 384x384, 512x512
3. Save with names: icon-192x192.png, etc.

The app will still work with SVG icons, but PNG provides better compatibility.
