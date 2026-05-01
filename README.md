# Rural Connect - Offline Digital Awareness & Mapping System

A comprehensive mobile application designed to identify rural areas with low digital awareness and enable volunteers to mark, visit, and improve awareness levels. The app works seamlessly in low or no internet conditions with offline-first architecture.

## 🎯 Project Overview

Rural Connect is a React Native + Expo application that helps:
- **Identify** rural areas needing digital awareness
- **Mark** locations with GPS coordinates and details
- **Track** volunteer visits and progress
- **Analyze** data with admin dashboards
- **Incentivize** contributions through a points system

## ✨ Core Features

### 1. 📍 Map-Based Location System
- GPS-based location marking
- Color-coded status indicators:
  - 🔴 Not Visited (Red)
  - 🟡 In Progress (Yellow)
  - 🟢 Completed (Green)
- Location details with images and descriptions
- Category-based organization (Healthcare, Education, Government Schemes, etc.)

### 2. 📴 Offline-First Architecture
- **SQLite Database**: Local data storage
- **Sync Queue**: Automatic sync when online
- **Conflict Resolution**: Handles offline changes
- **Data Persistence**: No data loss during offline periods

### 3. 👥 User Roles System
- **Guest/User**: Can mark locations
- **Volunteer**: Can update visit status and upload proof
- **Admin**: Full system access and analytics

### 4. 🔄 Status Tracking
- Real-time status updates
- Visit history with timestamps
- Photo evidence support
- Detailed notes and observations

### 5. 🤖 Smart Suggestions
- High-priority area identification
- Ignored region detection
- Category-based focus recommendations
- Completion rate analysis

### 6. 🎤 Voice-Based Interaction
- Voice input for location marking
- Voice descriptions (framework ready)
- Accessibility support

### 7. 📊 Admin Dashboard
- Real-time analytics
- Status distribution charts
- Category breakdown
- Leaderboard system
- Performance metrics

### 8. 🏆 Volunteer Incentive System
- Points for marking locations (+10)
- Points for status updates (+20)
- Points for completion (+50)
- Leaderboard rankings

## 🛠️ Tech Stack

### Frontend
- **React Native** - Cross-platform mobile development
- **Expo** - Rapid development and deployment
- **TypeScript** - Type safety
- **React Navigation** - Navigation management
- **Zustand** - State management

### Backend & Storage
- **SQLite** - Local offline database
- **Firebase** (optional) - Cloud sync and authentication
- **Expo APIs** - Location, Camera, Voice

### UI Components
- **React Native Chart Kit** - Data visualization
- **Expo Vector Icons** - Icon library
- **Native Components** - Platform-specific UI

## 📦 Project Structure

```
rural-connect/
├── App.tsx                          # Main app entry point
├── app.json                         # Expo configuration
├── package.json                     # Dependencies
├── src/
│   ├── database/
│   │   └── db.ts                   # SQLite database setup & queries
│   ├── screens/
│   │   ├── LoginScreen.tsx         # Authentication
│   │   ├── HomeScreen.tsx          # Dashboard
│   │   ├── MapScreen.tsx           # Map view
│   │   ├── AddLocationScreen.tsx   # Mark new location
│   │   ├── LocationDetailsScreen.tsx # View location details
│   │   ├── StatusUpdateScreen.tsx  # Update visit status
│   │   └── AdminDashboardScreen.tsx # Admin analytics
│   ├── store/
│   │   ├── authStore.ts            # Authentication state
│   │   └── locationStore.ts        # Location state management
│   └── utils/
│       ├── syncManager.ts          # Offline sync logic
│       └── smartSuggestions.ts     # AI-based suggestions
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- Mobile device or emulator

### Installation

1. **Clone the repository**
```bash
cd rural-connect
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
```

3. **Start the development server**
```bash
npm start
# or
yarn start
```

4. **Run on device/emulator**
```bash
# For Android
npm run android

# For iOS
npm run ios

