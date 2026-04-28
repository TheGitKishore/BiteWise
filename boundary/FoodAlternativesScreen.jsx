// FoodAlternativesScreen.jsx — UC #74 Premium User – View Healthier Food Alternatives
// Sprint 9: Full UI rewrite — grouped layout with search bar, matching design screenshots.
// Premium User only.

import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StyleSheet, StatusBar,
  Keyboard, KeyboardAvoidingView, Platform} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import ViewFoodAlternativesController from '../controller/ViewFoodAlternativesController';

const ctrl = new ViewFoodAlternativesController();

const C = {
  purple:      '#7C3AED',
  purpleLight: '#EDE9FE',
  dark:        '#111827',
  mid:         '#374151',
  body:        '#4B5563',
  subtle:      '#6B7280',
  white:       '#FFFFFF',
  border:      '#E5E7EB',
  bg:          '#F9FAFB',
  blue:        '#3B82F6',
  blueBg:      '#EFF6FF',
  blueBorder:  '#BFDBFE',
};

// ── NavBar ───────────────────────────────────────────────────────────────────
const NavBar = ({ onMenuPress }) => (
  <View style={nav.bar}>
    <View style={nav.brand}>
      <Text style={nav.icon}>🍴</Text>
      <Text style={nav.brandName}>BiteWise</Text>
    </View>
    <TouchableOpacity onPress={onMenuPress} style={{padding: 6}}>
          <Text style={{fontSize: 14, fontWeight: '500', color: '#374151'}}>← Back</Text>
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

// ── Alternative Card (inside a food group) ───────────────────────────────────
const AlternativeCard = ({ item }) => (
  <View style={ac.card}>
    {/* Name row */}
    <View style={ac.nameRow}>
      <Text style={ac.name}>{item.name}</Text>
    </View>

    {/* Goal badge */}
    <View style={ac.goalBadge}>
      <Text style={ac.goalTxt}>{item.goal}</Text>
    </View>

    {/* 4-column macros */}
    <View style={ac.macroRow}>
      <View style={ac.macroCol}>
        <Text style={ac.macroVal}>{item.calories}</Text>
        <Text style={ac.macroLbl}>cal</Text>
      </View>
      <View style={ac.macroCol}>
        <Text style={ac.macroVal}>{item.protein}g</Text>
        <Text style={ac.macroLbl}>protein</Text>
      </View>
      <View style={ac.macroCol}>
        <Text style={ac.macroVal}>{item.carbs}g</Text>
        <Text style={ac.macroLbl}>carbs</Text>
      </View>
      <View style={ac.macroCol}>
        <Text style={ac.macroVal}>{item.fat}g</Text>
        <Text style={ac.macroLbl}>fat</Text>
      </View>
    </View>

    {/* Divider + benefits */}
    <View style={ac.divider} />
    <Text style={ac.benefitsLabel}>Benefits:</Text>
    {item.benefits.map((b) => (
      <Text key={b} style={ac.benefit}>✓ {b}</Text>
    ))}
  </View>
);
const ac = StyleSheet.create({
  card:         { backgroundColor: C.white, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.border, marginBottom: 10 },
  nameRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  name:         { fontSize: 16, fontWeight: '700', color: C.dark },
  goalBadge:    { alignSelf: 'flex-start', backgroundColor: C.purpleLight, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 12 },
  goalTxt:      { fontSize: 12, fontWeight: '600', color: C.purple },
  macroRow:     { flexDirection: 'row', marginBottom: 6 },
  macroCol:     { flex: 1, alignItems: 'center' },
  macroVal:     { fontSize: 15, fontWeight: '800', color: C.dark },
  macroLbl:     { fontSize: 11, color: C.subtle, marginTop: 1 },
  divider:      { height: 1, backgroundColor: C.border, marginVertical: 10 },
  benefitsLabel:{ fontSize: 13, fontWeight: '700', color: C.dark, marginBottom: 4 },
  benefit:      { fontSize: 13, color: C.body, marginBottom: 2 },
});

// ── Food Group ────────────────────────────────────────────────────────────────
const FoodGroup = ({ group }) => (
  <View style={fg.container}>
    <View style={fg.header}>
      <Text style={fg.originalName}>{group.original}</Text>
      <Text style={fg.chefIcon}>👨‍🍳</Text>
    </View>
    {group.alternatives.map((alt) => (
      <AlternativeCard key={alt.id} item={alt} />
    ))}
  </View>
);
const fg = StyleSheet.create({
  container:    { backgroundColor: C.white, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 14 },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  originalName: { fontSize: 20, fontWeight: '800', color: C.dark },
  chefIcon:     { fontSize: 22, color: C.purple },
});

// ── Tips Footer ───────────────────────────────────────────────────────────────
const TipsSection = ({ tips }) => (
  <View style={ts.card}>
    <Text style={ts.title}>Tips for Using Alternatives</Text>
    {tips.map((tip) => (
      <View key={tip} style={ts.bulletRow}>
        <View style={ts.dot} />
        <Text style={ts.tip}>{tip}</Text>
      </View>
    ))}
  </View>
);
const ts = StyleSheet.create({
  card:      { backgroundColor: C.white, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 14 },
  title:     { fontSize: 16, fontWeight: '800', color: C.dark, marginBottom: 12 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  dot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: C.dark, marginTop: 6, flexShrink: 0 },
  tip:       { flex: 1, fontSize: 13, color: C.body, lineHeight: 19 },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
const FoodAlternativesScreen = ({ navigation, route }) => {
  const user = route?.params?.user || null;
  const [groups,   setGroups]   = useState([]);
  const [tips,     setTips]     = useState([]);
  const [query,    setQuery]    = useState('');
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      ctrl.fetchFoodAlternativesGrouped().then((r) => {
        if (r.success) {
          setGroups(r.data.groups);
          setTips(r.data.tips);
        } else {
          setError(r.message);
        }
        setLoading(false);
      });
    }, [])
  );

  const displayed = ctrl.searchAlternatives(groups, query);
  const onMenuPress = () => navigation.goBack();

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />
      <NavBar onMenuPress={onMenuPress} />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >

        {/* Page header */}
        <View style={s.header}>
          <View style={s.premBadge}><Text style={s.premBadgeTxt}>👑 Premium</Text></View>
          <Text style={s.pageTitle}>Healthier Food Alternatives</Text>
          <Text style={s.pageSub}>Discover healthier substitutes for your favorite foods without compromising taste</Text>
        </View>

        {/* Search bar */}
        <View style={s.searchWrap}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            style={s.searchInput}
            placeholder="Search for food alternatives..."
            placeholderTextColor={C.subtle}
            value={query}
            onChangeText={setQuery}
          />
        </View>

        {/* Smart Substitutions info card */}
        <View style={s.infoCard}>
          <Text style={s.infoIcon}>↗</Text>
          <View style={s.infoTextWrap}>
            <Text style={s.infoTitle}>Smart Substitutions</Text>
            <Text style={s.infoBody}>
              These alternatives maintain similar taste and texture while offering better nutrition. Swap ingredients to reduce calories, increase protein, or meet your dietary goals.
            </Text>
          </View>
        </View>

        {/* Content */}
        {loading ? (
          <Text style={s.empty}>Loading...</Text>
        ) : error ? (
          <Text style={s.empty}>{error}</Text>
        ) : displayed.length === 0 ? (
          <Text style={s.empty}>No results for "{query}"</Text>
        ) : (
          <>
            {displayed.map((group) => (
              <FoodGroup key={group.id} group={group} />
            ))}
            <TipsSection tips={tips} />
          </>
        )}
      </ScrollView>
          </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 40 },
  header:       { paddingVertical: 20 },
  premBadge:    { alignSelf: 'flex-start', backgroundColor: C.purple, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 10 },
  premBadgeTxt: { fontSize: 12, fontWeight: '700', color: C.white },
  pageTitle:    { fontSize: 28, fontWeight: '800', color: C.dark, letterSpacing: -0.5, marginBottom: 6 },
  pageSub:      { fontSize: 14, color: C.subtle, lineHeight: 21 },
  searchWrap:   { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: 12, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, marginBottom: 14 },
  searchIcon:   { fontSize: 16, color: C.subtle, marginRight: 8 },
  searchInput:  { flex: 1, fontSize: 14, color: C.dark, paddingVertical: 13 },
  infoCard:     { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: C.blueBg, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.blueBorder, marginBottom: 18 },
  infoIcon:     { fontSize: 20, color: C.blue, fontWeight: '800', marginTop: 2 },
  infoTextWrap: { flex: 1 },
  infoTitle:    { fontSize: 15, fontWeight: '800', color: C.dark, marginBottom: 4 },
  infoBody:     { fontSize: 13, color: C.body, lineHeight: 19 },
  empty:        { textAlign: 'center', color: C.subtle, paddingTop: 40 },
});

export default FoodAlternativesScreen;
