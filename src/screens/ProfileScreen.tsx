import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  RefreshControl, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { getLocationsByUser, getLeaderboardRank, getAnalyticsSummaryByUser } from '../database/db.web';
import { useTheme } from '../theme/colors';

const statusLabel = (s: string) => s === 'completed' ? 'Completed' : s === 'in_progress' ? 'In Progress' : 'Not Visited';
const rankSuffix = (n: number) => n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th';
const rankMedal  = (n: number) => n === 1 ? '🥇' : n === 2 ? '🥈' : n === 3 ? '🥉' : null;

export default function ProfileScreen({ navigation }: any) {
  const T = useTheme();
  const { user, logout } = useAuthStore();
  const [refreshing, setRefreshing]   = useState(false);
  const [myLocations, setMyLocations] = useState<any[]>([]);
  const [analytics, setAnalytics]     = useState({ total: 0, completed: 0, inProgress: 0, notVisited: 0 });
  const [rank, setRank]               = useState<number | null>(null);

  const isVolunteer = user?.role === 'volunteer';
  const roleBg      = isVolunteer ? T.primary : T.accent;
  const roleLbl     = isVolunteer ? 'Volunteer' : 'User';
  const roleIcn: keyof typeof Ionicons.glyphMap = isVolunteer ? 'walk' : 'person';

  const statusColor = (s: string) => s === 'completed' ? T.success : s === 'in_progress' ? T.warning : T.danger;

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    const locs = await getLocationsByUser(user.id);
    locs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setMyLocations(locs);
    setAnalytics(await getAnalyticsSummaryByUser(user.id));
    setRank(await getLeaderboardRank(user.id));
  }, [user?.id]);

  useEffect(() => { loadData(); }, [loadData]);
  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const handleLogout = () => {
    if (Platform.OS === 'web') { if (window.confirm('Are you sure you want to sign out?')) logout(); }
    else { const { Alert } = require('react-native'); Alert.alert('Sign Out', 'Are you sure?', [{ text: 'Cancel' }, { text: 'Sign Out', style: 'destructive', onPress: () => logout() }]); }
  };

  const pct = analytics.total > 0 ? Math.round((analytics.completed / analytics.total) * 100) : 0;
  const crd = (extra?: any) => ({ backgroundColor: T.cardBg, marginHorizontal: 12, marginTop: 12, padding: 16, borderRadius: 16, shadowColor: T.dark, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2, ...extra });

  return (
    <ScrollView style={{ flex: 1, backgroundColor: T.bg }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} showsVerticalScrollIndicator={false}>

      {/* ── Hero ── */}
      <View style={{ backgroundColor: T.headerBg, alignItems: 'center', paddingTop: 44, paddingBottom: 28, paddingHorizontal: 20 }}>
        <View style={{ width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: roleBg, justifyContent: 'center', alignItems: 'center', marginBottom: 14, backgroundColor: 'rgba(255,255,255,0.15)' }}>
          <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: roleBg, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 36, fontWeight: '800', color: T.white }}>{user?.name?.charAt(0).toUpperCase()}</Text>
          </View>
        </View>
        <Text style={{ fontSize: 24, fontWeight: '800', color: T.headerText, marginBottom: 8 }}>{user?.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: roleBg, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, gap: 6, marginBottom: 10 }}>
          <Ionicons name={roleIcn} size={13} color={T.white} />
          <Text style={{ fontSize: 13, fontWeight: '700', color: T.white }}>{roleLbl}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <Ionicons name="mail-outline" size={14} color={T.headerSub} />
          <Text style={{ fontSize: 13, color: T.headerSub }}>{user?.email}</Text>
        </View>
        <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Member of Rural Connect</Text>
      </View>

      {/* ── Stats row ── */}
      <View style={{ flexDirection: 'row', backgroundColor: T.cardBg, marginHorizontal: 12, marginTop: -16, borderRadius: 16, paddingVertical: 18, shadowColor: T.dark, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 }}>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Ionicons name="star" size={22} color="#FFC107" />
          <Text style={{ fontSize: 22, fontWeight: '800', color: T.textPrimary, marginTop: 4 }}>{user?.points ?? 0}</Text>
          <Text style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>Points</Text>
        </View>
        <View style={{ width: 1, backgroundColor: T.surface, marginVertical: 4 }} />
        <View style={{ flex: 1, alignItems: 'center' }}>
          {rank !== null ? (
            <><Text style={{ fontSize: 22 }}>{rankMedal(rank) ?? '🏅'}</Text><Text style={{ fontSize: 22, fontWeight: '800', color: T.textPrimary, marginTop: 4 }}>{rank}<Text style={{ fontSize: 13, fontWeight: '600', color: T.textMuted }}>{rankSuffix(rank)}</Text></Text><Text style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>Rank</Text></>
          ) : (
            <><Ionicons name="trophy-outline" size={22} color={T.textMuted} /><Text style={{ fontSize: 14, fontWeight: '800', color: T.textMuted, marginTop: 4 }}>Unranked</Text><Text style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>Rank</Text></>
          )}
        </View>
        <View style={{ width: 1, backgroundColor: T.surface, marginVertical: 4 }} />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Ionicons name="location" size={22} color={T.primary} />
          <Text style={{ fontSize: 22, fontWeight: '800', color: T.textPrimary, marginTop: 4 }}>{analytics.total}</Text>
          <Text style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>Marked</Text>
        </View>
      </View>

      {/* ── Points breakdown ── */}
      <View style={crd()}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: T.textPrimary, marginBottom: 14 }}>⭐ Points Breakdown</Text>
        {(isVolunteer
          ? [{ action: 'Mark a location', pts: 30, earned: analytics.total * 30 }, { action: 'Set In Progress', pts: 30, earned: analytics.inProgress * 30 }, { action: 'Mark as Completed', pts: 50, earned: analytics.completed * 50 }]
          : [{ action: 'Mark a location', pts: 50, earned: analytics.total * 50 }]
        ).map((p) => (
          <View key={p.action} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: T.surface }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: T.textPrimary }}>{p.action}</Text>
              <Text style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>+{p.pts} pts each</Text>
            </View>
            <View style={{ backgroundColor: T.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: T.primary }}>+{p.earned} pts</Text>
            </View>
          </View>
        ))}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: T.surface }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: T.textPrimary }}>Total Points Earned</Text>
          <Text style={{ fontSize: 16, fontWeight: '800', color: T.primary }}>{user?.points ?? 0} pts</Text>
        </View>
      </View>

      {/* ── Location stats ── */}
      <View style={crd()}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: T.textPrimary, marginBottom: 14 }}>📍 My Location Stats</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {[{ label: 'Total Marked', value: analytics.total, color: T.primary, icon: 'location' }, { label: 'Completed', value: analytics.completed, color: T.success, icon: 'checkmark-circle' }, { label: 'In Progress', value: analytics.inProgress, color: T.warning, icon: 'hourglass' }, { label: 'Not Visited', value: analytics.notVisited, color: T.danger, icon: 'alert-circle' }].map((s) => (
            <View key={s.label} style={{ width: '48%', padding: 12, borderRadius: 12, alignItems: 'center', backgroundColor: s.color }}>
              <Ionicons name={s.icon as any} size={20} color={T.white} />
              <Text style={{ fontSize: 22, fontWeight: '800', color: T.white, marginTop: 4 }}>{s.value}</Text>
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.9)', marginTop: 2, textAlign: 'center' }}>{s.label}</Text>
            </View>
          ))}
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: T.textSecond }}>Completion Rate</Text>
          <Text style={{ fontSize: 13, fontWeight: '800', color: T.primary }}>{pct}%</Text>
        </View>
        <View style={{ height: 10, backgroundColor: T.surface, borderRadius: 5, overflow: 'hidden', marginBottom: 6 }}>
          <View style={{ height: '100%', borderRadius: 5, backgroundColor: roleBg, width: `${pct}%` as any }} />
        </View>
        <Text style={{ fontSize: 12, color: T.textSecond }}>{analytics.total > 0 ? `${analytics.completed} of ${analytics.total} locations completed` : 'No locations marked yet — go to the Map tab!'}</Text>
      </View>

      {/* ── Marked locations list ── */}
      <View style={crd()}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: T.textPrimary, marginBottom: 14 }}>🗺️ Places I Marked ({myLocations.length})</Text>
        {myLocations.length > 0 ? myLocations.map((loc: any) => (
          <TouchableOpacity key={loc.id} style={{ flexDirection: 'row', alignItems: 'stretch', backgroundColor: T.surface, borderRadius: 12, marginBottom: 10, overflow: 'hidden', borderWidth: 1, borderColor: T.border }} onPress={() => navigation.navigate('LocationDetails', { locationId: loc.id })} activeOpacity={0.75}>
            <View style={{ width: 5, backgroundColor: statusColor(loc.status) }} />
            <View style={{ flex: 1, padding: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: T.textPrimary, flex: 1, marginRight: 8 }} numberOfLines={1}>{loc.title}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, gap: 4, backgroundColor: statusColor(loc.status) + '22' }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: statusColor(loc.status) }} />
                  <Text style={{ fontSize: 10, fontWeight: '700', color: statusColor(loc.status) }}>{statusLabel(loc.status)}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="grid-outline" size={11} color={T.textMuted} />
                  <Text style={{ fontSize: 11, color: T.textMuted }}>{loc.category}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="calendar-outline" size={11} color={T.textMuted} />
                  <Text style={{ fontSize: 11, color: T.textMuted }}>{new Date(loc.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                </View>
              </View>
              <Text style={{ fontSize: 11, color: T.textMuted, marginTop: 5 }}>📍 {Number(loc.latitude).toFixed(4)}, {Number(loc.longitude).toFixed(4)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={T.textMuted} style={{ alignSelf: 'center', marginRight: 8 }} />
          </TouchableOpacity>
        )) : (
          <View style={{ alignItems: 'center', paddingVertical: 28 }}>
            <Ionicons name="map-outline" size={40} color={T.textMuted} />
            <Text style={{ fontSize: 13, color: T.textMuted, marginTop: 10, textAlign: 'center' }}>You haven't marked any locations yet.</Text>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: T.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginTop: 14, gap: 6 }} onPress={() => navigation.navigate('AddLocation')}>
              <Ionicons name="add-circle-outline" size={16} color={T.white} />
              <Text style={{ fontSize: 13, fontWeight: '700', color: T.white }}>Mark a Location</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── Leaderboard position ── */}
      <View style={crd({ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 3, borderTopColor: '#FFC107' })}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <Text style={{ fontSize: 40 }}>{rank !== null ? (rankMedal(rank) ?? '🏅') : '🏆'}</Text>
          <View style={{ marginLeft: 14 }}>
            <Text style={{ fontSize: 12, color: T.textMuted, fontWeight: '600' }}>Leaderboard Position</Text>
            {rank !== null ? (
              <Text style={{ fontSize: 22, fontWeight: '800', color: T.textPrimary, marginTop: 2 }}>#{rank}<Text style={{ fontSize: 14, fontWeight: '600', color: T.textMuted }}>{rankSuffix(rank)}</Text> Place</Text>
            ) : (
              <Text style={{ fontSize: 14, fontWeight: '700', color: T.textMuted, marginTop: 2 }}>Not ranked yet{'\n'}<Text style={{ fontSize: 11, fontWeight: '400' }}>Mark locations to earn points!</Text></Text>
            )}
          </View>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 28, fontWeight: '800', color: T.primary }}>{user?.points ?? 0}</Text>
          <Text style={{ fontSize: 12, color: T.textMuted }}>pts</Text>
        </View>
      </View>

      {/* ── Sign out ── */}
      <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: T.danger, marginHorizontal: 12, marginTop: 12, paddingVertical: 14, borderRadius: 12, gap: 8 }} onPress={handleLogout} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={20} color={T.white} />
        <Text style={{ color: T.white, fontSize: 16, fontWeight: '700', letterSpacing: 0.4 }}>Sign Out</Text>
      </TouchableOpacity>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}
