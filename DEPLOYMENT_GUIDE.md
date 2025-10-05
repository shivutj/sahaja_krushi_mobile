# 🚀 Sahaja Krushi Mobile App Deployment Guide

## 📱 Free Deployment Options

### **Option 1: Expo Development Build (Easiest)**

#### **Step 1: Create Expo Account**
1. Go to [expo.dev](https://expo.dev)
2. Sign up for a free account
3. Note your username

#### **Step 2: Login to Expo**
```bash
cd /Users/shivu/Documents/sahaja_krushi/Sahaja_Krushi_Mobile
npx expo login
# Enter your Expo username and password
```

#### **Step 3: Build Development Version**
```bash
# For Android
npx expo build:android

# For iOS (requires Apple Developer account)
npx expo build:ios
```

#### **Step 4: Install on Device**
- Download the APK/IPA file
- Install on your Android/iOS device
- The app will connect to your deployed backend automatically

---

### **Option 2: EAS Build (Production Ready)**

#### **Step 1: Install EAS CLI**
```bash
npm install -g @expo/eas-cli
```

#### **Step 2: Configure EAS**
```bash
npx eas build:configure
```

#### **Step 3: Build for Production**
```bash
# Android APK (Free - 30 builds/month)
npx eas build --platform android --profile preview

# Android AAB (for Google Play Store)
npx eas build --platform android --profile production

# iOS (requires Apple Developer account)
npx eas build --platform ios --profile production
```

---

### **Option 3: Expo Go (Quick Testing)**

#### **Step 1: Start Development Server**
```bash
npx expo start
```

#### **Step 2: Install Expo Go App**
- Download "Expo Go" from Google Play Store or App Store
- Scan the QR code from terminal
- App runs instantly on your phone

---

### **Option 4: Web Deployment (PWA)**

#### **Step 1: Build for Web**
```bash
npx expo export --platform web
```

#### **Step 2: Deploy to Netlify/Vercel**
1. Upload the `dist` folder to Netlify or Vercel
2. Your app becomes a Progressive Web App
3. Users can "install" it on their phones

---

## 🔧 Configuration

### **API Configuration**
The app is already configured to use your deployed backend:
- **Development**: Uses localhost or LAN IP
- **Production**: Uses `https://sahaja-krushi-backend-h0t1.onrender.com`

### **Environment Variables**
Create a `.env` file (optional):
```env
EXPO_PUBLIC_API_BASE_URL=https://sahaja-krushi-backend-h0t1.onrender.com
```

---

## 📱 App Store Deployment

### **Google Play Store (Free)**
1. Create Google Play Console account ($25 one-time fee)
2. Build production AAB: `npx eas build --platform android --profile production`
3. Upload to Google Play Console
4. Submit for review

### **Apple App Store (Free)**
1. Create Apple Developer account ($99/year)
2. Build production IPA: `npx eas build --platform ios --profile production`
3. Upload to App Store Connect
4. Submit for review

---

## 🎯 Recommended Path

1. **Start with Expo Go** for quick testing
2. **Use EAS Build** for production-ready APK
3. **Deploy to app stores** when ready

---

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install

# Start development server
npx expo start

# Build for Android
npx eas build --platform android --profile preview

# Build for iOS
npx eas build --platform ios --profile preview
```

---

## 📞 Support

- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [React Native Documentation](https://reactnative.dev/)
