// AdminLoginScreen.jsx — UC #102 System Admin Log In
// Separate login screen — Admin role only
// Routes to AdminDashboardScreen on success

import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AdminLoginController from '../controller/AdminLoginController';

const ctrl = new AdminLoginController();
const C = { purple: '#7C3AED', dark: '#111827', mid: '#374151', subtle: '#6B7280', white: '#FFFFFF', border: '#E5E7EB', bg: '#F9FAFB', errorText: '#DC2626', errorBg: '#FEF2F2', errorBorder: '#FECACA' };

const AdminLoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  // UC #102
  const handleLogin = useCallback(async () => {
    setError('');
    setLoading(true);
    const result = await ctrl.login({ username: username.trim(), password });
    setLoading(false);
    if (result.success) {
      navigation.replace('AdminDashboardScreen', { user: result.user });
    } else {
      setError(result.message || 'Login failed.');
    }
  }, [username, password, navigation]);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.kav}>
        <View style={s.card}>
          <View style={s.shield}><Text style={s.shieldIcon}>🛡️</Text></View>
          <Text style={s.title}>Admin Portal</Text>
          <Text style={s.subtitle}>BiteWise System Administration</Text>

          {error ? (
            <View style={s.errorBox}>
              <Text style={s.errorTxt}>{error}</Text>
            </View>
          ) : null}

          <Text style={s.label}>Username</Text>
          <TextInput style={s.input} value={username} onChangeText={setUsername} placeholder="Admin username" placeholderTextColor={C.subtle} autoCapitalize="none" autoCorrect={false} />

          <Text style={s.label}>Password</Text>
          <TextInput style={s.input} value={password} onChangeText={setPassword} placeholder="Admin password" placeholderTextColor={C.subtle} secureTextEntry />

          <TouchableOpacity style={[s.loginBtn, loading && s.disabled]} onPress={handleLogin} disabled={loading}>
            <Text style={s.loginBtnTxt}>{loading ? 'Signing in...' : 'Sign In'}</Text>
          </TouchableOpacity>

          <Text style={s.hint}>Seeded credentials: adminuser / admin123</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: C.bg },
  kav:        { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  card:       { backgroundColor: C.white, borderRadius: 20, padding: 28, borderWidth: 1, borderColor: C.border },
  shield:     { alignItems: 'center', marginBottom: 16 },
  shieldIcon: { fontSize: 48 },
  title:      { fontSize: 26, fontWeight: '800', color: C.dark, textAlign: 'center', marginBottom: 4 },
  subtitle:   { fontSize: 14, color: C.subtle, textAlign: 'center', marginBottom: 24 },
  errorBox:   { backgroundColor: C.errorBg, borderRadius: 8, borderWidth: 1, borderColor: C.errorBorder, padding: 12, marginBottom: 16 },
  errorTxt:   { fontSize: 14, color: C.errorText },
  label:      { fontSize: 13, fontWeight: '600', color: C.dark, marginBottom: 6 },
  input:      { backgroundColor: C.bg, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: C.dark, borderWidth: 1, borderColor: C.border, marginBottom: 16 },
  loginBtn:   { backgroundColor: C.purple, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  loginBtnTxt:{ fontSize: 16, fontWeight: '700', color: C.white },
  disabled:   { opacity: 0.6 },
  hint:       { fontSize: 11, color: C.subtle, textAlign: 'center', marginTop: 16 },
});

export default AdminLoginScreen;