# For Web
npm run web
```

## 📱 Demo Credentials

### Admin Account
- **Email**: admin@ruralconnect.com
- **Password**: admin123
- **Role**: Admin (Full access to dashboard)

### User Account
- **Email**: user@ruralconnect.com
- **Password**: user123
- **Role**: User (Can mark locations)

## 🔐 Authentication

The app uses local SQLite authentication. In production, integrate with:
- Firebase Authentication
- Custom backend API
- OAuth providers

## 💾 Database Schema

### Users Table
```sql
- id (PRIMARY KEY)
- name
- email (UNIQUE)
- password (hash in production)
- role (user, volunteer, admin)
- points
- createdAt
```

### Locations Table
```sql
- id (PRIMARY KEY)
- userId (FOREIGN KEY)
- latitude, longitude
- title, description
- category
- status (not_visited, in_progress, completed)
- images (JSON array)
- notes
- createdAt, updatedAt
- isSynced
```

### Visit History Table
```sql
- id (PRIMARY KEY)
- locationId (FOREIGN KEY)
- volunteerId (FOREIGN KEY)
- status
- notes
- images (JSON array)
- timestamp
- isSynced
```

### Sync Queue Table
```sql
- id (PRIMARY KEY)
- action (INSERT, UPDATE, DELETE)
- table_name
- data (JSON)
- timestamp
- synced (0/1)
```

## 🔄 Offline Sync Flow

1. **User Action**: User marks location or updates status
2. **Local Storage**: Data saved to SQLite
3. **Sync Queue**: Action added to sync queue
4. **Online Check**: App detects internet connection
5. **Sync**: Pending items synced to backend
6. **Confirmation**: Sync status updated

## 📊 Admin Dashboard Features

- **Real-time Metrics**: Total, completed, in-progress, pending locations
- **Progress Visualization**: Pie charts and bar graphs
- **Category Analysis**: Breakdown by location category
- **Leaderboard**: Top 10 contributors with medals
- **Recent Activity**: Latest marked locations
- **System Statistics**: User count, average points, completion rate

## 🎨 UI/UX Design Principles

- **Simple & Clean**: Minimal text, maximum icons
- **Large Buttons**: Easy for rural users
- **Color-Coded**: Visual status indicators
- **Accessibility**: High contrast, readable fonts
- **Offline-First**: Works without internet
- **Low Bandwidth**: Optimized for slow connections

## 🔧 Configuration

### Environment Variables
Create a `.env` file:
```
FIREBASE_API_KEY=your_key
FIREBASE_PROJECT_ID=your_project
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
```

### Permissions (Android)
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

## 📈 Smart Suggestions Engine

The app analyzes data to provide:
1. **High-Priority Areas**: Oldest unvisited locations
2. **Ignored Regions**: Categories with high not_visited percentage
3. **Category Focus**: Recommendations based on distribution
4. **Completion Rate**: Progress tracking and motivation

## 🔄 Sync Manager

Handles:
- Network status detection
- Periodic sync (every 5 minutes)
- Sync on app resume
- Conflict resolution
- Error handling and retry logic

## 🧪 Testing

### Sample Data
The app includes demo credentials for testing:
- Admin dashboard access
- Location marking
- Status updates
- Leaderboard functionality

### Manual Testing Checklist
- [ ] Login/Register functionality
- [ ] Mark location with GPS
- [ ] Add photos to location
- [ ] Update location status
- [ ] View location details
- [ ] Check admin dashboard
- [ ] Verify offline functionality
- [ ] Test sync when online
- [ ] Check leaderboard

## 🚀 Deployment

### Android
```bash
eas build --platform android
eas submit --platform android
```

### iOS
```bash
eas build --platform ios
eas submit --platform ios
```

## 📝 Future Enhancements

- [ ] QR-based awareness content
- [ ] Multi-language support (Hindi, Regional languages)
- [ ] Push notifications for pending visits
- [ ] Advanced ML-based suggestions
- [ ] Real-time collaboration features
- [ ] Offline map tiles
- [ ] Video evidence support
- [ ] Community forums
- [ ] Gamification features
- [ ] Integration with government databases

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

## 📞 Support

For issues, questions, or suggestions:
- Create an issue on GitHub
- Contact: support@ruralconnect.com
- Documentation: [Full Docs](./docs)

## 🙏 Acknowledgments

- Built with React Native and Expo
- Inspired by rural development initiatives
- Community-driven development

---

**Made with ❤️ for Rural Digital Awareness**
