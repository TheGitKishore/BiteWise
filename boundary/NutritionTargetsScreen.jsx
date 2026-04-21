// NutritionTargetsScreen.jsx — Sprint 8: complete rewrite
// UC #53 Premium User – View Personalised Nutrition Targets
//        Free User  – View Calorie Target (macros greyed out)
// UC Edit Targets   — EditTargetsModal (inline, not a separate screen)
// UC Auto-Calculate — ⚡ button inside EditTargetsModal (Premium only)
//
// Design follows uploaded UI screenshots exactly:
//   • Personalized Nutrition Targets landing (images 5, 6)
//   • Edit Targets modal with dropdowns (images 2, 3, 4)
//   • Auto-calculation success banner (image 1)

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, StatusBar, Modal, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import ViewNutritionTargetsController   from '../controller/ViewNutritionTargetsController';
import EditNutritionTargetsController   from '../controller/EditNutritionTargetsController';
import AutoCalculateNutritionController from '../controller/AutoCalculateNutritionController';
import ViewCurrentCalorieIntakeController from '../controller/ViewCurrentCalorieIntakeController';

const viewCtrl   = new ViewNutritionTargetsController();
const editCtrl   = new EditNutritionTargetsController();
const autoCtrl   = new AutoCalculateNutritionController();
const intakeCtrl = new ViewCurrentCalorieIntakeController();

// ─── Design Tokens ─────────────────────────────────────────────────────────────
const C = {
  purple:       '#7C3AED',
  purpleLight:  '#EDE9FE',
  purplePale:   '#FAF5FF',
  dark:         '#111827',
  mid:          '#374151',
  body:         '#4B5563',
  subtle:       '#6B7280',
  white:        '#FFFFFF',
  border:       '#E5E7EB',
  bg:           '#F9FAFB',
  inputBg:      '#F3F4F6',
  disabled:     '#E5E7EB',
  disabledText: '#9CA3AF',
  green:        '#059669',
  greenPale:    '#ECFDF5',
  greenBorder:  '#A7F3D0',
  errorText:    '#DC2626',
};

// ─── NavBar ────────────────────────────────────────────────────────────────────
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
  bar:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  brand:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  icon:      { fontSize: 20 },
  brandName: { fontSize: 20, fontWeight: '800', color: C.dark, letterSpacing: -0.3 },
  menuBtn:   { padding: 6, gap: 4, alignItems: 'flex-end' },
  menuLine:  { width: 22, height: 2.5, backgroundColor: C.dark, borderRadius: 2 },
});

// ─── Premium Badge ─────────────────────────────────────────────────────────────
const PremiumBadge = () => (
  <View style={pb.wrap}><Text style={pb.text}>☆ Premium</Text></View>
);
const pb = StyleSheet.create({
  wrap: { alignSelf: 'flex-start', backgroundColor: C.purple, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 8 },
  text: { fontSize: 11, fontWeight: '700', color: C.white },
});

// ─── Success Banner ────────────────────────────────────────────────────────────
const SuccessBanner = ({ message }) => {
  if (!message) return null;
  return (
    <View style={sb.wrap}>
      <Text style={sb.icon}>✅</Text>
      <Text style={sb.text}>{message}</Text>
    </View>
  );
};
const sb = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.greenPale, borderWidth: 1, borderColor: C.greenBorder, borderRadius: 10, padding: 14, marginBottom: 16 },
  icon: { fontSize: 16 },
  text: { flex: 1, fontSize: 14, fontWeight: '600', color: C.green },
});

