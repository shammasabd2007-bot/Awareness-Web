import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { C } from '../theme/colors';

const showAlert = (title: string, msg: string) => {
  if (Platform.OS === 'web') { window.alert(`${title}\n\n${msg}`); }
  else { const { Alert } = require('react-native'); Alert.alert(title, msg); }
};

export default function LoginScreen() {
  const [isLogin, setIsLogin]           = useState(true);
  const [name, setName]                 = useState('');
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [loading, setLoading]           = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, register }             = useAuthStore();

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) { showAlert('Missing Fields', 'Please enter your email and password.'); return; }
    if (!isLogin && !name.trim())          { showAlert('Missing Name',   'Please enter your full name.');          return; }
    setLoading(true);
    try {
      if (isLogin) await login(email.trim(), password);
      else         await register(name.trim(), email.trim(), password);
    } catch (e: any) {
      showAlert('Error', e.message || 'Something went wrong. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={s.header}>
        <View style={s.logoCircle}>
          <Ionicons name="leaf" size={44} color={C.white} />
        </View>
        <Text style={s.appName}>Rural Connect</Text>
        <Text style={s.tagline}>Offline Digital Awareness & Mapping System</Text>
      </View>

      {/* Form card */}
      <View style={s.card}>
        <Text style={s.cardTitle}>{isLogin ? 'Sign In' : 'Create Account'}</Text>
        <Text style={s.cardSub}>{isLogin ? 'Welcome back! Sign in to continue.' : 'Register to start marking locations.'}</Text>

        {!isLogin && (
          <View style={s.field}>
            <Text style={s.label}>Full Name</Text>
            <View style={s.inputRow}>
              <Ionicons name="person-outline" size={18} color={C.textMuted} style={s.inputIcon} />
              <TextInput style={s.input} placeholder="Your full name" placeholderTextColor={C.textMuted} value={name} onChangeText={setName} autoCapitalize="words" editable={!loading} />
            </View>
          </View>
        )}

        <View style={s.field}>
          <Text style={s.label}>Email Address</Text>
          <View style={s.inputRow}>
            <Ionicons name="mail-outline" size={18} color={C.textMuted} style={s.inputIcon} />
            <TextInput style={s.input} placeholder="you@example.com" placeholderTextColor={C.textMuted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} editable={!loading} />
          </View>
        </View>

        <View style={s.field}>
          <Text style={s.label}>Password</Text>
          <View style={s.inputRow}>
            <Ionicons name="lock-closed-outline" size={18} color={C.textMuted} style={s.inputIcon} />
            <TextInput style={[s.input, { flex: 1 }]} placeholder="••••••••" placeholderTextColor={C.textMuted} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} editable={!loading} />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={s.eyeBtn}>
              <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={C.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={[s.submitBtn, loading && s.submitBtnOff]} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
          {loading ? <ActivityIndicator color={C.white} /> : (
            <>
              <Ionicons name={isLogin ? 'log-in-outline' : 'person-add-outline'} size={20} color={C.white} />
              <Text style={s.submitText}>{isLogin ? 'Sign In' : 'Create Account'}</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={s.toggleRow}>
          <Text style={s.toggleText}>{isLogin ? "Don't have an account?" : 'Already have an account?'}</Text>
          <TouchableOpacity onPress={() => { setIsLogin(!isLogin); setName(''); setEmail(''); setPassword(''); }}>
            <Text style={s.toggleLink}>{isLogin ? ' Register' : ' Sign In'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Roles info */}
      <View style={s.rolesCard}>
        <Text style={s.rolesTitle}>User Roles</Text>
        {[
          { icon: 'person-outline',           color: C.primary,   label: 'User',      desc: '— Mark new low-awareness locations' },
          { icon: 'walk-outline',             color: C.secondary, label: 'Volunteer', desc: '— Visit & update location status' },
          { icon: 'shield-checkmark-outline', color: C.accent,    label: 'Admin',     desc: '— Full access & analytics dashboard' },
        ].map((r) => (
          <View key={r.label} style={s.roleRow}>
            <Ionicons name={r.icon as any} size={16} color={r.color} />
            <Text style={s.roleText}><Text style={s.roleName}>{r.label}</Text> {r.desc}</Text>
          </View>
        ))}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content:   { paddingBottom: 20 },
  header: {
    backgroundColor: C.primary, alignItems: 'center',
    paddingTop: 60, paddingBottom: 36, paddingHorizontal: 24,
  },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 14, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
  },
  appName:  { fontSize: 28, fontWeight: '800', color: C.white, letterSpacing: 0.5 },
  tagline:  { fontSize: 13, color: C.secondary, marginTop: 6, textAlign: 'center' },
  card: {
    backgroundColor: C.cardBg, marginHorizontal: 16, marginTop: -20,
    borderRadius: 16, padding: 24,
    shadowColor: C.dark, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 12, elevation: 5,
  },
  cardTitle: { fontSize: 20, fontWeight: '700', color: C.textPrimary, marginBottom: 4 },
  cardSub:   { fontSize: 13, color: C.textSecond, marginBottom: 22 },
  field:     { marginBottom: 18 },
  label:     { fontSize: 13, fontWeight: '600', color: C.textPrimary, marginBottom: 7 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: C.border,
    borderRadius: 10, backgroundColor: C.surface, paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  input:     { flex: 1, paddingVertical: 12, fontSize: 15, color: C.textPrimary },
  eyeBtn:    { padding: 6 },
  submitBtn: {
    flexDirection: 'row', backgroundColor: C.primary,
    borderRadius: 10, paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center',
    gap: 8, marginTop: 4, marginBottom: 18,
  },
  submitBtnOff: { opacity: 0.6 },
  submitText:   { color: C.white, fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  toggleRow:    { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  toggleText:   { fontSize: 14, color: C.textSecond },
  toggleLink:   { fontSize: 14, color: C.primary, fontWeight: '700' },
  rolesCard: {
    backgroundColor: C.cardBg, marginHorizontal: 16, marginTop: 16,
    borderRadius: 14, padding: 18,
    shadowColor: C.dark, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  rolesTitle: {
    fontSize: 13, fontWeight: '700', color: C.textSecond,
    marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.8,
  },
  roleRow:  { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 10 },
  roleText: { fontSize: 13, color: C.textSecond, flex: 1, lineHeight: 19 },
  roleName: { fontWeight: '700', color: C.textPrimary },
});
