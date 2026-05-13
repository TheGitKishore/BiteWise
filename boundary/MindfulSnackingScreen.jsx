// MindfulSnackingScreen.jsx — UC #75 Premium User – View Mindful Snacking Recommendations
// Sprint 9: Full UI rewrite — 6-section layout matching design screenshots.
// Premium User only.

import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, Modal, Image} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import ViewMindfulSnackingController from '../controller/ViewMindfulSnackingController';

const ctrl = new ViewMindfulSnackingController();

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
  green:       '#16A34A',
  orange:      '#EA580C',
  orangeBg:    '#FFF7ED',
  orangeBorder:'#FED7AA',
};

const SNACK_FILTERS = ['All', 'Morning', 'Afternoon', 'Evening'];

// ── NavBar ───────────────────────────────────────────────────────────────────
const NavBar = ({ onMenuPress }) => (
  <View style={nav.bar}>
    <View style={nav.brand}>
      <Image source={require('../assets/BiteWiseLogo.png')} style={nav.logo} />
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
  logo:      { width: 24, height: 24, resizeMode: 'contain' },
  brandName: { fontSize: 20, fontWeight: '800', color: C.dark, letterSpacing: -0.3 },
  menuBtn:   { padding: 6, gap: 4, alignItems: 'flex-end' },
  menuLine:  { width: 22, height: 2.5, backgroundColor: C.dark, borderRadius: 2 },
});

// ── Section 1: Core Principles ───────────────────────────────────────────────
const CorePrinciplesCard = ({ principles }) => (
  <View style={ss.card}>
    <View style={ss.cardHeader}>
      <Image source={require('../assets/section-mindful.png')} style={[ss.cardHeaderIcon,{width:18,height:18,resizeMode:'contain'}]} />
      <Text style={ss.cardHeaderTitle}>Core Principles of Mindful Snacking</Text>
    </View>
    {principles.map((p) => (
      <View key={p.id} style={cp.row}>
        <View style={cp.checkCircle}>
          <Image source={require('../assets/icon-check.png')} style={[cp.checkMark,{width:14,height:14,resizeMode:'contain'}]} />
        </View>
        <View style={cp.textWrap}>
          <Text style={cp.title}>{p.title}</Text>
          <Text style={cp.desc}>{p.description}</Text>
        </View>
      </View>
    ))}
  </View>
);
const cp = StyleSheet.create({
  row:         { flexDirection: 'row', gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.border },
  checkCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.purpleLight, borderWidth: 2, borderColor: C.purple, alignItems: 'center', justifyContent: 'center', marginTop: 2, flexShrink: 0 },
  checkMark:   { fontSize: 13, color: C.purple, fontWeight: '800' },
  textWrap:    { flex: 1 },
  title:       { fontSize: 15, fontWeight: '700', color: C.dark, marginBottom: 3 },
  desc:        { fontSize: 13, color: C.body, lineHeight: 19 },
});

// ── Section 2: Managing Cravings ──────────────────────────────────────────────
const ManagingCravingsCard = ({ cravings }) => (
  <View style={ss.card}>
    <View style={ss.cardHeader}>
      <Image source={require('../assets/section-goals.png')} style={[ss.cardHeaderIcon,{width:18,height:18,resizeMode:'contain'}]} />
      <Text style={ss.cardHeaderTitle}>Managing Cravings</Text>
    </View>
    {cravings.map((c) => (
      <View key={c.id} style={[mc.item, { borderLeftColor: c.borderColor }]}>
        <Text style={mc.title}>{c.title}</Text>
        <Text style={mc.desc}>{c.description}</Text>
      </View>
    ))}
  </View>
);
const mc = StyleSheet.create({
  item:  { borderLeftWidth: 4, paddingLeft: 12, paddingVertical: 8, marginBottom: 4 },
  title: { fontSize: 15, fontWeight: '700', color: C.dark, marginBottom: 3 },
  desc:  { fontSize: 13, color: C.body, lineHeight: 19 },
});

