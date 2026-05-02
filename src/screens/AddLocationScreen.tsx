import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocationStore } from '../store/locationStore';
import { useAuthStore } from '../store/authStore';
import LeafletMap, { MapLocation } from '../components/LeafletMap';
import { useTheme } from '../theme/colors';

const CATEGORIES = ['Healthcare','Education','Government Schemes','Agriculture','Infrastructure','Other'];

const showAlert = (t: string, m: string) => {
  if (Platform.OS === 'web') window.alert(`${t}\n${m}`);
  else { const { Alert } = require('react-native'); Alert.alert(t, m); }
};

export default function AddLocationScreen({ navigation }: any) {
  const T = useTheme();
  const { user }        = useAuthStore();
  const { addLocation } = useLocationStore();

  const markPoints = user?.role === 'admin' ? 0 : user?.role === 'volunteer' ? 30 : 50;

  const [title, setTitle]         = useState('');
  const [description, setDesc]    = useState('');
  const [category, setCategory]   = useState('Healthcare');
  const [latitude, setLat]        = useState('20.5937');
  const [longitude, setLng]       = useState('78.9629');
  const [isLoading, setIsLoading] = useState(false);

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

  const cardStyle = { backgroundColor: T.cardBg, marginHorizontal: 12, marginBottom: 10, padding: 14, borderRadius: 14, shadowColor: T.dark, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2 };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: T.bg }} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={{ backgroundColor: T.headerBg, padding: 20, paddingTop: 44, alignItems: 'center' }}>
        <Ionicons name="add-circle" size={36} color={T.headerText} />
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: T.headerText, marginTop: 8 }}>Mark a New Location</Text>
        <Text style={{ fontSize: 13, color: T.headerSub, marginTop: 4, textAlign: 'center' }}>Tap the map to pin the exact spot, or use GPS</Text>
      </View>

      {/* Map picker */}
      <View style={{ backgroundColor: T.cardBg, margin: 12, borderRadius: 14, overflow: 'hidden', shadowColor: T.dark, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: T.textPrimary, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 6 }}>📍 Tap the map to set location</Text>
        <LeafletMap locations={previewPin} centerLat={parseFloat(latitude) || 20.5937} centerLng={parseFloat(longitude) || 78.9629} zoom={parseFloat(latitude) !== 20.5937 ? 12 : 5} height={260} showUserLocation onMapPress={(c) => { setLat(c.latitude.toFixed(6)); setLng(c.longitude.toFixed(6)); }} />
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', padding: 12, gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, color: T.textSecond, marginBottom: 4 }}>Latitude</Text>
            <TextInput style={{ borderWidth: 1, borderColor: T.border, borderRadius: 8, padding: 8, fontSize: 13, backgroundColor: T.surface, color: T.textPrimary }} value={latitude} onChangeText={setLat} keyboardType="decimal-pad" placeholder="20.5937" placeholderTextColor={T.textMuted} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, color: T.textSecond, marginBottom: 4 }}>Longitude</Text>
            <TextInput style={{ borderWidth: 1, borderColor: T.border, borderRadius: 8, padding: 8, fontSize: 13, backgroundColor: T.surface, color: T.textPrimary }} value={longitude} onChangeText={setLng} keyboardType="decimal-pad" placeholder="78.9629" placeholderTextColor={T.textMuted} />
          </View>
          <TouchableOpacity style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: T.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: T.primary }} onPress={getCurrentLocation}>
            <Ionicons name="locate" size={20} color={T.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Title */}
      <View style={cardStyle}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: T.textPrimary }}>Location Title *</Text>
        <TextInput style={{ borderWidth: 1.5, borderColor: T.border, borderRadius: 8, padding: 11, fontSize: 14, color: T.textPrimary, backgroundColor: T.surface, marginTop: 6 }} placeholder="e.g., Village Health Center" placeholderTextColor={T.textMuted} value={title} onChangeText={setTitle} editable={!isLoading} />
      </View>

      {/* Description */}
      <View style={cardStyle}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: T.textPrimary }}>Description *</Text>
        <TextInput style={{ borderWidth: 1.5, borderColor: T.border, borderRadius: 8, padding: 11, fontSize: 14, color: T.textPrimary, backgroundColor: T.surface, marginTop: 6, textAlignVertical: 'top', minHeight: 90 }} placeholder="Describe why this area needs digital awareness…" placeholderTextColor={T.textMuted} value={description} onChangeText={setDesc} multiline numberOfLines={4} editable={!isLoading} />
      </View>

      {/* Category */}
      <View style={cardStyle}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: T.textPrimary }}>Category *</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity key={cat} style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: category === cat ? T.primary : T.surface, borderWidth: 1, borderColor: category === cat ? T.primary : T.border }} onPress={() => setCategory(cat)} disabled={isLoading}>
              <Text style={{ fontSize: 12, color: category === cat ? T.white : T.textSecond, fontWeight: '500' }}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Points banner */}
      {markPoints > 0 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF8E1', marginHorizontal: 12, marginBottom: 8, padding: 12, borderRadius: 10, borderLeftWidth: 4, borderLeftColor: '#F57C00', gap: 8 }}>
          <Ionicons name="star" size={18} color="#F57C00" />
          <Text style={{ fontSize: 13, color: T.textSecond, flex: 1 }}>You earn <Text style={{ fontWeight: '800', color: '#E65100' }}>+{markPoints} points</Text> for marking this location</Text>
        </View>
      )}

      {/* Submit */}
      <TouchableOpacity style={{ flexDirection: 'row', backgroundColor: T.primary, marginHorizontal: 12, marginTop: 4, padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 10, opacity: isLoading ? 0.6 : 1 }} onPress={handleSubmit} disabled={isLoading} activeOpacity={0.8}>
        {isLoading ? <ActivityIndicator color={T.white} /> : (
          <><Ionicons name="checkmark-circle" size={20} color={T.white} /><Text style={{ color: T.white, fontSize: 16, fontWeight: '700' }}>Mark This Location</Text></>
        )}
      </TouchableOpacity>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}