// ─── Macro Progress Row ────────────────────────────────────────────────────────
const MacroRow = ({ label, consumed, goal, unit, greyed }) => {
  const pct = goal > 0 ? Math.min(consumed / goal, 1) : 0;
  const rem = Math.max(0, goal - consumed);
  return (
    <View style={mr.wrap}>
      <View style={mr.topRow}>
        <Text style={[mr.label, greyed && mr.greyedText]}>{label}</Text>
        <Text style={[mr.value, greyed && mr.greyedText]}>{greyed ? '— / — ' + unit : `${consumed} / ${goal} ${unit}`}</Text>
      </View>
      <View style={mr.barTrack}>
        <View style={[mr.barFill, greyed && mr.barFillGreyed, { width: greyed ? '0%' : `${Math.round(pct * 100)}%` }]} />
      </View>
      <Text style={[mr.remaining, greyed && mr.greyedText]}>{greyed ? 'Upgrade to Premium' : `${rem} ${unit} remaining`}</Text>
    </View>
  );
};
const mr = StyleSheet.create({
  wrap:           { marginBottom: 16 },
  topRow:         { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label:          { fontSize: 14, fontWeight: '600', color: C.dark },
  value:          { fontSize: 13, fontWeight: '600', color: C.dark },
  greyedText:     { color: C.disabledText },
  barTrack:       { height: 6, backgroundColor: C.purpleLight, borderRadius: 3, marginBottom: 4, overflow: 'hidden' },
  barFill:        { height: 6, backgroundColor: C.purple, borderRadius: 3 },
  barFillGreyed:  { backgroundColor: C.disabled },
  remaining:      { fontSize: 12, color: C.subtle },
});

// ─── Target Row ────────────────────────────────────────────────────────────────
const TargetRow = ({ label, description, value, greyed }) => (
  <View style={tr.row}>
    <View style={tr.left}>
      <Text style={tr.label}>{label}</Text>
      <Text style={tr.desc}>{description}</Text>
    </View>
    {greyed
      ? <View style={tr.lockWrap}><Text style={tr.lockIcon}>🔒</Text><Text style={tr.lockText}>Premium</Text></View>
      : <Text style={tr.value}>{value}</Text>
    }
  </View>
);
const tr = StyleSheet.create({
  row:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  left:     { flex: 1 },
  label:    { fontSize: 14, fontWeight: '600', color: C.dark, marginBottom: 2 },
  desc:     { fontSize: 12, color: C.subtle },
  value:    { fontSize: 18, fontWeight: '800', color: C.purple },
  lockWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  lockIcon: { fontSize: 13 },
  lockText: { fontSize: 12, color: C.disabledText, fontWeight: '500' },
});

// ─── Chip ──────────────────────────────────────────────────────────────────────
const Chip = ({ label }) => (
  <View style={ch.wrap}><Text style={ch.text}>{label}</Text></View>
);
const ch = StyleSheet.create({
  wrap: { alignSelf: 'flex-start', backgroundColor: C.purpleLight, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  text: { fontSize: 13, color: C.purple, fontWeight: '600' },
});

// ─── Macro Distribution Row ────────────────────────────────────────────────────
const DistRow = ({ label, pct }) => (
  <View style={dr.row}>
    <Text style={dr.label}>{label}</Text>
    <Text style={dr.pct}>{pct}%</Text>
  </View>
);
const dr = StyleSheet.create({
  row:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  label: { fontSize: 14, color: C.body },
  pct:   { fontSize: 14, fontWeight: '600', color: C.dark },
});

// ─── Card ──────────────────────────────────────────────────────────────────────
const Card = ({ children, style }) => (
  <View style={[cd.wrap, style]}>{children}</View>
);
const cd = StyleSheet.create({
  wrap: { backgroundColor: C.white, borderRadius: 14, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: C.border },
});

// ─── Section Heading ───────────────────────────────────────────────────────────
const SectionHeading = ({ icon, title }) => (
  <View style={sch.row}>
    <Text style={sch.icon}>{icon}</Text>
    <Text style={sch.title}>{title}</Text>
  </View>
);
const sch = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  icon:  { fontSize: 16, color: C.purple },
  title: { fontSize: 15, fontWeight: '700', color: C.dark },
});

