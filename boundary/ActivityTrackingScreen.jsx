import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, StatusBar, Modal, Alert, TouchableWithoutFeedback,
  Keyboard, KeyboardAvoidingView, Platform, Image} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import LogExerciseController from '../controller/LogExerciseController';
import EditExerciseLogController from '../controller/EditExerciseLogController';
import DeleteExerciseLogController from '../controller/DeleteExerciseLogController';
import ExerciseEntry from '../entity/ExerciseEntry';

const controller = new LogExerciseController();

const TABS = ['Overview', 'Exercise Log'];

// Design Tokens
const C = {
  purple:        '#7C3AED',
  purpleLight:   '#EDE9FE',
  dark:          '#111827',
  mid:           '#374151',
  body:          '#4B5563',
  subtle:        '#6B7280',
  white:         '#FFFFFF',
  border:        '#E5E7EB',
  bg:            '#F9FAFB',
  errorText:     '#DC2626',
  successBg:     '#F0FDF4',
  successBorder: '#BBF7D0',
  successText:   '#15803D',
  greenLight:    '#DCFCE7',
  greenMid:      '#16A34A',
  orangeLight:   '#FEF3C7',
  orangeMid:     '#D97706',
};


// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────

// NavBar
const NavBar = ({ onMenuPress }) => (
  <View style={nav.bar}>
    <View style={nav.brand}>
      <Image source={require('../assets/BiteWiseLogo.png')} style={nav.logo} />
      <Text style={nav.brandName}>BiteWise</Text>
    </View>
    <TouchableOpacity onPress={onMenuPress} style={nav.backBtn}>
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
  menuBtn:   { padding: 6, gap: 4, alignItems: 'flex-end' },
  menuLine:  { width: 22, height: 2.5, backgroundColor: C.dark, borderRadius: 2 },
  backBtn:  { padding: 6 },
  backText: { fontSize: 14, fontWeight: '500', color: '#374151' },
});

// Success banner
const Banner = ({ message }) => {
  if (!message) return null;
  return (
    <View style={bn.wrap}>
      <Image source={require('../assets/icon-success.png')} style={[bn.icon,{width:20,height:20,resizeMode:'contain'}]} />
      <Text style={bn.text}>{message}</Text>
    </View>
  );
};
const bn = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.successBg, borderBottomWidth: 1, borderBottomColor: C.successBorder },
  icon: { fontSize: 16 },
  text: { flex: 1, fontSize: 14, fontWeight: '500', color: C.successText },
});

// Premium badge
const PremiumBadge = () => (
  <View style={pb.wrap}><View style={{flexDirection:'row',alignItems:'center',gap:4}}><Image source={require('../assets/icon-premium-star.png')} style={{width:12,height:12,resizeMode:'contain'}} /><Text style={pb.text}>Premium</Text></View>
);
const pb = StyleSheet.create({
  wrap: { alignSelf: 'flex-start', backgroundColor: C.purple, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 8 },
  text: { fontSize: 11, fontWeight: '700', color: C.white },
});

