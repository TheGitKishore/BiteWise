import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  StatusBar,
  Modal,
  Alert,
  Image,
  Keyboard, KeyboardAvoidingView, Platform, TouchableWithoutFeedback} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

import ViewDiaryController from '../controller/ViewDiaryController';
import CreateDiaryEntryController from '../controller/CreateDiaryEntryController';
import DeleteDiaryEntryController from '../controller/DeleteDiaryEntryController';
import EditDiaryEntryController from '../controller/EditDiaryEntryController';
import API_CONFIG from '../entity/api_config';

const viewCtrl = new ViewDiaryController();
const createCtrl = new CreateDiaryEntryController();
const editCtrl   = new EditDiaryEntryController();
const deleteCtrl = new DeleteDiaryEntryController();

const C = {
  purple: '#7C3AED',
  purpleLight: '#EDE9FE',
  dark: '#111827',
  mid: '#374151',
  subtle: '#6B7280',
  white: '#FFFFFF',
  border: '#E5E7EB',
  bg: '#F9FAFB',
  errorText: '#DC2626',
  green: '#16A34A',
  greenBg: '#F0FDF4',
  greenBorder: '#BBF7D0',
};

const UPLOAD_URL = `${API_CONFIG}/uploads/diary-photo`;

const EntryModal = ({ visible, userId, onClose, onSaved }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('');
  const [weight, setWeight] = useState('');
  const [photoUri, setPhotoUri] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setTitle('');
    setContent('');
    setMood('');
    setWeight('');
    setPhotoUri('');
    setErrors({});
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const requestMediaPermission = async (mode) => {
    if (mode === 'camera') {
      const p = await ImagePicker.requestCameraPermissionsAsync();
      return p?.granted;
    }

    const p = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return p?.granted;
  };

  const pickFromLibrary = async () => {
    const granted = await requestMediaPermission('library');
    if (!granted) {
      Alert.alert('Permission needed', 'Allow photo library access to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const granted = await requestMediaPermission('camera');
    if (!granted) {
      Alert.alert('Permission needed', 'Allow camera access to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const uploadPhoto = async (localUri) => {
    const formData = new FormData();
    formData.append('photo', {
      uri: localUri,
      name: `diary-${Date.now()}.jpg`,
      type: 'image/jpeg',
    });

    const res = await fetch(UPLOAD_URL, {
      method: 'POST',
      body: formData,
    });

    const payload = await res.json();
    if (!res.ok || !payload?.success || !payload?.photoUri) {
      throw new Error(payload?.message || 'Photo upload failed.');
    }

    return payload.photoUri;
  };

  const handleAddPhoto = () => {
    Alert.alert('Add Photo', 'Choose how you want to add your diary photo.', [
      { text: 'Take Photo', onPress: takePhoto },
      { text: 'Choose from Library', onPress: pickFromLibrary },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSave = useCallback(async () => {
    setErrors({});
    setSaving(true);

    const result = await createCtrl.createEntry(userId, { title, content, mood, weight });

    if (!result.success) {
      setSaving(false);
      if (result.field) setErrors({ [result.field]: result.message });
      return;
    }

    let finalEntry = result.data;
    let finalMessage = result.message;

    if (photoUri && result.data?.entryId) {
      try {
        const cloudinaryUrl = await uploadPhoto(photoUri);
        const attach = await createCtrl.addPhoto(result.data.entryId, cloudinaryUrl);

        if (attach.success && attach.data) {
          finalEntry = attach.data;
          finalMessage = 'Diary entry created with photo.';
        } else {
          finalMessage = 'Diary entry created. Photo could not be attached.';
        }
      } catch (e) {
        finalMessage = `Diary entry created. ${e?.message || 'Photo upload failed.'}`;
      }
    }

    setSaving(false);
    reset();
    onSaved(finalMessage, finalEntry);
  }, [title, content, mood, weight, userId, photoUri]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={m.overlay}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={m.sheet}>
          <TouchableOpacity style={m.closeBtn} onPress={handleClose}>
            <Text style={m.closeX}>X</Text>
          </TouchableOpacity>
          <Text style={m.heading}>New Diary Entry</Text>

          <Text style={m.label}>Title *</Text>
          {errors.title ? <Text style={m.err}>{errors.title}</Text> : null}
          <TextInput
            style={[m.input, errors.title && m.inputErr]}
            value={title}
            onChangeText={setTitle}
            placeholder="Entry title..."
            placeholderTextColor={C.subtle}
          />

          <Text style={[m.label, { marginTop: 10 }]}>Entry *</Text>
          {errors.content ? <Text style={m.err}>{errors.content}</Text> : null}
          <TextInput
            style={[m.input, m.multiline, errors.content && m.inputErr]}
            value={content}
            onChangeText={setContent}
            placeholder="Write about your day, progress, goals..."
            placeholderTextColor={C.subtle}
            multiline
            textAlignVertical="top"
          />

          <Text style={[m.label, { marginTop: 10 }]}>Mood (Optional)</Text>
          <TextInput
            style={m.input}
            value={mood}
            onChangeText={setMood}
            placeholder="How are you feeling today?"
            placeholderTextColor={C.subtle}
          />

          <Text style={[m.label, { marginTop: 10 }]}>Weight (Optional)</Text>
          {errors.weight ? <Text style={m.err}>{errors.weight}</Text> : null}
          <TextInput
            style={[m.input, errors.weight && m.inputErr]}
            value={weight}
            onChangeText={setWeight}
            placeholder="e.g. 68.5"
            placeholderTextColor={C.subtle}
            keyboardType="decimal-pad"
          />

          <TouchableOpacity style={m.photoBtn} onPress={handleAddPhoto}>
            <Text style={m.photoBtnTxt}>Add Photo</Text>
          </TouchableOpacity>

          {photoUri ? (
            <View style={m.previewWrap}>
              <Image source={{ uri: photoUri }} style={m.previewImage} resizeMode="cover" />
              <TouchableOpacity style={m.removePhotoBtn} onPress={() => setPhotoUri('')}>
                <Text style={m.removePhotoTxt}>Remove Photo</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <TouchableOpacity style={[m.saveBtn, saving && m.disabled]} onPress={handleSave} disabled={saving}>
            <Text style={m.saveBtnTxt}>{saving ? 'Saving...' : 'Save Entry'}</Text>
          </TouchableOpacity>
        </View>
        </TouchableWithoutFeedback>
      </View>
    </Modal>
  );
};

const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', paddingHorizontal: 16 },
  sheet: { backgroundColor: C.white, borderRadius: 16, padding: 22, paddingTop: 40 },
  closeBtn: { position: 'absolute', top: 12, right: 16 },
  closeX: { fontSize: 16, color: C.subtle },
  heading: { fontSize: 16, fontWeight: '700', color: C.dark, textAlign: 'center', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: C.dark, marginBottom: 4 },
  err: { fontSize: 12, color: C.errorText, marginBottom: 4 },
  input: { backgroundColor: C.bg, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: C.dark, borderWidth: 1, borderColor: C.border, marginBottom: 4 },
  inputErr: { borderColor: '#FECACA' },
  multiline: { minHeight: 100 },
  photoBtn: { backgroundColor: C.bg, borderRadius: 8, borderWidth: 1, borderColor: C.border, paddingVertical: 10, alignItems: 'center', marginVertical: 10 },
  photoBtnTxt: { fontSize: 14, color: C.mid, fontWeight: '600' },
  previewWrap: { marginBottom: 10 },
  previewImage: { width: '100%', height: 150, borderRadius: 8, borderWidth: 1, borderColor: C.border },
  removePhotoBtn: { alignSelf: 'flex-end', marginTop: 8, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: C.border },
  removePhotoTxt: { fontSize: 12, color: C.subtle, fontWeight: '600' },
  saveBtn: { backgroundColor: C.purple, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  saveBtnTxt: { fontSize: 15, fontWeight: '700', color: C.white },
  disabled: { opacity: 0.6 },
});

const EntryCard = ({ entry, onDelete, onEdit }) => (
  <View style={ec.card}>
    <View style={ec.row}>
      <View style={ec.info}>
        <Text style={ec.title}>{entry.title}</Text>
        <Text style={ec.meta}>
          {[
            new Date(entry.createdAt).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' }),
            entry.mood ? `Mood: ${entry.mood}` : null,
            entry.weight ? `Weight: ${entry.weight} kg` : null,
          ].filter(Boolean).join('  |  ')}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TouchableOpacity style={ec.editBtn} onPress={() => onEdit(entry)}>
          <Image source={require('../assets/icon-edit.png')} style={[ec.editIcon,{width:16,height:16,resizeMode:'contain'}]} />
        </TouchableOpacity>
        <TouchableOpacity style={ec.del} onPress={() => onDelete(entry.entryId)}>
          <Text style={ec.delIcon}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
    {entry.photoUri ? <Image source={{ uri: entry.photoUri }} style={ec.photo} resizeMode="cover" /> : null}
    <Text style={ec.body}>{entry.content}</Text>
  </View>
);

const ec = StyleSheet.create({
  card: { backgroundColor: C.white, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 12 },
  editBtn: { padding: 4 },
  editIcon: { fontSize: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  info: { flex: 1 },
  title: { fontSize: 16, fontWeight: '700', color: C.dark, marginBottom: 2 },
  meta: { fontSize: 12, color: C.subtle },
  del: { padding: 4 },
  delIcon: { fontSize: 12, color: '#DC2626', fontWeight: '700' },
  photo: { width: '100%', height: 160, borderRadius: 8, marginBottom: 10 },
  body: { fontSize: 14, color: C.mid, lineHeight: 20 },
});

const DiaryScreen = ({ navigation, route }) => {
  const user = route?.params?.user || null;
  const [entries, setEntries] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [banner, setBanner] = useState('');
  const [editingEntry, setEditingEntry] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editMood, setEditMood] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const showBanner = (msg) => {
    setBanner(msg);
    setTimeout(() => setBanner(''), 3000);
  };

  useFocusEffect(useCallback(() => {
    if (!user?.userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    viewCtrl.fetchEntries(user.userId).then((r) => {
      if (r.success) setEntries(r.data);
      setLoading(false);
    });
  }, [user?.userId]));

  const handleEdit = useCallback((entry) => {
    setEditingEntry(entry);
    setEditTitle(entry.title || '');
    setEditContent(entry.content || '');
    setEditMood(entry.mood || '');
    setEditWeight(entry.weight ? String(entry.weight) : '');
  }, []);

  const handleEditSave = useCallback(async () => {
    if (!editingEntry) return;
    setEditSaving(true);
    const result = await editCtrl.updateEntry(editingEntry.entryId, {
      title: editTitle, content: editContent, mood: editMood, weight: editWeight,
    });
    setEditSaving(false);
    if (result.success) {
      setEntries((prev) => prev.map((e) =>
        e.entryId === editingEntry.entryId ? { ...e, ...result.data } : e
      ));
      setEditingEntry(null);
      setBanner(result.message);
      setTimeout(() => setBanner(''), 4000);
    } else {
      Alert.alert('Error', result.message);
    }
  }, [editingEntry, editTitle, editContent, editMood, editWeight]);

  const handleDelete = useCallback((entryId) => {
    Alert.alert('Delete Entry', 'Remove this diary entry permanently?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const r = await deleteCtrl.deleteEntry(entryId);
          if (r.success) {
            setEntries((p) => p.filter((e) => e.entryId !== entryId));
            showBanner('Entry deleted.');
          }
        }
      },
    ]);
  }, []);

  const handleSaved = useCallback((msg, entry) => {
    setShowModal(false);
    setEntries((p) => [entry, ...p]);
    showBanner(msg);
  }, []);

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />
      <View style={s.nav}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>Back</Text>
        </TouchableOpacity>
        <Text style={s.navTitle}>Health Diary</Text>
        <View style={{ width: 50 }} />
      </View>

      {banner ? (
        <View style={s.bannerBar}>
          <Text style={s.bannerTxt}>{banner}</Text>
        </View>
      ) : null}

      <EntryModal
        visible={showModal}
        userId={user?.userId}
        onClose={() => setShowModal(false)}
        onSaved={handleSaved}
      />

      <Modal visible={Boolean(editingEntry)} transparent animationType="slide" onRequestClose={() => setEditingEntry(null)}>
        <View style={m.overlay}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={m.sheet}>
            <TouchableOpacity style={m.closeBtn} onPress={() => setEditingEntry(null)}>
              <Text style={m.closeX}>X</Text>
            </TouchableOpacity>
            <Text style={m.heading}>Edit Diary Entry</Text>

            <Text style={m.label}>Title *</Text>
            <TextInput
              style={m.input}
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="Entry title..."
              placeholderTextColor={C.subtle}
            />

            <Text style={[m.label, { marginTop: 10 }]}>Entry *</Text>
            <TextInput
              style={[m.input, m.multiline]}
              value={editContent}
              onChangeText={setEditContent}
              placeholder="Write about your day, progress, goals..."
              placeholderTextColor={C.subtle}
              multiline
              textAlignVertical="top"
            />

            <Text style={[m.label, { marginTop: 10 }]}>Mood (Optional)</Text>
            <TextInput
              style={m.input}
              value={editMood}
              onChangeText={setEditMood}
              placeholder="How are you feeling today?"
              placeholderTextColor={C.subtle}
            />

            <Text style={[m.label, { marginTop: 10 }]}>Weight (Optional)</Text>
            <TextInput
              style={m.input}
              value={editWeight}
              onChangeText={setEditWeight}
              placeholder="e.g. 68.5"
              placeholderTextColor={C.subtle}
              keyboardType="decimal-pad"
            />

            <TouchableOpacity style={[m.saveBtn, editSaving && m.disabled]} onPress={handleEditSave} disabled={editSaving}>
              <Text style={m.saveBtnTxt}>{editSaving ? 'Saving...' : 'Save Changes'}</Text>
            </TouchableOpacity>
          </View>
          </TouchableWithoutFeedback>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={s.list}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
        <View style={s.header}>
          <View style={s.badge}><Text style={s.badgeTxt}>Premium</Text></View>
          <Text style={s.pageTitle}>Health Diary</Text>
          <Text style={s.pageSub}>Document your journey, moods and milestones</Text>
        </View>

        <TouchableOpacity style={s.addBtn} onPress={() => setShowModal(true)}>
          <Text style={s.addBtnTxt}>+ New Entry</Text>
        </TouchableOpacity>

        {loading ? (
          <Text style={s.empty}>Loading...</Text>
        ) : entries.length === 0 ? (
          <View style={s.emptyCard}>
            <Text style={s.emptyTitle}>No Diary Entries Yet</Text>
            <Text style={s.emptyBody}>Start documenting your health journey by adding your first entry.</Text>
          </View>
        ) : entries.map((e) => (
          <EntryCard key={e.entryId} entry={e} onDelete={handleDelete} onEdit={handleEdit} />
        ))}
      </ScrollView>
          </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  back: { fontSize: 14, color: C.purple, fontWeight: '600' },
  navTitle: { fontSize: 17, fontWeight: '700', color: C.dark },
  bannerBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.greenBg, borderBottomWidth: 1, borderBottomColor: C.greenBorder },
  bannerTxt: { fontSize: 14, fontWeight: '500', color: C.green },
  list: { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 32 },
  header: { paddingVertical: 20 },
  badge: { alignSelf: 'flex-start', backgroundColor: C.purple, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 8 },
  badgeTxt: { fontSize: 11, fontWeight: '700', color: C.white },
  pageTitle: { fontSize: 28, fontWeight: '800', color: C.dark, letterSpacing: -0.5, marginBottom: 4 },
  pageSub: { fontSize: 14, color: C.subtle },
  addBtn: { backgroundColor: C.purple, borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginBottom: 20 },
  addBtnTxt: { fontSize: 15, fontWeight: '700', color: C.white },
  empty: { textAlign: 'center', color: C.subtle, paddingTop: 40 },
  emptyCard: { backgroundColor: C.white, borderRadius: 14, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.dark, marginBottom: 6 },
  emptyBody: { fontSize: 13, color: C.subtle, textAlign: 'center' },
});

export default DiaryScreen;
