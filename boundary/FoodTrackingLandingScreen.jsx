import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, StatusBar, ActivityIndicator, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';

import ViewFoodDatabaseController          from '../controller/ViewFoodDatabaseController';
import CreateManualFoodEntryController     from '../controller/CreateManualFoodEntryController';
import CameraFoodEntryController           from '../controller/CameraFoodEntryController';
import SetDailyCalorieLimitController      from '../controller/SetDailyCalorieLimitController';
import ViewPastCalorieEntriesController    from '../controller/ViewPastCalorieEntriesController';
import ViewCurrentCalorieIntakeController  from '../controller/ViewCurrentCalorieIntakeController';
import CheckDailyCalorieTargetController   from '../controller/CheckDailyCalorieTargetController';
import UserController from '../controller/UserController';

const dbController          = new ViewFoodDatabaseController();
const manualController      = new CreateManualFoodEntryController();
const cameraController      = new CameraFoodEntryController();
const goalController        = new SetDailyCalorieLimitController();
const historyController     = new ViewPastCalorieEntriesController();
const intakeController      = new ViewCurrentCalorieIntakeController();
const targetController      = new CheckDailyCalorieTargetController();
const userController = new UserController();

const MEAL_OPTIONS = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
const TABS         = ['Log Food', "Today's Entries", 'History'];

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
  bg:           '#F9FAFB',
  errorText:    '#DC2626',
  successBg:    '#F0FDF4',
  successBorder:'#BBF7D0',
  successText:  '#15803D',
  warnBg:       '#FFFBEB',
  warnBorder:   '#FDE68A',
  warnText:     '#92400E',
};


// SUB-COMPONENTS

// NavBar
const NavBar = ({ onMenuPress }) => (
  <View style={nav.bar}>
    <View style={nav.brand}>
      <Text style={nav.icon}>🍴</Text>
      <Text style={nav.brandName}>BiteWise</Text>
    </View>
    <TouchableOpacity onPress={onMenuPress} style={nav.menuBtn} accessibilityRole="button">
      <View style={nav.menuLine} />
      <View style={[nav.menuLine, { width: 18 }]} />
      <View style={nav.menuLine} />
    </TouchableOpacity>
  </View>
);
const nav = StyleSheet.create({
  bar:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  brand:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  icon:     { fontSize: 20 },
  brandName:{ fontSize: 20, fontWeight: '800', color: C.dark, letterSpacing: -0.3 },
  menuBtn:  { padding: 6, gap: 4, alignItems: 'flex-end' },
  menuLine: { width: 22, height: 2.5, backgroundColor: C.dark, borderRadius: 2 },
});

// Banner
const Banner = ({ message }) => {
  if (!message) return null;
  return (
    <View style={bn.wrap}>
      <Text style={bn.icon}>✅</Text>
      <Text style={bn.text}>{message}</Text>
    </View>
  );
};
const bn = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.successBg, borderBottomWidth: 1, borderBottomColor: C.successBorder },
  icon: { fontSize: 16 },
  text: { flex: 1, fontSize: 14, fontWeight: '500', color: C.successText },
});


// TODAY'S PROGRESS CARD — UC #20, #21

const TodaysProgressCard = ({ target }) => {
  const barColor = target.status === 'exceeded'   ? '#DC2626'
                 : target.status === 'near_limit' ? '#F59E0B'
                 : C.purple;

  return (
    <View style={tp.card}>
      <Text style={tp.heading}>Today's Progress</Text>
      <View style={tp.calRow}>
        <Text style={tp.calLabel}>Calories</Text>
        <Text style={tp.calValue}>
          {target.status === 'no_target'
            ? `${target.consumed} kcal`
            : `${target.consumed} / ${target.goal} kcal`}
        </Text>
      </View>
      <View style={tp.barTrack}>
        <View style={[tp.barFill, { width: `${target.percentage}%`, backgroundColor: barColor }]} />
      </View>
      {target.status === 'no_target' && (
        <Text style={tp.noTarget}>No daily target set — tap Set Daily Goal to add one.</Text>
      )}
      {target.status !== 'no_target' && (
        <View style={tp.remainRow}>
          <Text style={tp.remainLabel}>Remaining</Text>
          <Text style={tp.remainValue}>{target.remaining} kcal</Text>
        </View>
      )}
    </View>
  );
};
const tp = StyleSheet.create({
  card:        { backgroundColor: C.white, borderRadius: 14, padding: 18, borderWidth: 1, borderColor: C.border, marginBottom: 12 },
  heading:     { fontSize: 15, fontWeight: '700', color: C.dark, marginBottom: 12 },
  calRow:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  calLabel:    { fontSize: 13, color: C.subtle },
  calValue:    { fontSize: 13, fontWeight: '600', color: C.dark },
  barTrack:    { height: 6, backgroundColor: C.purpleLight, borderRadius: 3, marginBottom: 10, overflow: 'hidden' },
  barFill:     { height: 6, borderRadius: 3 },
  remainRow:   { flexDirection: 'row', justifyContent: 'space-between' },
  remainLabel: { fontSize: 13, color: C.subtle },
  remainValue: { fontSize: 13, fontWeight: '600', color: C.dark },
  noTarget:    { fontSize: 12, color: C.subtle, fontStyle: 'italic' },
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
  tabText:       { fontSize: 13, fontWeight: '500', color: C.subtle },
  tabTextActive: { color: C.purple, fontWeight: '700' },
});

