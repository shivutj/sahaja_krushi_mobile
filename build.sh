#!/bin/bash

echo "🚀 Building Sahaja Krushi Mobile App for Render..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build web version
echo "🌐 Building web version..."
npm run build

# Check if dist folder exists
if [ -d "dist" ]; then
    echo "✅ Build successful! dist folder created."
    echo "📁 Contents of dist folder:"
    ls -la dist/
else
    echo "❌ Build failed! dist folder not found."
    exit 1
fi

echo "🎉 Build complete! Ready for deployment."
