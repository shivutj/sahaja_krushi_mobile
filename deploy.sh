#!/bin/bash

echo "🚀 Sahaja Krushi Mobile App Deployment Script"
echo "=============================================="

# Check if Expo CLI is installed
if ! command -v npx &> /dev/null; then
    echo "❌ Node.js/npm not found. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js/npm found"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if user is logged in to Expo
echo "🔐 Checking Expo login status..."
if npx expo whoami &> /dev/null; then
    echo "✅ Already logged in to Expo"
else
    echo "❌ Not logged in to Expo"
    echo "Please run: npx expo login"
    echo "Then run this script again"
    exit 1
fi

echo ""
echo "🎯 Choose deployment option:"
echo "1. Start development server (Expo Go)"
echo "2. Build Android APK (EAS Build)"
echo "3. Build iOS app (EAS Build)"
echo "4. Build for web (PWA)"
echo "5. Exit"

read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo "🚀 Starting development server..."
        npx expo start
        ;;
    2)
        echo "🤖 Building Android APK..."
        npx eas build --platform android --profile preview
        ;;
    3)
        echo "🍎 Building iOS app..."
        npx eas build --platform ios --profile preview
        ;;
    4)
        echo "🌐 Building for web..."
        npx expo export --platform web
        echo "✅ Web build complete! Upload the 'dist' folder to Netlify or Vercel"
        ;;
    5)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac
