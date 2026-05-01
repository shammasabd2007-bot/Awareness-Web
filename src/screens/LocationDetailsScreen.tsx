import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Platform,
  Image, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocationStore } from '../store/locationStore';
import { useAuthStore } from '../store/authStore';
import { getLocationById, getVisitHistory, getUserById } from '../database/db.web';
import LeafletMap, { MapLocation } from '../components/LeafletMap';
import { C } from '../theme/colors';

const sColor = (s: string) => s === 'completed' ? C.success : s === 'in_progress' ? C.warning : C.danger;
const sLabel = (s: string) => s === 'completed' ? '🟢 Completed' : s === 'in_progress' ? '🟡 In Progress' : '🔴 Not Visited';

// ─── Full-screen photo viewer ─────────────────────────────────────────────────
function PhotoViewer({ uri, onClose }: { uri: string; onClose: () => void }) {
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={pv.overlay}>
        <TouchableOpacity style={pv.closeBtn} onPress={onClose}>
          <Ionicons name="close-circle" size={36} color={C.white} />
        </TouchableOpacity>
        <Image source={{ uri }} style={pv.image} resizeMode="contain" />
      </View>
    </Modal>
  );
}
const pv = StyleSheet.create({
  overlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  closeBtn: { position: 'absolute' as any, top: 48, right: 16, zIndex: 10 },
  image:    { width: '100%', height: '80%' },
});

