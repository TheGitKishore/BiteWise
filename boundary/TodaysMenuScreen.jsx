// TodaysMenuScreen.jsx — Sprint 9 Task 4
// UC: Premium User – View Today's Menu
// Personalised recipe recommendations based on remaining daily nutrition budget.
// Sources: recipe library (curated) + custom recipes. Reads from NutritionTargets.
// Premium User only — all 3 profile types (HEALTH_ORIENTED, ATHLETE, MEAL_PLANNER)

import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, Image} from 'react-native';
import { SafeAreaView }   from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import ViewTodaysMenuController from '../controller/ViewTodaysMenuController';
import Recipe                   from '../entity/Recipe';

const ctrl = new ViewTodaysMenuController();

// ── Design Tokens ─────────────────────────────────────────────────────────────
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
  greenPale:   '#ECFDF5',
  greenBorder: '#BBF7D0',
  blue:        '#3B82F6',
  teal:        '#10B981',
  amber:       '#F59E0B',
  orange:      '#EA580C',
};

// ── NavBar ────────────────────────────────────────────────────────────────────
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

// ── Budget Card (purple hero) ─────────────────────────────────────────────────
const BudgetCard = ({ remaining }) => (
  <View style={bc.card}>
    <Text style={bc.eyebrow}>Remaining Today</Text>
    <Text style={bc.bigNumber}>{Math.round(remaining.calories)}</Text>
    <Text style={bc.unit}>kcal left</Text>
    <View style={bc.macroRow}>
      <View style={bc.macroChip}>
        <Text style={bc.macroVal}>{Math.round(remaining.protein)}g</Text>
        <Text style={bc.macroLbl}>protein</Text>
      </View>
      <View style={bc.macroDivider} />
      <View style={bc.macroChip}>
        <Text style={bc.macroVal}>{Math.round(remaining.carbs)}g</Text>
        <Text style={bc.macroLbl}>carbs</Text>
      </View>
      <View style={bc.macroDivider} />
      <View style={bc.macroChip}>
        <Text style={bc.macroVal}>{Math.round(remaining.fat)}g</Text>
        <Text style={bc.macroLbl}>fat</Text>
      </View>
    </View>
  </View>
);
const bc = StyleSheet.create({
  card:         { backgroundColor: C.purple, borderRadius: 18, padding: 24, alignItems: 'center', marginBottom: 14 },
  eyebrow:      { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.75)', marginBottom: 4, letterSpacing: 0.5 },
  bigNumber:    { fontSize: 60, fontWeight: '900', color: C.white, lineHeight: 68, letterSpacing: -2 },
  unit:         { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginBottom: 18 },
  macroRow:     { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 24 },
  macroChip:    { flex: 1, alignItems: 'center' },
  macroVal:     { fontSize: 18, fontWeight: '800', color: C.white },
  macroLbl:     { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  macroDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.25)' },
});

