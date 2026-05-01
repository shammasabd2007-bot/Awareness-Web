import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import {
  getLocationsByUser,
  getLeaderboardRank,
  getAnalyticsSummaryByUser,
} from '../database/db.web';

import { C } from '../theme/colors';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const statusColor = (s: string) =>
  s === 'completed' ? C.success : s === 'in_progress' ? C.warning : C.danger;

const statusLabel = (s: string) =>
  s === 'completed'
    ? 'Completed'
    : s === 'in_progress'
    ? 'In Progress'
    : 'Not Visited';

const rankSuffix = (n: number) => {
  if (n === 1) return 'st';
  if (n === 2) return 'nd';
  if (n === 3) return 'rd';
  return 'th';
};

const rankMedal = (n: number) => {
  if (n === 1) return '🥇';
  if (n === 2) return '🥈';
  if (n === 3) return '🥉';
  return null;
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuthStore();

  const [refreshing, setRefreshing]   = useState(false);
  const [myLocations, setMyLocations] = useState<any[]>([]);
  const [analytics, setAnalytics]     = useState({
    total: 0, completed: 0, inProgress: 0, notVisited: 0,
  });
  const [rank, setRank]               = useState<number | null>(null);

  const isVolunteer = user?.role === 'volunteer';
  const roleColor   = isVolunteer ? C.primary : C.accent;
  const roleLabel   = isVolunteer ? 'Volunteer' : 'User';
  const roleIcon: keyof typeof Ionicons.glyphMap = isVolunteer ? 'walk' : 'person';

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    const locs = await getLocationsByUser(user.id);
    locs.sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    setMyLocations(locs);

    const summary = await getAnalyticsSummaryByUser(user.id);
    setAnalytics(summary);

    const r = await getLeaderboardRank(user.id);
    setRank(r);
  }, [user?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to sign out?')) logout();
    } else {
      const { Alert } = require('react-native');
      Alert.alert('Sign Out', 'Are you sure?', [
        { text: 'Cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => logout() },
      ]);
    }
  };

  const completionPct =
    analytics.total > 0
      ? Math.round((analytics.completed / analytics.total) * 100)
      : 0;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {/* ══════════════════════════════════════════════════════
          PROFILE HERO CARD
      ══════════════════════════════════════════════════════ */}
      <View style={styles.hero}>
        {/* Avatar */}
        <View style={[styles.avatarRing, { borderColor: roleColor }]}>
          <View style={[styles.avatar, { backgroundColor: roleColor }]}>
            <Text style={styles.avatarLetter}>
              {user?.name?.charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Name + role tag */}
        <Text style={styles.heroName}>{user?.name}</Text>
        <View style={[styles.roleTag, { backgroundColor: roleColor }]}>
          <Ionicons name={roleIcon} size={13} color="#fff" />
          <Text style={styles.roleTagText}>{roleLabel}</Text>
        </View>

        {/* Email */}
        <View style={styles.emailRow}>
          <Ionicons name="mail-outline" size={14} color="#D0BDF4" />
          <Text style={styles.emailText}>{user?.email}</Text>
        </View>

        {/* Member since */}
        <Text style={styles.memberSince}>
          Member of Rural Connect
        </Text>
      </View>

      {/* ══════════════════════════════════════════════════════
          STATS ROW  (Points · Rank · Locations)
      ══════════════════════════════════════════════════════ */}
      <View style={styles.statsRow}>
        {/* Points */}
        <View style={styles.statBox}>
          <Ionicons name="star" size={22} color="#FFC107" />
          <Text style={styles.statValue}>{user?.points ?? 0}</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>

        <View style={styles.statDivider} />

        {/* Leaderboard rank */}
        <View style={styles.statBox}>
          {rank !== null ? (
            <>
              <Text style={styles.rankEmoji}>
                {rankMedal(rank) ?? '🏅'}
              </Text>
              <Text style={styles.statValue}>
                {rank}
                <Text style={styles.rankSuffix}>{rankSuffix(rank)}</Text>
              </Text>
              <Text style={styles.statLabel}>Rank</Text>
            </>
          ) : (
            <>
              <Ionicons name="trophy-outline" size={22} color="#bbb" />
              <Text style={[styles.statValue, { color: '#bbb', fontSize: 14 }]}>
                Unranked
              </Text>
              <Text style={styles.statLabel}>Rank</Text>
            </>
          )}
        </View>

        <View style={styles.statDivider} />

        {/* Locations marked */}
        <View style={styles.statBox}>
          <Ionicons name="location" size={22} color="#8458B3" />
          <Text style={styles.statValue}>{analytics.total}</Text>
          <Text style={styles.statLabel}>Marked</Text>
        </View>
      </View>

      {/* ══════════════════════════════════════════════════════
          POINTS BREAKDOWN  (how points are earned)
      ══════════════════════════════════════════════════════ */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>⭐ Points Breakdown</Text>

        {isVolunteer ? (
          <>
            <PointsRow action="Mark a location"   pts={30} earned={analytics.total * 30} />
            <PointsRow action="Set In Progress"   pts={30} earned={analytics.inProgress * 30} />
            <PointsRow action="Mark as Completed" pts={50} earned={analytics.completed * 50} />
          </>
        ) : (
          <PointsRow action="Mark a location" pts={50} earned={analytics.total * 50} />
        )}

        <View style={styles.totalPtsRow}>
          <Text style={styles.totalPtsLabel}>Total Points Earned</Text>
          <Text style={styles.totalPtsValue}>{user?.points ?? 0} pts</Text>
        </View>
      </View>

      {/* ══════════════════════════════════════════════════════
          LOCATION STATS
      ══════════════════════════════════════════════════════ */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📍 My Location Stats</Text>

        {/* Mini stat cards */}
        <View style={styles.miniGrid}>
          {[
            { label: 'Total Marked', value: analytics.total,      color: '#A0D2EB', icon: 'location'         },
            { label: 'Completed',    value: analytics.completed,  color: '#4CAF50', icon: 'checkmark-circle' },
            { label: 'In Progress',  value: analytics.inProgress, color: '#FFC107', icon: 'hourglass'        },
            { label: 'Not Visited',  value: analytics.notVisited, color: '#E05C7A', icon: 'alert-circle'     },
          ].map((s) => (
            <View key={s.label} style={[styles.miniCard, { backgroundColor: s.color }]}>
              <Ionicons name={s.icon as any} size={20} color="#fff" />
              <Text style={styles.miniValue}>{s.value}</Text>
              <Text style={styles.miniLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Progress bar */}
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Completion Rate</Text>
          <Text style={styles.progressPct}>{completionPct}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${completionPct}%` as any, backgroundColor: roleColor },
            ]}
          />
        </View>
        <Text style={styles.progressSub}>
          {analytics.total > 0
            ? `${analytics.completed} of ${analytics.total} locations completed`
            : 'No locations marked yet — go to the Map tab!'}
        </Text>
      </View>

      {/* ══════════════════════════════════════════════════════
          MARKED LOCATIONS LIST
      ══════════════════════════════════════════════════════ */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          🗺️ Places I Marked ({myLocations.length})
        </Text>

        {myLocations.length > 0 ? (
          myLocations.map((loc: any) => (
            <TouchableOpacity
              key={loc.id}
              style={styles.locRow}
              onPress={() =>
                navigation.navigate('LocationDetails', { locationId: loc.id })
              }
              activeOpacity={0.75}
            >
              {/* Colour strip */}
              <View
                style={[
                  styles.locStrip,
                  { backgroundColor: statusColor(loc.status) },
                ]}
              />

              <View style={styles.locBody}>
                {/* Title + status pill */}
                <View style={styles.locTopRow}>
                  <Text style={styles.locTitle} numberOfLines={1}>
                    {loc.title}
                  </Text>
                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: statusColor(loc.status) + '22' },
                    ]}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: statusColor(loc.status) },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusPillText,
                        { color: statusColor(loc.status) },
                      ]}
                    >
                      {statusLabel(loc.status)}
                    </Text>
                  </View>
                </View>

                {/* Category + date */}
                <View style={styles.locMeta}>
                  <View style={styles.metaChip}>
                    <Ionicons name="grid-outline" size={11} color="#888" />
                    <Text style={styles.metaChipText}>{loc.category}</Text>
                  </View>
                  <View style={styles.metaChip}>
                    <Ionicons name="calendar-outline" size={11} color="#888" />
                    <Text style={styles.metaChipText}>
                      {new Date(loc.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                </View>

                {/* Coordinates */}
                <Text style={styles.locCoords}>
                  📍 {Number(loc.latitude).toFixed(4)},{' '}
                  {Number(loc.longitude).toFixed(4)}
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={16}
                color="#ccc"
                style={{ alignSelf: 'center' }}
              />
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyBox}>
            <Ionicons name="map-outline" size={40} color="#ddd" />
            <Text style={styles.emptyText}>
              You haven't marked any locations yet.
            </Text>
            <TouchableOpacity
              style={styles.goMarkBtn}
              onPress={() => navigation.navigate('AddLocation')}
            >
              <Ionicons name="add-circle-outline" size={16} color="#fff" />
              <Text style={styles.goMarkBtnText}>Mark a Location</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ══════════════════════════════════════════════════════
          LEADERBOARD POSITION CARD
      ══════════════════════════════════════════════════════ */}
      <View style={[styles.card, styles.rankCard]}>
        <View style={styles.rankCardLeft}>
          <Text style={styles.rankCardEmoji}>
            {rank !== null ? (rankMedal(rank) ?? '🏅') : '🏆'}
          </Text>
          <View style={{ marginLeft: 14 }}>
            <Text style={styles.rankCardTitle}>Leaderboard Position</Text>
            {rank !== null ? (
              <Text style={styles.rankCardValue}>
                #{rank}
                <Text style={styles.rankCardSuffix}>{rankSuffix(rank)}</Text>
                {' '}Place
              </Text>
            ) : (
              <Text style={styles.rankCardUnranked}>
                Not ranked yet{'\n'}
                <Text style={styles.rankCardHint}>
                  Mark locations to earn points!
                </Text>
              </Text>
            )}
          </View>
        </View>
        <View style={styles.rankCardRight}>
          <Text style={styles.rankCardPts}>{user?.points ?? 0}</Text>
          <Text style={styles.rankCardPtsLabel}>pts</Text>
        </View>
      </View>

      {/* ══════════════════════════════════════════════════════
          SIGN OUT
      ══════════════════════════════════════════════════════ */}
      <TouchableOpacity
        style={styles.signOutBtn}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <Ionicons name="log-out-outline" size={20} color="#fff" />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

// ─── Small helper component ───────────────────────────────────────────────────
const PointsRow = ({
  action,
  pts,
  earned,
}: {
  action: string;
  pts: number;
  earned: number;
}) => (
  <View style={ptsStyles.row}>
    <View style={ptsStyles.left}>
      <Text style={ptsStyles.action}>{action}</Text>
      <Text style={ptsStyles.rate}>+{pts} pts each</Text>
    </View>
    <View style={ptsStyles.badge}>
      <Text style={ptsStyles.badgeText}>+{earned} pts</Text>
    </View>
  </View>
);

const ptsStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  left:      { flex: 1 },
  action:    { fontSize: 13, fontWeight: '600', color: '#333' },
  rate:      { fontSize: 11, color: '#aaa', marginTop: 2 },
  badge: {
    backgroundColor: '#E5EAF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#8458B3' },
});

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0EEF8' },

  /* Hero */
  hero: {
    backgroundColor: '#8458B3',
    alignItems: 'center',
    paddingTop: 44,
    paddingBottom: 28,
    paddingHorizontal: 20,
  },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: { fontSize: 36, fontWeight: '800', color: '#fff' },
  heroName:     { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 8 },
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
    marginBottom: 10,
  },
  roleTagText:  { fontSize: 13, fontWeight: '700', color: '#fff' },
  emailRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  emailText:    { fontSize: 13, color: '#D0BDF4' },
  memberSince:  { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },

  /* Stats row */
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: -16,
    borderRadius: 16,
    paddingVertical: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  statBox:     { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: '#f0f0f0', marginVertical: 4 },
  statValue:   { fontSize: 22, fontWeight: '800', color: '#222', marginTop: 4 },
  statLabel:   { fontSize: 11, color: '#888', marginTop: 2 },
  rankEmoji:   { fontSize: 22 },
  rankSuffix:  { fontSize: 13, fontWeight: '600', color: '#888' },

  /* Generic card */
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#333', marginBottom: 14 },

  /* Points breakdown */
  totalPtsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalPtsLabel: { fontSize: 14, fontWeight: '700', color: '#333' },
  totalPtsValue: { fontSize: 16, fontWeight: '800', color: '#8458B3' },

  /* Mini stat grid */
  miniGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  miniCard: {
    width: '48%',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  miniValue: { fontSize: 22, fontWeight: '800', color: '#fff', marginTop: 4 },
  miniLabel: { fontSize: 11, color: 'rgba(255,255,255,0.9)', marginTop: 2, textAlign: 'center' },

  /* Progress */
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: { fontSize: 13, fontWeight: '600', color: '#555' },
  progressPct:   { fontSize: 13, fontWeight: '800', color: '#8458B3' },
  progressTrack: {
    height: 10,
    backgroundColor: '#E5EAF5',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: { height: '100%', borderRadius: 5 },
  progressSub:  { fontSize: 12, color: '#888' },

  /* Location rows */
  locRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: '#fafafa',
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  locStrip: { width: 5 },
  locBody:  { flex: 1, padding: 12 },
  locTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  locTitle:  { fontSize: 14, fontWeight: '700', color: '#222', flex: 1, marginRight: 8 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  statusDot:      { width: 6, height: 6, borderRadius: 3 },
  statusPillText: { fontSize: 10, fontWeight: '700' },
  locMeta:        { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  metaChip:       { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaChipText:   { fontSize: 11, color: '#888' },
  locCoords:      { fontSize: 11, color: '#bbb', marginTop: 5 },

  /* Empty state */
  emptyBox:    { alignItems: 'center', paddingVertical: 28 },
  emptyText:   { fontSize: 13, color: '#bbb', marginTop: 10, textAlign: 'center' },
  goMarkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8458B3',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 14,
    gap: 6,
  },
  goMarkBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  /* Rank card */
  rankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 3,
    borderTopColor: '#FFC107',
  },
  rankCardLeft:    { flexDirection: 'row', alignItems: 'center', flex: 1 },
  rankCardEmoji:   { fontSize: 40 },
  rankCardTitle:   { fontSize: 12, color: '#888', fontWeight: '600' },
  rankCardValue:   { fontSize: 22, fontWeight: '800', color: '#222', marginTop: 2 },
  rankCardSuffix:  { fontSize: 14, fontWeight: '600', color: '#888' },
  rankCardUnranked:{ fontSize: 14, fontWeight: '700', color: '#bbb', marginTop: 2 },
  rankCardHint:    { fontSize: 11, fontWeight: '400', color: '#ccc' },
  rankCardRight:   { alignItems: 'center' },
  rankCardPts:     { fontSize: 28, fontWeight: '800', color: '#8458B3' },
  rankCardPtsLabel:{ fontSize: 12, color: '#888' },

  /* Sign out */
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E05C7A',
    marginHorizontal: 12,
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  signOutText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.4 },
});
