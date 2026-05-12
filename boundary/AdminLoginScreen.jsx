// AdminLoginScreen.jsx — UC #98 System Admin – Log In
//                        UC #99 System Admin – Log Out (receives showLogoutBanner param)
//
// Design matches login.png exactly:
//   - BiteWise NavBar header (fork icon + BiteWise text + hamburger)
//   - White card: purple shield circle, "System Admin" title,
//     "Secure access to BiteWise administration" subtitle,
//     Username field (person icon), Password field (lock icon),
//     Purple gradient "Login to Admin Panel" button
//     NO demo credentials tile (per product spec)
//     "← Back to Home" link at bottom
//   - Green "Logged out successfully" banner when arriving from logout (UC #99)

import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, KeyboardAvoidingView, Platform, Image} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AdminLoginController from '../controller/AdminLoginController';

const ctrl = new AdminLoginController();

const C = {
  purple:       '#7C3AED',
  purpleDark:   '#5B21B6',
  dark:         '#111827',
  mid:          '#374151',
  subtle:       '#6B7280',
  white:        '#FFFFFF',
  border:       '#E5E7EB',
  bg:           '#F9FAFB',
  errorText:    '#DC2626',
  errorBg:      '#FEF2F2',
  errorBorder:  '#FECACA',
  successBg:    '#F0FDF4',
  successBorder:'#BBF7D0',
  successText:  '#15803D',
};

// ── NavBar ────────────────────────────────────────────────────────────────────
const NavBar = ({ onBackPress }) => (
  <View style={nav.bar}>
    <View style={nav.brand}>
      <Image source={require('../assets/BiteWiseLogo.png')} style={nav.logo} />
      <Text style={nav.brandName}>BiteWise</Text>
    </View>
    <View style={{ width: 32 }} />
  </View>
);
const nav = StyleSheet.create({
  bar:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  brand:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  icon:      { fontSize: 20 },
  logo:      { width: 24, height: 24, resizeMode: 'contain' },
  brandName: { fontSize: 20, fontWeight: '800', color: C.dark, letterSpacing: -0.3 },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
const AdminLoginScreen = ({ navigation, route }) => {
  const showLogoutBanner = route?.params?.showLogoutBanner === true;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  // UC #98 — handle login
  const handleLogin = useCallback(async () => {
    setError('');
    setLoading(true);
    const result = await ctrl.login({ username, password });
    setLoading(false);
    if (result.success) {
      navigation.replace('AdminDashboardScreen', { user: result.user || result.data });
    } else {
      setError(result.message || 'Incorrect Username or Password');
    }
  }, [username, password, navigation]);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />
      <NavBar />

      {/* UC #99 — logout success banner */}
      {showLogoutBanner && (
        <View style={s.logoutBanner}>
          <Text style={s.logoutBannerIcon}>✅</Text>
          <Text style={s.logoutBannerText}>Logged out successfully</Text>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={s.card}>
            {/* Shield avatar */}
            <View style={s.shieldWrap}>
              <View style={s.shieldCircle}>
                <Text style={s.shieldIcon}>🛡️</Text>
              </View>
            </View>

            <Text style={s.title}>System Admin</Text>
            <Text style={s.subtitle}>Secure access to BiteWise administration</Text>

            {/* Error */}
            {error ? (
              <View style={s.errorBox}>
                <Text style={s.errorTxt}>{error}</Text>
              </View>
            ) : null}

            {/* Username */}
            <Text style={s.label}>Username</Text>
            <View style={s.inputWrap}>
              <Text style={s.inputIcon}>👤</Text>
              <TextInput
                style={s.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Enter admin username"
                placeholderTextColor={C.subtle}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Password */}
            <Text style={s.label}>Password</Text>
            <View style={s.inputWrap}>
              <Text style={s.inputIcon}>🔒</Text>
              <TextInput
                style={s.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter admin password"
                placeholderTextColor={C.subtle}
                secureTextEntry
              />
            </View>

            {/* Login button */}
            <TouchableOpacity
              style={[s.loginBtn, loading && s.disabled]}
              onPress={handleLogin}
              activeOpacity={0.88}
              disabled={loading}
            >
              <Text style={s.loginBtnTxt}>
                {loading ? 'Signing in...' : 'Login to Admin Panel'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Back to Home */}
          <TouchableOpacity
            style={s.backLink}
            onPress={() => navigation.navigate('MainLandingScreen')}
          >
            <Text style={s.backLinkTxt}>← Back to Home</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:              { flex: 1, backgroundColor: C.bg },
  scroll:            { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 32 },
  logoutBanner:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.successBg, borderBottomWidth: 1, borderBottomColor: C.successBorder },
  logoutBannerIcon:  { fontSize: 16 },
  logoutBannerText:  { fontSize: 14, fontWeight: '500', color: C.successText },
  card:              { backgroundColor: C.white, borderRadius: 16, padding: 28, borderWidth: 1, borderColor: C.border, marginBottom: 16 },
  shieldWrap:        { alignItems: 'center', marginBottom: 20 },
  shieldCircle:      { width: 72, height: 72, borderRadius: 36, backgroundColor: C.purple, alignItems: 'center', justifyContent: 'center' },
  shieldIcon:        { fontSize: 32 },
  title:             { fontSize: 26, fontWeight: '800', color: C.dark, textAlign: 'center', marginBottom: 6 },
  subtitle:          { fontSize: 14, color: C.subtle, textAlign: 'center', marginBottom: 28 },
  errorBox:          { backgroundColor: C.errorBg, borderRadius: 8, borderWidth: 1, borderColor: C.errorBorder, padding: 12, marginBottom: 16 },
  errorTxt:          { fontSize: 13, color: C.errorText },
  label:             { fontSize: 13, fontWeight: '600', color: C.dark, marginBottom: 6 },
  inputWrap:         { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg, borderRadius: 10, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, marginBottom: 16 },
  inputIcon:         { fontSize: 16, marginRight: 10 },
  input:             { flex: 1, fontSize: 15, color: C.dark, paddingVertical: 13 },
  loginBtn:          { backgroundColor: C.purple, borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 6 },
  loginBtnTxt:       { fontSize: 16, fontWeight: '700', color: C.white },
  disabled:          { opacity: 0.6 },
  backLink:          { alignItems: 'center', paddingVertical: 8 },
  backLinkTxt:       { fontSize: 14, color: C.mid, fontWeight: '500' },
});

export default AdminLoginScreen;
