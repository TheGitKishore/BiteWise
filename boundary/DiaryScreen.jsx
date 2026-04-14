// DiaryScreen.jsx — UC #77 add photo, #78 view, #79 delete  (UC #76 create implied)
// Premium User only — accessible from PremiumUserDashboardScreen

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, StatusBar, Modal, Alert, Image } from 'react-native';
import { SafeAreaView }   from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import ViewDiaryController        from '../controller/ViewDiaryController';
import CreateDiaryEntryController from '../controller/CreateDiaryEntryController';
import DeleteDiaryEntryController from '../controller/DeleteDiaryEntryController';

const viewCtrl   = new ViewDiaryController();
const createCtrl = new CreateDiaryEntryController();
const deleteCtrl = new DeleteDiaryEntryController();

const MOODS = ['Great', 'Good', 'Okay', 'Bad'];
const MOOD_EMOJI = { Great: '😄', Good: '🙂', Okay: '😐', Bad: '😔' };

const C = { purple: '#7C3AED', purpleLight: '#EDE9FE', dark: '#111827', mid: '#374151', subtle: '#6B7280', white: '#FFFFFF', border: '#E5E7EB', bg: '#F9FAFB', errorText: '#DC2626', green: '#16A34A', greenBg: '#F0FDF4', greenBorder: '#BBF7D0' };

