import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getAnalyticsSummary,
  getAnalyticsSummaryByUser,
  getLeaderboard,
  getAllLocations,
  getLocationsByUser,
  getAllUsers,
} from '../database/db.web';
import { useAuthStore } from '../store/authStore';

// ─── Status helpers ───────────────────────────────────────────────────────────
const statusColor = (s: string) =>
  s === 'completed' ? '#4CAF50' : s === 'in_progress' ? '#FFC107' : '#F44336';

const statusLabel = (s: string) =>
  s === 'completed' ? '🟢 Completed'
  : s === 'in_progress' ? '🟡 In Progress'
  : '🔴 Not Visited';

// ─── Component ────────────────────────────────────────────────────────────────
export default function AdminDashboardScreen({ navigation }: any) {
  const { user } = useAuthStore();

  const [refreshing, setRefreshing]         = useState(false);

  // System-wide analytics
  const [analytics, setAnalytics]           = useState({ total: 0, completed: 0, inProgress: 0, notVisited: 0 });
  const [leaderboard, setLeaderboard]       = useState<any[]>([]);
  const [allLocations, setAllLocations]     = useState<any[]>([]);
  const [categoryStats, setCategoryStats]   = useState<Record<string, number>>({});
  const [totalUsers, setTotalUsers]         = useState(0);

  // Admin's own locations
  const [myAnalytics, setMyAnalytics]       = useState({ total: 0, completed: 0, inProgress: 0, notVisited: 0 });
  const [myLocations, setMyLocations]       = useState<any[]>([]);
  const [myCatStats, setMyCatStats]         = useState<Record<string, number>>({});
  const [myExpanded, setMyExpanded]         = useState(true);   // section collapsed state

  const loadData = useCallback(async () => {
    // ── System-wide ──
    const summary = await getAnalyticsSummary();
    setAnalytics(summary);

    const leaders = await getLeaderboard(10);
    setLeaderboard(leaders);

    const allLocs = await getAllLocations();
    setAllLocations(allLocs);

    const cats: Record<string, number> = {};
    allLocs.forEach((loc: any) => {
      cats[loc.category] = (cats[loc.category] || 0) + 1;
    });
    setCategoryStats(cats);

    const users = await getAllUsers();
    setTotalUsers(users.length);

    // ── Admin's own locations ──
    if (user?.id) {
      const mySummary = await getAnalyticsSummaryByUser(user.id);
      setMyAnalytics(mySummary);

      const myLocs = await getLocationsByUser(user.id);
      // Sort newest first
      myLocs.sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setMyLocations(myLocs);

      const myCats: Record<string, number> = {};
      myLocs.forEach((loc: any) => {
        myCats[loc.category] = (myCats[loc.category] || 0) + 1;
      });
      setMyCatStats(myCats);
    }
  }, [user?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const completionPct =
    analytics.total > 0 ? Math.round((analytics.completed / analytics.total) * 100) : 0;

  const myCompletionPct =
    myAnalytics.total > 0 ? Math.round((myAnalytics.completed / myAnalytics.total) * 100) : 0;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* ══════════════════════════════════════════════════════════════════════
          HEADER
      ══════════════════════════════════════════════════════════════════════ */}
      <View style={styles.header}>
        <Ionicons name="stats-chart" size={36} color="#fff" />
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <Text style={styles.headerSub}>Real-time system analytics</Text>
      </View>

      {/* ══════════════════════════════════════════════════════════════════════
          ① MY MARKED LOCATIONS  (admin's own work — shown first & prominently)
      ══════════════════════════════════════════════════════════════════════ */}
      <View style={styles.sectionDivider}>
        <View style={styles.sectionDividerLine} />
        <Text style={styles.sectionDividerText}>👨‍💼 My Marked Locations</Text>
        <View style={styles.sectionDividerLine} />
      </View>

      {/* My stat cards */}
      <View style={styles.metricsGrid}>
        {[
          { label: 'I Marked',    value: myAnalytics.total,      color: '#6A3D9A', icon: 'location'         },
          { label: 'Completed',   value: myAnalytics.completed,  color: '#8458B3', icon: 'checkmark-circle' },
          { label: 'In Progress', value: myAnalytics.inProgress, color: '#8458B3', icon: 'hourglass'        },
          { label: 'Not Visited', value: myAnalytics.notVisited, color: '#B71C1C', icon: 'alert-circle'     },
        ].map((m) => (
          <View key={m.label} style={[styles.metricCard, { backgroundColor: m.color }]}>
            <Ionicons name={m.icon as any} size={24} color="#fff" />
            <Text style={styles.metricValue}>{m.value}</Text>
            <Text style={styles.metricLabel}>{m.label}</Text>
          </View>
        ))}
      </View>

      {/* My progress bar */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>My Completion Progress</Text>
          <Text style={styles.pctBadge}>{myCompletionPct}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${myCompletionPct}%` as any, backgroundColor: '#6A3D9A' }]} />
        </View>
        <Text style={styles.progressSub}>
          {myAnalytics.total > 0
            ? `${myAnalytics.completed} of ${myAnalytics.total} locations I marked are completed`
            : 'You have not marked any locations yet'}
        </Text>
      </View>

      {/* My status distribution */}
      {myAnalytics.total > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📊 My Status Breakdown</Text>
          {[
            { label: 'Completed',   count: myAnalytics.completed,  color: '#4CAF50' },
            { label: 'In Progress', count: myAnalytics.inProgress, color: '#FFC107' },
            { label: 'Not Visited', count: myAnalytics.notVisited, color: '#F44336' },
          ].map((s) => (
            <View key={s.label} style={styles.distRow}>
              <View style={[styles.distDot, { backgroundColor: s.color }]} />
              <Text style={styles.distLabel}>{s.label}</Text>
              <View style={styles.distBarTrack}>
                <View
                  style={[
                    styles.distBarFill,
                    {
                      width: `${Math.round((s.count / myAnalytics.total) * 100)}%` as any,
                      backgroundColor: s.color,
                    },
                  ]}
                />
              </View>
              <Text style={styles.distCount}>{s.count}</Text>
            </View>
          ))}
        </View>
      )}

      {/* My category breakdown */}
      {Object.keys(myCatStats).length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📂 My Locations by Category</Text>
          {Object.entries(myCatStats)
            .sort((a, b) => b[1] - a[1])
            .map(([cat, count]) => (
              <View key={cat} style={styles.catRow}>
                <Text style={styles.catName}>{cat}</Text>
                <View style={styles.catBarTrack}>
                  <View
                    style={[
                      styles.catBarFill,
                      {
                        width: `${Math.round((count / myAnalytics.total) * 100)}%` as any,
                        backgroundColor: '#6A3D9A',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.catCount}>{count}</Text>
              </View>
            ))}
        </View>
      )}

      {/* My full location list — collapsible */}
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.rowBetween}
          onPress={() => setMyExpanded(!myExpanded)}
          activeOpacity={0.7}
        >
          <Text style={styles.cardTitle}>
            📍 All My Locations ({myLocations.length})
          </Text>
          <Ionicons
            name={myExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#888"
          />
        </TouchableOpacity>

        {myExpanded && (
          myLocations.length > 0 ? (
            myLocations.map((loc: any) => (
              <TouchableOpacity
                key={loc.id}
                style={styles.myLocRow}
                onPress={() => navigation.navigate('LocationDetails', { locationId: loc.id })}
                activeOpacity={0.75}
              >
                {/* Status colour strip */}
                <View style={[styles.myLocStrip, { backgroundColor: statusColor(loc.status) }]} />

                <View style={styles.myLocBody}>
                  {/* Title + status badge */}
                  <View style={styles.rowBetween}>
                    <Text style={styles.myLocTitle} numberOfLines={1}>{loc.title}</Text>
                    <View style={[styles.statusPill, { backgroundColor: statusColor(loc.status) + '22' }]}>
                      <Text style={[styles.statusPillText, { color: statusColor(loc.status) }]}>
                        {statusLabel(loc.status)}
                      </Text>
                    </View>
                  </View>

                  {/* Category + date */}
                  <View style={styles.myLocMeta}>
                    <View style={styles.metaChip}>
                      <Ionicons name="grid-outline" size={11} color="#888" />
                      <Text style={styles.metaChipText}>{loc.category}</Text>
                    </View>
                    <View style={styles.metaChip}>
                      <Ionicons name="calendar-outline" size={11} color="#888" />
                      <Text style={styles.metaChipText}>
                        {new Date(loc.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </Text>
                    </View>
                  </View>

                  {/* Description preview */}
                  {loc.description ? (
                    <Text style={styles.myLocDesc} numberOfLines={2}>{loc.description}</Text>
                  ) : null}

                  {/* Coordinates */}
                  <Text style={styles.myLocCoords}>
                    📍 {Number(loc.latitude).toFixed(4)}, {Number(loc.longitude).toFixed(4)}
                  </Text>
                </View>

                <Ionicons name="chevron-forward" size={16} color="#ccc" style={{ alignSelf: 'center' }} />
              </TouchableOpacity>
            ))
          ) : (
            <EmptyState icon="map-outline" text="You haven't marked any locations yet" />
          )
        )}
      </View>

      {/* ══════════════════════════════════════════════════════════════════════
          ② SYSTEM-WIDE ANALYTICS
      ══════════════════════════════════════════════════════════════════════ */}
      <View style={styles.sectionDivider}>
        <View style={styles.sectionDividerLine} />
        <Text style={styles.sectionDividerText}>🌐 System-Wide Analytics</Text>
        <View style={styles.sectionDividerLine} />
      </View>

      {/* System stat cards */}
      <View style={styles.metricsGrid}>
        {[
          { label: 'Total Locations', value: analytics.total,      color: '#A0D2EB', icon: 'location'         },
          { label: 'Completed',       value: analytics.completed,  color: '#4CAF50', icon: 'checkmark-circle' },
          { label: 'In Progress',     value: analytics.inProgress, color: '#FFC107', icon: 'hourglass'        },
          { label: 'Not Visited',     value: analytics.notVisited, color: '#E05C7A', icon: 'alert-circle'     },
        ].map((m) => (
          <View key={m.label} style={[styles.metricCard, { backgroundColor: m.color }]}>
            <Ionicons name={m.icon as any} size={24} color="#fff" />
            <Text style={styles.metricValue}>{m.value}</Text>
            <Text style={styles.metricLabel}>{m.label}</Text>
          </View>
        ))}
      </View>

      {/* System progress */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>Overall Completion</Text>
          <Text style={styles.pctBadge}>{completionPct}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${completionPct}%` as any }]} />
        </View>
        <Text style={styles.progressSub}>
          {analytics.total > 0
            ? `${analytics.completed} of ${analytics.total} locations completed`
            : 'No locations marked yet'}
        </Text>
      </View>

      {/* Category breakdown */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📂 All Locations by Category</Text>
        {Object.keys(categoryStats).length > 0 ? (
          Object.entries(categoryStats)
            .sort((a, b) => b[1] - a[1])
            .map(([cat, count]) => (
              <View key={cat} style={styles.catRow}>
                <Text style={styles.catName}>{cat}</Text>
                <View style={styles.catBarTrack}>
                  <View
                    style={[
                      styles.catBarFill,
                      { width: `${Math.round((count / analytics.total) * 100)}%` as any },
                    ]}
                  />
                </View>
                <Text style={styles.catCount}>{count}</Text>
              </View>
            ))
        ) : (
          <EmptyState icon="folder-open-outline" text="No locations marked yet" />
        )}
      </View>

      {/* Status distribution */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📊 Status Distribution</Text>
        {analytics.total > 0 ? (
          [
            { label: 'Completed',   count: analytics.completed,  color: '#4CAF50' },
            { label: 'In Progress', count: analytics.inProgress, color: '#FFC107' },
            { label: 'Not Visited', count: analytics.notVisited, color: '#F44336' },
          ].map((s) => (
            <View key={s.label} style={styles.distRow}>
              <View style={[styles.distDot, { backgroundColor: s.color }]} />
              <Text style={styles.distLabel}>{s.label}</Text>
              <View style={styles.distBarTrack}>
                <View
                  style={[
                    styles.distBarFill,
                    {
                      width: `${Math.round((s.count / analytics.total) * 100)}%` as any,
                      backgroundColor: s.color,
                    },
                  ]}
                />
              </View>
              <Text style={styles.distCount}>{s.count}</Text>
            </View>
          ))
        ) : (
          <EmptyState icon="pie-chart-outline" text="No data to display" />
        )}
      </View>

      {/* Leaderboard */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🏆 Top Contributors</Text>
        {leaderboard.length > 0 ? (
          leaderboard.map((leader, index) => (
            <View key={leader.id} style={styles.leaderRow}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>#{index + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.leaderNameRow}>
                  <Text style={styles.leaderName}>{leader.name}</Text>
                  <View style={[
                    styles.leaderRolePill,
                    { backgroundColor: leader.role === 'volunteer' ? '#FFF3E0' : '#E5EAF5' },
                  ]}>
                    <Text style={[
                      styles.leaderRoleText,
                      { color: leader.role === 'volunteer' ? '#8458B3' : '#8458B3' },
                    ]}>
                      {leader.role === 'volunteer' ? '🙋 Volunteer' : '👤 User'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.leaderPts}>{leader.points} points</Text>
              </View>
              {index === 0 && <Text style={styles.medal}>🥇</Text>}
              {index === 1 && <Text style={styles.medal}>🥈</Text>}
              {index === 2 && <Text style={styles.medal}>🥉</Text>}
            </View>
          ))
        ) : (
          <EmptyState icon="trophy-outline" text="No contributions yet" />
        )}
      </View>

      {/* Recently marked (all users) */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📍 Recently Marked (All Users)</Text>
        {allLocations.length > 0 ? (
          allLocations.slice(0, 8).map((loc) => (
            <View key={loc.id} style={styles.recentRow}>
              <View style={[styles.recentDot, { backgroundColor: statusColor(loc.status) }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.recentTitle}>{loc.title}</Text>
                <Text style={styles.recentMeta}>{loc.category}</Text>
              </View>
              <Text style={styles.recentDate}>
                {new Date(loc.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short',
                })}
              </Text>
            </View>
          ))
        ) : (
          <EmptyState icon="map-outline" text="No locations marked yet" />
        )}
      </View>

      {/* System overview */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>⚙️ System Overview</Text>
        <SysRow label="Registered Users"  value={String(totalUsers)} />
        <SysRow label="Total Locations"   value={String(analytics.total)} />
        <SysRow label="Completion Rate"   value={`${completionPct}%`} />
        <SysRow label="Pending Visits"    value={String(analytics.notVisited)} />
        <SysRow label="My Locations"      value={String(myAnalytics.total)} />
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const EmptyState = ({ icon, text }: { icon: any; text: string }) => (
  <View style={emptyStyles.box}>
    <Ionicons name={icon} size={34} color="#ddd" />
    <Text style={emptyStyles.text}>{text}</Text>
  </View>
);
const emptyStyles = StyleSheet.create({
  box: { alignItems: 'center', paddingVertical: 24 },
  text: { fontSize: 13, color: '#bbb', marginTop: 8, textAlign: 'center' },
});

const SysRow = ({ label, value }: { label: string; value: string }) => (
  <View style={sysStyles.row}>
    <Text style={sysStyles.label}>{label}</Text>
    <Text style={sysStyles.value}>{value}</Text>
  </View>
);
const sysStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0EEF8',
  },
  label: { fontSize: 14, color: '#666' },
  value: { fontSize: 14, fontWeight: '700', color: '#8458B3' },
});

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0EEF8' },

  /* Header */
  header: {
    backgroundColor: '#8458B3', padding: 20, paddingTop: 44, alignItems: 'center',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginTop: 8 },
  headerSub:   { fontSize: 13, color: '#D0BDF4', marginTop: 4 },

  /* Section divider */
  sectionDivider: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 12, marginTop: 16, marginBottom: 4, gap: 8,
  },
  sectionDividerLine: { flex: 1, height: 1, backgroundColor: '#ddd' },
  sectionDividerText: { fontSize: 12, fontWeight: '700', color: '#555', textAlign: 'center' },

  /* Metrics grid */
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 10 },
  metricCard:  { width: '48%', padding: 14, borderRadius: 14, alignItems: 'center' },
  metricValue: { fontSize: 26, fontWeight: '800', color: '#fff', marginTop: 6 },
  metricLabel: { fontSize: 11, color: 'rgba(255,255,255,0.9)', marginTop: 4, textAlign: 'center' },

  /* Generic card */
  card: {
    backgroundColor: '#fff', marginHorizontal: 12, marginBottom: 10,
    padding: 16, borderRadius: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#333', marginBottom: 12 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },

  /* Progress */
  pctBadge:      { fontSize: 15, fontWeight: '800', color: '#8458B3' },
  progressTrack: { height: 10, backgroundColor: '#E5EAF5', borderRadius: 5, overflow: 'hidden', marginBottom: 8 },
  progressFill:  { height: '100%', backgroundColor: '#8458B3', borderRadius: 5 },
  progressSub:   { fontSize: 12, color: '#888' },

  /* Category bars */
  catRow:      { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  catName:     { fontSize: 12, color: '#555', width: 110 },
  catBarTrack: { flex: 1, height: 8, backgroundColor: '#f0f0f0', borderRadius: 4, overflow: 'hidden' },
  catBarFill:  { height: '100%', backgroundColor: '#8458B3', borderRadius: 4 },
  catCount:    { fontSize: 12, fontWeight: '700', color: '#333', width: 24, textAlign: 'right' },

  /* Status distribution */
  distRow:      { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  distDot:      { width: 10, height: 10, borderRadius: 5 },
  distLabel:    { fontSize: 12, color: '#555', width: 80 },
  distBarTrack: { flex: 1, height: 8, backgroundColor: '#f0f0f0', borderRadius: 4, overflow: 'hidden' },
  distBarFill:  { height: '100%', borderRadius: 4 },
  distCount:    { fontSize: 12, fontWeight: '700', color: '#333', width: 24, textAlign: 'right' },

  /* ── My location rows ── */
  myLocRow: {
    flexDirection: 'row', alignItems: 'stretch',
    backgroundColor: '#fafafa', borderRadius: 10,
    marginBottom: 10, overflow: 'hidden',
    borderWidth: 1, borderColor: '#eee',
  },
  myLocStrip: { width: 5 },
  myLocBody:  { flex: 1, padding: 12 },
  myLocTitle: { fontSize: 14, fontWeight: '700', color: '#222', flex: 1, marginRight: 8 },
  myLocMeta:  { flexDirection: 'row', gap: 10, marginTop: 6, flexWrap: 'wrap' },
  metaChip:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaChipText: { fontSize: 11, color: '#888' },
  myLocDesc:  { fontSize: 12, color: '#666', marginTop: 6, lineHeight: 17 },
  myLocCoords:{ fontSize: 11, color: '#aaa', marginTop: 5 },

  /* Status pill */
  statusPill:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusPillText: { fontSize: 10, fontWeight: '700' },

  /* Leaderboard */
  leaderRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0EEF8',
  },
  rankBadge: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#8458B3', justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  rankText:      { color: '#fff', fontWeight: '700', fontSize: 12 },
  leaderNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  leaderName:    { fontSize: 14, fontWeight: '600', color: '#333' },
  leaderPts:     { fontSize: 12, color: '#999', marginTop: 1 },
  medal:         { fontSize: 20 },
  leaderRolePill:{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  leaderRoleText:{ fontSize: 10, fontWeight: '700' },

  /* Recent rows */
  recentRow:  { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0EEF8' },
  recentDot:  { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  recentTitle:{ fontSize: 13, fontWeight: '600', color: '#333' },
  recentMeta: { fontSize: 11, color: '#999', marginTop: 1 },
  recentDate: { fontSize: 11, color: '#bbb' },
});