// ─── Visit record card ────────────────────────────────────────────────────────
function VisitCard({ visit, index }: { visit: any; index: number }) {
  const [expanded, setExpanded]       = useState(index === 0); // first card open by default
  const [viewerUri, setViewerUri]     = useState<string | null>(null);
  const [volunteerName, setVolunteerName] = useState<string>('');

  const photos: string[] = Array.isArray(visit.images) ? visit.images : [];

  // Extract awareness category from notes if present
  const awarenessMatch = visit.notes?.match(/^\[Awareness: (.+?)\]/);
  const awarenessLabel = awarenessMatch ? awarenessMatch[1] : null;
  const cleanNotes     = visit.notes?.replace(/^\[Awareness: .+?\]\n?/, '').trim() || '';

  useEffect(() => {
    if (visit.volunteerId) {
      getUserById(visit.volunteerId).then((u) => {
        if (u) setVolunteerName(u.name);
      });
    }
  }, [visit.volunteerId]);

  return (
    <View style={vc.card}>
      {/* ── Header row ── */}
      <TouchableOpacity style={vc.header} onPress={() => setExpanded(!expanded)} activeOpacity={0.75}>
        {/* Status dot */}
        <View style={[vc.dot, { backgroundColor: sColor(visit.status) }]} />

        <View style={{ flex: 1 }}>
          <Text style={vc.statusText}>{sLabel(visit.status)}</Text>
          <Text style={vc.dateText}>
            {new Date(visit.timestamp).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
            {' · '}
            {new Date(visit.timestamp).toLocaleTimeString('en-IN', {
              hour: '2-digit', minute: '2-digit',
            })}
          </Text>
          {volunteerName ? (
            <Text style={vc.volunteerText}>👤 {volunteerName}</Text>
          ) : null}
        </View>

        {/* Photo count badge */}
        {photos.length > 0 && (
          <View style={vc.photoBadge}>
            <Ionicons name="camera" size={12} color={C.white} />
            <Text style={vc.photoBadgeText}>{photos.length}</Text>
          </View>
        )}

        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={C.textMuted}
          style={{ marginLeft: 8 }}
        />
      </TouchableOpacity>

      {/* ── Expanded content ── */}
      {expanded && (
        <View style={vc.body}>

          {/* Awareness category */}
          {awarenessLabel && (
            <View style={vc.awarenessPill}>
              <Ionicons name="bulb-outline" size={14} color={C.primary} />
              <Text style={vc.awarenessText}>{awarenessLabel}</Text>
            </View>
          )}

          {/* Notes */}
          {cleanNotes ? (
            <View style={vc.notesBox}>
              <Text style={vc.notesLabel}>📝 Notes</Text>
              <Text style={vc.notesText}>{cleanNotes}</Text>
            </View>
          ) : null}

          {/* Evidence photos */}
          {photos.length > 0 ? (
            <View style={vc.photosSection}>
              <View style={vc.photosSectionHeader}>
                <Ionicons name="images-outline" size={15} color={C.primary} />
                <Text style={vc.photosSectionTitle}>
                  Evidence Photos ({photos.length})
                </Text>
              </View>

              <View style={vc.photosGrid}>
                {photos.map((uri, i) => (
                  <TouchableOpacity
                    key={i}
                    style={vc.photoThumb}
                    onPress={() => setViewerUri(uri)}
                    activeOpacity={0.85}
                  >
                    <Image
                      source={{ uri }}
                      style={vc.photoThumbImg}
                      resizeMode="cover"
                    />
                    {/* Tap to expand hint on first photo */}
                    {i === 0 && (
                      <View style={vc.photoHint}>
                        <Ionicons name="expand-outline" size={14} color={C.white} />
                      </View>
                    )}
                    {/* Index badge */}
                    <View style={vc.photoIndex}>
                      <Text style={vc.photoIndexText}>{i + 1}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <View style={vc.noPhotos}>
              <Ionicons name="camera-outline" size={20} color={C.textMuted} />
              <Text style={vc.noPhotosText}>No evidence photos attached</Text>
            </View>
          )}
        </View>
      )}

      {/* Full-screen photo viewer */}
      {viewerUri && (
        <PhotoViewer uri={viewerUri} onClose={() => setViewerUri(null)} />
      )}
    </View>
  );
}

const vc = StyleSheet.create({
  card: {
    backgroundColor: C.surface,
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  dot: {
    width: 12, height: 12, borderRadius: 6,
    marginRight: 12, marginTop: 2,
  },
  statusText:    { fontSize: 14, fontWeight: '700', color: C.textPrimary },
  dateText:      { fontSize: 11, color: C.textMuted, marginTop: 2 },
  volunteerText: { fontSize: 11, color: C.primary, marginTop: 2, fontWeight: '600' },
  photoBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: C.primary, paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 10,
  },
  photoBadgeText: { fontSize: 11, color: C.white, fontWeight: '700' },
  body: {
    paddingHorizontal: 14, paddingBottom: 14,
    borderTopWidth: 1, borderTopColor: C.border,
  },

  /* Awareness pill */
  awarenessPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.primaryLight,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 10, alignSelf: 'flex-start',
    marginTop: 12, marginBottom: 8,
  },
  awarenessText: { fontSize: 12, color: C.primary, fontWeight: '700' },

  /* Notes */
  notesBox:  { marginTop: 8, marginBottom: 10 },
  notesLabel:{ fontSize: 12, fontWeight: '700', color: C.textSecond, marginBottom: 4 },
  notesText: { fontSize: 13, color: C.textPrimary, lineHeight: 19 },

  /* Photos section */
  photosSection:      { marginTop: 10 },
  photosSectionHeader:{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  photosSectionTitle: { fontSize: 13, fontWeight: '700', color: C.textPrimary },
  photosGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoThumb: {
    width: '47%', aspectRatio: 1.3,
    borderRadius: 10, overflow: 'hidden',
    position: 'relative' as any,
    borderWidth: 1.5, borderColor: C.border,
  },
  photoThumbImg: { width: '100%', height: '100%' },
  photoHint: {
    position: 'absolute' as any, top: 6, right: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 4, borderRadius: 6,
  },
  photoIndex: {
    position: 'absolute' as any, bottom: 5, left: 5,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  photoIndexText: { fontSize: 10, color: C.white, fontWeight: '700' },

  /* No photos */
  noPhotos:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, opacity: 0.6 },
  noPhotosText: { fontSize: 12, color: C.textMuted },
});

export default function LocationDetailsScreen({ route, navigation }: any) {
  const { locationId }                    = route.params;
  const { user }                          = useAuthStore();
  const { fetchVisitHistory, visitHistory } = useLocationStore();
  const [location, setLocation]           = useState<any>(null);
  const [isLoading, setIsLoading]         = useState(true);
  const [localHistory, setLocalHistory]   = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const loc = await getLocationById(locationId);
        setLocation(loc);
        // Fetch visit history with parsed images
        const history = await getVisitHistory(locationId);
        setLocalHistory(history);
        // Also update the store for other screens
        await fetchVisitHistory(locationId);
      } catch (_) {
        if (Platform.OS === 'web') window.alert('Failed to load location details');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [locationId]);

  if (isLoading) return <View style={s.centered}><ActivityIndicator size="large" color={C.primary} /></View>;
  if (!location) return <View style={s.centered}><Text style={s.errorText}>Location not found</Text></View>;

  const pin: MapLocation[] = [{ id: location.id, title: location.title, latitude: location.latitude, longitude: location.longitude, status: location.status, category: location.category }];

  return (
    <ScrollView style={s.container}>
      <View style={s.header}>
        <View style={[s.badge, { backgroundColor: sColor(location.status) }]}>
          <Text style={s.badgeText}>{sLabel(location.status)}</Text>
        </View>
        <Text style={s.title}>{location.title}</Text>
        <Text style={s.category}>{location.category}</Text>
      </View>

      {/* Map */}
      <View style={s.mapCard}>
        <Text style={s.sectionTitle}>🗺️ Location on Map</Text>
        <LeafletMap locations={pin} centerLat={location.latitude} centerLng={location.longitude} zoom={13} height={240} showUserLocation={false} />
        <View style={s.coordBadge}>
          <Ionicons name="location" size={14} color={C.primary} />
          <Text style={s.coordText}>{location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}</Text>
        </View>
      </View>

      {/* Details */}
      <View style={s.card}>
        <Text style={s.sectionTitle}>📋 Details</Text>
        {[
          { icon: 'document-text', label: 'Description', value: location.description },
          { icon: 'grid',          label: 'Category',    value: location.category },
          { icon: 'calendar',      label: 'Marked On',   value: new Date(location.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) },
          { icon: 'time',          label: 'Last Updated',value: new Date(location.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) },
        ].map((r) => (
          <View key={r.label} style={s.infoRow}>
            <Ionicons name={r.icon as any} size={18} color={C.primary} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.infoLabel}>{r.label}</Text>
              <Text style={s.infoValue}>{r.value}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Update button */}
      {user?.role !== 'user' && location.status !== 'completed' && (
        <TouchableOpacity style={s.updateBtn} onPress={() => navigation.navigate('StatusUpdate', { locationId: location.id })} activeOpacity={0.8}>
          <Ionicons name="pencil" size={18} color={C.white} />
          <Text style={s.updateBtnText}>Update Visit Status</Text>
        </TouchableOpacity>
      )}

      {/* Visit history */}
      <View style={s.card}>
        <Text style={s.sectionTitle}>
          📅 Visit History ({localHistory.length})
        </Text>
        {localHistory.length > 0 ? (
          localHistory.map((v: any, i: number) => (
            <VisitCard key={v.id} visit={v} index={i} />
          ))
        ) : (
          <View style={s.emptyVisit}>
            <Ionicons name="time-outline" size={36} color={C.textMuted} />
            <Text style={s.emptyText}>No visits recorded yet</Text>
          </View>
        )}
      </View>

      {/* Stats */}
      <View style={s.card}>
        <Text style={s.sectionTitle}>📊 Statistics</Text>
        {[
          { label: 'Total Visits',     value: String(localHistory.length) },
          { label: 'Current Status',   value: sLabel(location.status) },
          { label: 'Days Since Marked',value: String(Math.floor((Date.now() - new Date(location.createdAt).getTime()) / 86400000)) },
          { label: 'Photos Uploaded',  value: String(localHistory.reduce((sum: number, v: any) => sum + (v.images?.length ?? 0), 0)) },
        ].map((r) => (
          <View key={r.label} style={s.statRow}>
            <Text style={s.statLabel}>{r.label}</Text>
            <Text style={s.statValue}>{r.value}</Text>
          </View>
        ))}
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: C.bg },
  centered:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText:   { fontSize: 16, color: C.danger },
  header:      { backgroundColor: C.primary, padding: 20, paddingTop: 44 },
  badge:       { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginBottom: 10 },
  badgeText:   { color: C.white, fontSize: 12, fontWeight: '600' },
  title:       { fontSize: 22, fontWeight: 'bold', color: C.white, marginBottom: 4 },
  category:    { fontSize: 13, color: C.secondary },
  mapCard:     { backgroundColor: C.cardBg, margin: 12, borderRadius: 14, overflow: 'hidden', shadowColor: C.dark, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  coordBadge:  { flexDirection: 'row', alignItems: 'center', padding: 10, gap: 5, backgroundColor: C.surface },
  coordText:   { fontSize: 12, color: C.primary, fontWeight: '600' },
  card:        { backgroundColor: C.cardBg, marginHorizontal: 12, marginBottom: 10, padding: 16, borderRadius: 14, shadowColor: C.dark, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2 },
  sectionTitle:{ fontSize: 15, fontWeight: '700', color: C.textPrimary, marginBottom: 12 },
  infoRow:     { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.surface },
  infoLabel:   { fontSize: 11, color: C.textMuted, marginBottom: 3 },
  infoValue:   { fontSize: 14, color: C.textPrimary, fontWeight: '500' },
  updateBtn:   { flexDirection: 'row', backgroundColor: C.primary, marginHorizontal: 12, marginBottom: 10, padding: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 8 },
  updateBtnText:{ color: C.white, fontSize: 15, fontWeight: '700' },
  visitRow:    { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.surface },
  visitDot:    { width: 12, height: 12, borderRadius: 6, marginTop: 3, marginRight: 12 },
  visitStatus: { fontSize: 13, fontWeight: '600', color: C.textPrimary },
  visitDate:   { fontSize: 12, color: C.textMuted, marginTop: 2 },
  visitNotes:  { fontSize: 12, color: C.textSecond, marginTop: 4, fontStyle: 'italic' },
  statRow:     { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.surface },
  statLabel:   { fontSize: 14, color: C.textSecond },
  statValue:   { fontSize: 14, fontWeight: '600', color: C.primary },
  emptyText:   { fontSize: 14, color: C.textMuted, textAlign: 'center', paddingVertical: 20 },
  emptyVisit:  { alignItems: 'center', paddingVertical: 24, gap: 8 },
});
