import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import LogOutController              from '../controller/LogOutController';
import ViewAccountDetailsController  from '../controller/ViewAccountDetailsController';
import UpdateAccountDetailsController from '../controller/UpdateAccountDetailsController';
import TerminateAccountController    from '../controller/TerminateAccountController';

const logOutController    = new LogOutController();
const viewDetailsCtrl     = new ViewAccountDetailsController();
const updateDetailsCtrl   = new UpdateAccountDetailsController();
const terminateCtrl       = new TerminateAccountController();

// Design Tokens
const C = {
  purple:       '#7C3AED',
  purpleLight:  '#EDE9FE',
  dark:         '#111827',
  mid:          '#374151',
  body:         '#4B5563',
  subtle:       '#6B7280',
  white:        '#FFFFFF',
  border:       '#E5E7EB',
  bg:           '#F3F4F6',
  errorText:    '#DC2626',
  errorBorder:  '#FECACA',
  errorBg:      '#FEF2F2',
  successBg:    '#F0FDF4',
  successBorder:'#BBF7D0',
  successText:  '#15803D',
  dangerText:   '#DC2626',
  dangerBorder: '#FECACA',
  dangerBg:     '#FEF2F2',
};


// SUB-COMPONENTS

// NavBar
const NavBar = ({ onMenuPress }) => (
  <View style={nav.bar}>
    <View style={nav.brand}>
      <Text style={nav.icon}>🍴</Text>
      <Text style={nav.brandName}>BiteWise</Text>
    </View>
    <TouchableOpacity
      onPress={onMenuPress}
      style={nav.menuBtn}
      accessibilityRole="button"
      accessibilityLabel="Open menu"
    >
      <View style={nav.menuLine} />
      <View style={[nav.menuLine, { width: 18 }]} />
      <View style={nav.menuLine} />
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
  brand: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  icon:      { fontSize: 20 },
  brandName: {
    fontSize:      20,
    fontWeight:    '800',
    color:         C.dark,
    letterSpacing: -0.3,
  },
  menuBtn:  { padding: 6, gap: 4, alignItems: 'flex-end' },
  menuLine: {
    width:           22,
    height:          2.5,
    backgroundColor: C.dark,
    borderRadius:    2,
  },
});

