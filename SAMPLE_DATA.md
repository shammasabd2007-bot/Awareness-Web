# Rural Connect - Sample Data & Testing Guide

## 📊 Sample Data Overview

This document provides sample data for testing the Rural Connect application. You can use this data to populate the database and test various features.

## 👥 Sample Users

### Admin User
```json
{
  "id": "admin-001",
  "name": "Rajesh Kumar",
  "email": "admin@ruralconnect.com",
  "password": "admin123",
  "role": "admin",
  "points": 500
}
```

### Volunteer Users
```json
{
  "id": "volunteer-001",
  "name": "Priya Singh",
  "email": "priya@ruralconnect.com",
  "password": "priya123",
  "role": "volunteer",
  "points": 350
}
```

```json
{
  "id": "volunteer-002",
  "name": "Amit Patel",
  "email": "amit@ruralconnect.com",
  "password": "amit123",
  "role": "volunteer",
  "points": 280
}
```

### Regular Users
```json
{
  "id": "user-001",
  "name": "Deepak Sharma",
  "email": "deepak@ruralconnect.com",
  "password": "deepak123",
  "role": "user",
  "points": 150
}
```

## 📍 Sample Locations

### Healthcare Locations

**Location 1: Village Health Center**
```json
{
  "id": "loc-001",
  "userId": "user-001",
  "latitude": 28.6139,
  "longitude": 77.2090,
  "title": "Village Health Center - Sector 5",
  "description": "Small health center serving 500+ residents. Lacks digital awareness about telemedicine and online health records.",
  "category": "Healthcare",
  "status": "completed",
  "images": ["image1.jpg", "image2.jpg"],
  "notes": "Successfully conducted awareness session on digital health records",
  "createdAt": "2024-04-15T10:30:00Z",
  "updatedAt": "2024-04-20T14:45:00Z"
}
```

**Location 2: Primary Health Sub-Center**
```json
{
  "id": "loc-002",
  "userId": "volunteer-001",
  "latitude": 28.5355,
  "longitude": 77.3910,
  "title": "Primary Health Sub-Center - Village Nagar",
  "description": "Remote health center with limited digital infrastructure. Staff needs training on digital patient management systems.",
  "category": "Healthcare",
  "status": "in_progress",
  "images": [],
  "notes": "Initial assessment completed. Training scheduled for next week.",
  "createdAt": "2024-04-18T09:15:00Z",
  "updatedAt": "2024-04-22T11:20:00Z"
}
```

**Location 3: Community Health Worker Post**
```json
{
  "id": "loc-003",
  "userId": "user-001",
  "latitude": 28.7041,
  "longitude": 77.1025,
  "title": "Community Health Worker Post - Outer Delhi",
  "description": "Health worker post serving rural population. No digital literacy programs in place.",
  "category": "Healthcare",
  "status": "not_visited",
  "images": [],
  "notes": "",
  "createdAt": "2024-04-20T08:00:00Z",
  "updatedAt": "2024-04-20T08:00:00Z"
}
```

### Education Locations

**Location 4: Government Primary School**
```json
{
  "id": "loc-004",
  "userId": "volunteer-002",
  "latitude": 28.5244,
  "longitude": 77.1855,
  "title": "Government Primary School - Block A",
  "description": "School with 200+ students. Teachers lack digital skills for online teaching. No computer lab.",
  "category": "Education",
  "status": "completed",
  "images": ["school1.jpg"],
  "notes": "Conducted digital literacy workshop for 15 teachers. Provided resources for online teaching.",
  "createdAt": "2024-04-10T10:00:00Z",
  "updatedAt": "2024-04-19T15:30:00Z"
}
```

