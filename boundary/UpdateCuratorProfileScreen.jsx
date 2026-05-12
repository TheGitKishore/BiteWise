// UpdateCuratorProfileScreen.jsx — UC #116 Curator – Update Profile
//
// Pre-filled from route.params.expertise and route.params.bio.
// On success → navigates back to CuratorDashboardScreen with banner param.
// Design consistent with EditMyRecipeScreen layout.

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, KeyboardAvoidingView, Platform,, Image} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import UpdateCuratorProfileController from '../controller/UpdateCuratorProfileController';
import CuratorProfileEdit from '../entity/CuratorProfileEdit'; // adjust path

const ctrl = new UpdateCuratorProfileController();

const C = {
  purple:       '#7C3AED',
  purpleLight:  '#EDE9FE',
  dark:         '#111827',
  mid:          '#374151',
  body:         '#4B5563',
  subtle:       '#6B7280',
  white:        '#FFFFFF',
  border:       '#E5E7EB',
  bg:           '#F9FAFB',
  errorText:    '#DC2626',
  errorBg:      '#FEF2F2',
  errorBorder:  '#FECACA',
};

// ── NavBar ────────────────────────────────────────────────────────────────────
const NavBar = ({ onBack }) => (
  <View style={nav.bar}>
    <View style={nav.brand}>
      <Image source={require('../assets/BiteWiseLogo.png')} style={nav.logo} />
      <Text style={nav.brandName}>BiteWise</Text>
    </View>
    <TouchableOpacity onPress={onBack} style={nav.backBtn}>
      <Text style={nav.backText}>← Back</Text>
    </TouchableOpacity>
  </View>
);
const nav = StyleSheet.create({
  bar:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  brand:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  icon:      { fontSize: 20 },
  logo:      { width: 24, height: 24, resizeMode: 'contain' },
  brandName: { fontSize: 20, fontWeight: '800', color: C.dark, letterSpacing: -0.3 },
  backBtn:   { padding: 4 },
  backText:  { fontSize: 14, fontWeight: '500', color: '#374151' },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
const UpdateCuratorProfileScreen = ({ navigation, route }) => {
  const user = route?.params?.user || null;
  const [expertise,  setExpertise]  = useState(route?.params?.expertise || '');
  const [bio,        setBio]        = useState(route?.params?.bio        || '');
  const [error,      setError]      = useState('');
  const [isLoading,  setIsLoading]  = useState(false);

  const handleSave = useCallback(async () => {
    setError('');
    setIsLoading(true);
    const result = await ctrl.updateProfile(user?.userId, { expertise, bio });
    setIsLoading(false);

    if (result.success) {
      navigation.navigate('CuratorDashboardScreen', {
        user,
        banner: result.message,
        updatedExpertise: result.data?.expertise,
        updatedBio:       result.data?.bio,
      });
    } else {
      setError(result.message);
    }
  }, [expertise, bio, user, navigation]);

  useEffect(() => {
    const fetchProfile = async () => {
      const res = await CuratorProfileEdit.getProfile(user?.userId);

      if (res.success && res.data) {
        setExpertise(res.data.expertise || '');
        setBio(res.data.bio || '');
      }
    };

    fetchProfile();
  }, [user]);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />
      <NavBar onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, ...s.scroll }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">

          {/* Header */}
          <Text style={s.pageTitle}>Update Profile</Text>
          <Text style={s.pageSubtitle}>Update your curator expertise and bio so readers know who you are</Text>

          {/* Error */}
          {error ? (
            <View style={s.errorBox}>
              <Text style={s.errorTxt}>⚠️  {error}</Text>
            </View>
          ) : null}

          {/* Curator avatar preview */}
          <View style={s.avatarRow}>
            <View style={s.avatarCircle}>
              <Text style={s.avatarTxt}>{(user?.username || 'C')[0].toUpperCase()}</Text>
            </View>
            <View>
              <Text style={s.avatarName}>{user?.username || 'Curator'}</Text>
              <Text style={s.avatarEmail}>{user?.email || ''}</Text>
            </View>
          </View>

          {/* Fields card */}
          <View style={s.card}>
            <Text style={s.cardHeading}>Profile Details</Text>

            <Text style={s.label}>Expertise *</Text>
            <TextInput
              style={[s.input, error && { borderColor: C.errorBorder }]}
              value={expertise}
              onChangeText={setExpertise}
              placeholder="e.g., Certified Nutritionist, Meal Planning Expert"
              placeholderTextColor={C.subtle}
              autoCorrect={false}
            />

            <Text style={s.label}>Bio</Text>
            <TextInput
              style={[s.input, s.multiline]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell the community a bit about yourself..."
              placeholderTextColor={C.subtle}
              multiline
              autoCorrect={false}
            />
          </View>

          {/* Save button */}
          <TouchableOpacity
            style={[s.saveBtn, isLoading && s.saveBtnDisabled]}
            onPress={handleSave}
            activeOpacity={0.85}
            disabled={isLoading}
          >
            <Text style={s.saveBtnText}>{isLoading ? 'Saving...' : 'Save Changes'}</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: C.bg },
  scroll:         { paddingHorizontal: 16, paddingBottom: 32 },
  pageTitle:      { fontSize: 26, fontWeight: '800', color: C.dark, letterSpacing: -0.3, paddingTop: 20, marginBottom: 4 },
  pageSubtitle:   { fontSize: 13, color: C.subtle, marginBottom: 20 },
  errorBox:       { backgroundColor: C.errorBg, borderRadius: 10, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: C.errorBorder },
  errorTxt:       { fontSize: 13, color: C.errorText },
  avatarRow:      { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.white, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 14 },
  avatarCircle:   { width: 56, height: 56, borderRadius: 28, backgroundColor: C.purple, alignItems: 'center', justifyContent: 'center' },
  avatarTxt:      { fontSize: 22, fontWeight: '800', color: C.white },
  avatarName:     { fontSize: 16, fontWeight: '700', color: C.dark, marginBottom: 2 },
  avatarEmail:    { fontSize: 13, color: C.subtle },
  card:           { backgroundColor: C.white, borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: C.border },
  cardHeading:    { fontSize: 15, fontWeight: '700', color: C.dark, marginBottom: 14 },
  label:          { fontSize: 13, fontWeight: '600', color: C.dark, marginBottom: 6 },
  input:          { backgroundColor: C.bg, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: C.dark, borderWidth: 1, borderColor: C.border, marginBottom: 14 },
  multiline:      { minHeight: 100, textAlignVertical: 'top' },
  saveBtn:        { backgroundColor: C.purple, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 8 },
  saveBtnDisabled:{ opacity: 0.6 },
  saveBtnText:    { fontSize: 16, fontWeight: '700', color: C.white },
});

export default UpdateCuratorProfileScreen;
