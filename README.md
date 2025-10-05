# Sahaja Krushi Farmer App

A comprehensive React Native (Expo) mobile application designed specifically for farmers to manage their agricultural activities, upload crop reports, and stay updated with agricultural news and information.

## 🌾 Features

### 📱 Core Functionality
- **Multi-language Support**: English and Kannada (ಕನ್ನಡ)
- **Farmer-friendly UI**: Clean, intuitive interface designed for rural users
- **Offline Capable**: Works with limited internet connectivity

### 🔐 Authentication
- **Login Screen**: Farmer ID and Phone Number authentication
- **Demo Credentials**: Pre-filled credentials for testing
- **Logout Functionality**: Secure logout with navigation back to login
- **No Signup**: Farmers are created by admin only

### 🏠 Home Dashboard
- Quick access to all app features
- Real-time statistics and overview
- Navigation to main sections
- Bilingual interface (English + Kannada)
- Logout button in app bar

### 📤 Upload Crop Report
- **Image Capture**: Take photos or select from gallery
- **Audio Recording**: Record voice descriptions
- **Video Recording**: Capture short video clips
- **Description**: Add detailed crop condition notes
- **Preview**: Review before submission
- **Mock Submission**: Simulated backend integration

### 📰 News & Updates
- Agricultural news and announcements
- Weather alerts and advisories
- Market price updates
- Training program notifications
- Pull-to-refresh functionality
- Important news highlighting

### 📋 Report History
- View all previously uploaded reports
- Filter by status (Pending, Approved, Rejected, Under Review)
- Detailed report information
- Media attachments (images, audio, video)
- Status tracking with visual indicators

### 👤 Farmer Profile
- **Personal Information**: Name, contact details, location
- **Agricultural Data**: Land area, primary crops, registration date
- **Editable Fields**: Phone number and language preference
- **Account Status**: Active/Inactive status
- **Support Access**: Contact information for assistance

## 🛠 Technical Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router (file-based routing)
- **UI Components**: React Native Paper
- **Icons**: Expo Vector Icons (MaterialIcons)
- **Media Handling**: 
  - `expo-image-picker` for image selection
  - `expo-camera` for photo/video capture
  - `expo-av` for audio recording and video playback
- **Language**: TypeScript
- **Styling**: StyleSheet with Tailwind-inspired design

## 📁 Project Structure

```
Sahaja_Krushi_Mobile/
├── app/
│   ├── _layout.tsx          # Root layout with navigation
│   ├── login.tsx            # Login screen (first screen)
│   ├── index.tsx            # Home/Dashboard screen
│   ├── upload.tsx           # Upload Crop Report screen
│   ├── news.tsx             # News & Updates screen
│   ├── history.tsx          # Report History screen
│   └── profile.tsx          # Farmer Profile screen
├── assets/                  # Images, fonts, and static assets
├── package.json             # Dependencies and scripts
├── app.json                 # Expo configuration
└── README.md               # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development) or Android Studio (for Android development)

### Installation

1. **Clone the repository**
   ```bash
   cd Sahaja_Krushi_Mobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Run on device/simulator**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on physical device

### Available Scripts

- `npm start` - Start Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator
- `npm run web` - Run in web browser
- `npm run lint` - Run ESLint

## 📱 Screen Descriptions

### Login Screen (`login.tsx`)
- Farmer ID and Phone Number authentication
- Demo credentials for easy testing
- Help section with support contact
- Bilingual interface (English + Kannada)
- Keyboard-aware design

### Home Screen (`index.tsx`)
- Welcome message in both languages
- Four main navigation cards with icons
- Quick statistics overview
- Clean, card-based layout
- App bar with logout functionality

### Upload Screen (`upload.tsx`)
- Multi-step form for crop report submission
- Camera integration for photo capture
- Audio recording with visual feedback
- Video recording capabilities
- Preview functionality before submission
- Form validation and error handling

### News Screen (`news.tsx`)
- Scrollable list of agricultural news
- Bilingual content (English + Kannada)
- Category-based organization
- Important news highlighting
- Pull-to-refresh functionality
- Date-based sorting

### History Screen (`history.tsx`)
- Filterable list of submitted reports
- Status-based filtering (All, Pending, Approved, Rejected)
- Visual status indicators
- Media attachment previews
- Detailed report information
- Action buttons for report management

### Profile Screen (`profile.tsx`)
- Farmer information display
- Editable personal details
- Language preference selection
- Account status information
- Support contact section
- Avatar and profile image support

## 🌐 Multi-language Support

The app supports both English and Kannada languages:
- All UI elements display in both languages
- Content is presented side-by-side
- Language preference can be changed in profile
- Consistent terminology across the app

## 📊 Mock Data

The app includes comprehensive mock data for:
- **News Articles**: 6 sample news items with categories
- **Report History**: 6 sample crop reports with various statuses
- **Farmer Profile**: Complete farmer information
- **Statistics**: Dashboard metrics and counts

## 🔧 Backend Integration

Currently, the app uses mock data and simulated API calls. Backend integration points are marked with `TODO` comments:

- **Authentication**: Login validation and token management
- Upload report submission
- Profile updates
- News fetching
- History retrieval

## 🎨 UI/UX Features

- **Material Design**: Consistent with Google's Material Design principles
- **Color Scheme**: Green-based theme representing agriculture
- **Typography**: Clear, readable fonts suitable for all users
- **Icons**: Intuitive iconography for easy navigation
- **Responsive**: Adapts to different screen sizes
- **Accessibility**: High contrast and clear text

## 🔒 Permissions

The app requires the following permissions:
- **Camera**: For taking photos and recording videos
- **Microphone**: For audio recording
- **Storage**: For saving media files
- **Location**: For field location tracking (future feature)

## 🚧 Future Enhancements

- **Real-time Notifications**: Push notifications for important updates
- **Offline Mode**: Full offline functionality with sync
- **Voice Commands**: Voice-based navigation for accessibility
- **AI Integration**: Crop disease detection and recommendations
- **Weather Integration**: Real-time weather data
- **Market Prices**: Live market price updates
- **Community Features**: Farmer-to-farmer communication

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is part of the Sahaja Krushi initiative and is proprietary software.

## 📞 Support

For technical support or questions:
- Email: support@sahajakrushi.com
- Phone: +91-XXX-XXX-XXXX
- In-app: Use the "Contact Support" button in the Profile screen

---

**Built with ❤️ for Indian Farmers**