// Action tile
const ActionTile = ({ icon, title, subtitle, onPress }) => (
  <TouchableOpacity style={at.card} onPress={onPress} activeOpacity={0.8}>
    <View style={at.iconWrap}><Text style={at.icon}>{icon}</Text></View>
    <Text style={at.title}>{title}</Text>
    <Text style={at.subtitle}>{subtitle}</Text>
  </TouchableOpacity>
);
const at = StyleSheet.create({
  card:    { backgroundColor: C.white, borderRadius: 14, padding: 24, marginBottom: 12, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  iconWrap:{ marginBottom: 10 },
  icon:    { fontSize: 32 },
  title:   { fontSize: 15, fontWeight: '700', color: C.dark, marginBottom: 4 },
  subtitle:{ fontSize: 13, color: C.subtle },
});

// Food database row with inline stepper
const FoodRow = ({ item, qty, isExpanded, onAdd, onIncrement, onDecrement, onLog }) => (
  <View style={fdr.row}>
    <View style={fdr.info}>
      <Text style={fdr.name}>{item.name}</Text>
      <Text style={fdr.meta}>{item.getDisplayMeta()}</Text>
    </View>
    {isExpanded ? (
      <View style={fdr.stepper}>
        <TouchableOpacity style={fdr.stepBtn} onPress={onDecrement}><Text style={fdr.stepIcon}>−</Text></TouchableOpacity>
        <Text style={fdr.qty}>{qty}</Text>
        <TouchableOpacity style={fdr.stepBtn} onPress={onIncrement}><Text style={fdr.stepIcon}>+</Text></TouchableOpacity>
        <TouchableOpacity style={fdr.logBtn} onPress={onLog}><Text style={fdr.logText}>Log</Text></TouchableOpacity>
      </View>
    ) : (
      <TouchableOpacity style={fdr.addBtn} onPress={onAdd}><Text style={fdr.addIcon}>+</Text></TouchableOpacity>
    )}
  </View>
);
const fdr = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  info:    { flex: 1 },
  name:    { fontSize: 14, fontWeight: '600', color: C.dark, marginBottom: 2 },
  meta:    { fontSize: 12, color: C.subtle },
  addBtn:  { width: 32, height: 32, borderRadius: 8, backgroundColor: C.purple, alignItems: 'center', justifyContent: 'center' },
  addIcon: { fontSize: 20, color: C.white, lineHeight: 24, fontWeight: '700' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepBtn: { width: 28, height: 28, borderRadius: 6, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', backgroundColor: C.white },
  stepIcon:{ fontSize: 16, color: C.dark, lineHeight: 20 },
  qty:     { fontSize: 15, fontWeight: '700', color: C.purple, minWidth: 20, textAlign: 'center' },
  logBtn:  { backgroundColor: C.purple, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  logText: { fontSize: 13, fontWeight: '700', color: C.white },
});

// Modal wrapper
const ModalSheet = ({ visible, title, subtitle, onClose, children }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={ms.overlay}>
      <View style={ms.sheet}>
        <TouchableOpacity style={ms.closeBtn} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
          <Text style={ms.closeIcon}>✕</Text>
        </TouchableOpacity>
        <Text style={ms.title}>{title}</Text>
        {subtitle ? <Text style={ms.subtitle}>{subtitle}</Text> : null}
        {children}
      </View>
    </View>
  </Modal>
);
const ms = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', paddingHorizontal: 16 },
  sheet:   { backgroundColor: C.white, borderRadius: 16, padding: 22, paddingTop: 36 },
  closeBtn:{ position: 'absolute', top: 12, right: 16, padding: 4 },
  closeIcon:{ fontSize: 16, color: C.subtle },
  title:   { fontSize: 16, fontWeight: '700', color: C.dark, textAlign: 'center', marginBottom: 4 },
  subtitle:{ fontSize: 13, color: C.subtle, textAlign: 'center', marginBottom: 18 },
});