// Top banner — success or error
const Banner = ({ message, type }) => {
  if (!message) return null;
  const isSuccess = type === 'success';
  return (
    <View style={[bn.wrap, isSuccess ? bn.success : bn.error]}>
      <Text style={bn.icon}>{isSuccess ? '✅' : '⚠️'}</Text>
      <Text style={[bn.text, isSuccess ? bn.successText : bn.errorText]}>{message}</Text>
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

// Section wrapper
const Section = ({ children, style }) => (
  <View style={[sec.wrap, style]}>{children}</View>
);
const sec = StyleSheet.create({
  wrap: {
    backgroundColor: C.white,
    borderRadius:    14,
    padding:         20,
    marginBottom:    16,
    borderWidth:     1,
    borderColor:     C.border,
  },
});

// Section heading + subtext
const SectionHead = ({ title, subtitle }) => (
  <View style={sh.wrap}>
    <Text style={sh.title}>{title}</Text>
    {subtitle && <Text style={sh.subtitle}>{subtitle}</Text>}
  </View>
);
const sh = StyleSheet.create({
  wrap:     { marginBottom: 16 },
  title:    { fontSize: 16, fontWeight: '700', color: C.dark, marginBottom: 2 },
  subtitle: { fontSize: 13, color: C.subtle },
});

// Labelled field row with optional error
const FieldRow = ({ label, value, onChangeText, error }) => (
  <View style={fld.wrap}>
    <Text style={fld.label}>{label}</Text>
    {error ? <Text style={fld.errorText}>{error}</Text> : null}
    <TextInput
      style={[fld.input, error && fld.inputError]}
      value={value}
      onChangeText={onChangeText}
      autoCapitalize="none"
      autoCorrect={false}
    />
  </View>
);
const fld = StyleSheet.create({
  wrap:       { marginBottom: 14 },
  label:      { fontSize: 13, fontWeight: '600', color: C.mid, marginBottom: 4 },
  errorText:  { fontSize: 12, color: C.errorText, marginBottom: 4 },
  input: {
    backgroundColor:   C.bg,
    borderRadius:      8,
    paddingHorizontal: 12,
    paddingVertical:   10,
    fontSize:          15,
    color:             C.dark,
    borderWidth:       1,
    borderColor:       C.border,
  },
  inputError: { borderColor: C.errorBorder },
});


// MAIN SCREEN
// Covers UC #11, #12, #13, #14, #46, #47, #48, #49

const AccountSettingsScreen = ({ navigation, route }) => {
  const [user,         setUser]         = useState(route?.params?.user || null);
  const [username,     setUsername]     = useState('');
  const [email,        setEmail]        = useState('');
  const [fieldErrors,  setFieldErrors]  = useState({});
  const [banner,       setBanner]       = useState({ message: '', type: '' });
  const [isUpdating,   setIsUpdating]   = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // UC #12, #47 — load account details on mount
  useEffect(() => {
    viewDetailsCtrl.fetchAccountDetails(user).then((result) => {
      if (result.success) {
        setUsername(result.data.username);
        setEmail(result.data.email);
      } else {
        setBanner({ message: result.message, type: 'error' });
      }
    });
  }, []);

  // UC #13, #48 — update account details
  const handleUpdate = useCallback(async () => {
    setFieldErrors({});
    setBanner({ message: '', type: '' });
    setIsUpdating(true);

    const result = await updateDetailsCtrl.updateAccountDetails(user, { username, email });

    setIsUpdating(false);

    if (result.success) {
      setUser(result.user);
      setBanner({ message: result.message, type: 'success' });
    } else {
      if (result.field) {
        setFieldErrors({ [result.field]: result.message });
      }
    }
  }, [user, username, email]);

  // UC #11, #46 — log out
  const handleLogOut = useCallback(async () => {
    setIsLoggingOut(true);
    const result = await logOutController.logout();
    setIsLoggingOut(false);

    if (result.success) {
      navigation.navigate('LoginScreen', {
        successMessage: result.message,
        messageType:    'success',
      });
    }
  }, [navigation]);

  // UC #14, #49 — terminate/delete account
  const handleTerminate = useCallback(() => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text:  'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await terminateCtrl.terminateAccount(user);
            if (result.success) {
              navigation.navigate('LoginScreen', {
                successMessage: result.message,
                messageType:    'success',
              });
            } else {
              setBanner({ message: result.message, type: 'error' });
            }
          },
        },
      ]
    );
  }, [user, navigation]);

  const planLabel = user?.membershipPlanId === 2 ? 'Premium' : 'Free';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />

      <NavBar onMenuPress={() => navigation.goBack()} />

      <Banner message={banner.message} type={banner.type} />

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>

        <Text style={styles.pageTitle}>Account Settings</Text>

        {/* UC #12, #13, #47, #48 — Account Details */}
        <Section>
          <SectionHead
            title="Account Details"
            subtitle="Update your personal information"
          />
          <FieldRow
            label="Username"
            value={username}
            onChangeText={setUsername}
            error={fieldErrors.username}
          />
          <FieldRow
            label="Email"
            value={email}
            onChangeText={setEmail}
            error={fieldErrors.email}
          />
          <TouchableOpacity
            style={[styles.updateBtn, isUpdating && styles.btnDisabled]}
            onPress={handleUpdate}
            activeOpacity={0.85}
            disabled={isUpdating}
            accessibilityRole="button"
            accessibilityLabel="Update Account"
          >
            <Text style={styles.updateBtnText}>
              {isUpdating ? 'Updating...' : 'Update Account'}
            </Text>
          </TouchableOpacity>
        </Section>

        {/* Subscription info */}
        <Section>
          <SectionHead
            title="Subscription"
            subtitle="Your current subscription plan"
          />
          <Text style={styles.planLabel}>Current Plan</Text>
          <Text style={styles.planValue}>{planLabel}</Text>
          <TouchableOpacity
            style={styles.changePlanBtn}
            onPress={() => navigation.navigate('ViewPricingPlansScreen')}
            activeOpacity={0.75}
          >
            <Text style={styles.changePlanText}>Change Plan</Text>
          </TouchableOpacity>
        </Section>

        {/* UC #11, #46 — Log Out */}
        <TouchableOpacity
          style={[styles.logOutBtn, isLoggingOut && styles.btnDisabled]}
          onPress={handleLogOut}
          activeOpacity={0.85}
          disabled={isLoggingOut}
          accessibilityRole="button"
          accessibilityLabel="Log Out"
        >
          <Text style={styles.logOutText}>
            {isLoggingOut ? 'Logging out...' : 'Log Out'}
          </Text>
        </TouchableOpacity>

        {/* UC #14, #49 — Danger Zone */}
        <Section style={styles.dangerSection}>
          <SectionHead
            title="Danger Zone"
            subtitle="Permanently delete your account and all data"
          />
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={handleTerminate}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Delete Account"
          >
            <Text style={styles.deleteBtnText}>Delete Account</Text>
          </TouchableOpacity>
        </Section>

      </ScrollView>
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  safe: {
    flex:            1,
    backgroundColor: C.bg,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom:     40,
  },
  pageTitle: {
    fontSize:      24,
    fontWeight:    '800',
    color:         C.dark,
    letterSpacing: -0.3,
    paddingVertical: 20,
  },
  updateBtn: {
    backgroundColor: C.purple,
    borderRadius:    8,
    paddingVertical: 12,
    alignItems:      'center',
    marginTop:       4,
  },
  updateBtnText: {
    fontSize:   14,
    fontWeight: '700',
    color:      C.white,
  },
  planLabel: {
    fontSize:     12,
    color:        C.subtle,
    marginBottom: 2,
  },
  planValue: {
    fontSize:     18,
    fontWeight:   '700',
    color:        C.dark,
    marginBottom: 12,
  },
  changePlanBtn: {
    alignSelf:       'flex-start',
    borderWidth:     1.5,
    borderColor:     C.border,
    borderRadius:    8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  changePlanText: {
    fontSize:   14,
    fontWeight: '600',
    color:      C.mid,
  },
  logOutBtn: {
    backgroundColor: C.white,
    borderRadius:    12,
    paddingVertical: 15,
    alignItems:      'center',
    marginBottom:    16,
    borderWidth:     1.5,
    borderColor:     C.border,
  },
  logOutText: {
    fontSize:   15,
    fontWeight: '700',
    color:      C.mid,
  },
  dangerSection: {
    borderColor: C.errorBorder,
    borderWidth: 1.5,
  },
  deleteBtn: {
    backgroundColor: C.dangerBg,
    borderRadius:    8,
    paddingVertical: 12,
    alignItems:      'center',
    borderWidth:     1,
    borderColor:     C.errorBorder,
  },
  deleteBtnText: {
    fontSize:   14,
    fontWeight: '700',
    color:      C.dangerText,
  },
  btnDisabled: { opacity: 0.6 },
});

export default AccountSettingsScreen;
