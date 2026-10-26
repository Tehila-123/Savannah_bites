import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, StatusBar, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Mail, Lock, ChevronRight, Eye, EyeOff, Flame, User } from 'lucide-react-native';
import { COLORS } from '../constants/colors';
import { useCart } from '../context/CartContext';
import { useGoogleAuth } from '../context/GoogleAuthContext';
import GoogleIcon from '../components/GoogleIcon';
import { API_URL } from '../services/googleAuth';

export default function SignInScreen({ navigation }) {
  const { setUser } = useCart();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const { busy: googleBusy, error: googleError, signInWithGoogle, cancelGoogle } = useGoogleAuth();

  function handleSubmit() {
    if (!form.email || !form.password) return;
    setUser({
      name: form.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      email: form.email,
      phone: '+234 801 234 5678',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    });
    navigation.navigate('Main');
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View style={s.header}>
            <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
              <ArrowLeft size={18} color={COLORS.stone800} />
            </TouchableOpacity>
            <View style={s.brandPill}>
              <Text style={s.brandText}>Savanna Bites</Text>
              <View style={s.brandIcon}><User size={12} color={COLORS.white} /></View>
            </View>
          </View>

          <View style={s.badge}>
            <Text style={s.badgeText}>CULINARY MEMBERSHIP</Text>
          </View>

          <Text style={s.title}>Welcome back!</Text>
          <Text style={s.subtitle}>
            Sign in to access your saved feasts, loyalty points, and quick re-orders.
          </Text>

          {/* Spice points card */}
          <View style={s.pointsCard}>
            <View style={s.pointsIcon}><Flame size={20} color={COLORS.white} fill={COLORS.white} /></View>
            <View>
              <Text style={s.pointsTitle}>240 Spice Points ✦</Text>
              <Text style={s.pointsSub}>Waiting in your account for your next feast...</Text>
            </View>
          </View>

          {/* Email */}
          <View style={s.fieldGroup}>
            <View style={s.labelRow}>
              <Text style={s.label}>Email Address</Text>
              <Text style={s.labelHint}>Primary contact</Text>
            </View>
            <View style={s.inputBox}>
              <Mail size={16} color={COLORS.stone400} style={s.icoLeft} />
              <TextInput
                style={s.input}
                placeholder="amara.okafor@email.com"
                placeholderTextColor={COLORS.stone400}
                value={form.email}
                onChangeText={v => setForm({ ...form, email: v })}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Password */}
          <View style={s.fieldGroup}>
            <Text style={s.label}>Password</Text>
            <View style={s.inputBox}>
              <Lock size={16} color={COLORS.stone400} style={s.icoLeft} />
              <TextInput
                style={s.input}
                placeholder="••••••••••••••••"
                placeholderTextColor={COLORS.stone400}
                value={form.password}
                onChangeText={v => setForm({ ...form, password: v })}
                secureTextEntry={!showPw}
              />
              <TouchableOpacity onPress={() => setShowPw(!showPw)} style={s.icoRight}>
                {showPw ? <EyeOff size={16} color={COLORS.stone400} /> : <Eye size={16} color={COLORS.stone400} />}
              </TouchableOpacity>
            </View>
          </View>

          {/* Remember / Forgot */}
          <View style={s.rememberRow}>
            <TouchableOpacity style={s.checkRow} onPress={() => setRememberMe(!rememberMe)}>
              <View style={[s.checkbox, rememberMe && s.checkboxActive]}>
                {rememberMe && <Text style={s.checkMark}>✓</Text>}
              </View>
              <Text style={s.rememberText}>Remember me</Text>
            </TouchableOpacity>
            <Text style={s.forgotText}>Forgot Password?</Text>
          </View>

          <TouchableOpacity style={s.btnPrimary} onPress={handleSubmit} activeOpacity={0.85}>
            <Text style={s.btnPrimaryText}>Sign In</Text>
            <ChevronRight size={16} color={COLORS.white} />
          </TouchableOpacity>

          {/* Divider */}
          <View style={s.divider}>
            <View style={s.divLine} />
            <Text style={s.divText}>OR</Text>
            <View style={s.divLine} />
          </View>

          <TouchableOpacity
            style={[s.googleBtn, googleBusy && s.googleBtnBusy]}
            onPress={signInWithGoogle}
            activeOpacity={0.85}
            disabled={googleBusy}
          >
            {googleBusy
              ? <ActivityIndicator size="small" color={COLORS.stone600} />
              : <GoogleIcon />}
            <Text style={s.googleText}>
              {googleBusy ? 'Waiting for Google...' : 'Continue with Google'}
            </Text>
          </TouchableOpacity>

          {googleBusy && (
            <TouchableOpacity style={s.cancelRow} onPress={cancelGoogle}>
              <Text style={s.cancelText}>Cancel and use another sign-in method</Text>
            </TouchableOpacity>
          )}

          {!!googleError && (
            <View style={s.errorBox}>
              <Text style={s.errorText}>{googleError}</Text>
              <Text style={s.errorHint}>Backend: {API_URL}</Text>
            </View>
          )}

          <View style={s.footerRow}>
            <Text style={s.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={s.footerLink}>Create Account</Text>
            </TouchableOpacity>
          </View>

          <View style={s.tagRow}>
            <View style={s.tag}><Text style={s.tagText}>🌿 Authentic Spices</Text></View>
            <View style={s.tag}><Text style={s.tagText}>👨‍🍳 Chef Curated</Text></View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 20, paddingBottom: 36 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.stone100, alignItems: 'center', justifyContent: 'center' },
  brandPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  brandText: { fontSize: 12, fontWeight: '700', color: COLORS.white },
  brandIcon: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#C86D33', alignItems: 'center', justifyContent: 'center' },
  badge: { backgroundColor: COLORS.amberLight, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginBottom: 10 },
  badgeText: { fontSize: 10, fontWeight: '900', color: '#92400E', letterSpacing: 1.5 },
  title: { fontSize: 30, fontWeight: '900', color: COLORS.stone900, marginBottom: 6 },
  subtitle: { fontSize: 12, color: COLORS.stone500, lineHeight: 18, marginBottom: 18 },
  pointsCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(254,243,199,0.6)', borderWidth: 1, borderColor: '#FDE68A', borderRadius: 16, padding: 14, marginBottom: 22 },
  pointsIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.warm, alignItems: 'center', justifyContent: 'center' },
  pointsTitle: { fontSize: 13, fontWeight: '900', color: COLORS.stone900, marginBottom: 2 },
  pointsSub: { fontSize: 11, color: COLORS.stone600 },
  fieldGroup: { marginBottom: 14 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.stone800, marginBottom: 4 },
  labelHint: { fontSize: 10, color: COLORS.stone400 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.stone200, borderRadius: 14, paddingHorizontal: 12, elevation: 1 },
  icoLeft: { marginRight: 8 },
  icoRight: { marginLeft: 8 },
  input: { flex: 1, fontSize: 14, color: COLORS.stone900, paddingVertical: 12 },
  rememberRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, borderColor: COLORS.stone300, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  checkMark: { color: COLORS.white, fontSize: 11, fontWeight: '800' },
  rememberText: { fontSize: 12, color: COLORS.stone700 },
  forgotText: { fontSize: 12, fontWeight: '700', color: '#92400E' },
  btnPrimary: { backgroundColor: COLORS.primary, borderRadius: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, elevation: 4, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  btnPrimaryText: { color: COLORS.white, fontSize: 14, fontWeight: '800' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 18 },
  divLine: { flex: 1, height: 1, backgroundColor: COLORS.stone200 },
  divText: { fontSize: 10, fontWeight: '700', color: COLORS.stone400, letterSpacing: 1.5 },
  googleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.stone200, borderRadius: 16, paddingVertical: 14, elevation: 1 },
  googleBtnBusy: { opacity: 0.7 },
  cancelRow: { alignItems: 'center', marginTop: 12 },
  cancelText: { fontSize: 11, color: COLORS.stone500, textDecorationLine: 'underline' },
  errorBox: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 12, padding: 12, marginTop: 12 },
  errorText: { fontSize: 12, color: '#991B1B', fontWeight: '600' },
  errorHint: { fontSize: 10, color: '#B91C1C', marginTop: 4 },
  googleText: { fontSize: 14, fontWeight: '700', color: COLORS.stone800 },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { fontSize: 12, color: COLORS.stone500 },
  footerLink: { fontSize: 12, fontWeight: '700', color: '#92400E' },
  tagRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: COLORS.stone200 },
  tag: { backgroundColor: COLORS.stone100, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  tagText: { fontSize: 10, fontWeight: '700', color: COLORS.stone700 },
});