// ── Macro Progress Bar ────────────────────────────────────────────────────────
const MacroBar = ({ label, consumed, goal, unit, pct, color }) => {
  const overGoal = pct > 1;
  return (
    <View style={mb.row}>
      <View style={mb.labelRow}>
        <Text style={mb.label}>{label}</Text>
        <Text style={[mb.value, overGoal && { color: C.orange }]}>
          {consumed}<Text style={mb.unit}>{unit}</Text>
          {'  /  '}
          {goal}<Text style={mb.unit}>{unit}</Text>
        </Text>
      </View>
      <View style={mb.track}>
        <View style={[
          mb.fill,
          { width: `${Math.round(Math.min(1, pct) * 100)}%`, backgroundColor: overGoal ? C.orange : color },
        ]} />
      </View>
    </View>
  );
};
const mb = StyleSheet.create({
  row:      { marginBottom: 14 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  label:    { fontSize: 13, fontWeight: '600', color: C.dark },
  value:    { fontSize: 12, color: C.subtle },
  unit:     { fontSize: 11, color: C.subtle },
  track:    { height: 8, backgroundColor: C.border, borderRadius: 4, overflow: 'hidden' },
  fill:     { height: 8, borderRadius: 4 },
});

// ── Progress Card ─────────────────────────────────────────────────────────────
const ProgressCard = ({ targets, consumed }) => {
  const bars = ctrl.getMacroProgress(targets, consumed);
  return (
    <View style={pc.card}>
      <Text style={pc.title}>📊  Today's Progress</Text>
      {bars.map((bar) => <MacroBar key={bar.label} {...bar} />)}
    </View>
  );
};
const pc = StyleSheet.create({
  card:  { backgroundColor: C.white, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 14 },
  title: { fontSize: 15, fontWeight: '800', color: C.dark, marginBottom: 14 },
});

// ── Recipe Card ───────────────────────────────────────────────────────────────
// Calls Recipe.getMacroMatchScore() (Entity) to derive the fit label — this is
// why the boundary imports Recipe directly (pure computation, not a data fetch).
const MenuRecipeCard = ({ recipe, remaining }) => {
  const score = Recipe.getMacroMatchScore(recipe, remaining);

  const fitLabel = score >= 0.75
    ? { text: 'Great fit',    color: C.purple, bg: C.purpleLight, border: '#C4B5FD' }
    : score >= 0.50
    ? { text: 'Good match',   color: C.teal,   bg: C.greenPale,   border: C.greenBorder }
    : score >= 0.25
    ? { text: 'Partial fit',  color: C.blue,   bg: '#EFF6FF',     border: '#BFDBFE' }
    : { text: 'Light option', color: C.amber,  bg: '#FFFBEB',     border: '#FDE68A' };

  const pctOfRemain = remaining.calories > 0
    ? Math.round((Number(recipe.calories) / remaining.calories) * 100)
    : 0;

  return (
    <View style={mrc.card}>
      <View style={mrc.imgPlaceholder}>
        <Text style={mrc.imgIcon}>🍽️</Text>
        {/* Calorie amount — most prominent element on the card */}
        <View style={mrc.calBadge}>
          <Text style={mrc.calBadgeTxt}>{recipe.calories} kcal</Text>
        </View>
        <View style={mrc.diffBadge}>
          <Text style={mrc.diffTxt}>{recipe.difficulty || 'Easy'}</Text>
        </View>
      </View>

      <View style={mrc.body}>
        <Text style={mrc.title} numberOfLines={2}>{recipe.title}</Text>

        <View style={mrc.metaRow}>
          <Text style={mrc.prepTime}>⏱ {recipe.prepTimeMins} min</Text>
          <View style={[mrc.fitChip, { backgroundColor: fitLabel.bg, borderColor: fitLabel.border }]}>
            <Text style={[mrc.fitTxt, { color: fitLabel.color }]}>{fitLabel.text}</Text>
          </View>
        </View>

        <View style={mrc.macroRow}>
          {[
            { label: 'Protein', value: `${recipe.protein}g`, color: C.blue },
            { label: 'Carbs',   value: `${recipe.carbs}g`,  color: C.teal },
            { label: 'Fat',     value: `${recipe.fat}g`,    color: C.amber },
          ].map((m) => (
            <View key={m.label} style={mrc.macroChip}>
              <Text style={[mrc.macroVal, { color: m.color }]}>{m.value}</Text>
              <Text style={mrc.macroLbl}>{m.label}</Text>
            </View>
          ))}
        </View>

        {Array.isArray(recipe.tags) && recipe.tags.length > 0 && (
          <View style={mrc.tagRow}>
            {recipe.tags.slice(0, 3).map((t) => (
              <View key={t} style={mrc.tag}><Text style={mrc.tagTxt}>{t}</Text></View>
            ))}
          </View>
        )}

        <View style={mrc.budgetRow}>
          <Text style={mrc.budgetTxt}>Uses {pctOfRemain}% of your remaining budget</Text>
        </View>
      </View>
    </View>
  );
};
const mrc = StyleSheet.create({
  card:          { backgroundColor: C.white, borderRadius: 14, marginBottom: 14, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  imgPlaceholder:{ width: '100%', height: 140, backgroundColor: C.purpleLight, alignItems: 'center', justifyContent: 'center' },
  imgIcon:       { fontSize: 44 },
  calBadge:      { position: 'absolute', top: 10, left: 10, backgroundColor: C.purple, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  calBadgeTxt:   { fontSize: 13, fontWeight: '800', color: C.white },
  diffBadge:     { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  diffTxt:       { fontSize: 11, fontWeight: '600', color: C.white },
  body:          { padding: 14 },
  title:         { fontSize: 17, fontWeight: '700', color: C.dark, marginBottom: 8 },
  metaRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  prepTime:      { fontSize: 13, color: C.subtle },
  fitChip:       { borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  fitTxt:        { fontSize: 11, fontWeight: '700' },
  macroRow:      { flexDirection: 'row', gap: 8, marginBottom: 10 },
  macroChip:     { flex: 1, backgroundColor: C.bg, borderRadius: 8, paddingVertical: 7, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  macroVal:      { fontSize: 14, fontWeight: '800' },
  macroLbl:      { fontSize: 10, color: C.subtle, marginTop: 1 },
  tagRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  tag:           { backgroundColor: C.purpleLight, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  tagTxt:        { fontSize: 10, color: C.purple, fontWeight: '500' },
  budgetRow:     { borderTopWidth: 1, borderTopColor: C.border, paddingTop: 8, marginTop: 2 },
  budgetTxt:     { fontSize: 11, color: C.subtle, fontStyle: 'italic' },
});

// ── Goal Reached Card ─────────────────────────────────────────────────────────
const GoalReachedCard = ({ pctConsumed }) => (
  <View style={gr.card}>
    <Text style={gr.emoji}>🎉</Text>
    <Text style={gr.title}>{pctConsumed >= 1 ? 'Daily goal reached!' : 'Almost at your goal!'}</Text>
    <Text style={gr.body}>
      {pctConsumed >= 1
        ? "You've hit your nutrition targets for today. Great work — rest up!"
        : "You're 90%+ toward your daily calorie goal. Only snack if you're genuinely hungry."}
    </Text>
    <View style={gr.tipRow}>
      <Text style={gr.tipIcon}>💧</Text>
      <Text style={gr.tipTxt}>Stay hydrated and listen to your body.</Text>
    </View>
  </View>
);
const gr = StyleSheet.create({
  card:    { backgroundColor: C.greenPale, borderRadius: 14, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: C.greenBorder, marginBottom: 14 },
  emoji:   { fontSize: 48, marginBottom: 10 },
  title:   { fontSize: 20, fontWeight: '800', color: C.green, marginBottom: 8, textAlign: 'center' },
  body:    { fontSize: 14, color: C.body, textAlign: 'center', lineHeight: 21, marginBottom: 14 },
  tipRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.white, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: C.greenBorder, alignSelf: 'stretch' },
  tipIcon: { fontSize: 18 },
  tipTxt:  { fontSize: 13, color: C.body, flex: 1 },
});

// ── No Recipes Card ───────────────────────────────────────────────────────────
const NoRecipesCard = () => (
  <View style={nr.card}>
    <Text style={nr.emoji}>🔍</Text>
    <Text style={nr.title}>No matching recipes</Text>
    <Text style={nr.body}>No recipes fit within your remaining budget. Try a lighter meal or browse the full library.</Text>
  </View>
);
const nr = StyleSheet.create({
  card:  { backgroundColor: C.white, borderRadius: 14, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: C.border, marginBottom: 14 },
  emoji: { fontSize: 40, marginBottom: 10 },
  title: { fontSize: 16, fontWeight: '700', color: C.dark, marginBottom: 6 },
  body:  { fontSize: 13, color: C.subtle, textAlign: 'center', lineHeight: 20 },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
const TodaysMenuScreen = ({ navigation, route }) => {
  const user = route?.params?.user || null;

  const [loading,      setLoading]     = useState(true);
  const [error,        setError]       = useState('');
  const [targets,      setTargets]     = useState(null);
  const [consumed,     setConsumed]    = useState(null);
  const [remaining,    setRemaining]   = useState(null);
  const [recipes,      setRecipes]     = useState([]);
  const [isNearlyFull, setNearlyFull]  = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      setError('');

      ctrl.fetchTodaysMenu(user?.userId).then((result) => {
        if (!active) return;
        if (result.success && result.data) {
          const { targets: t, consumed: c, remaining: r, recipes: recs, isNearlyFull: nf } = result.data;
          setTargets(t);
          setConsumed(c);
          setRemaining(r);
          setRecipes(recs);
          setNearlyFull(nf);
        } else {
          setError(result.message || "Unable to load today's menu.");
        }
        setLoading(false);
      });

      return () => { active = false; };
    }, [user?.userId])
  );

  const pctConsumed = targets && consumed
    ? (consumed.calories || 0) / (targets.calories || 2000)
    : 0;

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />
      <NavBar onMenuPress={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <View style={s.header}>
          <View style={s.premBadge}><Text style={s.premBadgeTxt}>👑 Premium</Text></View>
          <Text style={s.pageTitle}>Today's Menu</Text>
          <Text style={s.pageSub}>Recipes matched to your remaining daily nutrition budget</Text>
        </View>

        {loading ? (
          <View style={s.loadingWrap}>
            <Text style={s.loadingTxt}>Building your menu...</Text>
          </View>
        ) : error ? (
          <View style={s.errorWrap}>
            <Text style={s.errorTxt}>⚠️  {error}</Text>
          </View>
        ) : (
          <>
            {remaining && <BudgetCard remaining={remaining} />}
            {targets && consumed && <ProgressCard targets={targets} consumed={consumed} />}

            {isNearlyFull ? (
              <GoalReachedCard pctConsumed={pctConsumed} />
            ) : (
              <>
                <View style={s.sectionHeader}>
                  <Text style={s.sectionTitle}>🍽️  Best Matches for You</Text>
                  <Text style={s.sectionCount}>{recipes.length} recipe{recipes.length !== 1 ? 's' : ''}</Text>
                </View>

                <View style={s.infoStrip}>
                  <Text style={s.infoIcon}>💡</Text>
                  <Text style={s.infoTxt}>
                    Ranked by how well each recipe fits your remaining {Math.round(remaining?.calories || 0)} kcal and macros.
                  </Text>
                </View>

                {recipes.length === 0
                  ? <NoRecipesCard />
                  : recipes.map((recipe) => (
                      <MenuRecipeCard
                        key={recipe.recipeId || recipe._id}
                        recipe={recipe}
                        remaining={remaining}
                      />
                    ))
                }

                {recipes.length > 0 && (
                  <TouchableOpacity
                    style={s.browseBtn}
                    onPress={() => navigation.navigate('RecipesScreen', { user })}
                  >
                    <Text style={s.browseBtnTxt}>Browse Full Recipe Library →</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: C.bg },
  scroll:       { paddingHorizontal: 16, paddingBottom: 40 },
  header:       { paddingTop: 20, paddingBottom: 16 },
  premBadge:    { alignSelf: 'flex-start', backgroundColor: C.purple, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 10 },
  premBadgeTxt: { fontSize: 12, fontWeight: '700', color: C.white },
  pageTitle:    { fontSize: 28, fontWeight: '800', color: C.dark, letterSpacing: -0.5, marginBottom: 6 },
  pageSub:      { fontSize: 14, color: C.subtle, lineHeight: 21 },
  loadingWrap:  { alignItems: 'center', paddingVertical: 60 },
  loadingTxt:   { fontSize: 15, color: C.subtle },
  errorWrap:    { backgroundColor: '#FEF2F2', borderRadius: 12, padding: 16, marginTop: 8 },
  errorTxt:     { fontSize: 14, color: '#DC2626', textAlign: 'center' },
  sectionHeader:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: C.dark },
  sectionCount: { fontSize: 13, color: C.subtle },
  infoStrip:    { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: C.purpleLight, borderRadius: 10, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: '#C4B5FD' },
  infoIcon:     { fontSize: 16 },
  infoTxt:      { flex: 1, fontSize: 13, color: C.purple, lineHeight: 19 },
  browseBtn:    { backgroundColor: C.white, borderRadius: 12, borderWidth: 1.5, borderColor: C.purple, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  browseBtnTxt: { fontSize: 14, fontWeight: '700', color: C.purple },
});

export default TodaysMenuScreen;
