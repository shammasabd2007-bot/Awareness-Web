# Rural Connect - Architecture Documentation

## 🏗️ System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    RURAL CONNECT APP                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              PRESENTATION LAYER (UI)                 │  │
│  │  ┌─────────────┬──────────────┬──────────────────┐  │  │
│  │  │   Screens   │  Components  │  Navigation      │  │  │
│  │  └─────────────┴──────────────┴──────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           STATE MANAGEMENT LAYER (Zustand)          │  │
│  │  ┌──────────────────┬──────────────────────────┐   │  │
│  │  │  Auth Store      │  Location Store          │   │  │
│  │  └──────────────────┴──────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           BUSINESS LOGIC LAYER (Utils)              │  │
│  │  ┌──────────────────┬──────────────────────────┐   │  │
│  │  │  Sync Manager    │  Smart Suggestions       │   │  │
│  │  └──────────────────┴──────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           DATA ACCESS LAYER (Database)              │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │  SQLite Database (Local Storage)             │  │  │
│  │  │  - Users Table                               │  │  │
│  │  │  - Locations Table                           │  │  │
│  │  │  - Visit History Table                       │  │  │
│  │  │  - Sync Queue Table                          │  │  │
│  │  │  - Analytics Table                           │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │        EXTERNAL SERVICES (Optional)                 │  │
│  │  ┌──────────────────┬──────────────────────────┐   │  │
│  │  │  Firebase        │  Backend API             │   │  │
│  │  │  (Cloud Sync)    │  (Data Sync)             │   │  │
│  │  └──────────────────┴──────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Directory Structure

```
rural-connect/
├── App.tsx                          # Main app entry point
├── app.json                         # Expo configuration
├── package.json                     # Dependencies
├── tsconfig.json                    # TypeScript config
├── .gitignore                       # Git ignore rules
│
├── src/
│   ├── database/
│   │   └── db.ts                   # SQLite database setup & queries
│   │
│   ├── screens/
│   │   ├── LoginScreen.tsx         # Authentication UI
│   │   ├── HomeScreen.tsx          # Dashboard
│   │   ├── MapScreen.tsx           # Map view & location list
│   │   ├── AddLocationScreen.tsx   # Mark new location
│   │   ├── LocationDetailsScreen.tsx # View location details
│   │   ├── StatusUpdateScreen.tsx  # Update visit status
│   │   └── AdminDashboardScreen.tsx # Admin analytics
│   │
│   ├── store/
│   │   ├── authStore.ts            # Authentication state (Zustand)
│   │   └── locationStore.ts        # Location state (Zustand)
│   │
│   ├── utils/
│   │   ├── syncManager.ts          # Offline sync logic
│   │   └── smartSuggestions.ts     # AI-based suggestions
│   │
│   └── types/
│       └── index.ts                # TypeScript type definitions
│
├── assets/
│   ├── icon.png                    # App icon
│   ├── splash.png                  # Splash screen
│   └── adaptive-icon.png           # Android adaptive icon
│
├── docs/
│   ├── README.md                   # Project overview
│   ├── SETUP_GUIDE.md              # Installation & setup
│   ├── SAMPLE_DATA.md              # Sample data & testing
│   └── ARCHITECTURE.md             # This file
│
└── .env.example                    # Environment variables template
```

## 🔄 Data Flow Architecture

### 1. User Authentication Flow

```
User Input (Email/Password)
        ↓
   Login Screen
        ↓
   Auth Store (Zustand)
        ↓
   Database Query (getUserByEmail)
        ↓
   Validate Credentials
        ↓
   Store Session Token (SecureStore)
        ↓
   Update Auth State
        ↓
   Navigate to Main App
```

### 2. Location Marking Flow

```
User Input (Location Details)
        ↓
   Add Location Screen
        ↓
   Get GPS Coordinates
        ↓
   Add Photos (Optional)
        ↓
   Location Store (addLocation)
        ↓
   Insert to SQLite
        ↓
   Add to Sync Queue
        ↓
   Award Points to User
        ↓
   Update Local State
        ↓
   Show Success Message
```

### 3. Offline Sync Flow

