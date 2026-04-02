// MyRecipesScreen.jsx — UC #27, #70
// Boundary only: no axios, no api_config.
// All data access goes through ViewMyRecipesController → Recipe entity.

import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, ActivityIndicator,
} from 'react-native';
import { SafeAreaView }   from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import ViewMyRecipesController from '../controller/ViewMyRecipesController';

const controller = new ViewMyRecipesController();

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
  successBg:     '#F0FDF4',
  successBorder: '#BBF7D0',
  successText:   '#15803D',
};


// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────

const NavBar = ({ onMenu }) => (
  <View style={nav.bar}>
    <View style={nav.brand}>
      <Text style={nav.icon}>🍴</Text>
      <Text style={nav.brandName}>BiteWise</Text>
    </View>
    <TouchableOpacity onPress={onMenu} style={nav.menuBtn} accessibilityRole="button">
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
  brandName: { fontSize: 20, fontWeight: '800', color: C.dark },
  menuBtn:   { padding: 6, gap: 4, alignItems: 'flex-end' },
  menuLine:  { width: 22, height: 2.5, backgroundColor: C.dark, borderRadius: 2 },
});

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

const RecipeCard = ({ recipe }) => (
  <View style={rc.card}>
    <Text style={rc.title}>{recipe.title}</Text>
    <Text style={rc.meta}>
      ⏱ {recipe.prepTimeMins} min  •  {recipe.calories} kcal  •  {recipe.difficulty}
    </Text>
    {recipe.tags?.length > 0 && (
      <View style={rc.tagRow}>
        {recipe.tags.map((t, i) => (
          <View key={i} style={rc.tag}>
            <Text style={rc.tagText}>{t}</Text>
          </View>
        ))}
      </View>
    )}
  </View>
);
const rc = StyleSheet.create({
  card:    { backgroundColor: C.white, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border, marginBottom: 12 },
  title:   { fontSize: 16, fontWeight: '700', color: C.dark, marginBottom: 4 },
  meta:    { fontSize: 13, color: C.subtle, marginBottom: 6 },
  tagRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag:     { backgroundColor: C.purpleLight, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontSize: 11, color: C.purple },
});

const EmptyState = ({ onCreate }) => (
  <View style={em.wrap}>
    <Text style={em.emoji}>👨‍🍳</Text>
    <Text style={em.heading}>No Custom Recipes Yet</Text>
    <Text style={em.body}>Start creating your own recipes to keep your favourites organised</Text>
    <TouchableOpacity style={em.btn} onPress={onCreate} activeOpacity={0.85}>
      <Text style={em.btnText}>+ Create Your First Recipe</Text>
    </TouchableOpacity>
  </View>
);
const em = StyleSheet.create({
  wrap:    { backgroundColor: C.white, borderRadius: 14, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  emoji:   { fontSize: 48, marginBottom: 12 },
  heading: { fontSize: 18, fontWeight: '700', color: C.dark, marginBottom: 6 },
  body:    { fontSize: 13, color: C.subtle, textAlign: 'center', marginBottom: 20 },
  btn:     { backgroundColor: C.purple, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 20 },
  btnText: { fontSize: 13, fontWeight: '700', color: C.white },
});


// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────

const MyRecipesScreen = ({ navigation, route }) => {
  const user = route?.params?.user || null;

  const [recipes,   setRecipes]   = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [banner,    setBanner]    = useState(route?.params?.banner || '');

  // UC #27, #70 — re-fetch every time the screen comes into focus so a newly
  // created recipe appears immediately on return from CreateRecipeScreen.
  useFocusEffect(
    useCallback(() => {
      if (banner) setTimeout(() => setBanner(''), 4000);

      if (!user?.userId) {
        setIsLoading(false);
        return;
      }

      const load = async () => {
        setIsLoading(true);
        const result = await controller.fetchMyRecipes(user.userId);
        if (result.success) setRecipes(result.data);
        setIsLoading(false);
      };

      load();
    }, [user?.userId])
  );

  const goToCreate = () => navigation.navigate('CreateRecipeScreen', { user });

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />

      <NavBar onMenu={() => navigation.navigate('AccountSettingsScreen', { user })} />
      <Banner message={banner} />

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.pageTitle}>My Custom Recipes</Text>
            <Text style={styles.pageSubtitle}>Create and save your favourite recipes</Text>
          </View>
          <TouchableOpacity style={styles.createBtn} onPress={goToCreate} activeOpacity={0.85}>
            <Text style={styles.createBtnText}>+ Create Recipe</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.spacer} />

        {isLoading ? (
          <ActivityIndicator size="large" color={C.purple} />
        ) : recipes.length === 0 ? (
          <EmptyState onCreate={goToCreate} />
        ) : (
          recipes.map((r) => <RecipeCard key={r.recipeId ?? r.title} recipe={r} />)
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: C.bg },
  list:         { paddingHorizontal: 16, paddingBottom: 32 },
  headerRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 20, marginBottom: 4 },
  pageTitle:    { fontSize: 24, fontWeight: '800', color: C.dark },
  pageSubtitle: { fontSize: 13, color: C.subtle, marginTop: 2 },
  createBtn:    { backgroundColor: C.purple, borderRadius: 8, paddingVertical: 9, paddingHorizontal: 14 },
  createBtnText:{ fontSize: 13, fontWeight: '700', color: C.white },
  spacer:       { height: 20 },
});

export default MyRecipesScreen;
