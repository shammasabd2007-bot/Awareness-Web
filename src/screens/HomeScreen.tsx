import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { useLocationStore } from '../store/locationStore';
import { getAnalyticsSummary, getLeaderboard } from '../database/db.web';
import { C } from '../theme/colors';

interface Analytics { total: number; completed: number; inProgress: number; notVisited: number; }

export default function HomeScreen({ navigation }: any) {
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
    <ScrollView style={s.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Ionicons name="leaf" size={26} color={C.white} style={{ marginRight: 10 }} />
          <View>
            <Text style={s.greeting}>Hello, {user?.name}!</Text>
            <Text style={s.roleTag}>
              {user?.role === 'admin' ? '👨‍💼 Admin' : user?.role === 'volunteer' ? '🙋 Volunteer' : '👤 User'}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleLogout} style={s.logoutPill} activeOpacity={0.75}>
          <Ionicons name="log-out-outline" size={17} color={C.white} />
          <Text style={s.logoutPillText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Stats grid */}
      <View style={s.statsGrid}>
        {[
          { icon: 'location',         value: analytics.total,      label: 'Total Marked', color: C.primary   },
          { icon: 'checkmark-circle', value: analytics.completed,  label: 'Completed',    color: C.success   },
          { icon: 'hourglass',        value: analytics.inProgress, label: 'In Progress',  color: C.warning   },
          { icon: 'alert-circle',     value: analytics.notVisited, label: 'Not Visited',  color: C.danger    },
        ].map((m) => (
          <View key={m.label} style={[s.statCard, { backgroundColor: m.color }]}>
            <Ionicons name={m.icon as any} size={28} color={C.white} />
            <Text style={s.statValue}>{m.value}</Text>
            <Text style={s.statLabel}>{m.label}</Text>
          </View>
        ))}
      </View>

      {/* Progress */}
      <View style={s.card}>
        <View style={s.rowBetween}>
          <Text style={s.cardTitle}>Overall Progress</Text>
          <Text style={s.pctText}>{pct}%</Text>
        </View>
        <View style={s.progressTrack}>
          <View style={[s.progressFill, { width: `${pct}%` as any }]} />
        </View>
        <Text style={s.progressSub}>
          {analytics.total > 0
            ? `${analytics.completed} of ${analytics.total} locations completed`
            : 'No locations marked yet — go to the Map tab to get started!'}
        </Text>
      </View>

      {/* Points (hidden for admin) */}
      {user?.role !== 'admin' && (
        <View style={[s.card, s.pointsRow]}>
          <Ionicons name="star" size={34} color="#FFC107" />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={s.pointsLabel}>Your Points</Text>
            <Text style={s.pointsValue}>{user?.points ?? 0}</Text>
          </View>
          <Text style={s.pointsHint}>
            {(user?.points ?? 0) === 0 ? 'Mark a location to earn points!' : 'Keep it up!'}
          </Text>
        </View>
      )}

      {/* Leaderboard */}
      <View style={s.card}>
        <Text style={s.cardTitle}>🏆 Top Contributors</Text>
        {leaderboard.length > 0 ? leaderboard.map((leader, i) => (
          <View key={leader.id} style={s.leaderRow}>
            <View style={s.rankBadge}><Text style={s.rankText}>#{i + 1}</Text></View>
            <View style={{ flex: 1 }}>
              <View style={s.leaderNameRow}>
                <Text style={s.leaderName}>{leader.name}</Text>
                <View style={[s.leaderRolePill, { backgroundColor: leader.role === 'volunteer' ? C.primaryLight : C.accentLight }]}>
                  <Text style={[s.leaderRoleText, { color: leader.role === 'volunteer' ? C.primary : C.accent }]}>
                    {leader.role === 'volunteer' ? '🙋 Volunteer' : '👤 User'}
                  </Text>
                </View>
              </View>
              <Text style={s.leaderPts}>{leader.points} pts</Text>
            </View>
            {i === 0 && <Text style={s.medal}>🥇</Text>}
            {i === 1 && <Text style={s.medal}>🥈</Text>}
            {i === 2 && <Text style={s.medal}>🥉</Text>}
          </View>
        )) : (
          <View style={s.emptyBox}>
            <Ionicons name="trophy-outline" size={36} color={C.textMuted} />
            <Text style={s.emptyText}>No contributions yet.{'\n'}Be the first to mark a location!</Text>
          </View>
        )}
      </View>

      {/* Summary */}
      <View style={s.card}>
        <Text style={s.cardTitle}>📊 Summary</Text>
        {[
          { label: 'Completion Rate',   value: `${pct}%` },
          { label: 'Locations Marked',  value: String(analytics.total) },
          { label: 'Pending Visits',    value: String(analytics.notVisited) },
          { label: 'Active Visits',     value: String(analytics.inProgress) },
        ].map((r) => (
          <View key={r.label} style={s.summaryRow}>
            <Text style={s.summaryLabel}>{r.label}</Text>
            <Text style={s.summaryValue}>{r.value}</Text>
          </View>
        ))}
      </View>

      {/* Account card — admin only */}
      {user?.role === 'admin' && (
        <View style={s.accountCard}>
          <Text style={s.accountSectionLabel}>Account</Text>
          <View style={s.accountRow}>
            <View style={s.avatar}>
              <Text style={s.avatarLetter}>{user?.name?.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={s.accountName}>{user?.name}</Text>
              <Text style={s.accountEmail}>{user?.email}</Text>
              <View style={s.rolePill}><Text style={s.rolePillText}>Admin</Text></View>
            </View>
          </View>
          <View style={s.divider} />
          <TouchableOpacity style={s.signOutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <Ionicons name="log-out-outline" size={20} color={C.white} />
            <Text style={s.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: C.primary, paddingHorizontal: 18, paddingTop: 44, paddingBottom: 20,
  },
  headerLeft:     { flexDirection: 'row', alignItems: 'center', flex: 1 },
  greeting:       { fontSize: 19, fontWeight: 'bold', color: C.white },
  roleTag:        { fontSize: 13, color: C.secondary, marginTop: 2 },
  logoutPill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)', gap: 5,
  },
  logoutPillText: { color: C.white, fontSize: 13, fontWeight: '600' },
  statsGrid:      { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 10 },
  statCard:       { width: '48%', padding: 16, borderRadius: 14, alignItems: 'center' },
  statValue:      { fontSize: 30, fontWeight: '800', color: C.white, marginTop: 8 },
  statLabel:      { fontSize: 12, color: 'rgba(255,255,255,0.9)', marginTop: 4, textAlign: 'center' },
  card: {
    backgroundColor: C.cardBg, marginHorizontal: 12, marginBottom: 10, padding: 16,
    borderRadius: 14, shadowColor: C.dark, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
  },
  cardTitle:    { fontSize: 15, fontWeight: '700', color: C.textPrimary, marginBottom: 12 },
  rowBetween:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  pctText:      { fontSize: 15, fontWeight: '800', color: C.primary },
  progressTrack:{ height: 10, backgroundColor: C.surface, borderRadius: 5, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', backgroundColor: C.primary, borderRadius: 5 },
  progressSub:  { fontSize: 12, color: C.textSecond },
  pointsRow:    { flexDirection: 'row', alignItems: 'center' },
  pointsLabel:  { fontSize: 13, color: C.textSecond },
  pointsValue:  { fontSize: 26, fontWeight: '800', color: C.primary },
  pointsHint:   { fontSize: 12, color: C.textMuted, maxWidth: 90, textAlign: 'right' },
  leaderRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.surface,
  },
  rankBadge: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: C.primary,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  rankText:       { color: C.white, fontWeight: '700', fontSize: 12 },
  leaderNameRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  leaderName:     { fontSize: 14, fontWeight: '600', color: C.textPrimary },
  leaderPts:      { fontSize: 12, color: C.textMuted, marginTop: 1 },
  medal:          { fontSize: 20 },
  leaderRolePill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  leaderRoleText: { fontSize: 10, fontWeight: '700' },
  emptyBox:       { alignItems: 'center', paddingVertical: 24 },
  emptyText:      { fontSize: 13, color: C.textMuted, textAlign: 'center', marginTop: 10, lineHeight: 20 },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.surface,
  },
  summaryLabel: { fontSize: 14, color: C.textSecond },
  summaryValue: { fontSize: 14, fontWeight: '700', color: C.primary },
  accountCard: {
    backgroundColor: C.cardBg, marginHorizontal: 12, marginBottom: 10, padding: 18,
    borderRadius: 14, shadowColor: C.dark, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
    borderTopWidth: 3, borderTopColor: C.secondary,
  },
  accountSectionLabel: {
    fontSize: 11, fontWeight: '700', color: C.textMuted,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14,
  },
  accountRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar:       { width: 52, height: 52, borderRadius: 26, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { fontSize: 22, fontWeight: '800', color: C.white },
  accountName:  { fontSize: 16, fontWeight: '700', color: C.textPrimary },
  accountEmail: { fontSize: 13, color: C.textSecond, marginTop: 2 },
  rolePill:     { alignSelf: 'flex-start', backgroundColor: C.primaryLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginTop: 5 },
  rolePillText: { fontSize: 11, color: C.primary, fontWeight: '700' },
  divider:      { height: 1, backgroundColor: C.surface, marginBottom: 16 },
  signOutBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: C.danger, paddingVertical: 14, borderRadius: 10, gap: 8 },
  signOutText:  { color: C.white, fontSize: 16, fontWeight: '700', letterSpacing: 0.4 },
});