```
User Action (Offline)
        ↓
   Save to SQLite
        ↓
   Add to Sync Queue
        ↓
   App Detects Internet
        ↓
   Sync Manager Triggered
        ↓
   Get Unsynced Items
        ↓
   Send to Backend API
        ↓
   Mark as Synced
        ↓
   Update Local State
```

### 4. Admin Dashboard Flow

```
Admin Opens Dashboard
        ↓
   Fetch All Locations
        ↓
   Calculate Analytics
        ↓
   Get Leaderboard
        ↓
   Prepare Chart Data
        ↓
   Render Dashboard
        ↓
   Display Metrics & Charts
```

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  points INTEGER DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Locations Table
```sql
CREATE TABLE locations (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  status TEXT DEFAULT 'not_visited',
  images TEXT,
  notes TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  syncedAt DATETIME,
  isSynced INTEGER DEFAULT 0,
  FOREIGN KEY(userId) REFERENCES users(id)
);
```

### Visit History Table
```sql
CREATE TABLE visit_history (
  id TEXT PRIMARY KEY,
  locationId TEXT NOT NULL,
  volunteerId TEXT NOT NULL,
  status TEXT NOT NULL,
  notes TEXT,
  images TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  isSynced INTEGER DEFAULT 0,
  FOREIGN KEY(locationId) REFERENCES locations(id),
  FOREIGN KEY(volunteerId) REFERENCES users(id)
);
```

### Sync Queue Table
```sql
CREATE TABLE sync_queue (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  data TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  synced INTEGER DEFAULT 0
);
```

## 🔐 Security Architecture

### Authentication
- Local SQLite storage (development)
- Firebase Authentication (production)
- Secure token storage (expo-secure-store)
- Password hashing (bcrypt in production)

### Data Protection
- Encrypted local storage
- HTTPS for API calls
- Input validation
- SQL injection prevention (parameterized queries)

### Access Control
- Role-based access (user, volunteer, admin)
- Permission checks on sensitive operations
- Audit logging

## 🔄 State Management Architecture

### Zustand Stores

**Auth Store**
```typescript
interface AuthStore {
  user: User | null;
  isLoading: boolean;
  login: (email, password) => Promise<void>;
  register: (name, email, password) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
}
```

**Location Store**
```typescript
interface LocationStore {
  locations: Location[];
  selectedLocation: Location | null;
  visitHistory: VisitRecord[];
  isLoading: boolean;
  
  fetchAllLocations: () => Promise<void>;
  addLocation: (location) => Promise<void>;
  updateStatus: (locationId, status, userId) => Promise<void>;
  addVisitRecord: (...) => Promise<void>;
}
```

## 🔄 Sync Architecture

### Offline-First Strategy

1. **Local First**: All data stored locally in SQLite
2. **Sync Queue**: Changes tracked in sync_queue table
3. **Auto Sync**: Periodic sync every 5 minutes
4. **Conflict Resolution**: Last-write-wins strategy
5. **Error Handling**: Retry logic with exponential backoff

### Sync Flow

```
┌─────────────────────────────────────────┐
│  User Action (Online/Offline)           │
└────────────────┬────────────────────────┘
                 ↓
        ┌────────────────────┐
        │ Save to SQLite     │
        └────────┬───────────┘
                 ↓
        ┌────────────────────┐
        │ Add to Sync Queue  │
        └────────┬───────────┘
                 ↓
        ┌────────────────────┐
        │ Check Internet     │
        └────────┬───────────┘
                 ↓
        ┌────────────────────┐
        │ If Online:         │
        │ Sync Immediately   │
        │ If Offline:        │
        │ Wait for Internet  │
        └────────┬───────────┘
                 ↓
        ┌────────────────────┐
        │ Send to Backend    │
        └────────┬───────────┘
                 ↓
        ┌────────────────────┐
        │ Mark as Synced     │
        └────────┬───────────┘
                 ↓
        ┌────────────────────┐
        │ Update Local State │
        └────────────────────┘
```

## 🎨 UI Architecture

### Screen Hierarchy

