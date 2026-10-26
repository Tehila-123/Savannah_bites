import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Lock,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
} from 'lucide-react-native';
import { COLORS } from '../constants/colors';
import { useCart } from '../context/CartContext';
import { useGoogleAuth } from '../context/GoogleAuthContext';
import { API_URL } from '../services/googleAuth';
import GoogleIcon from '../components/GoogleIcon';
import {
  RWANDA_CODE,
  RWANDA_FLAG,
  PHONE_LENGTH,
  PASSWORD_MIN_LENGTH,
  sanitizePhoneDigits,
  isValidRwandanPhone,
  formatRwandanPhone,
  getPasswordRules,
  getPasswordScore,
  isStrongPassword,
} from '../utils/validation';

export default function SignUpScreen({ navigation }) {
  const { setUser, showToast } = useCart();
  const { busy: googleBusy, error: googleError, signInWithGoogle, cancelGoogle } = useGoogleAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const pwRules = getPasswordRules(form.password);
  const pwScore = getPasswordScore(form.password);
  const phoneValid = isValidRwandanPhone(form.phone);
  const confirmMatches = form.confirm.length > 0 && form.confirm === form.password;

  async function handleSubmit() {
    if (saving) return;
    setError('');

    if (!form.name.trim()) return setError('Please enter your full name.');
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return setError('Please enter a valid email address.');
    if (!form.phone) return setError('Please enter your phone number.');
    if (!phoneValid) return setError('Enter a valid Rwandan number: 10 digits starting 072, 073, 078 or 079.');
    if (!isStrongPassword(form.password)) return setError('Your password does not meet the security requirements yet.');
    if (!confirmMatches) return setError('The two passwords do not match.');

    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: formatRwandanPhone(form.phone),
          password: form.password,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || 'Could not create your account.');
        setSaving(false);
        return;
      }
      setUser({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: formatRwandanPhone(form.phone),
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      });
      showToast('Welcome to Savanna Bites!');
      navigation.navigate('Main');
    } catch (err) {
      setError(`Could not reach the server at ${API_URL}.`);
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
            >
              <ArrowLeft size={18} color={COLORS.stone800} />
            </TouchableOpacity>
            <View style={styles.logoMini}>
              <Text style={styles.logoEmoji}>🔥</Text>
            </View>
            <View style={{ width: 36 }} />
          </View>

          {/* Heading */}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>🔥 WELCOME GIFT INCLUDED</Text>
          </View>
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>
            Join Savanna Bites and unlock{' '}
            <Text style={styles.highlight}>20% off</Text> your first Royal Feast.
          </Text>

          {/* Security banner */}
          <View style={styles.securityBanner}>
            <View style={styles.securityIcon}>
              <Text>🛡</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.securityTitleRow}>
                <Text style={styles.securityTitle}>Security Standard</Text>
                <Text style={styles.securityVerified}>✓ Verified</Text>
              </View>
              <Text style={styles.securityText}>
                {`Passwords need ${PASSWORD_MIN_LENGTH}+ characters with upper & lower case, a number, and a symbol.`}
              </Text>
            </View>
          </View>

          {/* Full Name */}
          <View style={styles.fieldGroup}>
            <View style={styles.fieldLabelRow}>
              <Text style={styles.label}>Full Name</Text>
              <Text style={styles.verified}>✓ Verified</Text>
            </View>
            <View style={styles.inputWrapper}>
              <User size={16} color={COLORS.stone400} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Amara Okafor"
                placeholderTextColor={COLORS.stone400}
                value={form.name}
                onChangeText={(v) => setForm({ ...form, name: v })}
                autoCapitalize="words"
              />
              {form.name.length > 0 && (
                <CheckCircle size={16} color={COLORS.emerald600} style={styles.inputIconRight} />
              )}
            </View>
          </View>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <View style={styles.fieldLabelRow}>
              <Text style={styles.label}>Email Address</Text>
              <Text style={styles.verified}>✓ Valid email</Text>
            </View>
            <View style={styles.inputWrapper}>
              <Mail size={16} color={COLORS.stone400} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="amara.okafor@savanna.co"
                placeholderTextColor={COLORS.stone400}
                value={form.email}
                onChangeText={(v) => setForm({ ...form, email: v })}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {form.email.includes('@') && (
                <CheckCircle size={16} color={COLORS.emerald600} style={styles.inputIconRight} />
              )}
            </View>
            <Text style={styles.fieldHint}>
              We'll send your food confirmation & royal rewards here.
            </Text>
          </View>

          {/* Phone */}
          <View style={styles.fieldGroup}>
            <View style={styles.fieldLabelRow}>
              <Text style={styles.label}>Phone Number</Text>
              {form.phone.length > 0 &&
                (phoneValid ? (
                  <Text style={styles.verified}>✓ Rwandan number</Text>
                ) : (
                  <Text style={styles.invalid}>Rwandan numbers only</Text>
                ))}
            </View>
            <View style={styles.phoneRow}>
              <View style={styles.countryCode}>
                <Text style={styles.countryCodeText}>{`${RWANDA_FLAG} ${RWANDA_CODE}`}</Text>
              </View>
              <View
                style={[
                  styles.inputWrapper,
                  { flex: 1 },
                  form.phone.length > 0 && !phoneValid && styles.inputWrapperError,
                ]}
              >
                <Phone size={16} color={COLORS.stone400} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="788123456"
                  placeholderTextColor={COLORS.stone400}
                  value={form.phone}
                  onChangeText={(v) =>
                    setForm({ ...form, phone: sanitizePhoneDigits(v) })
                  }
                  keyboardType="number-pad"
                  maxLength={PHONE_LENGTH}
                />
                {form.phone.length > 0 &&
                  (phoneValid ? (
                    <CheckCircle size={16} color={COLORS.emerald600} style={styles.inputIconRight} />
                  ) : (
                    <XCircle size={16} color="#DC2626" style={styles.inputIconRight} />
                  ))}
              </View>
            </View>
            <Text style={styles.fieldHint}>
              {`Rwandan mobile numbers only: ${PHONE_LENGTH} digits starting with 072, 073, 078 or 079.`}
            </Text>
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <View style={styles.fieldLabelRow}>
              <Text style={styles.label}>Password</Text>
              {form.password.length > 0 &&
                (pwScore === pwRules.length ? (
                  <Text style={styles.verified}>✓ Strong</Text>
                ) : (
                  <Text style={styles.invalid}>Too weak</Text>
                ))}
            </View>
            <View style={styles.inputWrapper}>
              <Lock size={16} color={COLORS.stone400} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Str0ng!Pass#2026"
                placeholderTextColor={COLORS.stone400}
                value={form.password}
                onChangeText={(v) => setForm({ ...form, password: v })}
                secureTextEntry={!showPw}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowPw(!showPw)}
                style={styles.inputIconRight}
              >
                {showPw ? (
                  <EyeOff size={16} color={COLORS.stone400} />
                ) : (
                  <Eye size={16} color={COLORS.stone400} />
                )}
              </TouchableOpacity>
            </View>
            <View style={styles.strengthRow}>
              {pwRules.map((rule, i) => (
                <View
                  key={rule.key}
                  style={[
                    styles.strengthBar,
                    {
                      backgroundColor:
                        form.password.length === 0
                          ? COLORS.stone200
                          : rule.ok
                          ? COLORS.primary
                          : COLORS.stone200,
                    },
                  ]}
                />
              ))}
            </View>
            <View style={styles.rulesBox}>
              {pwRules.map((rule) => (
                <View key={rule.key} style={styles.ruleRow}>
                  {rule.ok ? (
                    <CheckCircle size={13} color={COLORS.emerald600} />
                  ) : (
                    <XCircle size={13} color={COLORS.stone400} />
                  )}
                  <Text style={[styles.ruleText, rule.ok && styles.ruleTextOk]}>
                    {rule.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Confirm password */}
          <View style={styles.fieldGroup}>
            <View style={styles.fieldLabelRow}>
              <Text style={styles.label}>Confirm Password</Text>
              {form.confirm.length > 0 &&
                (confirmMatches ? (
                  <Text style={styles.verified}>✓ Matched</Text>
                ) : (
                  <Text style={styles.invalid}>No match</Text>
                ))}
            </View>
            <View style={styles.inputWrapper}>
              <Lock size={16} color={COLORS.stone400} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••••••••••"
                placeholderTextColor={COLORS.stone400}
                value={form.confirm}
                onChangeText={(v) => setForm({ ...form, confirm: v })}
                secureTextEntry={!showConfirm}
              />
              <TouchableOpacity
                onPress={() => setShowConfirm(!showConfirm)}
                style={styles.inputIconRight}
              >
                {showConfirm ? (
                  <EyeOff size={16} color={COLORS.stone400} />
                ) : (
                  <Eye size={16} color={COLORS.stone400} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.btnPrimary, saving && styles.btnBusy]}
            onPress={handleSubmit}
            activeOpacity={0.85}
            disabled={saving}
          >
            <Text style={styles.btnPrimaryText}>
              {saving ? 'Creating account...' : 'Create Account →'}
            </Text>
          </TouchableOpacity>

          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
              <Text style={styles.errorHint}>Backend: {API_URL}</Text>
            </View>
          )}

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={[styles.googleBtn, googleBusy && styles.googleBtnBusy]}
            onPress={signInWithGoogle}
            activeOpacity={0.85}
            disabled={googleBusy}
          >
            {googleBusy ? <ActivityIndicator size="small" color={COLORS.stone600} /> : <GoogleIcon />}
            <Text style={styles.googleText}>
              {googleBusy ? 'Waiting for Google...' : 'Continue with Google'}
            </Text>
          </TouchableOpacity>

          {googleBusy && (
            <TouchableOpacity style={styles.cancelRow} onPress={cancelGoogle}>
              <Text style={styles.cancelText}>Cancel and use another sign-up method</Text>
            </TouchableOpacity>
          )}

          {!!googleError && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{googleError}</Text>
              <Text style={styles.errorHint}>Backend: {API_URL}</Text>
            </View>
          )}

          {/* Promo */}
          <View style={styles.promoBanner}>
            <Text style={styles.promoEmoji}>🍲</Text>
            <Text style={styles.promoText}>
              Fresh handcrafted Suya, smoked jollof bowls, & fine hibiscus infusions freshly
              cooked upon ordering.
            </Text>
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 20, paddingBottom: 36 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.stone100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoMini: {
    width: 32,
    height: 32,
    backgroundColor: COLORS.stone900,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: { fontSize: 16 },

  badge: {
    backgroundColor: COLORS.amberLight,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 10,
  },
  badgeText: { fontSize: 10, fontWeight: '900', color: '#92400E', letterSpacing: 1 },
  title: { fontSize: 24, fontWeight: '900', color: COLORS.stone900, marginBottom: 6 },
  subtitle: { fontSize: 12, color: COLORS.stone600, lineHeight: 18, marginBottom: 14 },
  highlight: { fontWeight: '800', color: '#92400E' },

  securityBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: COLORS.emerald50,
    borderWidth: 1,
    borderColor: COLORS.emerald200,
    borderRadius: 16,
    padding: 12,
    marginBottom: 18,
  },
  securityIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.emerald600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  securityTitle: { fontSize: 11, fontWeight: '700', color: COLORS.stone900 },
  securityVerified: { fontSize: 10, fontWeight: '700', color: COLORS.emerald700 },
  securityText: { fontSize: 11, color: COLORS.stone600, lineHeight: 15 },

  fieldGroup: { marginBottom: 14 },
  fieldLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.stone800 },
  verified: { fontSize: 10, fontWeight: '700', color: COLORS.emerald700 },
  fieldHint: { fontSize: 10, color: COLORS.stone500, marginTop: 4 },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.stone200,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  inputIcon: { marginRight: 8 },
  inputIconRight: { marginLeft: 8 },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.stone900,
    paddingVertical: 10,
  },

  phoneRow: { flexDirection: 'row', gap: 8 },
  countryCode: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.stone200,
    borderRadius: 14,
    paddingHorizontal: 12,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  countryCodeText: { fontSize: 12, fontWeight: '700', color: COLORS.stone800 },

  strengthRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  strengthBar: { flex: 1, height: 5, borderRadius: 4 },

  rulesBox: { marginTop: 8, gap: 4 },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ruleText: { fontSize: 11, color: COLORS.stone500 },
  ruleTextOk: { color: COLORS.emerald700 },

  invalid: { fontSize: 10, fontWeight: '700', color: '#DC2626' },
  inputWrapperError: { borderColor: '#FCA5A5' },
  btnBusy: { opacity: 0.7 },

  btnPrimary: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 6,
  },
  btnPrimaryText: { color: COLORS.white, fontSize: 14, fontWeight: '800' },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 16,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.stone200 },
  dividerText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.stone400,
    letterSpacing: 1.5,
  },

  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.stone200,
    borderRadius: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  googleText: { fontSize: 14, fontWeight: '700', color: COLORS.stone800 },
  googleBtnBusy: { opacity: 0.7 },
  cancelRow: { alignItems: 'center', marginTop: 12 },
  cancelText: { fontSize: 11, color: COLORS.stone500, textDecorationLine: 'underline' },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  errorText: { fontSize: 12, color: '#991B1B', fontWeight: '600' },
  errorHint: { fontSize: 10, color: '#B91C1C', marginTop: 4 },

  promoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(254,243,199,0.5)',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 16,
    padding: 12,
    marginTop: 14,
    marginBottom: 6,
  },
  promoEmoji: { fontSize: 18 },
  promoText: { flex: 1, fontSize: 11, color: COLORS.stone600, lineHeight: 16 },

  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 14,
  },
  footerText: { fontSize: 12, color: COLORS.stone500 },
  footerLink: { fontSize: 12, fontWeight: '700', color: '#92400E' },
});