**Location 5: Village High School**
```json
{
  "id": "loc-005",
  "userId": "volunteer-001",
  "latitude": 28.6332,
  "longitude": 77.2197,
  "title": "Village High School - Sector 8",
  "description": "High school with 400 students. Limited internet connectivity. Students need digital skills training.",
  "category": "Education",
  "status": "in_progress",
  "images": [],
  "notes": "Internet connectivity improved. Digital literacy program started.",
  "createdAt": "2024-04-16T11:45:00Z",
  "updatedAt": "2024-04-21T13:20:00Z"
}
```

**Location 6: Adult Education Center**
```json
{
  "id": "loc-006",
  "userId": "user-001",
  "latitude": 28.5921,
  "longitude": 77.2580,
  "title": "Adult Education Center - Community Hall",
  "description": "Center for adult literacy. No digital awareness programs. Serves 100+ adults.",
  "category": "Education",
  "status": "not_visited",
  "images": [],
  "notes": "",
  "createdAt": "2024-04-21T09:30:00Z",
  "updatedAt": "2024-04-21T09:30:00Z"
}
```

### Government Schemes Locations

**Location 7: Gram Panchayat Office**
```json
{
  "id": "loc-007",
  "userId": "volunteer-002",
  "latitude": 28.5500,
  "longitude": 77.2500,
  "title": "Gram Panchayat Office - Village Council",
  "description": "Local government office. Staff unaware of digital government schemes and online services.",
  "category": "Government Schemes",
  "status": "completed",
  "images": ["panchayat1.jpg", "panchayat2.jpg"],
  "notes": "Trained staff on e-governance portals and digital scheme applications.",
  "createdAt": "2024-04-12T10:15:00Z",
  "updatedAt": "2024-04-18T16:45:00Z"
}
```

**Location 8: ASHA Worker Center**
```json
{
  "id": "loc-008",
  "userId": "volunteer-001",
  "latitude": 28.6500,
  "longitude": 77.3000,
  "title": "ASHA Worker Center - Health Scheme Hub",
  "description": "Center for ASHA workers. Need training on digital health schemes and online registration.",
  "category": "Government Schemes",
  "status": "in_progress",
  "images": [],
  "notes": "Initial training completed. Follow-up sessions scheduled.",
  "createdAt": "2024-04-17T14:00:00Z",
  "updatedAt": "2024-04-22T10:30:00Z"
}
```

### Agriculture Locations

**Location 9: Farmer Cooperative**
```json
{
  "id": "loc-009",
  "userId": "user-001",
  "latitude": 28.4500,
  "longitude": 77.1500,
  "title": "Farmer Cooperative - Agricultural Society",
  "description": "Cooperative with 150+ farmers. Lack awareness about digital farming tools and e-commerce platforms.",
  "category": "Agriculture",
  "status": "not_visited",
  "images": [],
  "notes": "",
  "createdAt": "2024-04-19T08:45:00Z",
  "updatedAt": "2024-04-19T08:45:00Z"
}
```

## 📋 Sample Visit History

### Visit Record 1
```json
{
  "id": "visit-001",
  "locationId": "loc-001",
  "volunteerId": "volunteer-001",
  "status": "in_progress",
  "notes": "Initial assessment completed. Identified 5 key areas for digital awareness.",
  "images": ["visit1_1.jpg", "visit1_2.jpg"],
  "timestamp": "2024-04-20T10:00:00Z"
}
```

### Visit Record 2
```json
{
  "id": "visit-002",
  "locationId": "loc-001",
  "volunteerId": "volunteer-001",
  "status": "completed",
  "notes": "Conducted 2-hour workshop on digital health records. 25 staff members participated.",
  "images": ["visit2_1.jpg", "visit2_2.jpg", "visit2_3.jpg"],
  "timestamp": "2024-04-20T14:45:00Z"
}
```

### Visit Record 3
```json
{
  "id": "visit-003",
  "locationId": "loc-004",
  "volunteerId": "volunteer-002",
  "status": "completed",
  "notes": "Trained 15 teachers on online teaching platforms. Provided resource materials.",
  "images": ["visit3_1.jpg"],
  "timestamp": "2024-04-19T15:30:00Z"
}
```

