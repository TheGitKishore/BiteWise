// DineOutScreen.jsx — Sprint 9 Task 6
// UC: Premium User – View Dine Out Options
// Displays restaurants whose menu items fit within the user's remaining
// daily nutrition budget. Premium only — all 3 profile types.

import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, StatusBar,
  Keyboard, KeyboardAvoidingView, Platform, Image} from 'react-native';
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

// ── Budget Pill ───────────────────────────────────────────────────────────────
const BudgetPill = ({ consumed, remaining, targets }) => {
  const calorieGoal = Number(targets?.calories || 0);
  const consumedCalories = Number(
    consumed?.calories ?? Math.max(0, calorieGoal - Number(remaining?.calories || 0))
  );
  const remainingCalories = Number(
    remaining?.calories ?? Math.max(0, calorieGoal - consumedCalories)
  );
  const pct = calorieGoal > 0
    ? Math.min(Math.round((consumedCalories / calorieGoal) * 100), 100)
    : 0;

  return (
    <View style={bp.wrap}>
      <View style={bp.pill}>
        <Image source={require('../assets/placeholder-recipe.png')} style={[bp.icon,{width:44,height:44,resizeMode:'contain'}]} />
        <View>
          <Text style={bp.label}>Remaining Budget</Text>
          <Text style={bp.value}>
            <Text style={bp.big}>{Math.round(remainingCalories)}</Text>
            <Text style={bp.unit}> kcal left</Text>
          </Text>
          <Text style={bp.usedText}>
            {Math.round(consumedCalories)} / {Math.round(calorieGoal)} kcal used
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
  usedText:{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
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
        {item.tags.map((t, idx) => (
          <View key={`${t || 'tag'}-${idx}`} style={mi.tag}>
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
            {restaurant.cuisine}  ·  {restaurant.priceRange}  ·  <Image source={require('../assets/tile-curator-program.png')} style={{width:14,height:14,resizeMode:'contain'}} /> {restaurant.rating}
          </Text>
          <View style={{flexDirection:'row',alignItems:'center',gap:4}}><Image source={require('../assets/icon-location.png')} style={{width:14,height:14,resizeMode:'contain'}} /><Text style={rc.address} numberOfLines={1}>{restaurant.address}</Text></View>
        </View>

        {/* Right: match badge + chevron */}
        <View style={rc.right}>
          <View style={rc.matchBadge}>
            <Text style={rc.matchTxt}>{matchCount} item{matchCount !== 1 ? 's' : ''} fit</Text>
          </View>
          {expanded  ? <Image source={require('../assets/icon-chevron-up.png')} style={{width:11,height:11,resizeMode:'contain'}} /> : <Image source={require('../assets/icon-chevron-down.png')} style={{width:11,height:11,resizeMode:'contain'}} />}
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
            restaurant.matchingItems.map((item, idx) => (
              <MenuItemCard key={`${item.itemId || item.name || 'menu-item'}-${idx}`} item={item} />
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
    {query  ? <Image source={require('../assets/empty-search.png')} style={{width:22,height:22,resizeMode:'contain'}} /> : <Image source={require('../assets/empty-goal-reached.png')} style={{width:22,height:22,resizeMode:'contain'}} />}
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
  const [consumed,      setConsumed]     = useState(null);
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
          const { targets: t, consumed: c, remaining: r, restaurants } = result.data;
          setTargets(t);
          setConsumed(c);
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
  const targetCalories = Number(targets?.calories || 0);
  const consumedCalories = Number(
    consumed?.calories ?? Math.max(0, targetCalories - Number(remaining?.calories || 0))
  );
  const remainingCalories = Number(
    remaining?.calories ?? (targets ? Math.max(0, targetCalories - consumedCalories) : 0)
  );

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />
      <NavBar onMenuPress={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >

        {/* Page header */}
        <View style={s.header}>
          <View style={s.premBadge}><View style={{flexDirection:'row',alignItems:'center',gap:4}}><Image source={require('../assets/icon-premium-crown.png')} style={{width:12,height:12,resizeMode:'contain'}} /><Text style={s.premBadgeTxt}>Premium</Text></View></View>
          <Text style={s.pageTitle}>Dine Out Options</Text>
          <Text style={s.pageSub}>Restaurants with menu items that fit your remaining daily budget</Text>
        </View>

        {loading ? (
          <View style={s.loadingWrap}><Text style={s.loadingTxt}>Finding options near you...</Text></View>
        ) : error ? (
          <View style={s.errorWrap}><View style={{flexDirection:'row',alignItems:'center',gap:4}}><Image source={require('../assets/icon-warning.png')} style={{width:14,height:14,resizeMode:'contain'}} /><Text style={s.errorTxt}>{error}</Text></View></View>
        ) : (
          <>
            {/* Budget pill */}
            {remaining && targets && (
              <BudgetPill consumed={consumed} remaining={remaining} targets={targets} />
            )}

            {/* Info strip */}
            <View style={s.infoStrip}>
              <Image source={require('../assets/section-tips.png')} style={[s.infoIcon,{width:16,height:16,resizeMode:'contain'}]} />
              <Text style={s.infoTxt}>
                Showing restaurants with meals that fit your remaining{' '}
                <Text style={s.infoHighlight}>{Math.round(remainingCalories)} kcal</Text>.
                Tap a card to see matching menu items.
              </Text>
            </View>

            {/* Search bar */}
            <View style={s.searchWrap}>
              <Image source={require('../assets/empty-search.png')} style={[s.searchIcon,{width:22,height:22,resizeMode:'contain'}]} />
              <TextInput
                style={s.searchInput}
                placeholder="Search restaurants or dishes..."
                placeholderTextColor={C.subtle}
                value={query}
                onChangeText={setQuery}
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery('')} style={s.clearBtn}>
                  <Image source={require('../assets/icon-close.png')} style={[s.clearTxt,{width:16,height:16,resizeMode:'contain'}]} />
                </TouchableOpacity>
              )}
            </View>

            {/* Cuisine filter chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.chipScroll}
              style={s.chipScrollWrap}
            
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
              {cuisines.map((c, idx) => (
                <TouchableOpacity
                  key={`${c || 'cuisine'}-${idx}`}
                  style={[s.chip, cuisine === c && s.chipActive]}
                  onPress={() => setCuisine(c)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[s.chipTxt, cuisine === c && s.chipTxtActive]}
                    numberOfLines={1}
                  >
                    {c}
                  </Text>
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
              displayed.map((restaurant, idx) => (
                <RestaurantCard
                  key={`${restaurant.restaurantId || restaurant.name || 'restaurant'}-${idx}`}
                  restaurant={restaurant}
                />
              ))
            )}
          </>
        )}
      </ScrollView>
          </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 40 },
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
  chipScrollWrap:{ height: 42, maxHeight: 42, flexGrow: 0, marginBottom: 14 },
  chipScroll:    { gap: 8, paddingRight: 4, alignItems: 'center' },
  chip:          { height: 36, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: C.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: C.white },
  chipActive:    { backgroundColor: C.purpleLight, borderColor: C.purple },
  chipTxt:       { fontSize: 13, lineHeight: 17, color: C.mid, fontWeight: '600' },
  chipTxtActive: { color: C.purple, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle:  { fontSize: 14, fontWeight: '700', color: C.mid },
});

export default DineOutScreen;
