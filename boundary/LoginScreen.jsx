import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import LoginController from '../controller/LoginController';

const controller = new LoginController();

// Design Tokens
const C = {
  purple:      '#7C3AED',
  dark:        '#111827',
  subtle:      '#6B7280',
  white:       '#FFFFFF',
  border:      '#E5E7EB',
  bg:          '#F3F4F6',
  errorBg:     '#FEF2F2',
  errorBorder: '#FECACA',
  errorText:   '#DC2626',
  successBg:   '#F0FDF4',
  successBorder:'#BBF7D0',
  successText: '#15803D',
};


// SUB-COMPONENTS

// NavBar
const NavBar = ({ onMenuPress }) => (
  <View style={nav.bar}>
    <View style={nav.brand}>
      <Text style={nav.icon}>🍴</Text>
      <Text style={nav.brandName}>BiteWise</Text>
    </View>
    <TouchableOpacity onPress={onMenuPress} style={nav.backBtn}>
      <Text style={nav.backText}>← Back</Text>
    </TouchableOpacity>
  </View>
);

const nav = StyleSheet.create({
  bar: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 20,
    paddingVertical:   14,
    backgroundColor:   C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  brand: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
  },
  icon:      { fontSize: 20 },
  brandName: {
    fontSize:      20,
    fontWeight:    '800',
    color:         C.dark,
    letterSpacing: -0.3,
  },
  menuBtn: {
    padding:    6,
    gap:        4,
    alignItems: 'flex-end',
  },
  menuLine: {
    width:           22,
    height:          2.5,
    backgroundColor: C.dark,
    borderRadius:    2,
  },
  backBtn:  { padding: 6 },
  backText: { fontSize: 14, fontWeight: '500', color: '#374151' },
});

// Top banner — success (green) or error (red)
const Banner = ({ message, type }) => {
  if (!message) return null;
  const isSuccess = type === 'success';
  return (
    <View style={[bn.wrap, isSuccess ? bn.success : bn.error]}>
      <Text style={bn.icon}>{isSuccess ? '✅' : '⚠️'}</Text>
      <Text style={[bn.text, isSuccess ? bn.successText : bn.errorText]}>
        {message}
      </Text>
    </View>
  );
};

const bn = StyleSheet.create({
  wrap: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               10,
    paddingHorizontal: 16,
    paddingVertical:   12,
    borderBottomWidth: 1,
  },
  success:     { backgroundColor: C.successBg,  borderBottomColor: C.successBorder },
  error:       { backgroundColor: C.errorBg,    borderBottomColor: C.errorBorder },
  icon:        { fontSize: 16 },
  text:        { flex: 1, fontSize: 14, fontWeight: '500' },
  successText: { color: C.successText },
  errorText:   { color: C.errorText },
});


// MAIN SCREEN

const LoginScreen = ({ navigation, route }) => {
  // Success banner from CreateAccountScreen or logout message from AccountSettingsScreen
  const incomingMessage = route?.params?.successMessage || '';
  const incomingType    = route?.params?.messageType    || 'success';

  const [username,  setUsername]  = useState('');
  const [password,  setPassword]  = useState('');
  const [banner,    setBanner]    = useState({ message: incomingMessage, type: incomingType });
  const [isLoading, setIsLoading] = useState(false);

  // UC #10, #45 Step 2: user taps Log In
  const handleLogin = useCallback(async () => {
    setBanner({ message: '', type: '' });
    setIsLoading(true);

    const result = await controller.login({ username, password });

    setIsLoading(false);

    if (result.success) {
      // Navigate to dashboard, passing the user session as a route param
      navigation.reset({
        index: 0,
        routes: [
          {
            name: 'DashboardRouter',
            params: {
              user: result.user,
            },
          },
        ],
      });
    } else {
      // Alt Flow 1a: incorrect credentials
      setBanner({ message: result.message, type: 'error' });
    }
  }, [username, password, navigation]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />

      <NavBar onMenuPress={() => navigation.goBack()} />

      {/* Success or error banner */}
      <Banner message={banner.message} type={banner.type} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={styles.card}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Log in to your BiteWise account</Text>

            {/* Username */}
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Enter your username"
              placeholderTextColor={C.subtle}
              autoCapitalize="none"
              autoCorrect={false}
            />

            {/* Password */}
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor={C.subtle}
              secureTextEntry
              autoCapitalize="none"
            />

            {/* Log In button */}
            <TouchableOpacity
              style={[styles.btn, isLoading && styles.btnDisabled]}
              onPress={handleLogin}
              activeOpacity={0.85}
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel="Log In"
            >
              <Text style={styles.btnText}>
                {isLoading ? 'Logging in...' : 'Log In'}
              </Text>
            </TouchableOpacity>

            {/* Sign up link */}
            <View style={styles.signupRow}>
              <Text style={styles.signupPrompt}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignUpScreen')}>
                <Text style={styles.signupLink}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  safe: {
    flex:            1,
    backgroundColor: C.bg,
  },
  scroll: {
    flexGrow:          1,
    justifyContent:    'center',
    paddingHorizontal: 16,
    paddingVertical:   32,
  },
  card: {
    backgroundColor: C.white,
    borderRadius:    16,
    padding:         24,
    borderWidth:     1,
    borderColor:     C.border,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 1 },
    shadowOpacity:   0.05,
    shadowRadius:    4,
    elevation:       2,
  },
  title: {
    fontSize:      24,
    fontWeight:    '800',
    color:         C.dark,
    letterSpacing: -0.3,
    marginBottom:  4,
  },
  subtitle: {
    fontSize:     14,
    color:        C.subtle,
    marginBottom: 24,
  },
  label: {
    fontSize:     14,
    fontWeight:   '600',
    color:        C.dark,
    marginBottom: 6,
  },
  input: {
    backgroundColor:   C.bg,
    borderRadius:      8,
    paddingHorizontal: 14,
    paddingVertical:   12,
    fontSize:          15,
    color:             C.dark,
    borderWidth:       1,
    borderColor:       C.border,
    marginBottom:      16,
  },
  btn: {
    backgroundColor: C.purple,
    borderRadius:    10,
    paddingVertical: 15,
    alignItems:      'center',
    marginTop:       4,
    marginBottom:    16,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: {
    fontSize:   16,
    fontWeight: '700',
    color:      C.white,
  },
  signupRow: {
    flexDirection:  'row',
    justifyContent: 'center',
    alignItems:     'center',
  },
  signupPrompt: {
    fontSize: 14,
    color:    C.subtle,
  },
  signupLink: {
    fontSize:   14,
    fontWeight: '600',
    color:      C.purple,
  },
});

export default LoginScreen;