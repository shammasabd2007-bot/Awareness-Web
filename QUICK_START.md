# Rural Connect - Quick Start Guide

Get the Rural Connect app running in 5 minutes!

## ⚡ 5-Minute Setup

### Step 1: Install Dependencies (2 min)
```bash
cd rural-connect
npm install
```

### Step 2: Start Development Server (1 min)
```bash
npm start
```

### Step 3: Run on Device (2 min)

**Option A: Android Emulator**
```bash
npm run android
```

**Option B: iOS Simulator (macOS)**
```bash
npm run ios
```

**Option C: Expo Go App**
1. Download "Expo Go" from App Store or Play Store
2. Scan the QR code shown in terminal
3. App loads on your phone

## 🔑 Demo Credentials

### Admin Account
```
Email: admin@ruralconnect.com
Password: admin123
```

### User Account
```
Email: user@ruralconnect.com
Password: user123
```

## 🎯 First Steps

1. **Login** with demo credentials
2. **Mark a Location** - Go to "Mark Location" tab
3. **View Map** - See all marked locations
4. **Update Status** - Change location status
5. **Check Dashboard** - View analytics (Admin only)

## 📱 Key Features to Try

### 1. Mark Location
- Tap "Mark Location" tab
- Fill in details
- Get GPS coordinates
- Add photos
- Submit

### 2. View Map
- Tap "Map" tab
- See all locations
- Filter by status
- Tap location for details

### 3. Update Status
- Select a location
- Tap "Update Status"
- Change status
- Add notes & photos
- Submit

### 4. Admin Dashboard
- Login as admin
- Tap "Admin" tab
- View analytics
- Check leaderboard
- See statistics

## 🔧 Troubleshooting

### App won't start?
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm start
```

### Port already in use?
```bash
npm start -- --port 19001
```

### Camera not working?
- Grant camera permission when prompted
- Check app permissions in device settings

### Location not updating?
- Enable location services
- Grant location permission
- Ensure GPS is enabled

## 📚 Next Steps

1. Read [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed setup
2. Check [SAMPLE_DATA.md](./SAMPLE_DATA.md) for test data
3. Review [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
4. Explore [README.md](./README.md) for full documentation

## 🚀 Deployment

### Build for Android
```bash
eas build --platform android
```

### Build for iOS
```bash
eas build --platform ios
```

## 💡 Tips

- **Offline Mode**: Enable Airplane Mode to test offline functionality
- **Test Data**: Use sample data from SAMPLE_DATA.md
- **Admin Features**: Login as admin to access dashboard
- **Performance**: App optimized for low-end devices

## 🆘 Need Help?

1. Check console logs: `npm start` shows detailed errors
2. Read error messages carefully
3. Check [SETUP_GUIDE.md](./SETUP_GUIDE.md) troubleshooting section
4. Review [ARCHITECTURE.md](./ARCHITECTURE.md) for system design

## ✅ Verification Checklist

- [ ] Dependencies installed
- [ ] App starts without errors
- [ ] Can login with demo credentials
- [ ] Can mark a location
- [ ] Can view map
- [ ] Can update status
- [ ] Admin dashboard works
- [ ] Offline mode works

## 🎉 You're Ready!

The Rural Connect app is now running. Start exploring and testing!

---

**Happy coding! 🚀**