// ── Entry form modal — UC #76 (create) + UC #77 (add photo) ─────────────────
const EntryModal = ({ visible, userId, onClose, onSaved }) => {
  const [title, setTitle]     = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood]       = useState('Good');
  const [errors, setErrors]   = useState({});
  const [saving, setSaving]   = useState(false);

  const reset = () => { setTitle(''); setContent(''); setMood('Good'); setErrors({}); };
  const handleClose = () => { reset(); onClose(); };

  // UC #77 — photo picker placeholder (real: expo-image-picker)
  const handleAddPhoto = () => Alert.alert('Add Photo', 'Device image picker would open here (expo-image-picker). Photo URI is stored on the diary entry after creation via CreateDiaryEntryController.addPhoto().');

  const handleSave = useCallback(async () => {
    setErrors({});
    setSaving(true);
    const result = await createCtrl.createEntry(userId, { title, content, mood });
    setSaving(false);
    if (result.success) { reset(); onSaved(result.message, result.data); }
    else if (result.field) setErrors({ [result.field]: result.message });
  }, [title, content, mood, userId]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={m.overlay}>
        <View style={m.sheet}>
          <TouchableOpacity style={m.closeBtn} onPress={handleClose}><Text style={m.closeX}>✕</Text></TouchableOpacity>
          <Text style={m.heading}>New Diary Entry</Text>

          <Text style={m.label}>Title *</Text>
          {errors.title ? <Text style={m.err}>{errors.title}</Text> : null}
          <TextInput style={[m.input, errors.title && m.inputErr]} value={title} onChangeText={setTitle} placeholder="Entry title..." placeholderTextColor={C.subtle} />

          <Text style={[m.label, { marginTop: 10 }]}>Mood</Text>
          <View style={m.moodRow}>
            {MOODS.map((mo) => (
              <TouchableOpacity key={mo} style={[m.moodChip, mood === mo && m.moodActive]} onPress={() => setMood(mo)}>
                <Text style={[m.moodTxt, mood === mo && m.moodActiveTxt]}>{MOOD_EMOJI[mo]} {mo}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[m.label, { marginTop: 10 }]}>Entry *</Text>
          {errors.content ? <Text style={m.err}>{errors.content}</Text> : null}
          <TextInput style={[m.input, m.multiline, errors.content && m.inputErr]} value={content} onChangeText={setContent} placeholder="Write about your day, progress, goals..." placeholderTextColor={C.subtle} multiline textAlignVertical="top" />

          {/* UC #77 — Add Photo button */}
          <TouchableOpacity style={m.photoBtn} onPress={handleAddPhoto}>
            <Text style={m.photoBtnTxt}>📷  Add Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[m.saveBtn, saving && m.disabled]} onPress={handleSave} disabled={saving}>
            <Text style={m.saveBtnTxt}>{saving ? 'Saving...' : 'Save Entry'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
const m = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', paddingHorizontal: 16 },
  sheet:        { backgroundColor: C.white, borderRadius: 16, padding: 22, paddingTop: 40 },
  closeBtn:     { position: 'absolute', top: 12, right: 16 },
  closeX:       { fontSize: 16, color: C.subtle },
  heading:      { fontSize: 16, fontWeight: '700', color: C.dark, textAlign: 'center', marginBottom: 16 },
  label:        { fontSize: 13, fontWeight: '600', color: C.dark, marginBottom: 4 },
  err:          { fontSize: 12, color: C.errorText, marginBottom: 4 },
  input:        { backgroundColor: C.bg, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: C.dark, borderWidth: 1, borderColor: C.border, marginBottom: 4 },
  inputErr:     { borderColor: '#FECACA' },
  multiline:    { minHeight: 100 },
  moodRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  moodChip:     { borderWidth: 1, borderColor: C.border, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  moodActive:   { backgroundColor: C.purple, borderColor: C.purple },
  moodTxt:      { fontSize: 12, color: C.mid },
  moodActiveTxt:{ color: C.white, fontWeight: '600' },
  photoBtn:     { backgroundColor: C.bg, borderRadius: 8, borderWidth: 1, borderColor: C.border, paddingVertical: 10, alignItems: 'center', marginVertical: 10 },
  photoBtnTxt:  { fontSize: 14, color: C.mid, fontWeight: '600' },
  saveBtn:      { backgroundColor: C.purple, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  saveBtnTxt:   { fontSize: 15, fontWeight: '700', color: C.white },
  disabled:     { opacity: 0.6 },
});

// ── Entry card — UC #78 (view) + UC #79 (delete) ────────────────────────────
const EntryCard = ({ entry, onDelete }) => (
  <View style={ec.card}>
    <View style={ec.row}>
      <View style={ec.info}>
        <Text style={ec.title}>{entry.title}</Text>
        <Text style={ec.meta}>{MOOD_EMOJI[entry.mood] || ''} {entry.mood}  •  {new Date(entry.createdAt).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
      </View>
      <TouchableOpacity style={ec.del} onPress={() => onDelete(entry.entryId)}><Text style={ec.delIcon}>🗑</Text></TouchableOpacity>
    </View>
    {entry.photoUri ? <Image source={{ uri: entry.photoUri }} style={ec.photo} resizeMode="cover" /> : null}
    <Text style={ec.body}>{entry.content}</Text>
  </View>
);
const ec = StyleSheet.create({
  card:    { backgroundColor: C.white, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 12 },
  row:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  info:    { flex: 1 },
  title:   { fontSize: 16, fontWeight: '700', color: C.dark, marginBottom: 2 },
  meta:    { fontSize: 12, color: C.subtle },
  del:     { padding: 4 },
  delIcon: { fontSize: 18 },
  photo:   { width: '100%', height: 160, borderRadius: 8, marginBottom: 10 },
  body:    { fontSize: 14, color: C.mid, lineHeight: 20 },
});

// ── Main screen ──────────────────────────────────────────────────────────────
const DiaryScreen = ({ navigation, route }) => {
  const user = route?.params?.user || null;
  const [entries,   setEntries]   = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [banner,    setBanner]    = useState('');
  const [loading,   setLoading]   = useState(true);

  const showBanner = (msg) => { setBanner(msg); setTimeout(() => setBanner(''), 3000); };

  useFocusEffect(useCallback(() => {
    if (!user?.userId) { setLoading(false); return; }
    setLoading(true);
    viewCtrl.fetchEntries(user.userId).then((r) => { if (r.success) setEntries(r.data); setLoading(false); });
  }, [user?.userId]));

  const handleDelete = useCallback((entryId) => {
    Alert.alert('Delete Entry', 'Remove this diary entry permanently?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          const r = await deleteCtrl.deleteEntry(entryId);
          if (r.success) { setEntries((p) => p.filter((e) => e.entryId !== entryId)); showBanner('Entry deleted.'); }
        }},
    ]);
  }, []);

  const handleSaved = useCallback((msg, entry) => {
    setShowModal(false); setEntries((p) => [entry, ...p]); showBanner(msg);
  }, []);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />
      <View style={s.nav}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.back}>← Back</Text></TouchableOpacity>
        <Text style={s.navTitle}>Health Diary</Text>
        <View style={{ width: 50 }} />
      </View>
      {banner ? <View style={s.bannerBar}><Text style={s.bannerTxt}>✅  {banner}</Text></View> : null}
      <EntryModal visible={showModal} userId={user?.userId} onClose={() => setShowModal(false)} onSaved={handleSaved} />
      <ScrollView contentContainerStyle={s.list}>
        <View style={s.header}>
          <View style={s.badge}><Text style={s.badgeTxt}>☆ Premium</Text></View>
          <Text style={s.pageTitle}>Health Diary</Text>
          <Text style={s.pageSub}>Document your journey, moods and milestones</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowModal(true)}><Text style={s.addBtnTxt}>+ New Entry</Text></TouchableOpacity>
        {loading ? <Text style={s.empty}>Loading...</Text>
          : entries.length === 0 ? (
            <View style={s.emptyCard}>
              <Text style={s.emptyEmoji}>📖</Text>
              <Text style={s.emptyTitle}>No Diary Entries Yet</Text>
              <Text style={s.emptyBody}>Start documenting your health journey by adding your first entry.</Text>
            </View>
          ) : entries.map((e) => <EntryCard key={e.entryId} entry={e} onDelete={handleDelete} />)}
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: C.bg },
  nav:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  back:       { fontSize: 14, color: C.purple, fontWeight: '600' },
  navTitle:   { fontSize: 17, fontWeight: '700', color: C.dark },
  bannerBar:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.greenBg, borderBottomWidth: 1, borderBottomColor: C.greenBorder },
  bannerTxt:  { fontSize: 14, fontWeight: '500', color: C.green },
  list:       { paddingHorizontal: 16, paddingBottom: 32 },
  header:     { paddingVertical: 20 },
  badge:      { alignSelf: 'flex-start', backgroundColor: C.purple, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 8 },
  badgeTxt:   { fontSize: 11, fontWeight: '700', color: C.white },
  pageTitle:  { fontSize: 28, fontWeight: '800', color: C.dark, letterSpacing: -0.5, marginBottom: 4 },
  pageSub:    { fontSize: 14, color: C.subtle },
  addBtn:     { backgroundColor: C.purple, borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginBottom: 20 },
  addBtnTxt:  { fontSize: 15, fontWeight: '700', color: C.white },
  empty:      { textAlign: 'center', color: C.subtle, paddingTop: 40 },
  emptyCard:  { backgroundColor: C.white, borderRadius: 14, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.dark, marginBottom: 6 },
  emptyBody:  { fontSize: 13, color: C.subtle, textAlign: 'center' },
});

export default DiaryScreen;
