// MyRecipesScreen.jsx — UC #27, #70, Sprint 9 Task 5 (Edit + Delete)
// Boundary only: no axios, no api_config.
// All data access goes through controllers → Recipe entity.
//
// Sprint 9 additions:
//   - Edit button on each recipe card → navigates to EditMyRecipeScreen
//   - Delete button on each recipe card → Alert.alert confirm → deletes + removes card

import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, ActivityIndicator, Alert, Image} from 'react-native';
import { SafeAreaView }   from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import ViewMyRecipesController    from '../controller/ViewMyRecipesController';
import DeleteCustomRecipeController from '../controller/DeleteCustomRecipeController';

const viewCtrl   = new ViewMyRecipesController();
const deleteCtrl = new DeleteCustomRecipeController();

// ── Design Tokens ─────────────────────────────────────────────────────────────
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
  red:           '#DC2626',
  redLight:      '#FEF2F2',
  redBorder:     '#FECACA',
  successBg:     '#F0FDF4',
  successBorder: '#BBF7D0',
  successText:   '#15803D',
};

// ── NavBar ────────────────────────────────────────────────────────────────────
const NavBar = ({ onMenu }) => (
  <View style={nav.bar}>
    <View style={nav.brand}>
      <Image source={require('../assets/BiteWiseLogo.png')} style={nav.logo} />
      <Text style={nav.brandName}>BiteWise</Text>
    </View>
    <TouchableOpacity onPress={onMenu} style={nav.backBtn}>
          <Text style={nav.backText}>← Back</Text>
        </TouchableOpacity>
  </View>
);
const nav = StyleSheet.create({
  bar:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  brand:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  icon:      { fontSize: 20 },
  logo:      { width: 24, height: 24, resizeMode: 'contain' },
  brandName: { fontSize: 20, fontWeight: '800', color: C.dark },
  menuBtn:   { padding: 6, gap: 4, alignItems: 'flex-end' },
  menuLine:  { width: 22, height: 2.5, backgroundColor: C.dark, borderRadius: 2 },
  backBtn:  { padding: 6 },
  backText: { fontSize: 14, fontWeight: '500', color: '#374151' },
});

// ── Success Banner ────────────────────────────────────────────────────────────
const Banner = ({ message }) => {
  if (!message) return null;
  return (
    <View style={bn.wrap}>
      <Image source={require('../assets/icon-success.png')} style={[bn.icon,{width:20,height:20,resizeMode:'contain'}]} />
      <Text style={bn.text}>{message}</Text>
    </View>
  );
};
const bn = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.successBg, borderBottomWidth: 1, borderBottomColor: C.successBorder },
  icon: { fontSize: 16 },
  text: { flex: 1, fontSize: 14, fontWeight: '500', color: C.successText },
});