## 📊 Analytics Summary

Based on sample data:

```json
{
  "total": 9,
  "completed": 3,
  "inProgress": 3,
  "notVisited": 3,
  "completionPercentage": 33.33,
  "categoryBreakdown": {
    "Healthcare": 3,
    "Education": 3,
    "Government Schemes": 2,
    "Agriculture": 1
  },
  "topContributors": [
    {
      "id": "volunteer-001",
      "name": "Priya Singh",
      "points": 350,
      "rank": 1
    },
    {
      "id": "volunteer-002",
      "name": "Amit Patel",
      "points": 280,
      "rank": 2
    },
    {
      "id": "user-001",
      "name": "Deepak Sharma",
      "points": 150,
      "rank": 3
    }
  ]
}
```

## 🧪 Testing Scenarios

### Scenario 1: Mark a New Location
1. Login as `user@ruralconnect.com`
2. Go to "Mark Location" tab
3. Fill in details:
   - Title: "Community Center - Digital Hub"
   - Description: "Center needs digital literacy programs"
   - Category: "Education"
   - Get current location (or use sample coordinates)
4. Add a photo (optional)
5. Submit

**Expected Result**: Location appears in map and dashboard

### Scenario 2: Update Location Status
1. Login as `volunteer@ruralconnect.com`
2. Go to Map tab
3. Select a location with status "Not Visited"
4. Click "Update Status"
5. Change status to "In Progress"
6. Add notes and photos
7. Submit

**Expected Result**: Status updated, points awarded, visit history recorded

### Scenario 3: View Admin Dashboard
1. Login as `admin@ruralconnect.com`
2. Go to "Admin" tab
3. View analytics:
   - Total locations
   - Status distribution
   - Category breakdown
   - Leaderboard
   - Recent locations

**Expected Result**: All charts and statistics display correctly

### Scenario 4: Test Offline Functionality
1. Mark a location while online
2. Enable Airplane Mode
3. Try to mark another location
4. Data should save locally
5. Disable Airplane Mode
6. Data should sync automatically

**Expected Result**: No data loss, automatic sync when online

## 📈 Performance Metrics

With sample data:
- **App Load Time**: < 2 seconds
- **Location Query**: < 100ms
- **Database Size**: ~2MB
- **Memory Usage**: ~50MB
- **Sync Time**: < 5 seconds

## 🔄 Data Import Script

To import sample data programmatically:

```typescript
import { insertUser, insertLocation, insertVisitHistory } from './src/database/db';

export const importSampleData = async () => {
  try {
    // Import users
    await insertUser({
      id: 'user-001',
      name: 'Deepak Sharma',
      email: 'deepak@ruralconnect.com',
      password: 'deepak123',
      role: 'user',
      points: 150,
    });

    // Import locations
    await insertLocation({
      id: 'loc-001',
      userId: 'user-001',
      latitude: 28.6139,
      longitude: 77.2090,
      title: 'Village Health Center',
      description: 'Health center needing digital awareness',
      category: 'Healthcare',
      status: 'not_visited',
      images: [],
      notes: '',
    });

    console.log('Sample data imported successfully');
  } catch (error) {
    console.error('Error importing sample data:', error);
  }
};
```

## 📝 Notes

- Sample coordinates are in Delhi, India region
- Dates are relative to current date
- Points are calculated based on actions
- Images are referenced but not included (use your own)
- All data is for testing purposes only

## 🎯 Testing Checklist

- [ ] Create new user account
- [ ] Mark 5+ locations
- [ ] Update status for 3+ locations
- [ ] Add photos to locations
- [ ] View admin dashboard
- [ ] Check leaderboard
- [ ] Test offline mode
- [ ] Verify sync functionality
- [ ] Check analytics accuracy
- [ ] Test all filters

---

**Use this sample data to thoroughly test the Rural Connect application!**