```
RootNavigator
├── LoginScreen (unauthenticated)
└── MainNavigator (authenticated)
    ├── HomeScreen (Dashboard)
    ├── MapScreen (Map View)
    ├── AddLocationScreen (Mark Location)
    ├── AdminScreen (Admin Dashboard)
    └── Modal Screens
        ├── LocationDetailsScreen
        └── StatusUpdateScreen
```

### Component Structure

```
App
├── Navigation Container
│   └── Root Navigator
│       ├── Auth Stack
│       │   └── Login Screen
│       └── App Stack
│           ├── Bottom Tab Navigator
│           │   ├── Home Tab
│           │   ├── Map Tab
│           │   ├── Add Location Tab
│           │   └── Admin Tab
│           └── Modal Stack
│               ├── Location Details
│               └── Status Update
```

## 📊 Analytics Architecture

### Data Collection

```
User Action
    ↓
Analytics Table Insert
    ↓
Aggregate Data
    ↓
Generate Metrics
    ↓
Display in Dashboard
```

### Metrics Calculated

- Total locations marked
- Completion rate
- Status distribution
- Category breakdown
- User points & leaderboard
- Visit frequency
- Response time

## 🚀 Performance Architecture

### Optimization Strategies

1. **Database Indexing**
   - Index on status column
   - Index on userId column
   - Index on category column

2. **Query Optimization**
   - Limit result sets
   - Use pagination
   - Cache frequently accessed data

3. **UI Optimization**
   - Lazy loading
   - Virtual lists for large datasets
   - Memoization of components

4. **Memory Management**
   - Cleanup on unmount
   - Proper state cleanup
   - Image compression

## 🔌 API Integration Architecture

### Backend API Endpoints (Future)

```
POST   /api/auth/login
POST   /api/auth/register
POST   /api/locations
GET    /api/locations
GET    /api/locations/:id
PUT    /api/locations/:id
POST   /api/visits
GET    /api/visits/:locationId
GET    /api/analytics
GET    /api/leaderboard
```

### Sync Endpoint

```
POST   /api/sync
Body: {
  items: [
    {
      action: 'INSERT|UPDATE|DELETE',
      table: 'locations|visits',
      data: {...}
    }
  ]
}
```

## 🧪 Testing Architecture

### Unit Tests
- Database queries
- State management
- Utility functions

### Integration Tests
- Auth flow
- Location marking
- Status updates
- Sync process

### E2E Tests
- Complete user journey
- Offline scenarios
- Admin operations

## 📈 Scalability Architecture

### Horizontal Scaling
- Stateless backend
- Database replication
- Load balancing

### Vertical Scaling
- Database optimization
- Caching layer (Redis)
- CDN for assets

### Data Partitioning
- Shard by region
- Shard by user
- Time-based partitioning

## 🔄 Deployment Architecture

### Development
```
Local Machine
    ↓
Expo Dev Server
    ↓
Device/Emulator
```

### Production
```
GitHub/GitLab
    ↓
CI/CD Pipeline
    ↓
Build APK/IPA
    ↓
App Store/Play Store
```

## 📚 Technology Stack Details

### Frontend
- **React Native**: Cross-platform mobile framework
- **Expo**: Development platform
- **TypeScript**: Type safety
- **React Navigation**: Navigation library
- **Zustand**: State management

### Backend (Optional)
- **Node.js**: Runtime
- **Express**: Web framework
- **Firebase**: Backend-as-a-Service
- **PostgreSQL**: Database

### Tools
- **Git**: Version control
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Jest**: Testing framework

## 🎯 Design Patterns Used

1. **MVC Pattern**: Separation of concerns
2. **Observer Pattern**: State management (Zustand)
3. **Singleton Pattern**: Database instance
4. **Factory Pattern**: Screen creation
5. **Strategy Pattern**: Sync strategies
6. **Repository Pattern**: Data access layer

## 📝 Code Quality Standards

- TypeScript for type safety
- ESLint for code style
- Prettier for formatting
- Comments for complex logic
- Meaningful variable names
- DRY principle
- SOLID principles

---

**This architecture ensures scalability, maintainability, and offline-first functionality for the Rural Connect application.**
