import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Screens
import LoginScreen           from './src/screens/LoginScreen';
import HomeScreen            from './src/screens/HomeScreen';
import MapScreen             from './src/screens/MapScreen';
import AddLocationScreen     from './src/screens/AddLocationScreen';
import StatusUpdateScreen    from './src/screens/StatusUpdateScreen';
import AdminDashboardScreen  from './src/screens/AdminDashboardScreen';
import LocationDetailsScreen from './src/screens/LocationDetailsScreen';
import ProfileScreen         from './src/screens/ProfileScreen';

// Floating chat overlay
import FloatingChat from './src/components/FloatingChat';

// Database & Store
import { initializeDatabase } from './src/database/db.web';
import { useAuthStore } from './src/store/authStore';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

// ─── Avatar tab icon (shows first letter of user name) ───────────────────────
const AvatarTabIcon = ({
  focused,
  name,
  role,
}: {
  focused: boolean;
  name: string;
  role: string;
}) => {
  const bg = focused
    ? role === 'volunteer' ? '#8458B3' : '#A0D2EB'
    : '#A9ADBE';

  return (
    <View style={[tabStyles.avatarIcon, { backgroundColor: bg }]}>
      <Text style={tabStyles.avatarLetter}>
        {name?.charAt(0).toUpperCase() ?? '?'}
      </Text>
    </View>
  );
};

const tabStyles = StyleSheet.create({
  avatarIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
  },
});

// ─── Main tab navigator ───────────────────────────────────────────────────────
const MainNavigator = () => {
  const { user } = useAuthStore();
  const isAdmin  = user?.role === 'admin';

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: true,
          tabBarActiveTintColor:   '#8458B3',
          tabBarInactiveTintColor: '#A9ADBE',
          tabBarStyle: { backgroundColor: '#E5EAF5', borderTopColor: '#D0BDF4' },
          tabBarIcon: ({ focused, color, size }) => {
            // Profile tab gets a special avatar icon
            if (route.name === 'Profile') {
              return (
                <AvatarTabIcon
                  focused={focused}
                  name={user?.name ?? ''}
                  role={user?.role ?? 'user'}
                />
              );
            }

            const icons: Record<
              string,
              [keyof typeof Ionicons.glyphMap, keyof typeof Ionicons.glyphMap]
            > = {
              Home:        ['home',        'home-outline'],
              Map:         ['map',         'map-outline'],
              AddLocation: ['add-circle',  'add-circle-outline'],
              Admin:       ['stats-chart', 'stats-chart-outline'],
            };
            const [active, inactive] = icons[route.name] ?? ['help', 'help-outline'];
            return <Ionicons name={focused ? active : inactive} size={size} color={color} />;
          },
        })}
      >
        {/* ── Shared tabs ── */}
        <Tab.Screen name="Home"        component={HomeScreen}        options={{ title: 'Dashboard' }} />
        <Tab.Screen name="Map"         component={MapScreen}         options={{ title: 'Map' }} />
        <Tab.Screen name="AddLocation" component={AddLocationScreen} options={{ title: 'Mark Location' }} />

        {/* ── Admin-only tab ── */}
        {isAdmin && (
          <Tab.Screen name="Admin" component={AdminDashboardScreen} options={{ title: 'Admin' }} />
        )}

        {/* ── Profile tab — only for User and Volunteer ── */}
        {!isAdmin && (
          <Tab.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ title: 'Profile' }}
          />
        )}
      </Tab.Navigator>

      {/* Floating chat button — visible on every screen */}
      <FloatingChat />
    </View>
  );
};

// ─── Root navigator ───────────────────────────────────────────────────────────
const RootNavigator = () => {
  const { user, isLoading, restoreSession } = useAuthStore();

  useEffect(() => { restoreSession(); }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#8458B3" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen name="Main" component={MainNavigator} />
          <Stack.Screen
            name="LocationDetails"
            component={LocationDetailsScreen}
            options={{ headerShown: true, title: 'Location Details' }}
          />
          <Stack.Screen
            name="StatusUpdate"
            component={StatusUpdateScreen}
            options={{ headerShown: true, title: 'Update Status' }}
          />
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
};

// ─── App root ─────────────────────────────────────────────────────────────────
export default function App() {
  useEffect(() => {
    initializeDatabase().catch(console.error);
  }, []);

  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}
