#!/usr/bin/env node

/**
 * PWA Icon Generator
 * 
 * Generates PWA icons in all required sizes from an SVG source.
 * Run: node generate-icons.js
 */

const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

const sizes = [192, 256, 384, 512];
const svgPath = './public/icon.svg';

async function generateIcons() {
  try {
    // For now, create placeholder PNGs with canvas
    // In production, use proper SVG to PNG conversion or design tools
    
    for (const size of sizes) {
      const canvas = createCanvas(size, size);
      const ctx = canvas.getContext('2d');
      
      // Background
      ctx.fillStyle = '#3b82f6';
      ctx.roundRect(0, 0, size, size, size / 6.4);
      ctx.fill();
      
      // White note card
      ctx.fillStyle = 'white';
      const padding = size * 0.156;
      const noteHeight = size * 0.61;
      ctx.roundRect(padding, size * 0.195, size - 2 * padding, noteHeight, size / 25.6);
      ctx.fill();
      
      // Lines on note
      ctx.fillStyle = '#3b82f6';
      const lineY1 = size * 0.3125;
      ctx.roundRect(size * 0.234, lineY1, size * 0.531, size * 0.039, size / 51.2);
      ctx.fill();
      
      ctx.fillStyle = '#94a3b8';
      const lineY2 = size * 0.43;
      ctx.roundRect(size * 0.234, lineY2, size * 0.391, size * 0.039, size / 51.2);
      ctx.fill();
      
      const lineY3 = size * 0.547;
      ctx.roundRect(size * 0.234, lineY3, size * 0.469, size * 0.039, size / 51.2);
      ctx.fill();
      
      // Save PNG
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(`./public/icon-${size}x${size}.png`, buffer);
      console.log(`✓ Generated icon-${size}x${size}.png`);
    }
    
    console.log('\\n✅ All PWA icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error.message);
    console.log('\\n⚠️  Fallback: Creating simple placeholder icons...');
    
    // Fallback: Create a simple script that uses the SVG directly
    createSimpleFallback();
  }
}

function createSimpleFallback() {
  // For systems without canvas, create a documentation file
  const readme = `# PWA Icons

## Manual Icon Generation Required

The automatic icon generator requires the 'canvas' package which isn't installed.

### Option 1: Use Online Tool
1. Open https://realfavicongenerator.net/ or https://www.pwabuilder.com/imageGenerator
2. Upload the icon.svg file from this directory
3. Generate icons in sizes: 192x192, 256x256, 384x384, 512x512
4. Save them to this directory with names: icon-192x192.png, icon-256x256.png, etc.

### Option 2: Use Design Software
1. Open icon.svg in Figma, Sketch, or Adobe Illustrator
2. Export as PNG in the following sizes:
   - 192x192 (icon-192x192.png)
   - 256x256 (icon-256x256.png)
   - 384x384 (icon-384x384.png)
   - 512x512 (icon-512x512.png)
3. Save to this directory

### Option 3: Install canvas package
\`\`\`bash
cd apps/frontend
pnpm add -D canvas
node generate-icons.js
\`\`\`

The PWA will work without icons, but users won't be able to install it to their home screen properly.
`;

  fs.writeFileSync('./public/PWA_ICONS_README.md', readme);
  console.log('\\n📝 Created PWA_ICONS_README.md with manual generation instructions');
}

// Try to use canvas, fallback if not available
try {
  require.resolve('canvas');
  generateIcons();
} catch (e) {
  console.log('⚠️  canvas package not found, creating fallback documentation...');
  createSimpleFallback();
}
