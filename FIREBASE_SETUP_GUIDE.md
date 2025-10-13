# Firebase OTP Setup Guide

## 🔥 Firebase Configuration Steps

### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `sahaja-krushi-mobile`
4. Enable Google Analytics (optional)
5. Click "Create project"

### Step 2: Enable Authentication
1. In Firebase console, go to **Authentication** → **Sign-in method**
2. Click on **Phone** provider
3. Enable **Phone** authentication
4. Save the configuration

### Step 3: Add Web App to Firebase
1. In Firebase console, click the **Web** icon (`</>`)
2. Register app with name: `Sahaja Krushi Mobile`
3. Copy the Firebase configuration object

### Step 4: Update Firebase Config
Replace the placeholder config in `firebase.config.js` with your actual config:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "sahaja-krushi-mobile.firebaseapp.com",
  projectId: "sahaja-krushi-mobile",
  storageBucket: "sahaja-krushi-mobile.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

### Step 5: Configure Test Phone Numbers (Optional)
For testing without using real SMS:
1. Go to **Authentication** → **Sign-in method** → **Phone**
2. Scroll to **Phone numbers for testing**
3. Add test numbers with verification codes:
   - Phone: `+919876543210`
   - Code: `123456`

## 🚀 Testing the OTP Flow

### Local Testing
1. Run the app: `npm start`
2. Enter a valid Indian phone number (10 digits)
3. Click "Send OTP"
4. Enter the 6-digit OTP received
5. Click "Verify OTP"

### Production Testing
1. Deploy your app
2. Use real phone numbers
3. SMS will be sent automatically via Firebase

## 🔧 Troubleshooting

### Common Issues

**1. reCAPTCHA Issues**
- Make sure your domain is authorized in Firebase console
- For development, use `localhost` in authorized domains

**2. SMS Not Received**
- Check if phone number format is correct (+91xxxxxxxxxx)
- Verify Firebase project has billing enabled for production
- Check SMS quota in Firebase console

**3. Invalid Verification Code**
- Ensure OTP is entered within the time limit (usually 5 minutes)
- Check if the verification ID matches

**4. Network Errors**
- Verify internet connection
- Check if Firebase config is correct
- Ensure Firebase services are not blocked by firewall

## 📱 Mobile App Features

### Current Implementation
- ✅ Phone number validation
- ✅ OTP sending via Firebase
- ✅ OTP verification
- ✅ Countdown timer for resend
- ✅ Error handling
- ✅ Bilingual support (English + Kannada)

### Backend Integration
- ✅ OTP-verified login endpoint
- ✅ Backward compatibility with DOB login
- ✅ Farmer authentication

## 🔐 Security Features

1. **Phone Verification**: Firebase ensures phone number ownership
2. **Time-Limited OTP**: Codes expire automatically
3. **Rate Limiting**: Firebase prevents spam
4. **Secure Storage**: Session tokens stored securely

## 💰 Cost Considerations

### Firebase Free Tier
- **Phone Auth**: 10,000 verifications/month FREE
- **Additional**: $0.01 per verification after free tier

### Production Recommendations
1. Monitor usage in Firebase console
2. Set up billing alerts
3. Implement client-side rate limiting
4. Use test phone numbers during development

## 🚀 Deployment

### Mobile App
```bash
# Build for production
npm run build

# Deploy to Expo/web
npm run deploy
```

### Backend
- Backend already deployed on Render
- OTP endpoints are ready and compatible

## 📞 Support

If you encounter issues:
1. Check Firebase console logs
2. Review mobile app console logs  
3. Verify phone number format
4. Test with different phone numbers

---

**Note**: This implementation uses Firebase Auth which is completely free for your use case (under 10K users/month).