// ── Recipe Card (with Edit + Delete) ─────────────────────────────────────────
const RecipeCard = ({ recipe, onEdit, onDelete }) => (
  <View style={rc.card}>
    {/* Recipe info */}
    <Text style={rc.title}>{recipe.title}</Text>
    <Text style={rc.meta}>
      <Image source={require('../assets/stat-prep-time.png')} style={{width:14,height:14,resizeMode:'contain'}} />{recipe.prepTimeMins} min  •  {recipe.calories} kcal  •  {recipe.difficulty}
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

    {/* Edit + Delete action row — separated by top border */}
    <View style={rc.actionRow}>
      <TouchableOpacity style={rc.editBtn} onPress={onEdit} activeOpacity={0.8}>
        <View style={{flexDirection:'row',alignItems:'center',gap:4}}><Image source={require('../assets/icon-edit.png')} style={{width:13,height:13,resizeMode:'contain'}} /><Text style={rc.editBtnText}>Edit</Text></View>
      </TouchableOpacity>
      <View style={rc.actionDivider} />
      <TouchableOpacity style={rc.deleteBtn} onPress={onDelete} activeOpacity={0.8}>
        <View style={{flexDirection:'row',alignItems:'center',gap:4}}><Image source={require('../assets/icon-delete.png')} style={{width:13,height:13,resizeMode:'contain'}} /><Text style={rc.deleteBtnText}>Delete</Text></View>
      </TouchableOpacity>
    </View>
  </View>
);
const rc = StyleSheet.create({
  card:         { backgroundColor: C.white, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border, marginBottom: 12 },
  title:        { fontSize: 16, fontWeight: '700', color: C.dark, marginBottom: 4 },
  meta:         { fontSize: 13, color: C.subtle, marginBottom: 6 },
  tagRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  tag:          { backgroundColor: C.purpleLight, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  tagText:      { fontSize: 11, color: C.purple },
  actionRow:    { flexDirection: 'row', borderTopWidth: 1, borderTopColor: C.border, marginTop: 4, paddingTop: 10 },
  editBtn:      { flex: 1, alignItems: 'center', paddingVertical: 4 },
  editBtnText:  { fontSize: 13, fontWeight: '600', color: C.purple },
  actionDivider:{ width: 1, backgroundColor: C.border, marginHorizontal: 4 },
  deleteBtn:    { flex: 1, alignItems: 'center', paddingVertical: 4 },
  deleteBtnText:{ fontSize: 13, fontWeight: '600', color: C.red },
});

// ── Empty State ───────────────────────────────────────────────────────────────
const EmptyState = ({ onCreate }) => (
  <View style={em.wrap}>
    <Image source={require('../assets/empty-my-recipes.png')} style={[em.emoji,{width:48,height:48,resizeMode:'contain'}]} />
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

// ── Main Screen ───────────────────────────────────────────────────────────────
const MyRecipesScreen = ({ navigation, route }) => {
  const user = route?.params?.user || null;

  const [recipes,   setRecipes]   = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [banner,    setBanner]    = useState(route?.params?.banner || '');
  const bannerConsumed = useRef(false);

  useEffect(() => {
    const incomingBanner = route?.params?.banner;

    if (incomingBanner && !bannerConsumed.current) {
      bannerConsumed.current = true;

      setBanner(incomingBanner);

      navigation.setParams({ banner: null });

      setTimeout(() => {
        setBanner('');
        bannerConsumed.current = false;
      }, 4000);
    }
  }, [route?.params?.banner]);

  // Re-fetch on every focus so edits/creates show immediately on return
  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        setIsLoading(true);
        const result = await viewCtrl.fetchMyRecipes(user.userId);
        if (result.success) setRecipes(result.data);
        setIsLoading(false);
      };
    
      load();
    }, [user?.userId])
  );

  // ── Edit handler ────────────────────────────────────────────────────────────
  const handleEdit = (recipe) => {
    navigation.navigate('EditMyRecipeScreen', { user, recipe });
  };

  // ── Delete handler ──────────────────────────────────────────────────────────
  const handleDelete = (recipe) => {
    const recipeId = recipe.recipeId || recipe._id;

    Alert.alert(
      'Delete Recipe',
      `Are you sure you want to delete "${recipe.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteCtrl.deleteRecipe(recipeId, user?.userId);
            if (result.success) {
              // Optimistically remove from list without re-fetching
              setRecipes((prev) =>
                prev.filter((r) => (r.recipeId || r._id) !== recipeId)
              );
              setBanner(result.message);
              setTimeout(() => setBanner(''), 4000);
            } else {
              Alert.alert('Error', result.message || 'Failed to delete recipe.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const goToCreate = () => navigation.navigate('CreateRecipeScreen', { user });

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />
      <NavBar onMenu={() => navigation.goBack()} />
      <Banner message={banner} />

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>

        {/* Header row */}
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
          recipes.map((r) => (
            <RecipeCard
              key={r.recipeId ?? r._id ?? r.title}
              recipe={r}
              onEdit={() => handleEdit(r)}
              onDelete={() => handleDelete(r)}
            />
          ))
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

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
