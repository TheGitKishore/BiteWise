// DineOutScreen.jsx — Sprint 9 Task 6
// UC: Premium User – View Dine Out Options
// Displays restaurants whose menu items fit within the user's remaining
// daily nutrition budget. Premium only — all 3 profile types.

import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, StatusBar,
} from 'react-native';
import { SafeAreaView }   from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import ViewDineOutController from '../controller/ViewDineOutController';

const ctrl = new ViewDineOutController();

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

// ── Budget Pill ───────────────────────────────────────────────────────────────
const BudgetPill = ({ remaining, targets }) => {
  const pct = targets?.calories > 0
    ? Math.round(((targets.calories - remaining.calories) / targets.calories) * 100)
    : 0;
  return (
    <View style={bp.wrap}>
      <View style={bp.pill}>
        <Text style={bp.icon}>🍽️</Text>
        <View>
          <Text style={bp.label}>Remaining Budget</Text>
          <Text style={bp.value}>
            <Text style={bp.big}>{Math.round(remaining.calories)}</Text>
            <Text style={bp.unit}> / {Math.round(targets?.calories || 0)} kcal</Text>
          </Text>
        </View>
        <View style={bp.pctBadge}>
          <Text style={bp.pctTxt}>{pct}% used</Text>
        </View>
      </View>
    </View>
  );
};
const bp = StyleSheet.create({
  wrap:    { marginBottom: 14 },
  pill:    { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.purple, borderRadius: 16, padding: 16 },
  icon:    { fontSize: 24 },
  label:   { fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: '500', marginBottom: 2 },
  value:   { flexDirection: 'row', alignItems: 'baseline' },
  big:     { fontSize: 22, fontWeight: '900', color: C.white },
  unit:    { fontSize: 12, color: 'rgba(255,255,255,0.75)' },
  pctBadge:{ marginLeft: 'auto', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  pctTxt:  { fontSize: 12, fontWeight: '700', color: C.white },
});

// ── Menu Item Card ────────────────────────────────────────────────────────────
const MenuItemCard = ({ item }) => (
  <View style={mi.card}>
    <View style={mi.topRow}>
      <Text style={mi.name}>{item.name}</Text>
      <View style={mi.calBadge}>
        <Text style={mi.calTxt}>{item.calories} kcal</Text>
      </View>
    </View>

    {/* Price */}
    <Text style={mi.price}>${item.price.toFixed(2)}</Text>

    {/* Macro row */}
    <View style={mi.macroRow}>
      {[
        { label: 'Protein', value: `${item.protein}g`, color: C.blue },
        { label: 'Carbs',   value: `${item.carbs}g`,  color: C.teal },
        { label: 'Fat',     value: `${item.fat}g`,    color: C.amber },
      ].map((m) => (
        <View key={m.label} style={mi.macroChip}>
          <Text style={[mi.macroVal, { color: m.color }]}>{m.value}</Text>
          <Text style={mi.macroLbl}>{m.label}</Text>
        </View>
      ))}
    </View>

    {/* Tags */}
    {item.tags?.length > 0 && (
      <View style={mi.tagRow}>
        {item.tags.map((t) => (
          <View key={t} style={mi.tag}>
            <Text style={mi.tagTxt}>{t}</Text>
          </View>
        ))}
      </View>
    )}
  </View>
);
const mi = StyleSheet.create({
  card:     { backgroundColor: C.bg, borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: C.border },
  topRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  name:     { fontSize: 14, fontWeight: '700', color: C.dark, flex: 1, marginRight: 8 },
  calBadge: { backgroundColor: C.purple, borderRadius: 14, paddingHorizontal: 9, paddingVertical: 3 },
  calTxt:   { fontSize: 12, fontWeight: '800', color: C.white },
  price:    { fontSize: 13, color: C.subtle, marginBottom: 10 },
  macroRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  macroChip:{ flex: 1, backgroundColor: C.white, borderRadius: 8, paddingVertical: 6, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  macroVal: { fontSize: 13, fontWeight: '800' },
  macroLbl: { fontSize: 10, color: C.subtle, marginTop: 1 },
  tagRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag:      { backgroundColor: C.purpleLight, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  tagTxt:   { fontSize: 10, color: C.purple, fontWeight: '500' },
});

// ── Restaurant Card (expandable) ──────────────────────────────────────────────
const RestaurantCard = ({ restaurant }) => {
  const [expanded, setExpanded] = useState(false);
  const matchCount = restaurant.matchingItems?.length || 0;

  return (
    <View style={rc.card}>
      {/* Header — always visible */}
      <TouchableOpacity
        style={rc.header}
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.8}
      >
        {/* Left: emoji + info */}
        <View style={rc.emojiCircle}>
          <Text style={rc.emoji}>{restaurant.emoji}</Text>
        </View>
        <View style={rc.info}>
          <Text style={rc.name}>{restaurant.name}</Text>
          <Text style={rc.meta}>
            {restaurant.cuisine}  ·  {restaurant.priceRange}  ·  ⭐ {restaurant.rating}
          </Text>
          <Text style={rc.address} numberOfLines={1}>📍 {restaurant.address}</Text>
        </View>

        {/* Right: match badge + chevron */}
        <View style={rc.right}>
          <View style={rc.matchBadge}>
            <Text style={rc.matchTxt}>{matchCount} item{matchCount !== 1 ? 's' : ''} fit</Text>
          </View>
          <Text style={rc.chevron}>{expanded ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>

      {/* Description strip */}
      {!expanded && (
        <Text style={rc.desc} numberOfLines={1}>{restaurant.description}</Text>
      )}

      {/* Expanded: full description + menu items */}
      {expanded && (
        <View style={rc.body}>
          <Text style={rc.fullDesc}>{restaurant.description}</Text>

          <Text style={rc.menuHeading}>Menu Items Matching Your Budget</Text>

          {restaurant.matchingItems.length === 0 ? (
            <Text style={rc.noItems}>No items fit your current budget.</Text>
          ) : (
            restaurant.matchingItems.map((item) => (
              <MenuItemCard key={item.itemId} item={item} />
            ))
          )}
        </View>
      )}
    </View>
  );
};
const rc = StyleSheet.create({
  card:        { backgroundColor: C.white, borderRadius: 14, marginBottom: 12, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  header:      { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  emojiCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.purpleLight, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  emoji:       { fontSize: 22 },
  info:        { flex: 1 },
  name:        { fontSize: 15, fontWeight: '800', color: C.dark, marginBottom: 2 },
  meta:        { fontSize: 12, color: C.subtle, marginBottom: 2 },
  address:     { fontSize: 11, color: C.subtle },
  right:       { alignItems: 'flex-end', gap: 6, flexShrink: 0 },
  matchBadge:  { backgroundColor: C.greenPale, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1, borderColor: C.greenBorder },
  matchTxt:    { fontSize: 11, fontWeight: '700', color: C.green },
  chevron:     { fontSize: 11, color: C.subtle },
  desc:        { fontSize: 12, color: C.subtle, paddingHorizontal: 14, paddingBottom: 12, lineHeight: 17 },
  body:        { borderTopWidth: 1, borderTopColor: C.border, padding: 14 },
  fullDesc:    { fontSize: 13, color: C.body, lineHeight: 19, marginBottom: 14 },
  menuHeading: { fontSize: 13, fontWeight: '700', color: C.dark, marginBottom: 8 },
  noItems:     { fontSize: 13, color: C.subtle, textAlign: 'center', paddingVertical: 12 },
});

// ── Empty State ───────────────────────────────────────────────────────────────
const EmptyState = ({ query }) => (
  <View style={es.card}>
    <Text style={es.emoji}>{query ? '🔍' : '🎉'}</Text>
    <Text style={es.title}>
      {query ? 'No restaurants match your search' : 'Goal almost reached!'}
    </Text>
    <Text style={es.body}>
      {query
        ? `No results for "${query}". Try a different search term.`
        : 'Your remaining calorie budget is very low. Consider a light snack or water instead.'}
    </Text>
  </View>
);
const es = StyleSheet.create({
  card:  { backgroundColor: C.white, borderRadius: 14, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: C.border, marginBottom: 14 },
  emoji: { fontSize: 40, marginBottom: 10 },
  title: { fontSize: 16, fontWeight: '700', color: C.dark, marginBottom: 6, textAlign: 'center' },
  body:  { fontSize: 13, color: C.subtle, textAlign: 'center', lineHeight: 20 },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
const DineOutScreen = ({ navigation, route }) => {
  const user = route?.params?.user || null;

  const [loading,       setLoading]      = useState(true);
  const [error,         setError]        = useState('');
  const [targets,       setTargets]      = useState(null);
  const [remaining,     setRemaining]    = useState(null);
  const [allRestaurants, setAllRestaurants] = useState([]);
  const [query,         setQuery]        = useState('');
  const [cuisine,       setCuisine]      = useState('All');

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      setError('');

      ctrl.fetchDineOutOptions(user?.userId).then((result) => {
        if (!active) return;
        if (result.success && result.data) {
          const { targets: t, remaining: r, restaurants } = result.data;
          setTargets(t);
          setRemaining(r);
          setAllRestaurants(restaurants);
        } else {
          setError(result.message || 'Unable to load dine out options.');
        }
        setLoading(false);
      });

      return () => { active = false; };
    }, [user?.userId])
  );

  // Client-side filter chain — cuisine then search
  const cuisines   = ctrl.getCuisines();
  const byCuisine  = ctrl.filterByCuisine(allRestaurants, cuisine);
  const displayed  = ctrl.search(byCuisine, query);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />
      <NavBar onMenuPress={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Page header */}
        <View style={s.header}>
          <View style={s.premBadge}><Text style={s.premBadgeTxt}>👑 Premium</Text></View>
          <Text style={s.pageTitle}>Dine Out Options</Text>
          <Text style={s.pageSub}>Restaurants with menu items that fit your remaining daily budget</Text>
        </View>

        {loading ? (
          <View style={s.loadingWrap}><Text style={s.loadingTxt}>Finding options near you...</Text></View>
        ) : error ? (
          <View style={s.errorWrap}><Text style={s.errorTxt}>⚠️  {error}</Text></View>
        ) : (
          <>
            {/* Budget pill */}
            {remaining && targets && (
              <BudgetPill remaining={remaining} targets={targets} />
            )}

            {/* Info strip */}
            <View style={s.infoStrip}>
              <Text style={s.infoIcon}>💡</Text>
              <Text style={s.infoTxt}>
                Showing restaurants with meals that fit your remaining{' '}
                <Text style={s.infoHighlight}>{Math.round(remaining?.calories || 0)} kcal</Text>.
                Tap a card to see matching menu items.
              </Text>
            </View>

            {/* Search bar */}
            <View style={s.searchWrap}>
              <Text style={s.searchIcon}>🔍</Text>
              <TextInput
                style={s.searchInput}
                placeholder="Search restaurants or dishes..."
                placeholderTextColor={C.subtle}
                value={query}
                onChangeText={setQuery}
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery('')} style={s.clearBtn}>
                  <Text style={s.clearTxt}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Cuisine filter chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.chipScroll}
              style={s.chipScrollWrap}
            >
              {cuisines.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[s.chip, cuisine === c && s.chipActive]}
                  onPress={() => setCuisine(c)}
                  activeOpacity={0.8}
                >
                  <Text style={[s.chipTxt, cuisine === c && s.chipTxtActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Section label */}
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>
                {displayed.length} restaurant{displayed.length !== 1 ? 's' : ''} found
              </Text>
            </View>

            {/* Restaurant cards */}
            {displayed.length === 0 ? (
              <EmptyState query={query} />
            ) : (
              displayed.map((restaurant) => (
                <RestaurantCard
                  key={restaurant.restaurantId}
                  restaurant={restaurant}
                />
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: C.bg },
  scroll:        { paddingHorizontal: 16, paddingBottom: 40 },
  header:        { paddingTop: 20, paddingBottom: 16 },
  premBadge:     { alignSelf: 'flex-start', backgroundColor: C.purple, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 10 },
  premBadgeTxt:  { fontSize: 12, fontWeight: '700', color: C.white },
  pageTitle:     { fontSize: 28, fontWeight: '800', color: C.dark, letterSpacing: -0.5, marginBottom: 6 },
  pageSub:       { fontSize: 14, color: C.subtle, lineHeight: 21 },
  loadingWrap:   { alignItems: 'center', paddingVertical: 60 },
  loadingTxt:    { fontSize: 15, color: C.subtle },
  errorWrap:     { backgroundColor: '#FEF2F2', borderRadius: 12, padding: 16, marginTop: 8 },
  errorTxt:      { fontSize: 14, color: '#DC2626', textAlign: 'center' },
  infoStrip:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: C.purpleLight, borderRadius: 10, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: '#C4B5FD' },
  infoIcon:      { fontSize: 15 },
  infoTxt:       { flex: 1, fontSize: 13, color: C.purple, lineHeight: 19 },
  infoHighlight: { fontWeight: '700' },
  searchWrap:    { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: 12, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, marginBottom: 12 },
  searchIcon:    { fontSize: 15, color: C.subtle, marginRight: 8 },
  searchInput:   { flex: 1, fontSize: 14, color: C.dark, paddingVertical: 13 },
  clearBtn:      { padding: 4 },
  clearTxt:      { fontSize: 14, color: C.subtle },
  chipScrollWrap:{ marginBottom: 14 },
  chipScroll:    { gap: 8, paddingRight: 4 },
  chip:          { borderWidth: 1, borderColor: C.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: C.white },
  chipActive:    { backgroundColor: C.purple, borderColor: C.purple },
  chipTxt:       { fontSize: 13, color: C.mid, fontWeight: '500' },
  chipTxtActive: { color: C.white, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle:  { fontSize: 14, fontWeight: '700', color: C.mid },
});

export default DineOutScreen;
