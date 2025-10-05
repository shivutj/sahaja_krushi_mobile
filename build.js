#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building Sahaja Krushi Mobile App for Render...');

try {
  // Install dependencies
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });

  // Build web version
  console.log('🌐 Building web version...');
  execSync('npm run build', { stdio: 'inherit' });

  // Check if dist folder exists
  const distPath = path.join(__dirname, 'dist');
  if (fs.existsSync(distPath)) {
    console.log('✅ Build successful! dist folder created.');
    console.log('📁 Contents of dist folder:');
    const files = fs.readdirSync(distPath);
    files.forEach(file => {
      console.log(`  - ${file}`);
    });
  } else {
    console.log('❌ Build failed! dist folder not found.');
    process.exit(1);
  }

  console.log('🎉 Build complete! Ready for deployment.');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
