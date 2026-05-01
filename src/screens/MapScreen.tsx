import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocationStore } from '../store/locationStore';
import { useAuthStore } from '../store/authStore';
import LeafletMap, { MapLocation } from '../components/LeafletMap';
import { C } from '../theme/colors';

const FILTERS = [
  { label: 'All',           value: null },
  { label: '🔴 Not Visited', value: 'not_visited' },
  { label: '🟡 In Progress', value: 'in_progress' },
  { label: '🟢 Completed',   value: 'completed' },
];

export default function MapScreen({ navigation }: any) {
  const { locations, fetchAllLocations, setSelectedLocation } = useLocationStore();
  const [isLoading, setIsLoading]   = useState(true);
  const [filterStatus, setFilter]   = useState<string | null>(null);

  useEffect(() => {
    (async () => { setIsLoading(true); try { await fetchAllLocations(); } finally { setIsLoading(false); } })();
  }, []);

  const handlePress = (loc: any) => { setSelectedLocation(loc); navigation.navigate('LocationDetails', { locationId: loc.id }); };

  const filtered = filterStatus ? locations.filter((l) => l.status === filterStatus) : locations;
  const mapLocs: MapLocation[] = filtered.map((l) => ({ id: l.id, title: l.title, latitude: l.latitude, longitude: l.longitude, status: l.status as any, category: l.category }));

  if (isLoading) return (
    <View style={s.centered}>
      <ActivityIndicator size="large" color={C.primary} />
      <Text style={s.loadingText}>Loading map…</Text>
    </View>
  );

  return (
    <View style={s.container}>
      {/* Filter bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterBar} contentContainerStyle={s.filterBarContent}>
        {FILTERS.map((f) => (
          <TouchableOpacity key={String(f.value)} style={[s.filterBtn, filterStatus === f.value && s.filterBtnActive]} onPress={() => setFilter(f.value)}>
            <Text style={[s.filterBtnText, filterStatus === f.value && s.filterBtnTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Map */}
      <LeafletMap locations={mapLocs} centerLat={20.5937} centerLng={78.9629} zoom={5} height={340} showUserLocation onMarkerPress={handlePress} />

      {/* Legend */}
      <View style={s.legend}>
        {[
          { label: 'Not Visited', color: C.danger  },
          { label: 'In Progress', color: C.warning  },
          { label: 'Completed',   color: C.success  },
          { label: 'You',         color: C.accent   },
        ].map((l) => (
          <View key={l.label} style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: l.color }]} />
            <Text style={s.legendText}>{l.label}</Text>
          </View>
        ))}
      </View>

      {/* List */}
      <ScrollView style={s.list} contentContainerStyle={{ paddingBottom: 16 }}>
        <Text style={s.listTitle}>📍 {filtered.length} Location{filtered.length !== 1 ? 's' : ''}</Text>
        {filtered.length > 0 ? filtered.map((loc) => (
          <TouchableOpacity key={loc.id} style={s.listItem} onPress={() => handlePress(loc)} activeOpacity={0.75}>
            <View style={[s.statusDot, { backgroundColor: loc.status === 'completed' ? C.success : loc.status === 'in_progress' ? C.warning : C.danger }]} />
            <View style={s.listItemInfo}>
              <Text style={s.listItemTitle}>{loc.title}</Text>
              <Text style={s.listItemMeta}>{loc.category} · {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
          </TouchableOpacity>
        )) : (
          <View style={s.emptyBox}>
            <Ionicons name="map-outline" size={40} color={C.textMuted} />
            <Text style={s.emptyText}>No locations found</Text>
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={s.footer}>
        {[
          { label: 'Total',   count: locations.length,                                              color: C.primary },
          { label: 'Done',    count: locations.filter((l) => l.status === 'completed').length,      color: C.success },
          { label: 'Active',  count: locations.filter((l) => l.status === 'in_progress').length,    color: C.warning },
          { label: 'Pending', count: locations.filter((l) => l.status === 'not_visited').length,    color: C.danger  },
        ].map((f) => (
          <View key={f.label} style={s.footerItem}>
            <Text style={[s.footerCount, { color: f.color }]}>{f.count}</Text>
            <Text style={s.footerLabel}>{f.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: C.bg },
  centered:        { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText:     { marginTop: 10, color: C.textSecond, fontSize: 14 },
  filterBar:       { backgroundColor: C.cardBg, borderBottomWidth: 1, borderBottomColor: C.border, maxHeight: 52 },
  filterBarContent:{ paddingHorizontal: 10, paddingVertical: 8, gap: 8, flexDirection: 'row', alignItems: 'center' },
  filterBtn:       { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  filterBtnActive: { backgroundColor: C.primary, borderColor: C.primary },
  filterBtnText:   { fontSize: 12, color: C.textSecond, fontWeight: '500' },
  filterBtnTextActive: { color: C.white },
  legend:          { flexDirection: 'row', backgroundColor: C.cardBg, paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border, gap: 16 },
  legendItem:      { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot:       { width: 10, height: 10, borderRadius: 5 },
  legendText:      { fontSize: 11, color: C.textSecond },
  list:            { flex: 1, paddingHorizontal: 12, paddingTop: 10 },
  listTitle:       { fontSize: 14, fontWeight: '600', color: C.textPrimary, marginBottom: 8 },
  listItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.cardBg,
    padding: 12, borderRadius: 10, marginBottom: 8,
    shadowColor: C.dark, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
  },
  statusDot:     { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  listItemInfo:  { flex: 1 },
  listItemTitle: { fontSize: 14, fontWeight: '600', color: C.textPrimary },
  listItemMeta:  { fontSize: 11, color: C.textMuted, marginTop: 2 },
  emptyBox:      { alignItems: 'center', paddingVertical: 40 },
  emptyText:     { fontSize: 14, color: C.textMuted, marginTop: 10 },
  footer:        { flexDirection: 'row', backgroundColor: C.cardBg, borderTopWidth: 1, borderTopColor: C.border, paddingVertical: 10 },
  footerItem:    { flex: 1, alignItems: 'center' },
  footerCount:   { fontSize: 18, fontWeight: 'bold' },
  footerLabel:   { fontSize: 11, color: C.textSecond, marginTop: 2 },
});
