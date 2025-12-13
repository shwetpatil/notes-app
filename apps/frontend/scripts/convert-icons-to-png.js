#!/usr/bin/env node

/**
 * Convert SVG Icons to PNG for PWA
 * 
 * This script converts SVG icon files to PNG format using sharp library.
 * Required for better PWA compatibility across all devices.
 * 
 * Usage:
 *   node scripts/convert-icons-to-png.js
 * 
 * Requirements:
 *   npm install sharp
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '../public');
const ICON_SIZES = [192, 256, 384, 512];

async function convertSvgToPng() {
  console.log('🎨 Converting SVG icons to PNG format...\n');

  const sourceSvg = path.join(PUBLIC_DIR, 'icon.svg');

  if (!fs.existsSync(sourceSvg)) {
    console.error('❌ Error: icon.svg not found in public directory');
    process.exit(1);
  }

  try {
    for (const size of ICON_SIZES) {
      const outputPath = path.join(PUBLIC_DIR, `icon-${size}x${size}.png`);
      
      await sharp(sourceSvg)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Created: icon-${size}x${size}.png`);
    }

    console.log('\n✨ All PNG icons created successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Update manifest.json to reference .png files');
    console.log('2. Verify icons in browser DevTools > Application > Manifest');
    console.log('3. Test PWA installation on mobile device\n');

  } catch (error) {
    console.error('❌ Error converting icons:', error.message);
    process.exit(1);
  }
}

convertSvgToPng();