// ─── Dropdown (custom, matches screenshot style) ────────────────────────────────
const Dropdown = ({ label, value, options, onSelect, disabled }) => {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ flex: 1 }}>
      <Text style={drd.label}>{label}</Text>
      <TouchableOpacity
        style={[drd.btn, disabled && drd.btnDisabled]}
        onPress={() => !disabled && setOpen(o => !o)}
        activeOpacity={disabled ? 1 : 0.8}
      >
        <Text style={[drd.btnText, disabled && drd.btnTextDisabled]} numberOfLines={1}>{value}</Text>
        {!disabled && <Text style={drd.arrow}>{open ? '▲' : '▼'}</Text>}
      </TouchableOpacity>
      {open && !disabled && (
        <View style={drd.list}>
          {options.map(opt => (
            <TouchableOpacity
              key={opt}
              style={[drd.item, opt === value && drd.itemActive]}
              onPress={() => { onSelect(opt); setOpen(false); }}
              activeOpacity={0.8}
            >
              <Text style={[drd.itemText, opt === value && drd.itemTextActive]}>{opt}</Text>
              {opt === value && <Text style={drd.check}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};
const drd = StyleSheet.create({
  label:           { fontSize: 13, fontWeight: '600', color: C.dark, marginBottom: 6 },
  btn:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.inputBg, borderRadius: 8, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, paddingVertical: 11 },
  btnDisabled:     { backgroundColor: C.disabled },
  btnText:         { flex: 1, fontSize: 14, color: C.dark, marginRight: 4 },
  btnTextDisabled: { color: C.disabledText },
  arrow:           { fontSize: 11, color: C.subtle },
  list:            { backgroundColor: C.white, borderRadius: 8, borderWidth: 1, borderColor: C.border, marginTop: 2, zIndex: 999, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  item:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  itemActive:      { backgroundColor: C.purpleLight },
  itemText:        { fontSize: 14, color: C.dark },
  itemTextActive:  { color: C.purple, fontWeight: '600' },
  check:           { fontSize: 13, color: C.purple, fontWeight: '700' },
});

// ─── Numeric Input Field ────────────────────────────────────────────────────────
const NumField = ({ label, value, onChangeText, placeholder, disabled, error, flex }) => (
  <View style={{ flex: flex || 1, marginBottom: 14 }}>
    <Text style={[nf.label, disabled && nf.labelDisabled]}>{label}</Text>
    {error ? <Text style={nf.err}>{error}</Text> : null}
    <TextInput
      style={[nf.input, disabled && nf.inputDisabled, error && nf.inputErr]}
      value={String(value || '')}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={C.subtle}
      keyboardType="numeric"
      editable={!disabled}
    />
    {disabled && <Text style={nf.lockHint}>🔒 Premium only</Text>}
  </View>
);
const nf = StyleSheet.create({
  label:         { fontSize: 13, fontWeight: '600', color: C.dark, marginBottom: 6 },
  labelDisabled: { color: C.disabledText },
  input:         { backgroundColor: C.inputBg, borderRadius: 8, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, paddingVertical: 11, fontSize: 15, color: C.dark },
  inputDisabled: { backgroundColor: C.disabled, color: C.disabledText, borderColor: C.disabled },
  inputErr:      { borderColor: '#FECACA' },
  lockHint:      { fontSize: 11, color: C.disabledText, marginTop: 4 },
  err:           { fontSize: 12, color: C.errorText, marginBottom: 4 },
});

// ═══════════════════════════════════════════════════════════════════════════════
// EDIT TARGETS MODAL
// Inline modal matching screenshots exactly.
// Free users: only Daily Calories is editable; dropdowns and other macros hidden.
// Premium users: full access with activity/goal dropdowns and auto-calculate.
// ═══════════════════════════════════════════════════════════════════════════════
const EditTargetsModal = ({ visible, targets, isPremium, user, onClose, onSaved }) => {
  const [activityLevel,  setActivityLevel]  = useState('');
  const [goal,           setGoal]           = useState('');
  const [calories,       setCalories]       = useState('');
  const [protein,        setProtein]        = useState('');
  const [carbs,          setCarbs]          = useState('');
  const [fat,            setFat]            = useState('');
  const [fiber,          setFiber]          = useState('');
  const [fieldErrors,    setFieldErrors]    = useState({});
  const [isSaving,       setIsSaving]       = useState(false);
  const [autoBanner,     setAutoBanner]     = useState('');

  // Sync form when targets change (on open)
  useEffect(() => {
    if (visible && targets) {
      setActivityLevel(targets.activityLevel || 'Moderate (3-5 days/week)');
      setGoal(targets.goal           || 'Maintain Weight');
      setCalories(String(targets.calories || 2000));
      setProtein(String(targets.protein   || 0));
      setCarbs(String(targets.carbs       || 0));
      setFat(String(targets.fat           || 0));
      setFiber(String(targets.fiber       || 30));
      setFieldErrors({});
      setAutoBanner('');
    }
  }, [visible, targets]);

  // ⚡ Auto-Calculate Based on Profile
  const handleAutoCalc = useCallback(() => {
    const computed = autoCtrl.computeTargets(user, activityLevel, goal);
    setCalories(String(computed.calories));
    setProtein(String(computed.protein));
    setCarbs(String(computed.carbs));
    setFat(String(computed.fat));
    setFiber(String(computed.fiber));
    setAutoBanner('Personalized targets calculated!');
    setTimeout(() => setAutoBanner(''), 3500);
  }, [user, activityLevel, goal]);

  // Save
  const handleSave = useCallback(async () => {
    setFieldErrors({});
    setIsSaving(true);

    let result;
    if (isPremium) {
      result = await editCtrl.saveTargets(user?.userId, { calories, protein, carbs, fat, fiber, activityLevel, goal });
    } else {
      result = await editCtrl.saveCaloriesOnly(user?.userId, calories);
    }

    setIsSaving(false);
    if (result.success) {
      onSaved(result.message, result.data);
    } else if (result.field) {
      setFieldErrors({ [result.field]: result.message });
    }
  }, [isPremium, user, calories, protein, carbs, fat, fiber, activityLevel, goal, onSaved]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={em.overlay}>
        <View style={em.sheet}>

          {/* Auto-calc banner */}
          {autoBanner ? <SuccessBanner message={autoBanner} /> : null}

          {/* Header row */}
          <View style={em.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={em.title}>Update Nutrition Targets</Text>
              <Text style={em.subtitle}>Customize your daily nutritional goals or use auto-calculation</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={em.closeBtn} activeOpacity={0.7}>
              <Text style={em.closeTxt}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            {/* Activity Level + Goal dropdowns — Premium only */}
            {isPremium && (
              <View style={[em.row, { gap: 12, marginBottom: 14 }]}>
                <Dropdown
                  label="Activity Level"
                  value={activityLevel}
                  options={autoCtrl.getActivityLevels()}
                  onSelect={setActivityLevel}
                />
                <Dropdown
                  label="Goal"
                  value={goal}
                  options={autoCtrl.getGoals()}
                  onSelect={setGoal}
                />
              </View>
            )}

            {/* Auto-Calculate button — Premium only */}
            {isPremium && (
              <TouchableOpacity style={em.autoBtn} onPress={handleAutoCalc} activeOpacity={0.85}>
                <Text style={em.autoBtnIcon}>⚡</Text>
                <Text style={em.autoBtnText}>Auto-Calculate Based on Profile</Text>
              </TouchableOpacity>
            )}

            {/* Row 1: Daily Calories + Fiber */}
            <View style={[em.row, { gap: 12 }]}>
              <NumField
                label="Daily Calories (kcal)"
                value={calories}
                onChangeText={setCalories}
                placeholder="2000"
                disabled={false}
                error={fieldErrors.calories}
              />
              <NumField
                label="Fiber (g)"
                value={fiber}
                onChangeText={setFiber}
                placeholder="30"
                disabled={!isPremium}
                error={fieldErrors.fiber}
              />
            </View>

            {/* Row 2: Protein + Carbs + Fat */}
            <View style={[em.row, { gap: 8 }]}>
              <NumField
                label="Protein (g)"
                value={protein}
                onChangeText={setProtein}
                placeholder="150"
                disabled={!isPremium}
                error={fieldErrors.protein}
              />
              <NumField
                label="Carbs (g)"
                value={carbs}
                onChangeText={setCarbs}
                placeholder="250"
                disabled={!isPremium}
                error={fieldErrors.carbs}
              />
              <NumField
                label="Fat (g)"
                value={fat}
                onChangeText={setFat}
                placeholder="67"
                disabled={!isPremium}
                error={fieldErrors.fat}
              />
            </View>

            {/* Save button */}
            <TouchableOpacity
              style={[em.saveBtn, isSaving && em.saveBtnDisabled]}
              onPress={handleSave}
              disabled={isSaving}
              activeOpacity={0.85}
            >
              <Text style={em.saveBtnText}>{isSaving ? 'Saving...' : 'Save Targets'}</Text>
            </TouchableOpacity>

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
const em = StyleSheet.create({
  overlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet:         { backgroundColor: C.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32, maxHeight: '88%' },
  headerRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 20 },
  title:         { fontSize: 17, fontWeight: '700', color: C.dark, marginBottom: 4 },
  subtitle:      { fontSize: 13, color: C.subtle, lineHeight: 18 },
  closeBtn:      { padding: 4, marginTop: 2 },
  closeTxt:      { fontSize: 18, color: C.subtle },
  row:           { flexDirection: 'row' },
  autoBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingVertical: 12, marginBottom: 18, backgroundColor: C.white },
  autoBtnIcon:   { fontSize: 16 },
  autoBtnText:   { fontSize: 14, fontWeight: '600', color: C.dark },
  saveBtn:       { backgroundColor: C.purple, borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 6 },
  saveBtnDisabled:{ opacity: 0.6 },
  saveBtnText:   { fontSize: 16, fontWeight: '700', color: C.white },
});

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
const NutritionTargetsScreen = ({ navigation, route }) => {
  const user = route?.params?.user || null;
  const isPremium = ['PREMIUM', 'CURATOR'].includes(String(user?.role || '').toUpperCase());

  const [targets,       setTargets]       = useState(null);
  const [todayConsumed, setTodayConsumed] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [isLoading,     setIsLoading]     = useState(true);
  const [showModal,     setShowModal]     = useState(route?.params?.openEdit === true);
  const [banner,        setBanner]        = useState('');

  const loadData = useCallback(async () => {
    if (!user?.userId) { setIsLoading(false); return; }
    setIsLoading(true);

    const [targetsResult, entries] = await Promise.all([
      viewCtrl.fetchNutritionTargets(user.userId),
      intakeCtrl.fetchTodayEntries(user.userId).catch(() => []),
    ]);

    if (targetsResult.success) setTargets(targetsResult.data);
    const summary = intakeCtrl.getCurrentIntake(entries || []);
    setTodayConsumed(summary);
    setIsLoading(false);
  }, [user?.userId]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const handleSaved = useCallback((message, updatedTargets) => {
    setShowModal(false);
    if (updatedTargets) setTargets(updatedTargets);
    setBanner(message);
    setTimeout(() => setBanner(''), 3500);
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={s.safe}>
        <NavBar onMenuPress={() => navigation.goBack()} />
        <ActivityIndicator size="large" color={C.purple} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  const t = targets || {};

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />
      <NavBar onMenuPress={() => navigation.navigate('AccountSettingsScreen', { user })} />

      {/* Edit Targets Modal — inline, not a separate screen */}
      <EditTargetsModal
        visible={showModal}
        targets={targets}
        isPremium={isPremium}
        user={user}
        onClose={() => setShowModal(false)}
        onSaved={handleSaved}
      />

      <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          {isPremium && <PremiumBadge />}
          <Text style={s.pageTitle}>Personalized Nutrition{'\n'}Targets</Text>
          <Text style={s.pageSub}>Your daily nutritional goals tailored to your needs</Text>
          {banner ? <SuccessBanner message={banner} /> : null}
          <TouchableOpacity style={s.editBtn} onPress={() => setShowModal(true)} activeOpacity={0.85}>
            <Text style={s.editBtnText}>Edit Targets</Text>
          </TouchableOpacity>
        </View>

        {/* Today's Progress */}
        <Card>
          <SectionHeading icon="🎯" title="Today's Progress" />
          <MacroRow label="Calories" consumed={todayConsumed.calories} goal={t.calories || 2000} unit="kcal" greyed={false} />
          <MacroRow label="Protein"  consumed={todayConsumed.protein}  goal={t.protein  || 0}    unit="g"    greyed={!isPremium} />
          <MacroRow label="Carbs"    consumed={todayConsumed.carbs}    goal={t.carbs    || 0}    unit="g"    greyed={!isPremium} />
          <MacroRow label="Fat"      consumed={todayConsumed.fat}      goal={t.fat      || 0}    unit="g"    greyed={!isPremium} />
        </Card>

        {/* Your Targets */}
        <Card>
          <SectionHeading icon="↗️" title="Your Targets" />
          <TargetRow label="Daily Calories"  description="Based on your activity level" value={`${t.calories || 2000} kcal`} greyed={false} />
          <TargetRow label="Protein"         description="For muscle maintenance"        value={`${t.protein  || 0} g`}      greyed={!isPremium} />
          <TargetRow label="Carbohydrates"   description="Your energy source"            value={`${t.carbs    || 0} g`}      greyed={!isPremium} />
          <TargetRow label="Fats"            description="Essential for health"          value={`${t.fat      || 0} g`}      greyed={!isPremium} />
          <TargetRow label="Fiber"           description="For digestive health"          value={`${t.fiber    || 0} g`}      greyed={!isPremium} />
        </Card>

        {/* Your Profile — Premium only */}
        {isPremium && (
          <Card>
            <SectionHeading icon="📈" title="Your Profile" />
            <Text style={s.profileLabel}>Activity Level</Text>
            <Chip label={t.activityLevel || 'Not set'} />
            <Text style={[s.profileLabel, { marginTop: 12 }]}>Goal</Text>
            <Chip label={t.goal || 'Not set'} />
          </Card>
        )}

        {/* Macro Distribution — Premium only */}
        {isPremium && (
          <Card>
            <Text style={s.distHeading}>Macro Distribution</Text>
            <DistRow label="Protein" pct={30} />
            <DistRow label="Carbs"   pct={40} />
            <DistRow label="Fat"     pct={30} />
          </Card>
        )}

        {/* Nutrition Tips */}
        <Card>
          <Text style={s.tipsHeading}>Nutrition Tips</Text>
          {[
            'Aim to hit your protein target daily for optimal muscle maintenance and recovery.',
            "It's okay to be within \u00b110% of your targets. Perfect accuracy isn\u2019t necessary.",
            'Adjust your activity level and goals as your lifestyle changes.',
            'Use the auto-calculate feature to update targets based on your current weight.',
          ].map((tip, i) => (
            <View key={i} style={s.tipRow}>
              <Text style={s.tipCheck}>\u2713</Text>
              <Text style={s.tipText}>{tip}</Text>
            </View>
          ))}
        </Card>

        {/* Upgrade nudge for Free users */}
        {!isPremium && (
          <Card style={s.upgradeCard}>
            <Text style={s.upgradeTitle}>🔒 Unlock Full Macro Tracking</Text>
            <Text style={s.upgradeSub}>Upgrade to Premium to set personalised targets for protein, carbs, fat and fiber — and use the auto-calculate feature.</Text>
            <TouchableOpacity
              style={s.upgradeBtn}
              onPress={() => navigation.navigate('ViewPricingPlansScreen')}
              activeOpacity={0.85}
            >
              <Text style={s.upgradeBtnText}>View Premium Plans</Text>
            </TouchableOpacity>
          </Card>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: C.bg },
  list:         { paddingHorizontal: 16, paddingBottom: 40 },
  header:       { paddingVertical: 20 },
  pageTitle:    { fontSize: 28, fontWeight: '800', color: C.dark, letterSpacing: -0.5, marginBottom: 6, lineHeight: 34 },
  pageSub:      { fontSize: 14, color: C.subtle, marginBottom: 16 },
  editBtn:      { backgroundColor: C.purple, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  editBtnText:  { fontSize: 15, fontWeight: '700', color: C.white },
  profileLabel: { fontSize: 13, color: C.subtle, marginBottom: 6 },
  distHeading:  { fontSize: 15, fontWeight: '700', color: C.dark, marginBottom: 12 },
  tipsHeading:  { fontSize: 15, fontWeight: '700', color: C.dark, marginBottom: 12 },
  tipRow:       { flexDirection: 'row', gap: 8, marginBottom: 10 },
  tipCheck:     { fontSize: 13, color: C.purple, fontWeight: '700', marginTop: 1 },
  tipText:      { flex: 1, fontSize: 13, color: C.body, lineHeight: 19 },
  upgradeCard:  { borderColor: C.purple, borderWidth: 1.5 },
  upgradeTitle: { fontSize: 15, fontWeight: '700', color: C.dark, marginBottom: 8 },
  upgradeSub:   { fontSize: 13, color: C.body, lineHeight: 19, marginBottom: 14 },
  upgradeBtn:   { backgroundColor: C.purpleLight, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  upgradeBtnText:{ fontSize: 14, fontWeight: '700', color: C.purple },
});

export default NutritionTargetsScreen;