// Shared labelled field
const Field = ({ label, value, onChangeText, placeholder, keyboardType, error }) => (
  <View style={fl.wrap}>
    <Text style={fl.label}>{label}</Text>
    <TextInput style={[fl.input, error && fl.inputError]} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={C.subtle} keyboardType={keyboardType || 'default'} autoCapitalize="none" autoCorrect={false} />
    {error ? <Text style={fl.error}>{error}</Text> : null}
  </View>
);
const fl = StyleSheet.create({
  wrap:      { marginBottom: 12 },
  label:     { fontSize: 13, fontWeight: '600', color: C.dark, marginBottom: 4 },
  input:     { backgroundColor: C.bg, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: C.dark, borderWidth: 1, borderColor: C.border },
  inputError:{ borderColor: '#FECACA' },
  error:     { fontSize: 12, color: C.errorText, marginTop: 3 },
});

// Meal picker chips
const MealPicker = ({ value, onSelect }) => (
  <View style={mp.wrap}>
    <Text style={mp.label}>Meal</Text>
    <View style={mp.row}>
      {MEAL_OPTIONS.map((m) => (
        <TouchableOpacity key={m} style={[mp.chip, value === m && mp.chipActive]} onPress={() => onSelect(m)} activeOpacity={0.8}>
          <Text style={[mp.chipText, value === m && mp.chipTextActive]}>{m}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);
const mp = StyleSheet.create({
  wrap:          { marginBottom: 16 },
  label:         { fontSize: 13, fontWeight: '600', color: C.dark, marginBottom: 8 },
  row:           { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:          { borderWidth: 1, borderColor: C.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, backgroundColor: C.white },
  chipActive:    { backgroundColor: C.purple, borderColor: C.purple },
  chipText:      { fontSize: 13, color: C.mid },
  chipTextActive:{ color: C.white, fontWeight: '600' },
});


// UC #18 — SET DAILY CALORIE GOAL MODAL

const SetGoalModal = ({ visible, currentGoal, user, onClose, onSuccess }) => {
  const [limit,     setLimit]     = useState(String(currentGoal || 2000));
  const [fieldError,setFieldError]= useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleClose = () => { setFieldError(''); onClose(); };

  const handleSave = useCallback(async () => {
    setFieldError('');
    setIsLoading(true);
    const result = await goalController.setDailyCalorieLimit(user, limit);
    setIsLoading(false);

    if (result.success) {
      onSuccess(result.message, result.user);
    } else {
      setFieldError(result.message);
    }
  }, [limit, user]);

  return (
    <ModalSheet visible={visible} title="Set Daily Calorie Goal" subtitle="Enter your target daily calorie intake" onClose={handleClose}>
      <Field
        label="Daily Calorie Goal"
        value={limit}
        onChangeText={setLimit}
        placeholder="2000"
        keyboardType="numeric"
        error={fieldError}
      />
      <TouchableOpacity style={[sg.btn, isLoading && sg.btnDisabled]} onPress={handleSave} activeOpacity={0.85} disabled={isLoading}>
        <Text style={sg.btnText}>{isLoading ? 'Saving...' : 'Save Goal'}</Text>
      </TouchableOpacity>
    </ModalSheet>
  );
};
const sg = StyleSheet.create({
  btn:         { backgroundColor: C.purple, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  btnDisabled: { opacity: 0.6 },
  btnText:     { fontSize: 15, fontWeight: '700', color: C.white },
});


// UC #16 — MANUAL ENTRY MODAL

const ManualEntryModal = ({ visible, userId, onClose, onSuccess }) => {
  const [foodName,    setFoodName]    = useState('');
  const [calories,    setCalories]    = useState('');
  const [protein,     setProtein]     = useState('');
  const [carbs,       setCarbs]       = useState('');
  const [fat,         setFat]         = useState('');
  const [meal,        setMeal]        = useState('Breakfast');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading,   setIsLoading]   = useState(false);

  const reset = () => { setFoodName(''); setCalories(''); setProtein(''); setCarbs(''); setFat(''); setMeal('Breakfast'); setFieldErrors({}); };
  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = useCallback(async () => {
    setFieldErrors({});
    setIsLoading(true);
    const result = await manualController.createManualEntry(userId, { foodName, calories, protein, carbs, fat, meal });
    setIsLoading(false);
    if (result.success) { reset(); onSuccess(result.message, result.data); }
    else if (result.field) setFieldErrors({ [result.field]: result.message });
  }, [foodName, calories, protein, carbs, fat, meal, userId]);

  return (
    <ModalSheet visible={visible} title="Manual Food Entry" subtitle="Enter the details of your food manually" onClose={handleClose}>
      <Field label="Food Name" value={foodName} onChangeText={setFoodName} placeholder="e.g., Chicken Breast" error={fieldErrors.foodName} />
      <Field label="Calories"  value={calories} onChangeText={setCalories} placeholder="165" keyboardType="numeric" error={fieldErrors.calories} />
      <View style={me.macroRow}>
        <View style={me.macroField}><Field label="Protein (g)" value={protein} onChangeText={setProtein} placeholder="31"  keyboardType="numeric" error={fieldErrors.protein} /></View>
        <View style={me.macroField}><Field label="Carbs (g)"   value={carbs}   onChangeText={setCarbs}   placeholder="0"   keyboardType="numeric" error={fieldErrors.carbs} /></View>
        <View style={me.macroField}><Field label="Fat (g)"     value={fat}     onChangeText={setFat}     placeholder="3.6" keyboardType="numeric" error={fieldErrors.fat} /></View>
      </View>
      <MealPicker value={meal} onSelect={setMeal} />
      <TouchableOpacity style={[me.btn, isLoading && me.btnDisabled]} onPress={handleSubmit} activeOpacity={0.85} disabled={isLoading}>
        <Text style={me.btnText}>{isLoading ? 'Adding...' : 'Add Entry'}</Text>
      </TouchableOpacity>
    </ModalSheet>
  );
};
const me = StyleSheet.create({
  macroRow:    { flexDirection: 'row', gap: 8 },
  macroField:  { flex: 1 },
  btn:         { backgroundColor: C.purple, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  btnDisabled: { opacity: 0.6 },
  btnText:     { fontSize: 15, fontWeight: '700', color: C.white },
});


// UC #17 — CAMERA FOOD RECOGNITION MODAL

const CameraModal = ({ visible, userId, onClose, onSuccess }) => {
  const [step,      setStep]      = useState('capture');
  const [detected,  setDetected]  = useState(null);
  const [foodName,  setFoodName]  = useState('');
  const [meal,      setMeal]      = useState('Lunch');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg,  setErrorMsg]  = useState('');
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraRef, setCameraRef] = useState(null);

  const reset = () => { setStep('capture'); setDetected(null); setFoodName(''); setMeal('Lunch'); setErrorMsg(''); };
  const handleClose = () => { reset(); onClose(); };

  const handleCapture = useCallback(async () => {
    if (!cameraRef) return;

    try {
      setIsLoading(true);
      setErrorMsg('');

      const photo = await cameraRef.takePictureAsync({
        base64: true,
        quality: 0.5,
      });

      console.log("PHOTO:", photo.uri);

      // 🔥 Send to backend for recognition
      const result = await cameraController.recogniseFood(photo);

      setIsLoading(false);

      if (result.success) {
        setDetected(result.data);
        setFoodName(result.data.foodName);
        setStep('confirm');
      } else {
        setErrorMsg(result.message || 'Recognition failed');
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMsg('Camera error occurred');
    }
  }, [cameraRef]);

  const handleConfirmLog = useCallback(async () => {
    if (!detected) return;
    setIsLoading(true);
    const result = await cameraController.logCameraEntry(userId, { foodName, calories: detected.calories, protein: detected.protein, carbs: detected.carbs, fat: detected.fat, meal });
    setIsLoading(false);
    if (result.success) { reset(); onSuccess(result.message, result.data); }
  }, [detected, foodName, meal, userId]);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View>
        <Text>No access to camera</Text>
        <TouchableOpacity onPress={requestPermission}>
          <Text>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }  

  return (
    <ModalSheet
      visible={visible}
      title={step === 'capture' ? 'Camera Food Recognition' : '📷 Confirm Food Recognition'}
      subtitle={step === 'capture' ? 'Simulate taking a photo to automatically recognize food' : 'Verify the details and select a meal category'}
      onClose={handleClose}
    >
      {step === 'capture' && (
        <>
          {!permission ? (
            <Text>Requesting camera permission...</Text>
          ) : !permission.granted ? (
            <>
              <Text>No access to camera</Text>
              <TouchableOpacity onPress={requestPermission}>
                <Text>Grant Permission</Text>
              </TouchableOpacity>
            </>
          ) : (
            <CameraView
              style={cm.viewfinder}
              ref={(ref) => setCameraRef(ref)}
            />
          )}

          {errorMsg ? <Text style={cm.errorText}>{errorMsg}</Text> : null}
        
          <TouchableOpacity
            style={[cm.captureBtn, isLoading && cm.btnDisabled]}
            onPress={handleCapture}
            disabled={isLoading}
          >
            <Text style={cm.captureBtnText}>
              {isLoading ? 'Recognising...' : 'Capture & Recognize Food'}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </ModalSheet>
  );
};
const cm = StyleSheet.create({
  viewfinder:     { height: 180, backgroundColor: C.bg, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1, borderColor: C.border },
  cameraIcon:     { fontSize: 40, opacity: 0.4 },
  captureBtn:     { backgroundColor: C.purple, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  captureBtnText: { fontSize: 15, fontWeight: '700', color: C.white },
  demoNote:       { fontSize: 12, color: C.subtle, textAlign: 'center' },
  errorText:      { fontSize: 13, color: C.errorText, textAlign: 'center', marginBottom: 10 },
  btnDisabled:    { opacity: 0.6 },
  pillRow:        { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  pill:           { flex: 1, alignItems: 'center', backgroundColor: C.purpleLight, borderRadius: 10, paddingVertical: 10, marginHorizontal: 3 },
  pillValue:      { fontSize: 16, fontWeight: '800', color: C.purple },
  pillLabel:      { fontSize: 11, color: C.purple, marginTop: 2 },
  detectedLabel:  { fontSize: 12, color: C.subtle, marginBottom: 10 },
  confirmRow:     { flexDirection: 'row', gap: 10, marginTop: 4 },
  tryAgainBtn:    { flex: 1, borderWidth: 1.5, borderColor: C.border, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  tryAgainText:   { fontSize: 14, fontWeight: '600', color: C.mid },
  confirmBtn:     { flex: 1.5, backgroundColor: C.purple, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  confirmBtnText: { fontSize: 14, fontWeight: '700', color: C.white },
});


// ─────────────────────────────────────────────────────────────
// FOOD DATABASE SECTION — UC #15, #50
// CHANGED: search is now async with local-first + API fallback
// ─────────────────────────────────────────────────────────────

const FoodDatabaseSection = ({ allItems, isLoading, errorMsg, onEntryLogged, userId }) => {
  const [search,        setSearch]        = useState('');
  const [expanded,      setExpanded]      = useState(null);
  const [quantities,    setQuantities]    = useState({});

  // ── NEW state for async search ──────────────────────────────
  const [displayItems,  setDisplayItems]  = useState([]);   // what's shown in the list
  const [isSearching,   setIsSearching]   = useState(false); // spinner while API call runs
  const [searchMsg,     setSearchMsg]     = useState('');    // "no results" or error text
  const [fromAPI,       setFromAPI]       = useState(false); // true when results came from Open Food Facts
  // ───────────────────────────────────────────────────────────

  // On mount (or when allItems loads), show the full local list
  useEffect(() => {
    setDisplayItems(allItems);
  }, [allItems]);

  // ── CHANGED: search handler is now async ───────────────────
  const handleSearch = useCallback(async (query) => {
    setSearch(query);
    setSearchMsg('');
    setFromAPI(false);

    // Empty query → restore full local list, no API call
    if (!query || query.trim().length === 0) {
      setDisplayItems(allItems);
      return;
    }

    setIsSearching(true);
    const result = await dbController.searchFoodItems(allItems, query);
    setIsSearching(false);

    setDisplayItems(result.data);
    setFromAPI(result.fromAPI);
    setSearchMsg(result.message);
  }, [allItems]);
  // ───────────────────────────────────────────────────────────

  const handleAdd = (item) => {
    setExpanded(item.foodItemId);
    setQuantities((p) => ({ ...p, [item.foodItemId]: p[item.foodItemId] || 1 }));
  };
  const handleInc = (id) => setQuantities((p) => ({ ...p, [id]: (p[id] || 1) + 1 }));
  const handleDec = (id) => setQuantities((p) => ({ ...p, [id]: Math.max(1, (p[id] || 1) - 1) }));
  const handleLog = async (item) => {
    const result = await dbController.logFoodItem(
      item,
      quantities[item.foodItemId] || 1,
      userId   // ✅ REQUIRED
    ); 
    if (result.success) {
      setExpanded(null);
      onEntryLogged(result.message, result.data);
    }
  };
  if (isLoading) return <ActivityIndicator size="small" color={C.purple} style={{ marginTop: 16 }} />;
  if (errorMsg)  return <Text style={{ color: C.errorText, textAlign: 'center', marginTop: 16 }}>{errorMsg}</Text>;

  return (
    <View style={db.wrap}>
      <Text style={db.heading}>Food Database</Text>

      {/* ── CHANGED: onChangeText now calls async handleSearch ── */}
      <TextInput
        style={db.search}
        value={search}
        onChangeText={handleSearch}
        placeholder="Search for food..."
        placeholderTextColor={C.subtle}
        autoCorrect={false}
      />

      {/* Spinner while Open Food Facts API is being called */}
      {isSearching && (
        <ActivityIndicator size="small" color={C.purple} style={{ marginVertical: 8 }} />
      )}

      {/* Badge shown when results come from Open Food Facts */}
      {fromAPI && displayItems.length > 0 && (
        <View style={db.apiBadge}>
          <Text style={db.apiBadgeText}>🌐 Results from Open Food Facts</Text>
        </View>
      )}

      {/* No results message */}
      {!isSearching && searchMsg !== '' && (
        <Text style={db.empty}>{searchMsg}</Text>
      )}

      {/* Food list */}
      {!isSearching && searchMsg === '' && displayItems.length === 0 && (
        <Text style={db.empty}>No food items found.</Text>
      )}

      {!isSearching && displayItems.map((item, index) => (
        <FoodRow
          key={`${item.foodItemId}-${index}`}
          item={item}
          qty={quantities[item.foodItemId] || 1}
          isExpanded={expanded === item.foodItemId}
          onAdd={() => handleAdd(item)}
          onIncrement={() => handleInc(item.foodItemId)}
          onDecrement={() => handleDec(item.foodItemId)}
          onLog={() => handleLog(item)}
        />
      ))}
    </View>
  );
};
const db = StyleSheet.create({
  wrap:         { backgroundColor: C.white, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border },
  heading:      { fontSize: 16, fontWeight: '700', color: C.dark, marginBottom: 12 },
  search:       { backgroundColor: C.bg, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: C.dark, borderWidth: 1, borderColor: C.border, marginBottom: 8 },
  empty:        { fontSize: 14, color: C.subtle, textAlign: 'center', paddingVertical: 24 },
  // ── NEW styles for API badge ──
  apiBadge:     { backgroundColor: C.purpleLight, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start', marginBottom: 8 },
  apiBadgeText: { fontSize: 12, color: C.purple, fontWeight: '600' },
});


// LOG FOOD TAB — unchanged

const LogFoodTab = ({ user, allItems, dbLoading, dbError, onOpenManual, onOpenCamera, onEntryLogged }) => (
  <View>
    <ActionTile icon="➕"  title="Manual Entry"   subtitle="Manually log food details"      onPress={onOpenManual} />
    <ActionTile icon="📷" title="Camera Capture" subtitle="Take a photo to recognize food" onPress={onOpenCamera} />
    <FoodDatabaseSection
      allItems={allItems}
      isLoading={dbLoading}
      errorMsg={dbError}
      userId={user?.userId}
      onEntryLogged={onEntryLogged}
    />
  </View>
);


// TODAY'S ENTRIES TAB — UC #20 — unchanged

const TodaysEntriesTab = ({ entries }) =>
  entries.length === 0
    ? <View style={tet.wrap}><Text style={tet.msg}>No food logged today yet.</Text></View>
    : entries.map((e, i) => (
        <View key={i} style={tet.row}>
          <View><Text style={tet.name}>{e.foodName}</Text><Text style={tet.meal}>{e.meal}</Text></View>
          <Text style={tet.cal}>{e.calories} kcal</Text>
        </View>
      ));
const tet = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 40 },
  msg:  { fontSize: 14, color: C.subtle },
  row:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  name: { fontSize: 14, fontWeight: '600', color: C.dark },
  meal: { fontSize: 12, color: C.subtle },
  cal:  { fontSize: 14, fontWeight: '600', color: C.purple },
});


// HISTORY TAB — UC #19 — unchanged

const HistoryTab = ({ pastEntries, isLoading, errorMsg }) => {
  if (isLoading) return <ActivityIndicator size="small" color={C.purple} style={{ marginTop: 24 }} />;
  if (errorMsg)  return <View style={{ alignItems: 'center', paddingVertical: 40 }}><Text style={{ fontSize: 14, color: C.subtle }}>{errorMsg}</Text></View>;
  if (pastEntries.length === 0) return <View style={{ alignItems: 'center', paddingVertical: 40 }}><Text style={{ fontSize: 14, color: C.subtle }}>No past calorie entries available.</Text></View>;

  const grouped = pastEntries.reduce((acc, e) => {
    const date = e.loggedAt?.split('T')[0] || 'Unknown';
    if (!acc[date]) acc[date] = [];
    acc[date].push(e);
    return acc;
  }, {});

  return (
    <View>
      {Object.entries(grouped).map(([date, entries]) => (
        <View key={date} style={ht.group}>
          <Text style={ht.dateLabel}>{date}</Text>
          {entries.map((e, i) => (
            <View key={i} style={ht.row}>
              <View><Text style={ht.name}>{e.foodName}</Text><Text style={ht.meal}>{e.meal}</Text></View>
              <Text style={ht.cal}>{e.calories} kcal</Text>
            </View>
          ))}
          <Text style={ht.total}>
            Total: {entries.reduce((s, e) => s + e.calories, 0)} kcal
          </Text>
        </View>
      ))}
    </View>
  );
};
const ht = StyleSheet.create({
  group:     { backgroundColor: C.white, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border },
  dateLabel: { fontSize: 13, fontWeight: '700', color: C.purple, marginBottom: 10 },
  row:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  name:      { fontSize: 14, fontWeight: '600', color: C.dark },
  meal:      { fontSize: 12, color: C.subtle },
  cal:       { fontSize: 14, fontWeight: '600', color: C.dark },
  total:     { fontSize: 13, fontWeight: '700', color: C.purple, marginTop: 10, textAlign: 'right' },
});


// MAIN SCREEN — unchanged

const FoodTrackingLandingScreen = ({ navigation, route }) => {
  const user = route?.params?.user || null;

  const [activeTab,     setActiveTab]     = useState('Log Food');
  const [allItems,      setAllItems]      = useState([]);
  const [dbLoading,     setDbLoading]     = useState(true);
  const [dbError,       setDbError]       = useState('');
  const [todaysEntries, setTodaysEntries] = useState([]);
  const [pastEntries,   setPastEntries]   = useState([]);
  const [histLoading,   setHistLoading]   = useState(false);
  const [histError,     setHistError]     = useState('');
  const [dailyGoal,     setDailyGoal]     = useState(user?.dailyCalorieLimit || 2000);
  const [currentUser,   setCurrentUser]   = useState(user);
  const [banner,        setBanner]        = useState('');
  const [showManual,    setShowManual]    = useState(false);
  const [showCamera,    setShowCamera]    = useState(false);
  const [showGoal,      setShowGoal]      = useState(false);

  const intake = intakeController.getCurrentIntake(todaysEntries);
  const target = targetController.checkDailyTarget(todaysEntries, dailyGoal);

  useEffect(() => {
    dbController.fetchFoodDatabase().then((result) => {
      if (result.success) setAllItems(result.data);
      else setDbError(result.message);
      setDbLoading(false);
    });
  }, []);

  const loadHistory = useCallback(async () => {
    if (!currentUser?.userId) return; // ✅ wait for user
    setHistLoading(true);
    setHistError('');
    const result = await historyController.fetchPastEntries(currentUser.userId);
    if (result.success) setPastEntries(result.data);
    else setHistError(result.message);
    setHistLoading(false);
    console.log("USER ID:", currentUser?.userId);
    console.log("FETCH RESULT:", result);
  }, [currentUser]);

  const loadTodayEntries = useCallback(async () => {
    if (!currentUser?.userId) return;
    const entries = await intakeController.fetchTodayEntries(currentUser.userId);
    if (entries) {
      setTodaysEntries(entries);
    }
  }, [currentUser?.userId]);

  const refreshUserData = useCallback(async () => {
    if (!currentUser?.userId) return;
  
    try {
      const result = await userController.getUser(currentUser.userId); // ✅ FIXED
    
      const userData = result?.data || result?.user;
    
      if (userData) {
        setCurrentUser(userData);
        setDailyGoal(userData.dailyCalorieLimit || 2000);
      }
    } catch (err) {
      console.log("Failed to refresh user:", err);
    }
  }, [currentUser]);

  useEffect(() => {
    loadTodayEntries();
  }, [loadTodayEntries]);  

  useFocusEffect(
    useCallback(() => {
      loadTodayEntries();
      refreshUserData();   // ✅ ADD THIS
    }, [loadTodayEntries, refreshUserData])
  );

  const handleTabSelect = useCallback((tab) => {
    setActiveTab(tab);

    if (tab === 'History') loadHistory();
    if (tab === "Today's Entries") loadTodayEntries(); // ✅ ADD THIS
  }, [loadHistory, loadTodayEntries]);

  const handleEntryLogged = useCallback((message, entry) => {
    setShowManual(false);
    setShowCamera(false);
    setBanner(message);
    // ✅ reload from backend (source of truth)
    loadTodayEntries();
    setActiveTab("Today's Entries");
    setTimeout(() => setBanner(''), 4000);
  }, [loadTodayEntries]);

  const handleGoalSaved = useCallback((message, updatedUser) => {
    setShowGoal(false);
    setDailyGoal(updatedUser.dailyCalorieLimit);
    setCurrentUser(updatedUser);
    setBanner(message);
    setTimeout(() => setBanner(''), 3000);
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />

      <NavBar onMenuPress={() => navigation.navigate('AccountSettingsScreen', { user: currentUser })} />
      <Banner message={banner} />

      <SetGoalModal
        visible={showGoal}
        currentGoal={dailyGoal}
        user={currentUser}
        onClose={() => setShowGoal(false)}
        onSuccess={handleGoalSaved}
      />

      <ManualEntryModal
        visible={showManual}
        userId={currentUser?.userId}
        onClose={() => setShowManual(false)}
        onSuccess={handleEntryLogged}
      />

      <CameraModal
        visible={showCamera}
        userId={currentUser?.userId}
        onClose={() => setShowCamera(false)}
        onSuccess={handleEntryLogged}
      />

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>

        <View style={styles.titleRow}>
          <Text style={styles.pageTitle}>Food Tracking</Text>
          <TouchableOpacity style={styles.goalBtn} onPress={() => setShowGoal(true)} activeOpacity={0.8}>
            <Text style={styles.goalBtnText}>↗  Set Daily Goal</Text>
          </TouchableOpacity>
        </View>

        <TodaysProgressCard target={target} />

        <TabBar activeTab={activeTab} onSelect={handleTabSelect} />

        {activeTab === 'Log Food'        && <LogFoodTab user={currentUser} allItems={allItems} dbLoading={dbLoading} dbError={dbError} onOpenManual={() => setShowManual(true)} onOpenCamera={() => setShowCamera(true)} onEntryLogged={handleEntryLogged}/>}
        {activeTab === "Today's Entries" && <TodaysEntriesTab entries={todaysEntries} />}
        {activeTab === 'History'         && <HistoryTab pastEntries={pastEntries} isLoading={histLoading} errorMsg={histError} />}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: C.bg },
  list:        { paddingHorizontal: 16, paddingBottom: 32 },
  titleRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 20 },
  pageTitle:   { fontSize: 26, fontWeight: '800', color: C.dark, letterSpacing: -0.3 },
  goalBtn:     {},
  goalBtnText: { fontSize: 13, fontWeight: '600', color: C.purple },
});

export default FoodTrackingLandingScreen;
