// OnboardingScreen.jsx — Step 3: Profile Onboarding Survey
// Triggered immediately after successful CreateAccount for Free & Premium users.
// One-time action per user — never shown again after profile is set.
// Design: matches CreateAccountScreen palette and card style.

import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  StatusBar, Modal, Alert, Image} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import OnboardingController from '../controller/OnboardingController';

const ctrl = new OnboardingController();

// Design tokens — matches CreateAccountScreen exactly
const C = {
  purple:      '#7C3AED',
  purpleLight: '#EDE9FE',
  purplePale:  '#FAF5FF',
  dark:        '#111827',
  mid:         '#374151',
  body:        '#4B5563',
  subtle:      '#6B7280',
  white:       '#FFFFFF',
  border:      '#E5E7EB',
  bg:          '#F3F4F6',
  errorBg:     '#FEF2F2',
  errorBorder: '#FECACA',
  errorText:   '#DC2626',
  green:       '#059669',
  greenPale:   '#ECFDF5',
};

// ── Survey data (labels only — no A/HO/MP shown to user) ─────────────────────
const QUESTIONS = [
  {
    question: "What's your main goal right now?",
    options: [
      'Improve overall health',
      'Lose weight',
      'Build muscle',
      'Plan and organise meals',
      'Eat more consistently',
    ],
  },
  {
    question: 'Which sounds most like you?',
    options: [
      'I like tracking what I eat and seeing my progress',
      'I follow a structured diet or training plan',
      'I prefer planning meals ahead of time',
      'I just want simple guidance without too much tracking',
    ],
  },
  {
    question: 'How active are you?',
    options: [
      'Not very active',
      'Light exercise (1–2x/week)',
      'Regular workouts (3–5x/week)',
    ],
  },
  {
    question: 'What would you most likely open this app to do?',
    options: [
      'Track my calories and macros precisely',
      'Check my eating habits and improve them over time',
      'Plan my meals for the week ahead',
    ],
  },
  {
    question: 'How do you usually decide what to eat?',
    options: [
      'Based on my nutrition targets or training goals',
      'Based on what feels healthy or balanced',
      'Based on what I\'ve planned or prepared in advance',
    ],
  },
  {
    question: 'What makes you feel like you\'re doing well?',
    options: [
      'Hitting my calorie or macro targets',
      'Feeling healthier or seeing gradual progress',
      'Having my meals organised and ready',
    ],
  },
  {
    question: 'Which approach do you prefer?',
    options: [
      'Detailed tracking and fine-tuning',
      'Simple tracking with helpful guidance',
      'Minimal tracking, more planning upfront',
    ],
  },
  {
    question: 'Which statement sounds most like you?',
    options: [
      'Food is fuel for performance',
      'Food is part of a healthy lifestyle',
      'Food is something I like to organise and manage',
    ],
  },
  {
    question: 'What would make this app most useful to you?',
    options: [
      'Detailed breakdowns and performance insights',
      'Gentle guidance and healthier suggestions',
      'Tools to organise meals and shopping',
    ],
  },
  {
    question: 'What motivates you the most?',
    options: [
      'Seeing numbers improve (calories, macros, performance)',
      'Feeling better physically and mentally',
      'Being organised and in control of my meals',
    ],
  },
];

const ALL_PROFILES = ctrl.getAllProfileOptions();

// ── NavBar ────────────────────────────────────────────────────────────────────
const NavBar = () => (
  <View style={nav.bar}>
    <View style={nav.brand}>
      <Image source={require('../assets/BiteWiseLogo.png')} style={nav.logo} />
      <Text style={nav.brandName}>BiteWise</Text>
    </View>
  </View>
);
const nav = StyleSheet.create({
  bar:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  brand:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  icon:      { fontSize: 20 },
  logo:      { width: 24, height: 24, resizeMode: 'contain' },
  brandName: { fontSize: 20, fontWeight: '800', color: C.dark, letterSpacing: -0.3 },
});

