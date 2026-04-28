import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, StatusBar, ActivityIndicator, Alert, Image,
  Keyboard, KeyboardAvoidingView, Platform} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ViewSavedRecipesController from '../controller/ViewSavedRecipesController';

const controller = new ViewSavedRecipesController();

// Design Tokens
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
  successBg:   '#F0FDF4',
  successBorder:'#BBF7D0',
  successText: '#15803D',
};

const PREP_TIME_OPTIONS  = ['All Times', '≤ 15 min', '≤ 30 min', '≤ 45 min', '≤ 60 min'];
const BATCH_SIZE_OPTIONS = ['All Sizes', '1-2 servings', '3-4 servings', '5+ servings'];
const PREP_TIME_MINS     = { 'All Times': null, '≤ 15 min': 15, '≤ 30 min': 30, '≤ 45 min': 45, '≤ 60 min': 60 };


const NavBar = ({ onMenuPress }) => (
  <View style={nav.bar}>
    <View style={nav.brand}>
      <Text style={nav.icon}>🍴</Text>
      <Text style={nav.brandName}>BiteWise</Text>
    </View>
    <TouchableOpacity onPress={onMenuPress} style={nav.menuBtn}>
      <View style={nav.menuLine} />
      <View style={[nav.menuLine, { width: 18 }]} />
      <View style={nav.menuLine} />
    </TouchableOpacity>
  </View>
);
const nav = StyleSheet.create({
  bar:      { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:20, paddingVertical:14, backgroundColor:C.white, borderBottomWidth:1, borderBottomColor:C.border },
  brand:    { flexDirection:'row', alignItems:'center', gap:6 },
  icon:     { fontSize:20 },
  brandName:{ fontSize:20, fontWeight:'800', color:C.dark, letterSpacing:-0.3 },
  menuBtn:  { padding:6, gap:4, alignItems:'flex-end' },
  menuLine: { width:22, height:2.5, backgroundColor:C.dark, borderRadius:2 },
});

// Saved recipe card — rich view with macros, servings, date
const SavedRecipeCard = ({ recipe, onRemove }) => (
  <View style={src.card}>
    {recipe.imageUrl ? (
      <Image source={{ uri: recipe.imageUrl }} style={src.image} resizeMode="cover" />
    ) : (
      <View style={src.imagePlaceholder}><Text style={{ fontSize:32 }}>🍽️</Text></View>
    )}
    <View style={src.body}>
      <Text style={src.title}>{recipe.title}</Text>
      <View style={src.metaRow}>
        <Text style={src.meta}>⏱ {recipe.prepTimeMins} min</Text>
        <Text style={src.meta}>👥 {recipe.servings} servings</Text>
      </View>
      <View style={src.tagRow}>
        {recipe.tags.map((t, i) => <View key={i} style={src.tag}><Text style={src.tagText}>{t}</Text></View>)}
      </View>
      <View style={src.nutritionRow}>
        {[{ l:'cal', v:recipe.calories }, { l:'protein', v:`${recipe.protein}g` }, { l:'carbs', v:`${recipe.carbs}g` }, { l:'fat', v:`${recipe.fat}g` }].map((n) => (
          <View key={n.l} style={src.nutriItem}>
            <Text style={src.nutriValue}>{n.v}</Text>
            <Text style={src.nutriLabel}>{n.l}</Text>
          </View>
        ))}
      </View>
      <View style={src.footer}>
        <Text style={src.savedDate}>Saved {new Date().toLocaleDateString('en-SG')}</Text>
        <TouchableOpacity onPress={() => onRemove(recipe.recipeId)} style={src.removeBtn} accessibilityRole="button">
          <Text style={src.removeIcon}>🗑</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
);
const src = StyleSheet.create({
  card:          { backgroundColor:C.white, borderRadius:14, marginBottom:14, overflow:'hidden', borderWidth:1, borderColor:C.border },
  image:         { width:'100%', height:160 },
  imagePlaceholder:{ width:'100%', height:160, backgroundColor:C.purpleLight, alignItems:'center', justifyContent:'center' },
  body:          { padding:14 },
  title:         { fontSize:16, fontWeight:'700', color:C.dark, marginBottom:6 },
  metaRow:       { flexDirection:'row', gap:14, marginBottom:8 },
  meta:          { fontSize:12, color:C.subtle },
  tagRow:        { flexDirection:'row', flexWrap:'wrap', gap:6, marginBottom:10 },
  tag:           { backgroundColor:C.purpleLight, borderRadius:20, paddingHorizontal:8, paddingVertical:3 },
  tagText:       { fontSize:11, color:C.purple },
  nutritionRow:  { flexDirection:'row', justifyContent:'space-between', marginBottom:10 },
  nutriItem:     { alignItems:'center' },
  nutriValue:    { fontSize:14, fontWeight:'700', color:C.dark },
  nutriLabel:    { fontSize:11, color:C.subtle },
  footer:        { flexDirection:'row', justifyContent:'space-between', alignItems:'center', borderTopWidth:1, borderTopColor:C.border, paddingTop:10 },
  savedDate:     { fontSize:12, color:C.subtle },
  removeBtn:     { padding:4 },
  removeIcon:    { fontSize:18 },
});