// Tab bar
const TabBar = ({ activeTab, onSelect }) => (
  <View style={tb.bar}>
    {TABS.map((tab) => (
      <TouchableOpacity key={tab} style={[tb.tab, activeTab === tab && tb.tabActive]} onPress={() => onSelect(tab)} activeOpacity={0.8}>
        <Text style={[tb.tabText, activeTab === tab && tb.tabTextActive]}>{tab}</Text>
      </TouchableOpacity>
    ))}
  </View>
);
const tb = StyleSheet.create({
  bar:           { flexDirection: 'row', backgroundColor: C.white, borderRadius: 10, borderWidth: 1, borderColor: C.border, marginBottom: 12, overflow: 'hidden' },
  tab:           { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabActive:     { backgroundColor: C.purpleLight },
  tabText:       { fontSize: 12, fontWeight: '500', color: C.subtle },
  tabTextActive: { color: C.purple, fontWeight: '700' },
});

// Stat card — icon circle + label + value
const StatCard = ({ iconBg, icon, label, value, extra }) => (
  <View style={sc.card}>
    <View style={[sc.iconCircle, { backgroundColor: iconBg }]}>
      <Text style={sc.icon}>{icon}</Text>
    </View>
    <View style={sc.body}>
      <Text style={sc.label}>{label}</Text>
      <Text style={sc.value}>{value}</Text>
      {extra ? <Text style={sc.extra}>{extra}</Text> : null}
    </View>
  </View>
);
const sc = StyleSheet.create({
  card:       { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.white, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border },
  iconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  icon:       { fontSize: 20 },
  body:       { flex: 1 },
  label:      { fontSize: 13, color: C.subtle, marginBottom: 2 },
  value:      { fontSize: 22, fontWeight: '800', color: C.dark },
  extra:      { fontSize: 12, color: C.subtle, marginTop: 2 },
});

// Modal wrapper
const ModalSheet = ({ visible, title, subtitle, onClose, children }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={ms.overlay}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={StyleSheet.absoluteFillObject} />
      </TouchableWithoutFeedback>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        pointerEvents="box-none"
        style={ms.keyboardWrap}
      >
      <View style={ms.sheet}>
        <TouchableOpacity style={ms.closeBtn} onPress={onClose} accessibilityRole="button">
          <Image source={require('../assets/icon-close.png')} style={[ms.closeIcon,{width:16,height:16,resizeMode:'contain'}]} />
        </TouchableOpacity>
        <ScrollView
          contentContainerStyle={ms.sheetContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          showsVerticalScrollIndicator={false}
        >
          <Text style={ms.title}>{title}</Text>
          {subtitle ? <Text style={ms.subtitle}>{subtitle}</Text> : null}
          {children}
        </ScrollView>
      </View>
      </KeyboardAvoidingView>
    </View>
  </Modal>
);
const ms = StyleSheet.create({
  overlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', paddingHorizontal: 16 },
  keyboardWrap: { flex: 1, justifyContent: 'center' },
  sheet:    { maxHeight: '88%', backgroundColor: C.white, borderRadius: 16, padding: 22, paddingTop: 36 },
  sheetContent: { paddingBottom: 4 },
  closeBtn: { position: 'absolute', top: 12, right: 16, padding: 4 },
  closeIcon:{ fontSize: 16, color: C.subtle },
  title:    { fontSize: 16, fontWeight: '700', color: C.dark, textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 13, color: C.subtle, textAlign: 'center', marginBottom: 18 },
});

// Shared field
const Field = ({ label, value, onChangeText, placeholder, keyboardType, error }) => (
  <View style={fl.wrap}>
    <Text style={fl.label}>{label}</Text>
    <TextInput
      style={[fl.input, error && fl.inputError]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={C.subtle}
      keyboardType={keyboardType || 'default'}
      autoCapitalize="none"
      autoCorrect={false}
    />
    {error ? <Text style={fl.error}>{error}</Text> : null}
  </View>
);
const fl = StyleSheet.create({
  wrap:       { marginBottom: 12 },
  label:      { fontSize: 13, fontWeight: '600', color: C.dark, marginBottom: 4 },
  input:      { backgroundColor: C.bg, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: C.dark, borderWidth: 1, borderColor: C.border },
  inputError: { borderColor: '#FECACA' },
  error:      { fontSize: 12, color: C.errorText, marginTop: 3 },
});

// Exercise type picker chips
const ExerciseTypePicker = ({ value, onSelect, exerciseTypes = [] }) => (
  <View style={ep.wrap}>
    <Text style={ep.label}>Exercise Type *</Text>
    <View style={ep.grid}>
      {exerciseTypes.length === 0 ? (
        <Text style={ep.empty}>No exercise types found.</Text>
      ) : exerciseTypes.map((t) => (
        <TouchableOpacity key={t.value} style={[ep.chip, value === t.value && ep.chipActive]} onPress={() => onSelect(t.value)} activeOpacity={0.8}>
          <Text style={[ep.chipText, value === t.value && ep.chipTextActive]}>{t.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);
const ep = StyleSheet.create({
  wrap:          { marginBottom: 12 },
  label:         { fontSize: 13, fontWeight: '600', color: C.dark, marginBottom: 8 },
  grid:          { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip:          { borderWidth: 1, borderColor: C.border, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: C.white },
  chipActive:    { backgroundColor: C.purple, borderColor: C.purple },
  chipText:      { fontSize: 12, color: C.mid },
  chipTextActive:{ color: C.white, fontWeight: '600' },
  empty:         { fontSize: 12, color: C.subtle },
});


// ─── UC #58 — LOG EXERCISE MODAL ─────────────────────────────────────────────

const LogExerciseModal = ({ visible, userId, onClose, onSuccess, exerciseTypes }) => {
  const defaultExerciseType = exerciseTypes?.[0]?.value || '';
  const [exerciseType,   setExerciseType]   = useState(defaultExerciseType);
  const [durationMins,   setDurationMins]   = useState('');
  const [caloriesBurned, setCaloriesBurned] = useState('');
  const [notes,          setNotes]          = useState('');
  const [fieldErrors,    setFieldErrors]    = useState({});
  const [isLoading,      setIsLoading]      = useState(false);

  useEffect(() => {
    if (!exerciseTypes?.some((t) => t.value === exerciseType)) {
      setExerciseType(defaultExerciseType);
    }
  }, [defaultExerciseType, exerciseType, exerciseTypes]);

  const reset = () => {
    setExerciseType(defaultExerciseType);
    setDurationMins('');
    setCaloriesBurned('');
    setNotes('');
    setFieldErrors({});
  };

  const handleClose = () => { reset(); onClose(); };

  // FIX 2: onSuccess added to dependency array to prevent stale closure
  const handleSubmit = useCallback(async () => {
    setFieldErrors({});
    setIsLoading(true);

    const result = await controller.logExercise(userId, {
      exerciseType,
      durationMins,
      caloriesBurned,
      notes,
    });

    setIsLoading(false);

    if (result.success) {
      reset();
      onSuccess(result.message, result.data);
    } else if (result.field) {
      setFieldErrors({ [result.field]: result.message });
    }
  }, [exerciseType, durationMins, caloriesBurned, notes, userId, onSuccess]);  // FIX 2

  return (
    <ModalSheet
      visible={visible}
      title="Log Exercise Session"
      subtitle="Record your workout or physical activity"
      onClose={handleClose}
    >
      <ExerciseTypePicker value={exerciseType} onSelect={setExerciseType} exerciseTypes={exerciseTypes} />
      <Field
        label="Duration (minutes) *"
        value={durationMins}
        onChangeText={setDurationMins}
        placeholder="30"
        keyboardType="numeric"
        error={fieldErrors.durationMins}
      />
      <Field
        label="Calories Burned (optional)"
        value={caloriesBurned}
        onChangeText={setCaloriesBurned}
        placeholder="Auto-calculated if left empty"
        keyboardType="numeric"
      />
      <Field
        label="Notes (optional)"
        value={notes}
        onChangeText={setNotes}
        placeholder="Great workout!"
      />
      <TouchableOpacity
        style={[le.btn, isLoading && le.btnDisabled]}
        onPress={handleSubmit}
        activeOpacity={0.85}
        disabled={isLoading || exerciseTypes.length === 0}
      >
        <Text style={le.btnText}>{isLoading ? 'Logging...' : 'Log Exercise'}</Text>
      </TouchableOpacity>
    </ModalSheet>
  );
};
const le = StyleSheet.create({
  btn:        { backgroundColor: C.purple, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  btnDisabled:{ opacity: 0.6 },
  btnText:    { fontSize: 15, fontWeight: '700', color: C.white },
});


// ─── OVERVIEW TAB ─────────────────────────────────────────────────────────────

const OverviewTab = ({ exerciseEntries }) => {
  const totalBurned = exerciseEntries.reduce((s, e) => s + e.caloriesBurned, 0);

  return (
    <View>
      <StatCard iconBg="#EDE9FE" icon={require('../assets/stat-exercise.png')} label="Today's Exercises" value={String(exerciseEntries.length)} />
      <StatCard iconBg="#FEF3C7" icon={require('../assets/stat-calories-burned.png')}  label="Calories Burned"   value={String(totalBurned)} />
    </View>
  );
};
// FIX 1: removed the unclosed `const ov = StyleSheet.create({` that was here.
// It was opened but never closed, causing every subsequent component and StyleSheet
// to be parsed as part of the broken object literal — a fatal compile error.
// `ov` was also never referenced anywhere in the file.


// ─── EXERCISE LOG TAB ────────────────────────────────────────────────────────

const ExerciseLogTab = ({ exerciseEntries, onOpenLog, onEditExercise, onDeleteExercise }) => {
  const total7Day = exerciseEntries.reduce((s, e) => s + e.caloriesBurned, 0);

  return (
    <View>
      {/* 7-day stat */}
      <StatCard iconBg={C.greenLight} icon={require('../assets/stat-7day.png')} label="7-Day Total" value={String(total7Day)} />

      {/* All sessions */}
      <View style={el.card}>
        <View style={el.headerRow}>
          <Text style={el.heading}>
            {exerciseEntries.length === 0 ? 'Recent Exercises' : 'All Exercise Sessions'}
          </Text>
          <TouchableOpacity style={el.logBtn} onPress={onOpenLog} activeOpacity={0.85}>
            <Text style={el.logBtnText}>+ Log Exercise</Text>
          </TouchableOpacity>
        </View>

        {exerciseEntries.length === 0 ? (
          <Text style={el.empty}>No exercises logged yet. Start tracking your workouts!</Text>
        ) : (
          exerciseEntries.map((e, i) => (
            <View key={e.entryId ?? i} style={el.row}>
              <View style={el.rowLeft}>
                <Text style={el.rowType}>{e.exerciseType}</Text>
                <Text style={el.rowMeta}>{e.durationMins} minutes • {e.caloriesBurned} calories burned</Text>
                {e.notes ? <Text style={el.rowNotes}>{e.notes}</Text> : null}
              </View>
              <View style={el.rowRight}>
                <Text style={el.rowDate}>
                  {new Date(e.loggedAt).toLocaleDateString('en-SG', { day: 'numeric', month: 'numeric', year: 'numeric' })}
                </Text>
                <Text style={el.rowTime}>
                  {new Date(e.loggedAt).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <View style={{ flexDirection:'row', gap:6, marginTop:6 }}>
                  <TouchableOpacity onPress={() => onEditExercise(e)} style={{ padding:4 }}><Image source={require('../assets/icon-edit.png')} style={{width:15,height:15,resizeMode:'contain'}} /></TouchableOpacity>
                  <TouchableOpacity onPress={() => onDeleteExercise(e.entryId)} style={{ padding:4 }}><Image source={require('../assets/icon-delete.png')} style={{width:15,height:15,resizeMode:'contain'}} /></TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );
};
const el = StyleSheet.create({
  card:      { backgroundColor: C.white, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  heading:   { fontSize: 15, fontWeight: '700', color: C.dark },
  logBtn:    { backgroundColor: C.purple, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14 },
  logBtnText:{ fontSize: 13, fontWeight: '700', color: C.white },
  empty:     { fontSize: 14, color: C.subtle, textAlign: 'center', paddingVertical: 24 },
  row:       { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.border },
  rowLeft:   { flex: 1 },
  rowType:   { fontSize: 14, fontWeight: '700', color: C.dark, marginBottom: 2 },
  rowMeta:   { fontSize: 12, color: C.subtle, marginBottom: 2 },
  rowNotes:  { fontSize: 12, color: C.subtle, fontStyle: 'italic' },
  rowRight:  { alignItems: 'flex-end' },
  rowDate:   { fontSize: 12, color: C.mid },
  rowTime:   { fontSize: 12, color: C.purple },
});


// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────

const ActivityTrackingScreen = ({ navigation, route }) => {
  const user = route?.params?.user || null;

  const [activeTab,       setActiveTab]       = useState('Overview');
  const [exerciseEntries, setExerciseEntries] = useState([]);
  const [exerciseTypes,   setExerciseTypes]   = useState([]);
  const [editingExercise, setEditingExercise] = useState(null);
  const [editExType, setEditExType] = useState('');
  const [editExDuration, setEditExDuration] = useState('');
  const [editExCalories, setEditExCalories] = useState('');
  const [editExNotes, setEditExNotes] = useState('');
  const [editExSaving, setEditExSaving] = useState(false);
  const editExCtrl = new EditExerciseLogController();
  const deleteExCtrl = new DeleteExerciseLogController();
  const [showLogModal,    setShowLogModal]    = useState(false);
  const [banner,          setBanner]          = useState('');

  const handleEditExercise = useCallback((entry) => {
    setEditingExercise(entry);
    setEditExType(entry.exerciseType || '');
    setEditExDuration(String(entry.durationMins || ''));
    setEditExCalories(String(entry.caloriesBurned || ''));
    setEditExNotes(entry.notes || '');
  }, []);

  const handleEditExSave = useCallback(async () => {
    if (!editingExercise) return;
    setEditExSaving(true);
    const result = await editExCtrl.updateExercise(editingExercise.entryId, {
      exerciseType: editExType, durationMins: editExDuration,
      caloriesBurned: editExCalories, notes: editExNotes,
    });
    setEditExSaving(false);
    if (result.success) {
      setExerciseEntries((prev) => prev.map((e) =>
        e.entryId === editingExercise.entryId ? { ...e, ...result.data } : e
      ));
      setEditingExercise(null);
      handleExerciseLogged(result.message, null);
    } else {
      Alert.alert('Error', result.message);
    }
  }, [editingExercise, editExType, editExDuration, editExCalories, editExNotes]);

  const handleDeleteExercise = useCallback((entryId) => {
    Alert.alert('Delete Exercise Log', 'Remove this exercise log permanently?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          const result = await deleteExCtrl.deleteExercise(entryId);
          if (result.success) {
            setExerciseEntries((prev) => prev.filter((e) => e.entryId !== entryId));
            handleExerciseLogged(result.message, null);
          } else {
            Alert.alert('Error', result.message);
          }
        }},
    ]);
  }, []);

  const handleExerciseLogged = useCallback((message, entry) => {
    setShowLogModal(false);
    setBanner(message);
    if (entry) {
      setExerciseEntries((prev) => [entry, ...prev]);
    }
    setActiveTab('Exercise Log');
    setTimeout(() => setBanner(''), 4000);
  }, []);

  // FIX 3: dependency changed from [user] → [user?.userId] so the fetch only
  // re-runs when the user ID actually changes, not on every parent re-render.
  useFocusEffect(
    useCallback(() => {
      if (!user?.userId) return;

      const fetchEntries = async () => {
        try {
          const data = await controller.fetchTodayEntries(user.userId);
          setExerciseEntries(data);
        } catch (err) {
          console.error('Failed to fetch exercise entries', err);
        }
      };

      const fetchExerciseTypes = async () => {
        try {
          const types = await ExerciseEntry.getExerciseTypes();
          setExerciseTypes(types);
        } catch (err) {
          console.error('Failed to fetch exercise types', err);
        }
      };

      fetchEntries();
      fetchExerciseTypes();
    }, [user?.userId])  // FIX 3
  );

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />

      <NavBar onMenuPress={() => navigation.goBack()} />
      <Banner message={banner} />

      {/* UC #58 modal */}
      <LogExerciseModal
        visible={showLogModal}
        userId={user?.userId}
        onClose={() => setShowLogModal(false)}
        onSuccess={handleExerciseLogged}
        exerciseTypes={exerciseTypes}
      />

      <ModalSheet
        visible={Boolean(editingExercise)}
        title="Edit Exercise Log"
        subtitle="Update your workout details"
        onClose={() => setEditingExercise(null)}
      >
        <ExerciseTypePicker value={editExType} onSelect={setEditExType} exerciseTypes={exerciseTypes} />
        <Field
          label="Duration (minutes) *"
          value={editExDuration}
          onChangeText={setEditExDuration}
          placeholder="30"
          keyboardType="numeric"
        />
        <Field
          label="Calories Burned (optional)"
          value={editExCalories}
          onChangeText={setEditExCalories}
          placeholder="Auto-calculated if left empty"
          keyboardType="numeric"
        />
        <Field
          label="Notes (optional)"
          value={editExNotes}
          onChangeText={setEditExNotes}
          placeholder="Great workout!"
        />
        <TouchableOpacity
          style={[le.btn, editExSaving && le.btnDisabled]}
          onPress={handleEditExSave}
          activeOpacity={0.85}
          disabled={editExSaving}
        >
          <Text style={le.btnText}>{editExSaving ? 'Saving...' : 'Save Changes'}</Text>
        </TouchableOpacity>
      </ModalSheet>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >

        {/* Header */}
        <View style={styles.header}>
          <PremiumBadge />
          <Text style={styles.pageTitle}>Activity Tracking</Text>
          <Text style={styles.pageSubtitle}>Track your exercise and daily activity</Text>
        </View>

        <TabBar activeTab={activeTab} onSelect={setActiveTab} />

        {activeTab === 'Overview'     && <OverviewTab     exerciseEntries={exerciseEntries} />}
        {activeTab === 'Exercise Log' && <ExerciseLogTab exerciseEntries={exerciseEntries} onOpenLog={() => setShowLogModal(true)} onEditExercise={handleEditExercise} onDeleteExercise={handleDeleteExercise} />}

      </ScrollView>
          </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: C.bg },
  list: { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 32 },
  header:       { paddingVertical: 20 },
  pageTitle:    { fontSize: 28, fontWeight: '800', color: C.dark, letterSpacing: -0.5, marginBottom: 4 },
  pageSubtitle: { fontSize: 14, color: C.subtle },
});

export default ActivityTrackingScreen;