// ── Question Card ─────────────────────────────────────────────────────────────
const QuestionCard = ({ question, questionNum, options, selectedIndex, onSelect }) => (
  <View style={qc.card}>
    <Text style={qc.num}>Question {questionNum} of {QUESTIONS.length}</Text>
    <Text style={qc.question}>{question}</Text>
    {options.map((opt, i) => (
      <TouchableOpacity
        key={i}
        style={[qc.option, selectedIndex === i && qc.optionSelected]}
        onPress={() => onSelect(i)}
        activeOpacity={0.8}
      >
        <View style={[qc.radio, selectedIndex === i && qc.radioSelected]}>
          {selectedIndex === i && <View style={qc.radioDot} />}
        </View>
        <Text style={[qc.optionText, selectedIndex === i && qc.optionTextSelected]}>{opt}</Text>
      </TouchableOpacity>
    ))}
  </View>
);
const qc = StyleSheet.create({
  card:               { backgroundColor: C.white, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: C.border, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  num:                { fontSize: 12, fontWeight: '600', color: C.subtle, marginBottom: 8, letterSpacing: 0.5 },
  question:           { fontSize: 16, fontWeight: '700', color: C.dark, marginBottom: 16, lineHeight: 22 },
  option:             { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1.5, borderColor: C.border, marginBottom: 8, backgroundColor: C.bg },
  optionSelected:     { borderColor: C.purple, backgroundColor: C.purplePale },
  radio:              { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  radioSelected:      { borderColor: C.purple },
  radioDot:           { width: 10, height: 10, borderRadius: 5, backgroundColor: C.purple },
  optionText:         { flex: 1, fontSize: 14, color: C.mid },
  optionTextSelected: { color: C.dark, fontWeight: '600' },
});

// ── Profile Result Card ───────────────────────────────────────────────────────
const ProfileResultCard = ({ meta, isRecommended }) => (
  <View style={[pr.card, isRecommended && pr.cardHighlight]}>
    {isRecommended && (
      <View style={pr.recommendBadge}><View style={{flexDirection:'row',alignItems:'center',gap:4}}><Image source={require('../assets/section-recommended.png')} style={{width:14,height:14,resizeMode:'contain'}} /><Text style={pr.recommendBadgeTxt}>Recommended for you</Text></View></View>
    )}
    <Text style={pr.emoji}>{meta.emoji}</Text>
    <Text style={pr.label}>{meta.label}</Text>
    <Text style={pr.desc}>{meta.description}</Text>
  </View>
);
const pr = StyleSheet.create({
  card:               { backgroundColor: C.white, borderRadius: 16, padding: 20, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', marginBottom: 12 },
  cardHighlight:      { borderColor: C.purple, backgroundColor: C.purplePale },
  recommendBadge:     { backgroundColor: C.purple, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 12 },
  recommendBadgeTxt:  { fontSize: 12, fontWeight: '700', color: C.white },
  emoji:              { fontSize: 44, marginBottom: 10 },
  label:              { fontSize: 20, fontWeight: '800', color: C.dark, marginBottom: 8 },
  desc:               { fontSize: 14, color: C.body, textAlign: 'center', lineHeight: 20 },
});

// ── Confirmation Modal ────────────────────────────────────────────────────────
const ConfirmModal = ({ visible, profileType, meta, onConfirm, onCancel }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
    <View style={cm.overlay}>
      <View style={cm.sheet}>
        <Text style={cm.emoji}>{meta?.emoji}</Text>
        <Text style={cm.title}>Confirm Profile</Text>
        <Text style={cm.body}>Set your profile to <Text style={cm.bold}>{meta?.label}</Text>?{'\n'}You can always change this later in Account Settings.</Text>
        <TouchableOpacity style={cm.confirmBtn} onPress={onConfirm} activeOpacity={0.85}>
          <Text style={cm.confirmTxt}>Yes, set my profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={cm.cancelBtn} onPress={onCancel} activeOpacity={0.75}>
          <Text style={cm.cancelTxt}>Go back</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);
const cm = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.48)', justifyContent: 'center', paddingHorizontal: 24 },
  sheet:      { backgroundColor: C.white, borderRadius: 20, padding: 28, alignItems: 'center' },
  emoji:      { fontSize: 48, marginBottom: 12 },
  title:      { fontSize: 20, fontWeight: '800', color: C.dark, marginBottom: 10 },
  body:       { fontSize: 14, color: C.body, textAlign: 'center', lineHeight: 21, marginBottom: 24 },
  bold:       { fontWeight: '700', color: C.dark },
  confirmBtn: { backgroundColor: C.purple, borderRadius: 12, paddingVertical: 14, width: '100%', alignItems: 'center', marginBottom: 10 },
  confirmTxt: { fontSize: 15, fontWeight: '700', color: C.white },
  cancelBtn:  { borderRadius: 12, paddingVertical: 12, width: '100%', alignItems: 'center' },
  cancelTxt:  { fontSize: 14, fontWeight: '600', color: C.subtle },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
const OnboardingScreen = ({ navigation, route }) => {
  const user = route?.params?.user || null;

  // answers[questionIndex] = answerIndex | null
  const [answers,           setAnswers]           = useState(Array(QUESTIONS.length).fill(null));
  const [recommendedType,   setRecommendedType]   = useState(null);
  const [recommendedMeta,   setRecommendedMeta]   = useState(null);
  const [chosenType,        setChosenType]         = useState(null);
  const [chosenMeta,        setChosenMeta]         = useState(null);
  const [showDropdown,      setShowDropdown]       = useState(false);
  const [showConfirmModal,  setShowConfirmModal]   = useState(false);
  const [saving,            setSaving]             = useState(false);
  const [resultVisible,     setResultVisible]      = useState(false);

  const allAnswered = answers.every(a => a !== null);

  const handleAnswer = (qIdx, aIdx) => {
    const next = [...answers];
    next[qIdx] = aIdx;
    setAnswers(next);
  };

  // "What is my profile?" — compute result
  const handleComputeProfile = useCallback(() => {
    if (!allAnswered) {
      Alert.alert('Incomplete Survey', 'Please answer all questions before seeing your profile.');
      return;
    }
    const answerObjs = answers.map((aIdx, qIdx) => ({ questionIndex: qIdx, answerIndex: aIdx }));
    const { profileType, meta } = ctrl.computeProfile(answerObjs);
    setRecommendedType(profileType);
    setRecommendedMeta(meta);
    setChosenType(profileType);
    setChosenMeta(meta);
    setResultVisible(true);
  }, [answers, allAnswered]);

  // User picks a different profile from dropdown
  const handleChooseOther = (pt) => {
    const found = ALL_PROFILES.find(p => p.profileType === pt);
    if (found) {
      setChosenType(found.profileType);
      setChosenMeta(found);
    }
    setShowDropdown(false);
  };

  // "Complete Onboarding" tapped → show confirmation modal
  const handleCompletePress = () => setShowConfirmModal(true);

  // Confirmed → save and navigate
  const handleConfirmSave = useCallback(async () => {
    setShowConfirmModal(false);
    setSaving(true);
    const result = await ctrl.saveProfile(user?.userId, chosenType);
    setSaving(false);
    if (result.success) {
      navigation.replace('LoginScreen', { successMessage: `Profile set to ${chosenMeta?.label}. Welcome to BiteWise!` });
    } else {
      Alert.alert('Error', result.message);
    }
  }, [chosenType, chosenMeta, user, navigation]);

  const otherProfiles = ALL_PROFILES.filter(p => p.profileType !== chosenType);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />
      <NavBar />

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>Let's find your profile</Text>
          <Text style={s.subtitle}>Answer 10 quick questions and we'll personalise your BiteWise experience</Text>
        </View>

        {/* Questions */}
        {QUESTIONS.map((q, qIdx) => (
          <QuestionCard
            key={qIdx}
            questionNum={qIdx + 1}
            question={q.question}
            options={q.options}
            selectedIndex={answers[qIdx]}
            onSelect={(aIdx) => handleAnswer(qIdx, aIdx)}
          />
        ))}

        {/* Progress indicator */}
        <View style={s.progressWrap}>
          <Text style={s.progressTxt}>{answers.filter(a => a !== null).length} / {QUESTIONS.length} answered</Text>
          <View style={s.progressBar}>
            <View style={[s.progressFill, { width: `${(answers.filter(a => a !== null).length / QUESTIONS.length) * 100}%` }]} />
          </View>
        </View>

        {/* "What is my profile?" button */}
        <TouchableOpacity
          style={[s.profileBtn, !allAnswered && s.profileBtnDisabled]}
          onPress={handleComputeProfile}
          activeOpacity={0.85}
          disabled={!allAnswered}
        >
          <Text style={s.profileBtnTxt}>What is my profile?</Text>
        </TouchableOpacity>

        {/* Result section */}
        {resultVisible && chosenMeta && (
          <View style={s.resultSection}>
            <ProfileResultCard meta={chosenMeta} isRecommended={chosenType === recommendedType} />

            {/* Choose another profile */}
            <View style={s.chooseAnotherWrap}>
              <Text style={s.chooseAnotherLabel}>Choose another profile</Text>

              {/* Dropdown trigger */}
              <TouchableOpacity style={s.dropdown} onPress={() => setShowDropdown(!showDropdown)} activeOpacity={0.8}>
                <Text style={s.dropdownTxt}>
                  {ALL_PROFILES.find(p => p.profileType === chosenType)?.label || 'Select a profile'}
                </Text>
                {showDropdown  ? <Image source={require('../assets/icon-chevron-up.png')} style={{width:11,height:11,resizeMode:'contain'}} /> : <Image source={require('../assets/icon-chevron-down.png')} style={{width:11,height:11,resizeMode:'contain'}} />}
              </TouchableOpacity>

              {/* Dropdown options */}
              {showDropdown && (
                <View style={s.dropdownList}>
                  {otherProfiles.map(p => (
                    <TouchableOpacity
                      key={p.profileType}
                      style={s.dropdownItem}
                      onPress={() => handleChooseOther(p.profileType)}
                      activeOpacity={0.8}
                    >
                      <Text style={s.dropdownItemEmoji}>{p.emoji}</Text>
                      <View>
                        <Text style={s.dropdownItemLabel}>{p.label}</Text>
                        <Text style={s.dropdownItemDesc} numberOfLines={1}>{p.description}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Complete Onboarding */}
            <TouchableOpacity
              style={[s.completeBtn, saving && s.completeBtnDisabled]}
              onPress={handleCompletePress}
              activeOpacity={0.85}
              disabled={saving}
            >
              <Text style={s.completeBtnTxt}>{saving ? 'Saving...' : 'Complete Onboarding'}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />

      </ScrollView>

      {/* Confirmation modal */}
      <ConfirmModal
        visible={showConfirmModal}
        profileType={chosenType}
        meta={chosenMeta}
        onConfirm={handleConfirmSave}
        onCancel={() => setShowConfirmModal(false)}
      />
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:                { flex: 1, backgroundColor: C.bg },
  scroll:              { paddingHorizontal: 16, paddingVertical: 24 },
  header:              { marginBottom: 20 },
  title:               { fontSize: 26, fontWeight: '800', color: C.dark, letterSpacing: -0.3, marginBottom: 6 },
  subtitle:            { fontSize: 14, color: C.subtle, lineHeight: 20 },
  progressWrap:        { marginBottom: 16 },
  progressTxt:         { fontSize: 13, color: C.subtle, marginBottom: 6, textAlign: 'center' },
  progressBar:         { height: 6, backgroundColor: C.border, borderRadius: 3, overflow: 'hidden' },
  progressFill:        { height: '100%', backgroundColor: C.purple, borderRadius: 3 },
  profileBtn:          { backgroundColor: C.purple, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 24 },
  profileBtnDisabled:  { opacity: 0.45 },
  profileBtnTxt:       { fontSize: 16, fontWeight: '700', color: C.white },
  resultSection:       { marginTop: 8 },
  chooseAnotherWrap:   { marginBottom: 20 },
  chooseAnotherLabel:  { fontSize: 15, fontWeight: '700', color: C.dark, marginBottom: 10 },
  dropdown:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.white, borderRadius: 10, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 14 },
  dropdownTxt:         { fontSize: 15, color: C.dark, fontWeight: '600' },
  dropdownArrow:       { fontSize: 12, color: C.subtle },
  dropdownList:        { backgroundColor: C.white, borderRadius: 10, borderWidth: 1, borderColor: C.border, marginTop: 4, overflow: 'hidden' },
  dropdownItem:        { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  dropdownItemEmoji:   { fontSize: 24 },
  dropdownItemLabel:   { fontSize: 14, fontWeight: '700', color: C.dark, marginBottom: 2 },
  dropdownItemDesc:    { fontSize: 12, color: C.subtle },
  completeBtn:         { backgroundColor: C.purple, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  completeBtnDisabled: { opacity: 0.6 },
  completeBtnTxt:      { fontSize: 16, fontWeight: '700', color: C.white },
});

export default OnboardingScreen;