// MAIN SCREEN — Premium only (#65, #64, #68)

const SavedRecipesScreen = ({ navigation, route }) => {
  const user = route?.params?.user || null;

  // ROLE GATE — redirect Free users immediately
  if (user?.role !== 'premium') {
    return (
      <SafeAreaView style={styles.safe}>
        <NavBar onMenuPress={() => navigation.goBack()} />
        <View style={styles.gateWrap}>
          <Text style={styles.gateIcon}>🔒</Text>
          <Text style={styles.gateTitle}>Premium Feature</Text>
          <Text style={styles.gateBody}>Saving and managing your recipe collection requires a Premium membership.</Text>
          <TouchableOpacity style={styles.gateBtn} onPress={() => navigation.navigate('ViewPricingPlansScreen')} activeOpacity={0.85}>
            <Text style={styles.gateBtnText}>Upgrade to Premium</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const [allSaved,   setAllSaved]   = useState([]);
  const [isLoading,  setIsLoading]  = useState(true);
  const [search,     setSearch]     = useState('');
  const [prepTime,   setPrepTime]   = useState('All Times');
  const [batchSize,  setBatchSize]  = useState('All Sizes');
  const [activeDiet, setActiveDiet] = useState('All');

  // UC #65 — load on mount
  useEffect(() => {
    controller.fetchSavedRecipes(user.userId).then((result) => {
      if (result.success) setAllSaved(result.data);
      setIsLoading(false);
    });
  }, []);

  // Remove from saved list (local only — would call API in production)
  const handleRemove = useCallback((recipeId) => {
    Alert.alert('Remove Recipe', 'Remove this recipe from your saved collection?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setAllSaved((prev) => prev.filter((r) => r.recipeId !== recipeId)) },
    ]);
  }, []);

  // Derive unique tags from saved recipes for the dietary chip row
  const dietTags = ['All', ...new Set(allSaved.flatMap((r) => r.tags))];

  // UC #64, #68 — filter chain
  const visible = (() => {
    let list = allSaved;
    if (search.trim())       list = controller.searchSavedRecipes(list, search);
    if (activeDiet !== 'All') list = controller.filterByDietaryTag(list, activeDiet);
    const maxMins = PREP_TIME_MINS[prepTime];
    if (maxMins)             list = controller.filterByPrepTime(list, maxMins);
    if (batchSize !== 'All Sizes') {
      if (batchSize === '1-2 servings') list = list.filter((r) => r.servings <= 2);
      else if (batchSize === '3-4 servings') list = list.filter((r) => r.servings >= 3 && r.servings <= 4);
      else if (batchSize === '5+ servings')  list = list.filter((r) => r.servings >= 5);
    }
    return list;
  })();

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />
      <NavBar onMenuPress={() => navigation.navigate('AccountSettingsScreen', { user })} />

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.premiumBadge}><Text style={styles.premiumBadgeText}>☆ Premium</Text></View>
          <Text style={styles.pageTitle}>Saved Recipes</Text>
          <Text style={styles.pageSubtitle}>
            Your personally saved recipe collection ({allSaved.length} recipe{allSaved.length !== 1 ? 's' : ''})
          </Text>
        </View>

        {/* Filter panel — UC #64, #68 */}
        <View style={styles.filterCard}>
          {/* Search */}
          <View style={styles.searchRow}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search saved recipes or ingredients..."
              placeholderTextColor={C.subtle}
              autoCorrect={false}
            />
          </View>

          {/* Prep Time picker — UC #68 */}
          <Text style={styles.filterLabel}>Prep Time</Text>
          <View style={styles.pickerRow}>
            {PREP_TIME_OPTIONS.map((opt) => (
              <TouchableOpacity key={opt} style={[pk.chip, prepTime === opt && pk.chipActive]} onPress={() => setPrepTime(opt)} activeOpacity={0.8}>
                <Text style={[pk.chipText, prepTime === opt && pk.chipTextActive]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Batch Size picker — UC #68 */}
          <Text style={styles.filterLabel}>Batch Size</Text>
          <View style={styles.pickerRow}>
            {BATCH_SIZE_OPTIONS.map((opt) => (
              <TouchableOpacity key={opt} style={[pk.chip, batchSize === opt && pk.chipActive]} onPress={() => setBatchSize(opt)} activeOpacity={0.8}>
                <Text style={[pk.chipText, batchSize === opt && pk.chipTextActive]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Dietary Tags — UC #64 */}
          <Text style={styles.filterLabel}>Dietary Tags</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap:6 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
            {dietTags.map((t) => (
              <TouchableOpacity key={t} style={[pk.chip, activeDiet === t && pk.chipActive]} onPress={() => setActiveDiet(t)} activeOpacity={0.8}>
                <Text style={[pk.chipText, activeDiet === t && pk.chipTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Saved recipe list */}
        {isLoading ? (
          <ActivityIndicator size="large" color={C.purple} style={{ marginTop:32 }} />
        ) : visible.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔖</Text>
            <Text style={styles.emptyText}>No saved recipes found.</Text>
            <Text style={styles.emptySubtext}>Browse the Recipe Library and save recipes you love.</Text>
          </View>
        ) : (
          visible.map((recipe) => (
            <SavedRecipeCard key={recipe.recipeId} recipe={recipe} onRemove={handleRemove} />
          ))
        )}

      </ScrollView>
          </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const pk = StyleSheet.create({
  chip:          { paddingHorizontal:10, paddingVertical:5, borderRadius:20, borderWidth:1, borderColor:C.border, backgroundColor:C.white, marginRight:6 },
  chipActive:    { backgroundColor:C.purple, borderColor:C.purple },
  chipText:      { fontSize:12, color:C.mid },
  chipTextActive:{ color:C.white, fontWeight:'600' },
});

const styles = StyleSheet.create({
  safe:         { flex:1, backgroundColor:C.bg },
  list:         { paddingHorizontal:16, paddingBottom:32 },
  gateWrap:     { flex:1, alignItems:'center', justifyContent:'center', paddingHorizontal:32 },
  gateIcon:     { fontSize:48, marginBottom:16 },
  gateTitle:    { fontSize:20, fontWeight:'800', color:C.dark, marginBottom:8 },
  gateBody:     { fontSize:14, color:C.subtle, textAlign:'center', lineHeight:21, marginBottom:20 },
  gateBtn:      { backgroundColor:C.purple, borderRadius:10, paddingVertical:13, paddingHorizontal:24 },
  gateBtnText:  { fontSize:14, fontWeight:'700', color:C.white },
  header:       { paddingVertical:20 },
  premiumBadge: { alignSelf:'flex-start', backgroundColor:C.purple, borderRadius:20, paddingHorizontal:10, paddingVertical:3, marginBottom:8 },
  premiumBadgeText:{ fontSize:11, fontWeight:'700', color:C.white },
  pageTitle:    { fontSize:26, fontWeight:'800', color:C.dark, letterSpacing:-0.3, marginBottom:4 },
  pageSubtitle: { fontSize:13, color:C.subtle },
  filterCard:   { backgroundColor:C.white, borderRadius:14, padding:14, borderWidth:1, borderColor:C.border, marginBottom:14, gap:10 },
  searchRow:    { flexDirection:'row', alignItems:'center', backgroundColor:C.bg, borderRadius:8, paddingHorizontal:10, paddingVertical:8, borderWidth:1, borderColor:C.border, gap:8 },
  searchIcon:   { fontSize:14, color:C.subtle },
  searchInput:  { flex:1, fontSize:14, color:C.dark },
  filterLabel:  { fontSize:13, fontWeight:'600', color:C.dark },
  pickerRow:    { flexDirection:'row', flexWrap:'wrap', gap:6 },
  emptyState:   { alignItems:'center', paddingVertical:48 },
  emptyIcon:    { fontSize:40, marginBottom:12 },
  emptyText:    { fontSize:15, fontWeight:'600', color:C.dark, marginBottom:4 },
  emptySubtext: { fontSize:13, color:C.subtle, textAlign:'center' },
});

export default SavedRecipesScreen;