// ── Section 3: When to Snack ─────────────────────────────────────────────────
const WhenToSnackCard = ({ slots }) => (
  <View style={ss.card}>
    <View style={ss.cardHeader}>
      <Image source={require('../assets/section-timing.png')} style={[ss.cardHeaderIcon,{width:18,height:18,resizeMode:'contain'}]} />
      <Text style={ss.cardHeaderTitle}>When to Snack</Text>
    </View>
    {slots.map((slot) => (
      <View key={slot.id} style={[wts.slot, { backgroundColor: slot.bg }]}>
        <Text style={wts.period}>{slot.period}</Text>
        <Text style={wts.desc}>{slot.description}</Text>
        <Text style={[wts.best, { color: slot.bestColor }]}>Best: {slot.best}</Text>
      </View>
    ))}
  </View>
);
const wts = StyleSheet.create({
  slot:   { borderRadius: 10, padding: 14, marginBottom: 8 },
  period: { fontSize: 15, fontWeight: '700', color: C.dark, marginBottom: 4 },
  desc:   { fontSize: 13, color: C.mid, lineHeight: 19, marginBottom: 6 },
  best:   { fontSize: 13, fontWeight: '600' },
});

// ── Section 4: Smart Snack Ideas ─────────────────────────────────────────────
const SnackIdeasCard = ({ snackIdeas, activeFilter, onFilterChange, onViewRecipe }) => {
  const displayed = ctrl.filterSnackIdeas(snackIdeas, activeFilter);
  return (
    <View style={ss.card}>
      <View style={ss.cardHeader}>
        <Image source={require('../assets/section-snacks.png')} style={[ss.cardHeaderIcon,{width:18,height:18,resizeMode:'contain'}]} />
        <Text style={ss.cardHeaderTitle}>Smart Snack Ideas</Text>
      </View>

      {/* Filter chips */}
      <View style={si.chipRow}>
        {SNACK_FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[si.chip, activeFilter === f && si.chipActive]}
            onPress={() => onFilterChange(f)}
          >
            <Text style={[si.chipTxt, activeFilter === f && si.chipTxtActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Snack cards */}
      {displayed.map((snack) => (
        <View key={snack.id} style={si.snackCard}>
          <Text style={si.snackName}>{snack.name}</Text>

          {/* Macro chips */}
          <View style={si.macroRow}>
            <View style={si.macroChip}>
              <Text style={si.macroVal}>{snack.calories}</Text>
              <Text style={si.macroLbl}>cal</Text>
            </View>
            <View style={si.macroChip}>
              <Text style={si.macroVal}>{snack.protein}g</Text>
              <Text style={si.macroLbl}>protein</Text>
            </View>
            <View style={si.macroChip}>
              <Text style={si.macroVal}>{snack.fiber}g</Text>
              <Text style={si.macroLbl}>fiber</Text>
            </View>
          </View>

          {/* Timing badge */}
          <View style={si.timingBadge}>
            <Image source={require('../assets/section-timing.png')} style={[si.timingIcon,{width:18,height:18,resizeMode:'contain'}]} />
            <Text style={si.timingTxt}>{snack.timing}</Text>
          </View>

          {/* Benefits */}
          <View style={si.divider} />
          <Text style={si.benefitsLabel}>Benefits:</Text>
          {snack.benefits.map((b) => (
            <View style={{flexDirection:'row',alignItems:'center',gap:4}}><Image source={require('../assets/icon-check.png')} style={{width:14,height:14,resizeMode:'contain'}} /><Text key={b} style={si.benefit}>{b}</Text></View>
          ))}

          {/* View Recipe button */}
          <View style={si.divider} />
          <TouchableOpacity style={si.viewRecipeBtn} onPress={() => onViewRecipe(snack)}>
            <Image source={require('../assets/icon-premium-crown.png')} style={[si.viewRecipeIcon,{width:12,height:12,resizeMode:'contain'}]} />
            <Text style={si.viewRecipeTxt}>View Recipe</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
};
const si = StyleSheet.create({
  chipRow:       { flexDirection: 'row', gap: 8, marginBottom: 14 },
  chip:          { borderWidth: 1, borderColor: C.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: C.white },
  chipActive:    { backgroundColor: C.purple, borderColor: C.purple },
  chipTxt:       { fontSize: 13, color: C.mid, fontWeight: '500' },
  chipTxtActive: { color: C.white, fontWeight: '700' },
  snackCard:     { backgroundColor: C.bg, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  snackName:     { fontSize: 16, fontWeight: '700', color: C.dark, marginBottom: 10 },
  macroRow:      { flexDirection: 'row', gap: 8, marginBottom: 10 },
  macroChip:     { flex: 1, backgroundColor: C.purpleLight, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  macroVal:      { fontSize: 15, fontWeight: '700', color: C.purple },
  macroLbl:      { fontSize: 11, color: C.purple, marginTop: 1 },
  timingBadge:   { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: C.purpleLight, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 10 },
  timingIcon:    { fontSize: 12, color: C.purple },
  timingTxt:     { fontSize: 12, fontWeight: '600', color: C.purple },
  divider:       { height: 1, backgroundColor: C.border, marginVertical: 10 },
  benefitsLabel: { fontSize: 13, fontWeight: '700', color: C.dark, marginBottom: 4 },
  benefit:       { fontSize: 13, color: C.body, marginBottom: 2 },
  viewRecipeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 4 },
  viewRecipeIcon:{ fontSize: 14, color: C.purple },
  viewRecipeTxt: { fontSize: 14, fontWeight: '600', color: C.purple },
});

// ── Section 5: Portion Control ───────────────────────────────────────────────
const PortionControlCard = ({ portionControl }) => (
  <View style={ss.card}>
    <View style={ss.cardHeader}>
      <Text style={ss.cardHeaderIcon}>〽</Text>
      <Text style={ss.cardHeaderTitle}>Portion Control Made Easy</Text>
    </View>

    <Text style={pc.subTitle}>Visual Portion Guides</Text>
    {portionControl.visualGuides.map((g) => (
      <View key={g.food} style={pc.bulletRow}>
        <View style={pc.dot} />
        <Text style={pc.bulletTxt}>
          <Text style={pc.foodBold}>{g.food}:</Text> {g.size}
        </Text>
      </View>
    ))}

    <Text style={[pc.subTitle, { marginTop: 14 }]}>Pre-Portioning Strategies</Text>
    {portionControl.prePortioningStrategies.map((s) => (
      <View key={s} style={pc.bulletRow}>
        <View style={pc.dot} />
        <Text style={pc.bulletTxt}>{s}</Text>
      </View>
    ))}
  </View>
);
const pc = StyleSheet.create({
  subTitle:  { fontSize: 15, fontWeight: '700', color: C.dark, marginBottom: 8, marginTop: 4 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  dot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: C.purple, marginTop: 6, flexShrink: 0 },
  bulletTxt: { flex: 1, fontSize: 13, color: C.body, lineHeight: 19 },
  foodBold:  { fontWeight: '700', color: C.dark },
});

// ── Section 6: Warning Card ───────────────────────────────────────────────────
const WarningCard = ({ warningSign }) => (
  <View style={wc.card}>
    <View style={wc.header}>
      <Image source={require('../assets/icon-warning.png')} style={[wc.icon,{width:20,height:20,resizeMode:'contain'}]} />
      <Text style={wc.title}>{warningSign.title}</Text>
    </View>
    <Text style={wc.intro}>{warningSign.intro}</Text>
    {warningSign.signs.map((s) => (
      <Text key={s} style={wc.sign}>• {s}</Text>
    ))}
    <Text style={wc.footer}>{warningSign.footer}</Text>
  </View>
);
const wc = StyleSheet.create({
  card:   { backgroundColor: C.orangeBg, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.orangeBorder, marginBottom: 8 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  icon:   { fontSize: 20 },
  title:  { fontSize: 15, fontWeight: '800', color: C.orange, flex: 1 },
  intro:  { fontSize: 13, color: C.mid, lineHeight: 19, marginBottom: 8 },
  sign:   { fontSize: 13, color: C.mid, lineHeight: 19, marginBottom: 4 },
  footer: { fontSize: 13, color: C.mid, lineHeight: 19, marginTop: 8, fontStyle: 'italic' },
});

// ── Shared card header style ─────────────────────────────────────────────────
const ss = StyleSheet.create({
  card:            { backgroundColor: C.white, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 14 },
  cardHeader:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  cardHeaderIcon:  { fontSize: 18 },
  cardHeaderTitle: { fontSize: 16, fontWeight: '800', color: C.dark, flex: 1 },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
const MindfulSnackingScreen = ({ navigation, route }) => {
  const user = route?.params?.user || null;
  const [content,      setContent]      = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedSnackRecipe, setSelectedSnackRecipe] = useState(null);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      ctrl.fetchSnackingContent().then((r) => {
        if (r.success) setContent(r.data);
        else           setError(r.message);
        setLoading(false);
      });
    }, [])
  );

  const onMenuPress = () => navigation.goBack();
  const handleViewRecipe = (snack) => {
    setSelectedSnackRecipe(snack);
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />
      <NavBar onMenuPress={onMenuPress} />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Page header */}
        <View style={s.header}>
          <View style={s.premBadge}><View style={{flexDirection:'row',alignItems:'center',gap:4}}><Image source={require('../assets/icon-premium-crown.png')} style={{width:12,height:12,resizeMode:'contain'}} /><Text style={s.premBadgeTxt}>Premium</Text></View></View>
          <Text style={s.pageTitle}>Mindful Snacking Guide</Text>
          <Text style={s.pageSub}>Master your cravings and maintain your dietary goals with smart snacking strategies</Text>
        </View>

        {loading ? (
          <Text style={s.empty}>Loading...</Text>
        ) : error ? (
          <Text style={s.empty}>{error}</Text>
        ) : content ? (
          <>
            {/* S1 */}
            <CorePrinciplesCard principles={content.corePrinciples} />

            {/* S2 */}
            <ManagingCravingsCard cravings={content.managingCravings} />

            {/* S3 */}
            <WhenToSnackCard slots={content.whenToSnack} />

            {/* S4 */}
            <SnackIdeasCard
              snackIdeas={content.snackIdeas}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              onViewRecipe={handleViewRecipe}
            />

            {/* S5 */}
            <PortionControlCard portionControl={content.portionControl} />

            {/* S6 */}
            <WarningCard warningSign={content.warningSign} />
          </>
        ) : null}
      </ScrollView>

      <Modal
        visible={!!selectedSnackRecipe}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedSnackRecipe(null)}
      >
        <View style={rm.overlay}>
          <View style={rm.sheet}>
            <View style={rm.headerRow}>
              <Text style={rm.title}>{selectedSnackRecipe?.name || 'Snack Recipe'}</Text>
              <TouchableOpacity onPress={() => setSelectedSnackRecipe(null)} style={rm.closeBtn}>
                <Text style={rm.closeTxt}>Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={rm.content}>
              <Text style={rm.sectionTitle}>Ingredients</Text>
              {(selectedSnackRecipe?.ingredients || []).length > 0 ? (
                selectedSnackRecipe.ingredients.map((item, idx) => (
                  <Text key={`${item}-${idx}`} style={rm.lineItem}>• {item}</Text>
                ))
              ) : (
                <Text style={rm.emptyTxt}>No ingredients available.</Text>
              )}

              <Text style={[rm.sectionTitle, { marginTop: 16 }]}>Steps</Text>
              {(selectedSnackRecipe?.steps || []).length > 0 ? (
                selectedSnackRecipe.steps.map((step, idx) => (
                  <Text key={`${step}-${idx}`} style={rm.lineItem}>{idx + 1}. {step}</Text>
                ))
              ) : (
                <Text style={rm.emptyTxt}>No steps available.</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: C.bg },
  scroll:      { paddingHorizontal: 16, paddingBottom: 40 },
  header:      { paddingVertical: 20 },
  premBadge:   { alignSelf: 'flex-start', backgroundColor: C.purple, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 10 },
  premBadgeTxt:{ fontSize: 12, fontWeight: '700', color: C.white },
  pageTitle:   { fontSize: 28, fontWeight: '800', color: C.dark, letterSpacing: -0.5, marginBottom: 6 },
  pageSub:     { fontSize: 14, color: C.subtle, lineHeight: 21 },
  empty:       { textAlign: 'center', color: C.subtle, paddingTop: 40 },
});

const rm = StyleSheet.create({
  overlay:     { flex: 1, backgroundColor: 'rgba(17,24,39,0.45)', justifyContent: 'flex-end' },
  sheet:       { backgroundColor: C.white, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '78%', padding: 16 },
  headerRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  title:       { flex: 1, fontSize: 17, fontWeight: '800', color: C.dark, paddingRight: 12 },
  closeBtn:    { backgroundColor: C.purpleLight, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  closeTxt:    { color: C.purple, fontWeight: '700', fontSize: 12 },
  content:     { paddingBottom: 12 },
  sectionTitle:{ fontSize: 14, fontWeight: '800', color: C.dark, marginBottom: 8 },
  lineItem:    { fontSize: 13, color: C.body, lineHeight: 20, marginBottom: 6 },
  emptyTxt:    { fontSize: 13, color: C.subtle },
});

export default MindfulSnackingScreen;
