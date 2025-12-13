#!/usr/bin/env node

/**
 * Simple PWA Icon Generator
 * Creates placeholder PNG icons by copying the SVG
 * For production, replace with proper high-quality icons
 */

const fs = require('fs');
const path = require('path');

const sizes = [192, 256, 384, 512];
const svgPath = path.join(__dirname, 'public', 'icon.svg');
const svgContent = fs.readFileSync(svgPath, 'utf8');

console.log('📦 Creating PWA icon placeholders...\n');

// For each size, create an SVG that will be served as PNG
// Most browsers can render SVG as icons
sizes.forEach(size => {
  // Create a sized SVG version
  const sizedSvg = svgContent
    .replace('width="512"', `width="${size}"`)
    .replace('height="512"', `height="${size}"`);
  
  const filename = `icon-${size}x${size}.svg`;
  const filepath = path.join(__dirname, 'public', filename);
  
  fs.writeFileSync(filepath, sizedSvg);
  console.log(`✓ Created ${filename}`);
});

// Create a README for generating proper PNG icons
const readme = `# PWA Icons

## Current Status
Placeholder SVG icons have been created. For better PWA compatibility, convert these to PNG format.

## How to Generate PNG Icons

### Option 1: Online Tool (Easiest)
1. Visit https://realfavicongenerator.net/ or https://www.pwabuilder.com/imageGenerator
2. Upload \`icon.svg\`
3. Download the generated icons
4. Replace the .svg files with .png files

### Option 2: Using ImageMagick (if installed)
\`\`\`bash
cd apps/frontend/public
for size in 192 256 384 512; do
  convert icon.svg -resize \${size}x\${size} icon-\${size}x\${size}.png
  rm icon-\${size}x\${size}.svg
done
\`\`\`

### Option 3: Design Tool
1. Open \`icon.svg\` in Figma, Sketch, or Illustrator
2. Export as PNG in sizes: 192x192, 256x256, 384x384, 512x512
3. Save with names: icon-192x192.png, etc.

The app will still work with SVG icons, but PNG provides better compatibility.
`;

fs.writeFileSync(path.join(__dirname, 'public', 'ICONS_README.md'), readme);
console.log('\n✅ Icon placeholders created!');
console.log('📝 See public/ICONS_README.md for converting to PNG\n');
