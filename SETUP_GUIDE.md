# Rural Connect - Complete Setup Guide

## 📋 Prerequisites

Before you begin, ensure you have:
- **Node.js** v14+ ([Download](https://nodejs.org/))
- **npm** or **yarn** package manager
- **Expo CLI**: `npm install -g expo-cli`
- **Git** for version control
- A mobile device or emulator (Android/iOS)

## 🔧 Installation Steps

### Step 1: Clone/Download the Project

```bash
# Navigate to your projects directory
cd ~/projects

# Clone the repository (if using git)
git clone <repository-url>
cd rural-connect

# Or extract the ZIP file and navigate to it
```

### Step 2: Install Dependencies

```bash
# Using npm
npm install

# Or using yarn
yarn install
```

This will install all required packages including:
- React Native
- Expo
- Navigation libraries
- State management (Zustand)
- Chart libraries
- And more...

### Step 3: Verify Installation

```bash
# Check if Expo is properly installed
expo --version

# Check if all dependencies are installed
npm list --depth=0
```

## 🚀 Running the Application

### Option 1: Development Server

```bash
# Start the Expo development server
npm start

# This will display a QR code and options:
# - Press 'a' for Android emulator
# - Press 'i' for iOS simulator
# - Press 'w' for web browser
# - Scan QR code with Expo Go app on your phone
```

### Option 2: Android Emulator

```bash
# Make sure Android emulator is running
npm run android

# Or manually:
expo start --android
```

### Option 3: iOS Simulator (macOS only)

```bash
npm run ios

# Or manually:
expo start --ios
```

### Option 4: Web Browser

```bash
npm run web

# Or manually:
expo start --web
```

## 📱 Using Expo Go App

1. **Download Expo Go** from App Store or Google Play
2. **Start development server**: `npm start`
3. **Scan QR code** with Expo Go app
4. App will load on your device

## 🗄️ Database Setup

The app uses SQLite which is automatically initialized on first run:

### Database Location
- **Android**: `/data/data/com.ruralconnect.app/databases/ruralconnect.db`
- **iOS**: App Documents folder
- **Web**: IndexedDB

### Tables Created Automatically
1. `users` - User accounts and profiles
2. `locations` - Marked locations
3. `visit_history` - Visit records
4. `sync_queue` - Offline sync queue
5. `analytics` - Usage analytics

### Reset Database (Development)

To reset the database during development:

```javascript
// In your code, call:
import { initializeDatabase } from './src/database/db';
await initializeDatabase();
```

Or delete the app and reinstall.

## 🔐 Authentication Setup

### Demo Accounts

The app comes with pre-configured demo accounts:

**Admin Account:**
- Email: `admin@ruralconnect.com`
- Password: `admin123`
- Role: Admin (Full access)

**User Account:**
- Email: `user@ruralconnect.com`
- Password: `user123`
- Role: User (Limited access)

### Create New Account

1. Open the app
2. Click "Register" on login screen
3. Enter name, email, and password
4. Account is created locally in SQLite

### Production Authentication

For production, integrate with:

```typescript
// Example: Firebase Authentication
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  projectId: process.env.FIREBASE_PROJECT_ID,
  // ... other config
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
```

## 🗺️ Location Permissions

### Android

Add to `app.json`:
```json
{
  "android": {
    "permissions": [
      "ACCESS_FINE_LOCATION",
      "ACCESS_COARSE_LOCATION",
      "CAMERA",
      "RECORD_AUDIO"
    ]
  }
}
```

### iOS

Add to `app.json`:
```json
{
  "ios": {
    "infoPlist": {
      "NSLocationWhenInUseUsageDescription": "Allow Rural Connect to access your location.",
      "NSCameraUsageDescription": "Allow Rural Connect to access your camera.",
      "NSMicrophoneUsageDescription": "Allow Rural Connect to access your microphone."
    }
  }
}
```

## 📸 Camera & Photo Permissions

The app requests permissions at runtime:

```typescript
// Camera permission
const { status } = await ImagePicker.requestCameraPermissionsAsync();

// Photo library permission
const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  allowsEditing: true,
  aspect: [4, 3],
  quality: 0.7,
});
```

## 🌐 Offline Functionality

### How It Works

1. **All data stored locally** in SQLite
2. **Sync queue** tracks changes
3. **Auto-sync** when internet available
4. **Conflict resolution** for offline changes

### Testing Offline Mode

**Android:**
1. Open Settings → Network & Internet
2. Toggle Airplane Mode ON
3. App continues to work
4. Toggle Airplane Mode OFF
5. Data syncs automatically

**iOS:**
1. Settings → Airplane Mode → ON
2. App continues to work
3. Settings → Airplane Mode → OFF
4. Data syncs automatically

## 🔄 Sync Manager

### Manual Sync

```typescript
import { syncPendingItems } from './src/utils/syncManager';

// Trigger sync manually
await syncPendingItems();
```

### Automatic Sync

Sync runs automatically:
- Every 5 minutes (periodic)
- When app resumes
- When internet connection detected

### Check Sync Status

```typescript
import { getSyncStatus } from './src/utils/syncManager';

const status = await getSyncStatus();
console.log(`Online: ${status.isOnline}`);
console.log(`Pending items: ${status.pendingItems}`);
```

## 🎨 Customization

### Change App Colors

Edit `src/screens/*.tsx` and update color values:

```typescript
// Primary color
const PRIMARY_COLOR = '#2E7D32'; // Green

// Status colors
const STATUS_COLORS = {
  completed: '#4CAF50',    // Green
  in_progress: '#FFC107',  // Yellow
  not_visited: '#F44336',  // Red
};
```

### Change App Name

Edit `app.json`:
```json
{
  "expo": {
    "name": "Your App Name",
    "slug": "your-app-slug"
  }
}
```

### Change App Icon

Replace `assets/icon.png` with your icon (1024x1024 PNG)

## 🧪 Testing Checklist

### Basic Functionality
- [ ] App launches without errors
- [ ] Login works with demo credentials
- [ ] Can register new account
- [ ] Can logout

### Location Features
- [ ] Can mark new location
- [ ] GPS coordinates auto-populate
- [ ] Can add photos
- [ ] Can select category
- [ ] Location saved to database

### Map & View
- [ ] Map screen shows all locations
- [ ] Can filter by status
- [ ] Can view location details
- [ ] Visit history displays correctly

### Admin Features
- [ ] Admin can access dashboard
- [ ] Charts display correctly
- [ ] Leaderboard shows users
- [ ] Statistics are accurate

### Offline Features
- [ ] App works without internet
- [ ] Data syncs when online
- [ ] No data loss during offline period

## 🐛 Troubleshooting

### Issue: "Module not found" error

**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm start
```

### Issue: Port 19000 already in use

**Solution:**
```bash
# Use different port
expo start --port 19001
```

### Issue: Camera not working

**Solution:**
1. Check permissions in app.json
2. Grant camera permission when prompted
3. Restart app

### Issue: Location not updating

**Solution:**
1. Enable location services on device
2. Grant location permission
3. Ensure GPS is enabled
4. Try "Get Current Location" button

### Issue: Database errors

**Solution:**
```bash
# Reset database
npm start
# Delete app and reinstall
# Or clear app data in settings
```

### Issue: Sync not working

**Solution:**
1. Check internet connection
2. Verify backend API is running
3. Check sync queue: `getSyncStatus()`
4. Check console logs for errors

## 📊 Performance Optimization

### For Low-End Devices

1. **Reduce image quality**
```typescript
quality: 0.5 // Instead of 0.7
```

2. **Limit location list**
```typescript
locations.slice(0, 50) // Show only 50 items
```

3. **Disable animations**
```typescript
// In navigation config
animationEnabled: false
```

4. **Optimize database queries**
```typescript
// Use indexes
CREATE INDEX idx_locations_status ON locations(status);
```

## 🔐 Security Best Practices

### Development
- ✅ Use demo credentials for testing
- ✅ Store sensitive data in .env
- ✅ Use HTTPS for API calls
- ✅ Validate user input

### Production
- ✅ Hash passwords (bcrypt)
- ✅ Use Firebase Authentication
- ✅ Implement API authentication
- ✅ Use environment variables
- ✅ Enable CORS properly
- ✅ Validate all inputs server-side

## 📦 Building for Production

### Android APK

```bash
# Build APK
eas build --platform android --type apk

# Or use Expo CLI
expo build:android
```

### iOS App

```bash
# Build for iOS
eas build --platform ios

# Requires Apple Developer account
```

### Web Deployment

```bash
# Build for web
npm run web

# Deploy to Vercel, Netlify, etc.
```

## 📚 Additional Resources

- [React Native Docs](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [React Navigation](https://reactnavigation.org/)
- [Zustand State Management](https://github.com/pmndrs/zustand)

## 🆘 Getting Help

1. **Check console logs**: `npm start` shows detailed errors
2. **Read error messages**: They usually indicate the problem
3. **Check GitHub issues**: Search for similar problems
4. **Ask in communities**: React Native forums, Stack Overflow
5. **Contact support**: support@ruralconnect.com

## ✅ Next Steps

1. ✅ Install dependencies
2. ✅ Run the app
3. ✅ Test with demo accounts
4. ✅ Mark some locations
5. ✅ Check admin dashboard
6. ✅ Test offline functionality
7. ✅ Customize for your needs
8. ✅ Deploy to production

---

**Happy coding! 🚀**
