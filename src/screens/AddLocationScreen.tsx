import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocationStore } from '../store/locationStore';
import { useAuthStore } from '../store/authStore';
import LeafletMap, { MapLocation } from '../components/LeafletMap';
import { C } from '../theme/colors';

const CATEGORIES = ['Healthcare','Education','Government Schemes','Agriculture','Infrastructure','Other'];

const showAlert = (t: string, m: string) => {
  if (Platform.OS === 'web') window.alert(`${t}\n${m}`);
  else { const { Alert } = require('react-native'); Alert.alert(t, m); }
};

export default function AddLocationScreen({ navigation }: any) {
  const { user }        = useAuthStore();
  const { addLocation } = useLocationStore();

  const [title, setTitle]           = useState('');
  const [description, setDesc]      = useState('');
  const [category, setCategory]     = useState('Healthcare');
  const [latitude, setLat]          = useState('20.5937');
  const [longitude, setLng]         = useState('78.9629');
  const [isLoading, setIsLoading]   = useState(false);

  const markPoints = user?.role === 'admin' ? 0 : user?.role === 'volunteer' ? 30 : 50;

  const previewPin: MapLocation[] = latitude && longitude ? [{
    id: 'preview', title: title || 'New Location',
    latitude: parseFloat(latitude) || 20.5937, longitude: parseFloat(longitude) || 78.9629,
    status: 'not_visited', category,
  }] : [];

  useEffect(() => { getCurrentLocation(); }, []);

  const getCurrentLocation = () => {
    if (Platform.OS === 'web') {
      navigator.geolocation?.getCurrentPosition(
        (p) => { setLat(p.coords.latitude.toFixed(6)); setLng(p.coords.longitude.toFixed(6)); },
        () => { setLat('20.5937'); setLng('78.9629'); }
      );
    } else {
      import('expo-location').then((L) => {
        L.requestForegroundPermissionsAsync().then(({ status }) => {
          if (status === 'granted') L.getCurrentPositionAsync({}).then((l) => { setLat(l.coords.latitude.toFixed(6)); setLng(l.coords.longitude.toFixed(6)); });
        });
      });
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) { showAlert('Missing Fields', 'Please enter a title and description.'); return; }
    if (!user) { showAlert('Error', 'User not authenticated.'); return; }
    setIsLoading(true);
    try {
      await addLocation({ userId: user.id, latitude: parseFloat(latitude), longitude: parseFloat(longitude), title: title.trim(), description: description.trim(), category, status: 'not_visited', images: [], notes: '' });
      if (Platform.OS === 'web') window.alert('✅ Location marked successfully!');
      else { const { Alert } = require('react-native'); Alert.alert('Success', 'Location marked successfully!'); }
      setTitle(''); setDesc(''); setCategory('Healthcare'); getCurrentLocation();
    } catch (e: any) { showAlert('Error', e.message || 'Failed to add location.'); }
    finally { setIsLoading(false); }
  };

  return (
    <ScrollView style={s.container} keyboardShouldPersistTaps="handled">
      <View style={s.header}>
        <Ionicons name="add-circle" size={36} color={C.white} />
        <Text style={s.headerTitle}>Mark a New Location</Text>
        <Text style={s.headerSub}>Tap the map to pin the exact spot, or use GPS</Text>
      </View>

      {/* Map picker */}
      <View style={s.mapSection}>
        <Text style={s.sectionLabel}>📍 Tap the map to set location</Text>
        <LeafletMap locations={previewPin} centerLat={parseFloat(latitude) || 20.5937} centerLng={parseFloat(longitude) || 78.9629} zoom={parseFloat(latitude) !== 20.5937 ? 12 : 5} height={260} showUserLocation onMapPress={(c) => { setLat(c.latitude.toFixed(6)); setLng(c.longitude.toFixed(6)); }} />
        <View style={s.coordRow}>
          <View style={s.coordBox}>
            <Text style={s.coordLabel}>Latitude</Text>
            <TextInput style={s.coordInput} value={latitude} onChangeText={setLat} keyboardType="decimal-pad" placeholder="20.5937" />
          </View>
          <View style={s.coordBox}>
            <Text style={s.coordLabel}>Longitude</Text>
            <TextInput style={s.coordInput} value={longitude} onChangeText={setLng} keyboardType="decimal-pad" placeholder="78.9629" />
          </View>
          <TouchableOpacity style={s.gpsBtn} onPress={getCurrentLocation}>
            <Ionicons name="locate" size={20} color={C.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Title */}
      <View style={s.card}>
        <Text style={s.sectionLabel}>Location Title *</Text>
        <TextInput style={s.input} placeholder="e.g., Village Health Center" placeholderTextColor={C.textMuted} value={title} onChangeText={setTitle} editable={!isLoading} />
      </View>

      {/* Description */}
      <View style={s.card}>
        <Text style={s.sectionLabel}>Description *</Text>
        <TextInput style={[s.input, s.textArea]} placeholder="Describe why this area needs digital awareness…" placeholderTextColor={C.textMuted} value={description} onChangeText={setDesc} multiline numberOfLines={4} editable={!isLoading} />
      </View>

      {/* Category */}
      <View style={s.card}>
        <Text style={s.sectionLabel}>Category *</Text>
        <View style={s.chips}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity key={cat} style={[s.chip, category === cat && s.chipActive]} onPress={() => setCategory(cat)} disabled={isLoading}>
              <Text style={[s.chipText, category === cat && s.chipTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Points banner */}
      {markPoints > 0 && (
        <View style={s.pointsBanner}>
          <Ionicons name="star" size={18} color="#F57C00" />
          <Text style={s.pointsBannerText}>You earn <Text style={s.pointsBannerPts}>+{markPoints} points</Text> for marking this location</Text>
        </View>
      )}

      {/* Submit */}
      <TouchableOpacity style={[s.submitBtn, isLoading && { opacity: 0.6 }]} onPress={handleSubmit} disabled={isLoading} activeOpacity={0.8}>
        {isLoading ? <ActivityIndicator color={C.white} /> : (
          <><Ionicons name="checkmark-circle" size={20} color={C.white} /><Text style={s.submitText}>Mark This Location</Text></>
        )}
      </TouchableOpacity>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: C.bg },
  header:      { backgroundColor: C.primary, padding: 20, paddingTop: 44, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: C.white, marginTop: 8 },
  headerSub:   { fontSize: 13, color: C.secondary, marginTop: 4, textAlign: 'center' },
  mapSection:  { backgroundColor: C.cardBg, margin: 12, borderRadius: 14, overflow: 'hidden', shadowColor: C.dark, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  sectionLabel:{ fontSize: 13, fontWeight: '600', color: C.textPrimary, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 6 },
  coordRow:    { flexDirection: 'row', alignItems: 'flex-end', padding: 12, gap: 8 },
  coordBox:    { flex: 1 },
  coordLabel:  { fontSize: 11, color: C.textSecond, marginBottom: 4 },
  coordInput:  { borderWidth: 1, borderColor: C.border, borderRadius: 8, padding: 8, fontSize: 13, backgroundColor: C.surface, color: C.textPrimary },
  gpsBtn:      { width: 40, height: 40, borderRadius: 20, backgroundColor: C.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: C.primary },
  card:        { backgroundColor: C.cardBg, marginHorizontal: 12, marginBottom: 10, padding: 14, borderRadius: 14, shadowColor: C.dark, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2 },
  input:       { borderWidth: 1.5, borderColor: C.border, borderRadius: 8, padding: 11, fontSize: 14, color: C.textPrimary, backgroundColor: C.surface, marginTop: 6 },
  textArea:    { textAlignVertical: 'top', minHeight: 90 },
  chips:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip:        { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  chipActive:  { backgroundColor: C.primary, borderColor: C.primary },
  chipText:    { fontSize: 12, color: C.textSecond, fontWeight: '500' },
  chipTextActive: { color: C.white },
  pointsBanner:{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF8E1', marginHorizontal: 12, marginBottom: 8, padding: 12, borderRadius: 10, borderLeftWidth: 4, borderLeftColor: '#F57C00', gap: 8 },
  pointsBannerText: { fontSize: 13, color: C.textSecond, flex: 1 },
  pointsBannerPts:  { fontWeight: '800', color: '#E65100' },
  submitBtn:   { flexDirection: 'row', backgroundColor: C.primary, marginHorizontal: 12, marginTop: 4, padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 10 },
  submitText:  { color: C.white, fontSize: 16, fontWeight: '700' },
});
