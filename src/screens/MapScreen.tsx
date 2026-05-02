import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocationStore } from '../store/locationStore';
import LeafletMap, { MapLocation } from '../components/LeafletMap';
import { useTheme } from '../theme/colors';

const FILTERS = [
  { label: 'All',             value: null },
  { label: '🔴 Not Visited', value: 'not_visited' },
  { label: '🟡 In Progress', value: 'in_progress' },
  { label: '🟢 Completed',   value: 'completed' },
];

export default function MapScreen({ navigation }: any) {
  const T = useTheme();
  const { locations, fetchAllLocations, setSelectedLocation } = useLocationStore();
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilter] = useState<string | null>(null);

  useEffect(() => { (async () => { setIsLoading(true); try { await fetchAllLocations(); } finally { setIsLoading(false); } })(); }, []);

  const handlePress = (loc: any) => { setSelectedLocation(loc); navigation.navigate('LocationDetails', { locationId: loc.id }); };
  const filtered = filterStatus ? locations.filter((l) => l.status === filterStatus) : locations;
  const mapLocs: MapLocation[] = filtered.map((l) => ({ id: l.id, title: l.title, latitude: l.latitude, longitude: l.longitude, status: l.status as any, category: l.category }));

  if (isLoading) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: T.bg }}>
      <ActivityIndicator size="large" color={T.primary} />
      <Text style={{ marginTop: 10, color: T.textSecond, fontSize: 14 }}>Loading map…</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      {/* Filter bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ backgroundColor: T.cardBg, borderBottomWidth: 1, borderBottomColor: T.border, maxHeight: 52 }} contentContainerStyle={{ paddingHorizontal: 10, paddingVertical: 8, gap: 8, flexDirection: 'row', alignItems: 'center' }}>
        {FILTERS.map((f) => (
          <TouchableOpacity key={String(f.value)} style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: filterStatus === f.value ? T.primary : T.surface, borderWidth: 1, borderColor: filterStatus === f.value ? T.primary : T.border }} onPress={() => setFilter(f.value)}>
            <Text style={{ fontSize: 12, color: filterStatus === f.value ? T.white : T.textSecond, fontWeight: '500' }}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <LeafletMap locations={mapLocs} centerLat={20.5937} centerLng={78.9629} zoom={5} height={340} showUserLocation onMarkerPress={handlePress} />

      {/* Legend */}
      <View style={{ flexDirection: 'row', backgroundColor: T.cardBg, paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: T.border, gap: 16 }}>
        {[{ label: 'Not Visited', color: T.danger }, { label: 'In Progress', color: T.warning }, { label: 'Completed', color: T.success }, { label: 'You', color: T.accent }].map((l) => (
          <View key={l.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: l.color }} />
            <Text style={{ fontSize: 11, color: T.textSecond }}>{l.label}</Text>
          </View>
        ))}
      </View>

      {/* List */}
      <ScrollView style={{ flex: 1, paddingHorizontal: 12, paddingTop: 10 }} contentContainerStyle={{ paddingBottom: 16 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: T.textPrimary, marginBottom: 8 }}>📍 {filtered.length} Location{filtered.length !== 1 ? 's' : ''}</Text>
        {filtered.length > 0 ? filtered.map((loc) => (
          <TouchableOpacity key={loc.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: T.cardBg, padding: 12, borderRadius: 10, marginBottom: 8, shadowColor: T.dark, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 }} onPress={() => handlePress(loc)} activeOpacity={0.75}>
            <View style={{ width: 12, height: 12, borderRadius: 6, marginRight: 12, backgroundColor: loc.status === 'completed' ? T.success : loc.status === 'in_progress' ? T.warning : T.danger }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: T.textPrimary }}>{loc.title}</Text>
              <Text style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{loc.category} · {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={T.textMuted} />
          </TouchableOpacity>
        )) : (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Ionicons name="map-outline" size={40} color={T.textMuted} />
            <Text style={{ fontSize: 14, color: T.textMuted, marginTop: 10 }}>No locations found</Text>
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={{ flexDirection: 'row', backgroundColor: T.cardBg, borderTopWidth: 1, borderTopColor: T.border, paddingVertical: 10 }}>
        {[{ label: 'Total', count: locations.length, color: T.primary }, { label: 'Done', count: locations.filter((l) => l.status === 'completed').length, color: T.success }, { label: 'Active', count: locations.filter((l) => l.status === 'in_progress').length, color: T.warning }, { label: 'Pending', count: locations.filter((l) => l.status === 'not_visited').length, color: T.danger }].map((f) => (
          <View key={f.label} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: f.color }}>{f.count}</Text>
            <Text style={{ fontSize: 11, color: T.textSecond, marginTop: 2 }}>{f.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
