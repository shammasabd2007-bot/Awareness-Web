import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Platform, Image,
  Modal, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocationStore } from '../store/locationStore';
import { useAuthStore } from '../store/authStore';
import { C } from '../theme/colors';
import WebCamera from '../components/WebCamera';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: 'in_progress', label: '🟡 In Progress', description: 'Visit has started' },
  { value: 'completed',   label: '🟢 Completed',   description: 'Visit fully completed' },
];

/** Awareness categories — what kind of digital awareness is being addressed */
const AWARENESS_CATEGORIES = [
  { value: 'healthcare',        label: '🏥 Healthcare',         desc: 'Telemedicine, health records, online appointments' },
  { value: 'education',         label: '📚 Education',          desc: 'Online learning, digital classrooms, e-resources' },
  { value: 'govt_schemes',      label: '🏛️ Govt Schemes',       desc: 'e-Governance, online applications, digital ID' },
  { value: 'agriculture',       label: '🌾 Agriculture',        desc: 'Digital farming tools, market prices, e-commerce' },
  { value: 'financial',         label: '💳 Financial Literacy', desc: 'Digital banking, UPI, online payments' },
  { value: 'infrastructure',    label: '🏗️ Infrastructure',     desc: 'Internet access, device availability, connectivity' },
  { value: 'women_empowerment', label: '👩 Women Empowerment',  desc: 'Digital skills for women, safety apps, SHG tools' },
  { value: 'youth_skills',      label: '🎓 Youth Skills',       desc: 'Coding, digital jobs, online freelancing' },
  { value: 'disaster_mgmt',     label: '🚨 Disaster Mgmt',      desc: 'Emergency alerts, relief apps, early warning systems' },
  { value: 'other',             label: '📌 Other',              desc: 'Any other digital awareness need' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const showAlert = (t: string, m: string) => {
  if (Platform.OS === 'web') window.alert(`${t}\n\n${m}`);
  else { const { Alert } = require('react-native'); Alert.alert(t, m); }
};

// ─── Gallery picker for web (file input) ─────────────────────────────────────
const pickFromGalleryWeb = (): Promise<string | null> =>
  new Promise((resolve) => {
    const input = document.createElement('input');
    input.type   = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file: File = e.target.files?.[0];
      if (!file) { resolve(null); return; }
      const reader = new FileReader();
      reader.onload = (ev) => resolve((ev.target?.result as string) ?? null);
      reader.readAsDataURL(file);
    };
    input.click();
  });

// ─── Component ────────────────────────────────────────────────────────────────

export default function StatusUpdateScreen({ route, navigation }: any) {
  const { locationId }     = route.params;
  const { user }           = useAuthStore();
  const { addVisitRecord } = useLocationStore();

  const [selected, setSelected]           = useState('in_progress');
  const [notes, setNotes]                 = useState('');
  const [photos, setPhotos]               = useState<string[]>([]);
  const [awarenessCategory, setAwareness] = useState<string>('');
  const [loading, setLoading]             = useState(false);
  const [photoLoading, setPhotoLoading]   = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showWebCamera, setShowWebCamera] = useState(false);   // web camera modal

  const role    = user?.role ?? 'volunteer';
  const isAdmin = role === 'admin';

  const pointsInfo = isAdmin ? null
    : role === 'volunteer'
      ? [{ action: 'Mark a location', pts: 30 }, { action: 'Set In Progress', pts: 30 }, { action: 'Mark as Completed', pts: 50 }]
      : [{ action: 'Mark a location', pts: 50 }];

  // ── Photo handlers ──────────────────────────────────────────────────────────

  /** Take Photo — opens WebCamera on web, native camera on device */
  const handleTakePhoto = async () => {
    if (Platform.OS === 'web') {
      // Open the full-screen WebCamera modal
      setShowWebCamera(true);
    } else {
      setPhotoLoading(true);
      try {
        const ImagePicker = await import('expo-image-picker');
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          showAlert('Permission Denied', 'Camera permission is required to take photos.');
          return;
        }
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
        if (!result.canceled && result.assets?.[0]?.uri) {
          setPhotos((prev) => [...prev, result.assets[0].uri]);
        }
      } catch {
        showAlert('Error', 'Failed to open camera. Please try again.');
      } finally {
        setPhotoLoading(false);
      }
    }
  };

  /** Called by WebCamera when user taps the shutter */
  const handleWebCameraCapture = (dataUri: string) => {
    setShowWebCamera(false);
    setPhotos((prev) => [...prev, dataUri]);
  };

  /** Pick from Gallery */
  const handlePickGallery = async () => {
    setPhotoLoading(true);
    try {
      if (Platform.OS === 'web') {
        const uri = await pickFromGalleryWeb();
        if (uri) setPhotos((prev) => [...prev, uri]);
      } else {
        const ImagePicker = await import('expo-image-picker');
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          showAlert('Permission Denied', 'Gallery permission is required to select photos.');
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
        if (!result.canceled && result.assets?.[0]?.uri) {
          setPhotos((prev) => [...prev, result.assets[0].uri]);
        }
      }
    } catch {
      showAlert('Error', 'Failed to pick photo. Please try again.');
    } finally {
      setPhotoLoading(false);
    }
  };

  const removePhoto = (index: number) =>
    setPhotos((prev) => prev.filter((_, i) => i !== index));

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!user) { showAlert('Error', 'User not authenticated.'); return; }
    if (!awarenessCategory) {
      showAlert('Missing Category', 'Please select an awareness category before submitting.');
      return;
    }
    setLoading(true);
    try {
      // Append awareness category to notes for storage
      const fullNotes = awarenessCategory
        ? `[Awareness: ${AWARENESS_CATEGORIES.find((c) => c.value === awarenessCategory)?.label ?? awarenessCategory}]\n${notes}`.trim()
        : notes;

      await addVisitRecord(locationId, user.id, selected, fullNotes, photos);

      if (Platform.OS === 'web') {
        window.alert('✅ Status updated successfully!');
        navigation.goBack();
      } else {
        const { Alert } = require('react-native');
        Alert.alert('Success', 'Status updated successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (e: any) {
      showAlert('Error', e.message || 'Failed to update status.');
    } finally {
      setLoading(false);
    }
  };

  // ── Selected category label ─────────────────────────────────────────────────
  const selectedCat = AWARENESS_CATEGORIES.find((c) => c.value === awarenessCategory);

  return (
    <ScrollView style={s.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

      {/* ── Header ── */}
      <View style={s.header}>
        <Ionicons name="pencil" size={36} color={C.white} />
        <Text style={s.headerTitle}>Update Visit Status</Text>
        <Text style={s.headerSub}>Record your visit, evidence & awareness type</Text>
      </View>

      {/* ══════════════════════════════════════════════════════
          1. STATUS SELECTION
      ══════════════════════════════════════════════════════ */}
      <View style={s.card}>
        <Text style={s.sectionLabel}>
          <Text style={s.required}>* </Text>Visit Status
        </Text>
        <View style={s.optionsList}>
          {STATUS_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[s.optionRow, selected === opt.value && s.optionRowActive]}
              onPress={() => setSelected(opt.value)}
              disabled={loading}
              activeOpacity={0.75}
            >
              <View style={{ flex: 1 }}>
                <Text style={[s.optionLabel, selected === opt.value && s.optionLabelActive]}>
                  {opt.label}
                </Text>
                <Text style={s.optionDesc}>{opt.description}</Text>
              </View>
              {selected === opt.value && (
                <Ionicons name="checkmark-circle" size={22} color={C.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ══════════════════════════════════════════════════════
          2. AWARENESS CATEGORY
      ══════════════════════════════════════════════════════ */}
      <View style={s.card}>
        <Text style={s.sectionLabel}>
          <Text style={s.required}>* </Text>Awareness Category
        </Text>
        <Text style={s.sectionHint}>
          Select the type of digital awareness being addressed at this location
        </Text>

        <TouchableOpacity
          style={[s.categorySelector, awarenessCategory && s.categorySelectorFilled]}
          onPress={() => setShowCategoryModal(true)}
          activeOpacity={0.8}
        >
          {selectedCat ? (
            <View style={s.categorySelectorContent}>
              <Text style={s.categorySelectorLabel}>{selectedCat.label}</Text>
              <Text style={s.categorySelectorDesc} numberOfLines={1}>{selectedCat.desc}</Text>
            </View>
          ) : (
            <Text style={s.categorySelectorPlaceholder}>Tap to select awareness category…</Text>
          )}
          <Ionicons
            name={awarenessCategory ? 'checkmark-circle' : 'chevron-down'}
            size={20}
            color={awarenessCategory ? C.primary : C.textMuted}
          />
        </TouchableOpacity>
      </View>

      {/* ══════════════════════════════════════════════════════
          3. EVIDENCE PHOTOS
      ══════════════════════════════════════════════════════ */}
      <View style={s.card}>
        <Text style={s.sectionLabel}>📸 Evidence Photos</Text>
        <Text style={s.sectionHint}>
          Add photos to document your visit — before/after, sessions, signage, etc.
        </Text>

        {/* Photo action buttons */}
        <View style={s.photoButtons}>
          <TouchableOpacity
            style={[s.photoBtn, s.photoBtnCamera]}
            onPress={handleTakePhoto}
            disabled={photoLoading || loading}
            activeOpacity={0.8}
          >
            {photoLoading ? (
              <ActivityIndicator size="small" color={C.white} />
            ) : (
              <>
                <Ionicons name="camera" size={22} color={C.white} />
                <Text style={s.photoBtnText}>Take Photo</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.photoBtn, s.photoBtnGallery]}
            onPress={handlePickGallery}
            disabled={photoLoading || loading}
            activeOpacity={0.8}
          >
            {photoLoading ? (
              <ActivityIndicator size="small" color={C.primary} />
            ) : (
              <>
                <Ionicons name="images" size={22} color={C.primary} />
                <Text style={[s.photoBtnText, { color: C.primary }]}>From Gallery</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Photo count badge */}
        {photos.length > 0 && (
          <View style={s.photoCountRow}>
            <Ionicons name="checkmark-circle" size={16} color={C.success} />
            <Text style={s.photoCountText}>
              {photos.length} photo{photos.length !== 1 ? 's' : ''} added
            </Text>
          </View>
        )}

        {/* Photo previews grid */}
        {photos.length > 0 && (
          <View style={s.photoGrid}>
            {photos.map((uri, index) => (
              <View key={index} style={s.photoThumb}>
                <Image source={{ uri }} style={s.photoThumbImg} resizeMode="cover" />
                {/* Remove button */}
                <TouchableOpacity
                  style={s.photoRemoveBtn}
                  onPress={() => removePhoto(index)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Ionicons name="close-circle" size={22} color="#E05C7A" />
                </TouchableOpacity>
                {/* Index label */}
                <View style={s.photoIndexBadge}>
                  <Text style={s.photoIndexText}>{index + 1}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Empty state */}
        {photos.length === 0 && (
          <View style={s.photoEmpty}>
            <Ionicons name="camera-outline" size={36} color={C.textMuted} />
            <Text style={s.photoEmptyText}>No photos added yet</Text>
            <Text style={s.photoEmptyHint}>Photos serve as proof of your visit</Text>
          </View>
        )}
      </View>

      {/* ══════════════════════════════════════════════════════
          4. VISIT NOTES
      ══════════════════════════════════════════════════════ */}
      <View style={s.card}>
        <Text style={s.sectionLabel}>📝 Visit Notes (Optional)</Text>
        <TextInput
          style={s.textArea}
          placeholder="Describe what you observed, actions taken, challenges faced, people reached…"
          placeholderTextColor={C.textMuted}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={5}
          editable={!loading}
        />
      </View>

      {/* ══════════════════════════════════════════════════════
          5. POINTS INFO
      ══════════════════════════════════════════════════════ */}
      {!isAdmin && pointsInfo && (
        <View style={s.pointsBox}>
          <View style={s.pointsBoxHeader}>
            <Ionicons name="star" size={18} color="#F57C00" />
            <Text style={s.pointsBoxTitle}>Points You Earn</Text>
          </View>
          {pointsInfo.map((p) => (
            <View key={p.action} style={s.pointsRow}>
              <Text style={s.pointsAction}>{p.action}</Text>
              <View style={s.pointsBadge}>
                <Text style={s.pointsBadgeText}>+{p.pts} pts</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* ══════════════════════════════════════════════════════
          6. SUBMIT
      ══════════════════════════════════════════════════════ */}
      {/* Validation hint */}
      {!awarenessCategory && (
        <View style={s.validationHint}>
          <Ionicons name="information-circle-outline" size={16} color={C.primary} />
          <Text style={s.validationHintText}>Please select an awareness category to submit</Text>
        </View>
      )}

      <TouchableOpacity
        style={[s.submitBtn, (loading || !awarenessCategory) && s.submitBtnOff]}
        onPress={handleSubmit}
        disabled={loading || !awarenessCategory}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color={C.white} />
        ) : (
          <>
            <Ionicons name="checkmark-circle" size={20} color={C.white} />
            <Text style={s.submitText}>Update Status</Text>
            {photos.length > 0 && (
              <View style={s.submitPhotoBadge}>
                <Text style={s.submitPhotoBadgeText}>{photos.length} 📸</Text>
              </View>
            )}
          </>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />

      {/* ── Web Camera modal ── */}
      {Platform.OS === 'web' && (
        <WebCamera
          visible={showWebCamera}
          onCapture={handleWebCameraCapture}
          onClose={() => setShowWebCamera(false)}
        />
      )}

      {/* ══════════════════════════════════════════════════════
          AWARENESS CATEGORY MODAL
      ══════════════════════════════════════════════════════ */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={m.backdrop}>
          <View style={m.sheet}>
            {/* Modal header */}
            <View style={m.sheetHeader}>
              <Text style={m.sheetTitle}>Select Awareness Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)} style={m.closeBtn}>
                <Ionicons name="close" size={22} color={C.textSecond} />
              </TouchableOpacity>
            </View>
            <Text style={m.sheetSub}>
              What type of digital awareness is being addressed at this location?
            </Text>

            {/* Category list */}
            <FlatList
              data={AWARENESS_CATEGORIES}
              keyExtractor={(item) => item.value}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
              renderItem={({ item }) => {
                const isSelected = awarenessCategory === item.value;
                return (
                  <TouchableOpacity
                    style={[m.catRow, isSelected && m.catRowSelected]}
                    onPress={() => { setAwareness(item.value); setShowCategoryModal(false); }}
                    activeOpacity={0.75}
                  >
                    <View style={[m.catIconBox, isSelected && m.catIconBoxSelected]}>
                      <Text style={m.catEmoji}>{item.label.split(' ')[0]}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[m.catLabel, isSelected && m.catLabelSelected]}>
                        {item.label.split(' ').slice(1).join(' ')}
                      </Text>
                      <Text style={m.catDesc} numberOfLines={2}>{item.desc}</Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={22} color={C.primary} />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: C.bg },

  /* Header */
  header:      { backgroundColor: C.primary, padding: 20, paddingTop: 44, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: C.white, marginTop: 8 },
  headerSub:   { fontSize: 13, color: C.secondary, marginTop: 4, textAlign: 'center' },

  /* Card */
  card: {
    backgroundColor: C.cardBg, marginHorizontal: 12, marginTop: 12, padding: 16,
    borderRadius: 14, shadowColor: C.dark, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
  },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: C.textPrimary, marginBottom: 4 },
  sectionHint:  { fontSize: 12, color: C.textMuted, marginBottom: 12 },
  required:     { color: C.danger, fontWeight: '800' },

  /* Status options */
  optionsList:      { gap: 10 },
  optionRow:        { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 10, backgroundColor: C.surface, borderWidth: 2, borderColor: C.border },
  optionRowActive:  { backgroundColor: C.primaryLight, borderColor: C.primary },
  optionLabel:      { fontSize: 15, fontWeight: '600', color: C.textPrimary },
  optionLabelActive:{ color: C.primary },
  optionDesc:       { fontSize: 12, color: C.textMuted, marginTop: 2 },

  /* Category selector */
  categorySelector: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 2, borderColor: C.border, borderRadius: 12,
    padding: 14, backgroundColor: C.surface,
  },
  categorySelectorFilled: { borderColor: C.primary, backgroundColor: C.primaryLight },
  categorySelectorContent:{ flex: 1 },
  categorySelectorLabel:  { fontSize: 14, fontWeight: '700', color: C.primary },
  categorySelectorDesc:   { fontSize: 12, color: C.textSecond, marginTop: 2 },
  categorySelectorPlaceholder: { flex: 1, fontSize: 14, color: C.textMuted },

  /* Photo buttons */
  photoButtons: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  photoBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 13, borderRadius: 12, gap: 8,
  },
  photoBtnCamera:  { backgroundColor: C.primary },
  photoBtnGallery: { backgroundColor: C.surface, borderWidth: 2, borderColor: C.primary },
  photoBtnText:    { fontSize: 14, fontWeight: '700', color: C.white },

  /* Photo count */
  photoCountRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  photoCountText:{ fontSize: 13, color: C.success, fontWeight: '600' },

  /* Photo grid */
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoThumb: {
    width: '47%', aspectRatio: 1.2, borderRadius: 10,
    overflow: 'visible', position: 'relative',
  },
  photoThumbImg: {
    width: '100%', height: '100%', borderRadius: 10,
    borderWidth: 2, borderColor: C.border,
  },
  photoRemoveBtn: {
    position: 'absolute', top: -8, right: -8,
    backgroundColor: C.white, borderRadius: 12, zIndex: 10,
  },
  photoIndexBadge: {
    position: 'absolute', bottom: 6, left: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8,
  },
  photoIndexText: { fontSize: 11, color: C.white, fontWeight: '700' },

  /* Photo empty */
  photoEmpty:     { alignItems: 'center', paddingVertical: 24 },
  photoEmptyText: { fontSize: 14, color: C.textMuted, marginTop: 8, fontWeight: '600' },
  photoEmptyHint: { fontSize: 12, color: C.textMuted, marginTop: 4 },

  /* Notes */
  textArea: {
    borderWidth: 1.5, borderColor: C.border, borderRadius: 10, padding: 12,
    fontSize: 14, color: C.textPrimary, textAlignVertical: 'top',
    minHeight: 110, backgroundColor: C.surface,
  },

  /* Points */
  pointsBox:       { backgroundColor: '#FFF8E1', marginHorizontal: 12, marginTop: 12, padding: 16, borderRadius: 14, borderLeftWidth: 4, borderLeftColor: '#F57C00' },
  pointsBoxHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  pointsBoxTitle:  { fontSize: 14, fontWeight: '700', color: '#E65100' },
  pointsRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#FFE082' },
  pointsAction:    { fontSize: 13, color: C.textSecond },
  pointsBadge:     { backgroundColor: '#F57C00', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  pointsBadgeText: { fontSize: 12, fontWeight: '700', color: C.white },

  /* Validation hint */
  validationHint: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 12, marginTop: 12,
    backgroundColor: C.primaryLight, padding: 12, borderRadius: 10,
  },
  validationHintText: { fontSize: 13, color: C.primary, fontWeight: '600', flex: 1 },

  /* Submit */
  submitBtn: {
    flexDirection: 'row', backgroundColor: C.primary,
    marginHorizontal: 12, marginTop: 14, padding: 16,
    borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  submitBtnOff:       { opacity: 0.45 },
  submitText:         { color: C.white, fontSize: 16, fontWeight: '700' },
  submitPhotoBadge:   { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  submitPhotoBadgeText: { fontSize: 12, color: C.white, fontWeight: '700' },
});

/* ── Modal styles ── */
const m = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: C.cardBg,
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
    maxHeight: '80%', paddingBottom: 20,
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 6,
  },
  sheetTitle: { fontSize: 17, fontWeight: '800', color: C.textPrimary },
  closeBtn:   { padding: 4 },
  sheetSub:   { fontSize: 13, color: C.textSecond, paddingHorizontal: 20, marginBottom: 14 },

  catRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: C.surface,
  },
  catRowSelected: { backgroundColor: C.primaryLight },
  catIconBox: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: C.surface,
    justifyContent: 'center', alignItems: 'center',
  },
  catIconBoxSelected: { backgroundColor: C.secondary },
  catEmoji:           { fontSize: 22 },
  catLabel:           { fontSize: 14, fontWeight: '700', color: C.textPrimary },
  catLabelSelected:   { color: C.primary },
  catDesc:            { fontSize: 12, color: C.textMuted, marginTop: 2, lineHeight: 17 },
});
