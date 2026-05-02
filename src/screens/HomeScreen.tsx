import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView,
  TouchableOpacity, RefreshControl, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { useLocationStore } from '../store/locationStore';
import { useThemeStore } from '../store/themeStore';
import { getAnalyticsSummary, getLeaderboard } from '../database/db.web';
import { useTheme } from '../theme/colors';

interface Analytics { total: number; completed: number; inProgress: number; notVisited: number; }

export default function HomeScreen({ navigation }: any) {
  const T = useTheme();
  const { isDark, toggle: toggleDark } = useThemeStore();
  const { user, logout }          = useAuthStore();
  const { fetchAllLocations }     = useLocationStore();
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics]   = useState<Analytics>({ total: 0, completed: 0, inProgress: 0, notVisited: 0 });
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    await fetchAllLocations();
    setAnalytics(await getAnalyticsSummary());
    setLeaderboard(await getLeaderboard(5));
  }, [fetchAllLocations]);

  useEffect(() => { loadData(); }, [loadData]);
  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const handleLogout = () => {
    if (Platform.OS === 'web') { if (window.confirm('Are you sure you want to sign out?')) logout(); }
    else { const { Alert } = require('react-native'); Alert.alert('Sign Out', 'Are you sure?', [{ text: 'Cancel' }, { text: 'Sign Out', style: 'destructive', onPress: () => logout() }]); }
  };

  const pct = analytics.total > 0 ? Math.round((analytics.completed / analytics.total) * 100) : 0;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: T.bg }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      {/* ── Header ── */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: T.headerBg, paddingHorizontal: 18, paddingTop: 44, paddingBottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <Ionicons name="leaf" size={26} color={T.headerText} style={{ marginRight: 10 }} />
          <View>
            <Text style={{ fontSize: 19, fontWeight: 'bold', color: T.headerText }}>Hello, {user?.name}!</Text>
            <Text style={{ fontSize: 13, color: T.headerSub, marginTop: 2 }}>
              {user?.role === 'admin' ? '👨‍💼 Admin' : user?.role === 'volunteer' ? '🙋 Volunteer' : '👤 User'}
            </Text>
          </View>
        </View>

        {/* ── Dark mode toggle ── */}
        <TouchableOpacity
          onPress={toggleDark}
          style={{
            width: 38, height: 38, borderRadius: 19,
            backgroundColor: 'rgba(255,255,255,0.2)',
            justifyContent: 'center', alignItems: 'center',
            marginRight: 8,
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
          }}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isDark ? 'sunny' : 'moon'}
            size={20}
            color={T.headerText}
          />
        </TouchableOpacity>

        {/* ── Logout ── */}
        <TouchableOpacity onPress={handleLogout} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)', gap: 5 }} activeOpacity={0.75}>
          <Ionicons name="log-out-outline" size={17} color={T.headerText} />
          <Text style={{ color: T.headerText, fontSize: 13, fontWeight: '600' }}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* ── Stats grid ── */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 10 }}>
        {[
          { icon: 'location',         value: analytics.total,      label: 'Total Marked', color: T.primary },
          { icon: 'checkmark-circle', value: analytics.completed,  label: 'Completed',    color: T.success },
          { icon: 'hourglass',        value: analytics.inProgress, label: 'In Progress',  color: T.warning },
          { icon: 'alert-circle',     value: analytics.notVisited, label: 'Not Visited',  color: T.danger  },
        ].map((m) => (
          <View key={m.label} style={{ width: '48%', padding: 16, borderRadius: 14, alignItems: 'center', backgroundColor: m.color }}>
            <Ionicons name={m.icon as any} size={28} color={T.white} />
            <Text style={{ fontSize: 30, fontWeight: '800', color: T.white, marginTop: 8 }}>{m.value}</Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.9)', marginTop: 4, textAlign: 'center' }}>{m.label}</Text>
          </View>
        ))}
      </View>

      {/* ── Progress ── */}
      <View style={card(T)}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: T.textPrimary }}>Overall Progress</Text>
          <Text style={{ fontSize: 15, fontWeight: '800', color: T.primary }}>{pct}%</Text>
        </View>
        <View style={{ height: 10, backgroundColor: T.surface, borderRadius: 5, overflow: 'hidden', marginBottom: 8 }}>
          <View style={{ height: '100%', backgroundColor: T.primary, borderRadius: 5, width: `${pct}%` as any }} />
        </View>
        <Text style={{ fontSize: 12, color: T.textSecond }}>
          {analytics.total > 0 ? `${analytics.completed} of ${analytics.total} locations completed` : 'No locations marked yet — go to the Map tab to get started!'}
        </Text>
      </View>

      {/* ── Points (hidden for admin) ── */}
      {user?.role !== 'admin' && (
        <View style={[card(T), { flexDirection: 'row', alignItems: 'center' }]}>
          <Ionicons name="star" size={34} color="#FFC107" />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={{ fontSize: 13, color: T.textSecond }}>Your Points</Text>
            <Text style={{ fontSize: 26, fontWeight: '800', color: T.primary }}>{user?.points ?? 0}</Text>
          </View>
          <Text style={{ fontSize: 12, color: T.textMuted, maxWidth: 90, textAlign: 'right' }}>
            {(user?.points ?? 0) === 0 ? 'Mark a location to earn points!' : 'Keep it up!'}
          </Text>
        </View>
      )}

      {/* ── Leaderboard ── */}
      <View style={card(T)}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: T.textPrimary, marginBottom: 12 }}>🏆 Top Contributors</Text>
        {leaderboard.length > 0 ? leaderboard.map((leader, i) => (
          <View key={leader.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: T.surface }}>
            <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: T.primary, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
              <Text style={{ color: T.white, fontWeight: '700', fontSize: 12 }}>#{i + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: T.textPrimary }}>{leader.name}</Text>
                <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, backgroundColor: leader.role === 'volunteer' ? T.primaryLight : T.accentLight }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: leader.role === 'volunteer' ? T.primary : T.accent }}>
                    {leader.role === 'volunteer' ? '🙋 Volunteer' : '👤 User'}
                  </Text>
                </View>
              </View>
              <Text style={{ fontSize: 12, color: T.textMuted, marginTop: 1 }}>{leader.points} pts</Text>
            </View>
            {i === 0 && <Text style={{ fontSize: 20 }}>🥇</Text>}
            {i === 1 && <Text style={{ fontSize: 20 }}>🥈</Text>}
            {i === 2 && <Text style={{ fontSize: 20 }}>🥉</Text>}
          </View>
        )) : (
          <View style={{ alignItems: 'center', paddingVertical: 24 }}>
            <Ionicons name="trophy-outline" size={36} color={T.textMuted} />
            <Text style={{ fontSize: 13, color: T.textMuted, textAlign: 'center', marginTop: 10, lineHeight: 20 }}>No contributions yet.{'\n'}Be the first to mark a location!</Text>
          </View>
        )}
      </View>

      {/* ── Summary ── */}
      <View style={card(T)}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: T.textPrimary, marginBottom: 12 }}>📊 Summary</Text>
        {[
          { label: 'Completion Rate',  value: `${pct}%` },
          { label: 'Locations Marked', value: String(analytics.total) },
          { label: 'Pending Visits',   value: String(analytics.notVisited) },
          { label: 'Active Visits',    value: String(analytics.inProgress) },
        ].map((r) => (
          <View key={r.label} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: T.surface }}>
            <Text style={{ fontSize: 14, color: T.textSecond }}>{r.label}</Text>
            <Text style={{ fontSize: 14, fontWeight: '700', color: T.primary }}>{r.value}</Text>
          </View>
        ))}
      </View>

      {/* ── Account card — admin only ── */}
      {user?.role === 'admin' && (
        <View style={[card(T), { borderTopWidth: 3, borderTopColor: T.secondary }]}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: T.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>Account</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: T.primary, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 22, fontWeight: '800', color: T.white }}>{user?.name?.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: T.textPrimary }}>{user?.name}</Text>
              <Text style={{ fontSize: 13, color: T.textSecond, marginTop: 2 }}>{user?.email}</Text>
              <View style={{ alignSelf: 'flex-start', backgroundColor: T.primaryLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginTop: 5 }}>
                <Text style={{ fontSize: 11, color: T.primary, fontWeight: '700' }}>Admin</Text>
              </View>
            </View>
          </View>
          <View style={{ height: 1, backgroundColor: T.surface, marginBottom: 16 }} />
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: T.danger, paddingVertical: 14, borderRadius: 10, gap: 8 }} onPress={handleLogout} activeOpacity={0.8}>
            <Ionicons name="log-out-outline" size={20} color={T.white} />
            <Text style={{ color: T.white, fontSize: 16, fontWeight: '700', letterSpacing: 0.4 }}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

// Helper to create card style with theme
const card = (T: any) => ({
  backgroundColor: T.cardBg,
  marginHorizontal: 12,
  marginBottom: 10,
  padding: 16,
  borderRadius: 14,
  shadowColor: T.dark,
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.07,
  shadowRadius: 4,
  elevation: 2,
});
