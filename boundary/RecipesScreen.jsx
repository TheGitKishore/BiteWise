import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, StatusBar, ActivityIndicator, Modal,
  Image, Alert,
  Keyboard, KeyboardAvoidingView, Platform, Image} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ViewRecipesController from '../controller/ViewRecipesController';
import SaveRecipeController  from '../controller/SaveRecipeController';
import Recipe from '../entity/Recipe';

const viewCtrl = new ViewRecipesController();
const saveCtrl = new SaveRecipeController();

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
  errorText:   '#DC2626',
  errorBg:     '#FEF2F2',
  errorBorder: '#FECACA',
  successBg:   '#F0FDF4',
  successBorder:'#BBF7D0',
  successText: '#15803D',
};

const QUICK_FILTERS  = ['All Recipes', 'High Protein', 'Vegetarian', 'Quick & Easy', 'Meal Prep'];
const DIET_TAGS      = ['All', 'high-protein', 'low-carb', 'gluten-free', 'vegetarian', 'breakfast', 'vegan', 'meal-prep', 'batch-cooking'];
const DIETARY_RESTRICTIONS = ['Vegetarian', 'Vegan', 'Pescatarian', 'Gluten-Free', 'Dairy-Free', 'Low-Carb', 'Keto', 'Paleo'];
const ALLERGIES             = ['Nuts', 'Peanuts', 'Shellfish', 'Fish', 'Eggs', 'Dairy', 'Soy', 'Wheat', 'Gluten'];
const ALLERGY_KEYWORDS = {
  Nuts: ['nut', 'almond', 'walnut', 'cashew', 'hazelnut', 'pecan', 'pistachio', 'macadamia'],
  Peanuts: ['peanut', 'groundnut'],
  Shellfish: ['shellfish', 'shrimp', 'prawn', 'crab', 'lobster', 'mussel', 'oyster', 'clam', 'scallop'],
  Fish: ['fish', 'salmon', 'tuna', 'cod', 'mackerel', 'sardine', 'anchovy'],
  Eggs: ['egg'],
  Dairy: ['dairy', 'milk', 'cheese', 'butter', 'yogurt', 'cream', 'lactose', 'ghee'],
  Soy: ['soy', 'soya', 'tofu', 'edamame', 'miso', 'tempeh', 'soy sauce'],
  Wheat: ['wheat', 'whole wheat', 'semolina'],
  Gluten: ['gluten', 'wheat', 'barley', 'rye'],
};


// SUB-COMPONENTS

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
  bar:      { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:20, paddingVertical:14, backgroundColor:C.white, borderBottomWidth:1, borderBottomColor:C.border },
  brand:    { flexDirection:'row', alignItems:'center', gap:6 },
  icon:     { fontSize:20 },
  logo:      { width: 24, height: 24, resizeMode: 'contain' },
  brandName:{ fontSize:20, fontWeight:'800', color:C.dark, letterSpacing:-0.3 },
  menuBtn:  { padding:6, gap:4, alignItems:'flex-end' },
  menuLine: { width:22, height:2.5, backgroundColor:C.dark, borderRadius:2 },
});

const Banner = ({ message, type }) => {
  if (!message) return null;
  const ok = type === 'success';
  return (
    <View style={[bn.wrap, ok ? bn.success : bn.error]}>
      <Text style={bn.icon}>{ok ? '✅' : '⚠️'}</Text>
      <Text style={[bn.text, ok ? bn.successText : bn.errorText]}>{message}</Text>
    </View>
  );
};
const bn = StyleSheet.create({
  wrap:        { flexDirection:'row', alignItems:'center', gap:10, paddingHorizontal:16, paddingVertical:12, borderBottomWidth:1 },
  success:     { backgroundColor:C.successBg, borderBottomColor:C.successBorder },
  error:       { backgroundColor:C.errorBg,   borderBottomColor:C.errorBorder },
  icon:        { fontSize:16 },
  text:        { flex:1, fontSize:14, fontWeight:'500' },
  successText: { color:C.successText },
  errorText:   { color:C.errorText },
});

const formatCount = (count = 0) => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return String(count);
};

const LikeButton = ({ isLiked, count, onPress }) => (
  <TouchableOpacity
    style={[lk.btn, isLiked && lk.btnActive]}
    onPress={onPress}
    activeOpacity={0.85}
  >
    <Text style={lk.icon}>👍</Text>
    <Text style={[lk.text, isLiked && lk.textActive]}>{formatCount(count)}</Text>
  </TouchableOpacity>
);

const lk = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: C.white,
    alignSelf: 'flex-start',
  },
  btnActive: {
    backgroundColor: C.purpleLight,
    borderColor: C.purple,
  },
  icon: { fontSize: 13 },
  text: { fontSize: 12, color: C.mid, fontWeight: '600' },
  textActive: { color: C.purple },
});

// Recipe card in library list — shows image, title, macros, tags
const RecipeCard = ({ recipe, onPress, isLiked, likeCount, onToggleLike, canLike }) => (
  <TouchableOpacity style={rc.card} onPress={onPress} activeOpacity={0.85}>
    {recipe.imageUrl ? (
      <Image source={{ uri: recipe.imageUrl }} style={rc.image} resizeMode="cover" />
    ) : (
      <View style={rc.imagePlaceholder}><Text style={rc.imagePlaceholderIcon}>🍽️</Text></View>
    )}
    <View style={rc.diffBadge}><Text style={rc.diffText}>{recipe.difficulty}</Text></View>
    <View style={rc.body}>
      <Text style={rc.title}>{recipe.title}</Text>
      <Text style={rc.summary}>⏱ {recipe.prepTimeMins} min  ↗ {recipe.calories} kcal</Text>
      <View style={rc.macroRow}>
        {[{ l:'Protein', v:`${recipe.protein}g` }, { l:'Carbs', v:`${recipe.carbs}g` }, { l:'Fat', v:`${recipe.fat}g` }].map((m) => (
          <View key={m.l} style={rc.macroItem}>
            <Text style={rc.macroLabel}>{m.l}</Text>
            <Text style={rc.macroValue}>{m.v}</Text>
          </View>
        ))}
      </View>
      <Text style={rc.ingHeading}>Ingredients:</Text>
      {recipe.ingredients.slice(0, 3).map((ing, i) => (
        <Text key={i} style={rc.ing}>• <Text style={rc.ingPurple}>{ing}</Text></Text>
      ))}
      {recipe.ingredients.length > 3 && (
        <Text style={rc.ingMore}>+ {recipe.ingredients.length - 3} more</Text>
      )}
      <View style={rc.footer}>
        <View style={rc.tagRow}>
          {recipe.tags.map((t, i) => <View key={i} style={rc.tag}><Text style={rc.tagText}>{t}</Text></View>)}
        </View>
        {canLike ? (
          <LikeButton
            isLiked={isLiked}
            count={likeCount}
            onPress={(e) => {
              e?.stopPropagation?.();
              onToggleLike();
            }}
          />
        ) : null}
      </View>
    </View>
  </TouchableOpacity>
);
const rc = StyleSheet.create({
  card:               { backgroundColor:C.white, borderRadius:14, marginBottom:14, overflow:'hidden', borderWidth:1, borderColor:C.border },
  image:              { width:'100%', height:180 },
  imagePlaceholder:   { width:'100%', height:180, backgroundColor:C.purpleLight, alignItems:'center', justifyContent:'center' },
  imagePlaceholderIcon:{ fontSize:40 },
  diffBadge:          { position:'absolute', top:10, right:10, backgroundColor:C.purple, borderRadius:6, paddingHorizontal:8, paddingVertical:3 },
  diffText:           { fontSize:12, fontWeight:'700', color:C.white },
  body:               { padding:16 },
  title:              { fontSize:18, fontWeight:'700', color:C.dark, marginBottom:4 },
  summary:            { fontSize:13, color:C.subtle, marginBottom:8 },
  macroRow:           { flexDirection:'row', gap:20, marginBottom:10 },
  macroItem:          {},
  macroLabel:         { fontSize:11, color:C.subtle },
  macroValue:         { fontSize:14, fontWeight:'700', color:C.dark },
  ingHeading:         { fontSize:13, fontWeight:'700', color:C.dark, marginBottom:4 },
  ing:                { fontSize:13, color:C.subtle, marginBottom:2 },
  ingPurple:          { color:C.purple },
  ingMore:            { fontSize:13, color:C.purple, marginBottom:6 },
  footer:             { flexDirection:'row', alignItems:'flex-end', justifyContent:'space-between', gap:8 },
  tagRow:             { flexDirection:'row', flexWrap:'wrap', gap:6, marginTop:4 },
  tag:                { backgroundColor:C.purpleLight, borderRadius:20, paddingHorizontal:10, paddingVertical:3 },
  tagText:            { fontSize:11, color:C.purple },
});

// Full recipe detail view
const RecipeDetail = ({ recipe, user, onBack, onSave, isSaving, isLiked, likeCount, onToggleLike, canLike }) => {
  const isPremium = user?.role === 'premium';
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
      <TouchableOpacity style={rd.backBtn} onPress={onBack}>
        <Text style={rd.backText}>← Back to Recipes</Text>
      </TouchableOpacity>

      {recipe.imageUrl ? (
        <View style={rd.heroBg}>
          <Image source={{ uri: recipe.imageUrl }} style={rd.heroImage} resizeMode="cover" />
          <View style={rd.heroOverlay}>
            <Text style={rd.heroTitle}>{recipe.title}</Text>
            <View style={rd.heroTagRow}>
              {recipe.tags.map((t, i) => <View key={i} style={rd.heroTag}><Text style={rd.heroTagText}>{t}</Text></View>)}
            </View>
          </View>
        </View>
      ) : null}

      {/* Stat tiles */}
      <View style={rd.statsGrid}>
        {[
          { icon:'⏱', label:'Prep Time', value:`${recipe.prepTimeMins} min` },
          { icon:'↗', label:'Calories',  value:String(recipe.calories) },
          { icon:'👨‍🍳', label:'Difficulty', value:recipe.difficulty },
          { icon:'💪', label:'Protein',   value:`${recipe.protein}g`, purple:true },
        ].map((s) => (
          <View key={s.label} style={rd.statTile}>
            <Text style={rd.statIcon}>{s.icon}</Text>
            <Text style={rd.statLabel}>{s.label}</Text>
            <Text style={[rd.statValue, s.purple && rd.statValuePurple]}>{s.value}</Text>
          </View>
        ))}
      </View>

      {/* Nutrition facts */}
      <View style={rd.section}>
        <Text style={rd.sectionHeading}>Nutrition Facts</Text>
        <View style={rd.nutritionRow}>
          {[{ l:'Calories', v:recipe.calories, purple:false }, { l:'Protein', v:`${recipe.protein}g`, purple:true }, { l:'Carbs', v:`${recipe.carbs}g`, purple:false }, { l:'Fat', v:`${recipe.fat}g`, purple:false }].map((n) => (
            <View key={n.l} style={rd.nutriItem}>
              <Text style={rd.nutriLabel}>{n.l}</Text>
              <Text style={[rd.nutriValue, n.purple && rd.nutriValuePurple]}>{n.v}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Ingredients */}
      <View style={rd.section}>
        <Text style={rd.sectionHeading}>Ingredients</Text>
        {recipe.ingredients.map((ing, i) => (
          <Text key={i} style={rd.listItem}>• <Text style={rd.listPurple}>{ing}</Text></Text>
        ))}
      </View>

      {/* Instructions */}
      <View style={rd.section}>
        <Text style={rd.sectionHeading}>Instructions</Text>
        {recipe.instructions.map((step, i) => (
          <View key={i} style={rd.stepRow}>
            <View style={rd.stepNum}><Text style={rd.stepNumText}>{i + 1}</Text></View>
            <Text style={rd.stepText}>{step}</Text>
          </View>
        ))}
      </View>

      {/* Save button — gated by role */}
      {canLike ? (
        <View style={{ marginHorizontal: 16, marginTop: 8 }}>
          <LikeButton
            isLiked={isLiked}
            count={likeCount}
            onPress={onToggleLike}
          />
        </View>
      ) : null}

      <TouchableOpacity
        style={[rd.saveBtn, isSaving && rd.saveBtnDisabled]}
        onPress={onSave}
        activeOpacity={0.85}
        disabled={isSaving}
      >
        <Text style={rd.saveBtnText}>{isSaving ? 'Saving...' : '♡  Save Recipe'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};
const rd = StyleSheet.create({
  backBtn:            { flexDirection:'row', alignItems:'center', paddingHorizontal:16, paddingVertical:14 },
  backText:           { fontSize:14, color:C.mid, fontWeight:'500' },
  heroBg:             { marginHorizontal:16, borderRadius:16, overflow:'hidden', marginBottom:14 },
  heroImage:          { width:'100%', height:220 },
  heroOverlay:        { position:'absolute', bottom:0, left:0, right:0, backgroundColor:'rgba(0,0,0,0.45)', padding:16 },
  heroTitle:          { fontSize:22, fontWeight:'800', color:C.white, marginBottom:6 },
  heroTagRow:         { flexDirection:'row', flexWrap:'wrap', gap:6 },
  heroTag:            { backgroundColor:'rgba(255,255,255,0.25)', borderRadius:20, paddingHorizontal:8, paddingVertical:3 },
  heroTagText:        { fontSize:11, color:C.white, fontWeight:'600' },
  statsGrid:          { flexDirection:'row', flexWrap:'wrap', paddingHorizontal:16, gap:8, marginBottom:14 },
  statTile:           { flex:1, minWidth:'45%', backgroundColor:C.purpleLight, borderRadius:12, padding:14, alignItems:'center' },
  statIcon:           { fontSize:20, marginBottom:4 },
  statLabel:          { fontSize:11, color:C.subtle, marginBottom:2 },
  statValue:          { fontSize:16, fontWeight:'800', color:C.dark },
  statValuePurple:    { color:C.purple },
  section:            { marginHorizontal:16, backgroundColor:C.white, borderRadius:14, padding:16, marginBottom:12, borderWidth:1, borderColor:C.border },
  sectionHeading:     { fontSize:15, fontWeight:'700', color:C.dark, marginBottom:12 },
  nutritionRow:       { flexDirection:'row', justifyContent:'space-between' },
  nutriItem:          { alignItems:'center' },
  nutriLabel:         { fontSize:12, color:C.subtle, marginBottom:2 },
  nutriValue:         { fontSize:18, fontWeight:'800', color:C.dark },
  nutriValuePurple:   { color:C.purple },
  listItem:           { fontSize:14, color:C.subtle, marginBottom:6 },
  listPurple:         { color:C.purple },
  stepRow:            { flexDirection:'row', alignItems:'flex-start', gap:12, marginBottom:12 },
  stepNum:            { width:28, height:28, borderRadius:14, backgroundColor:C.purple, alignItems:'center', justifyContent:'center', flexShrink:0 },
  stepNumText:        { fontSize:13, fontWeight:'700', color:C.white },
  stepText:           { flex:1, fontSize:14, color:C.body, lineHeight:20 },
  saveBtn:            { marginHorizontal:16, marginTop:8, backgroundColor:C.purple, borderRadius:10, paddingVertical:15, alignItems:'center' },
  saveBtnDisabled:    { opacity:0.6 },
  saveBtnText:        { fontSize:15, fontWeight:'700', color:C.white },
});

// Premium gate modal — shown when Free user tries to save
const PremiumGateModal = ({ visible, onClose, onUpgrade }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={pgm.overlay}>
      <View style={pgm.sheet}>
        <Text style={pgm.title}>Choose Plan</Text>
        <View style={pgm.errorRow}>
          <Text style={pgm.errorIcon}>⚠️</Text>
          <Text style={pgm.errorText}>Saving recipes is a Premium feature</Text>
        </View>
        <View style={pgm.planCard}>
          <View style={pgm.popularBadge}><Text style={pgm.popularText}>Most Popular</Text></View>
          <Text style={pgm.planName}>Premium</Text>
          <Text style={pgm.planPrice}>$19.99<Text style={pgm.planCycle}>/month</Text></Text>
          {['Unlimited recipes', 'AI meal recommendations', 'Camera food recognition', 'Monthly detailed reports', 'Custom meal plans'].map((f, i) => (
            <View key={i} style={pgm.featureRow}><Text style={pgm.featureTick}>✓</Text><Text style={pgm.featureText}>{f}</Text></View>
          ))}
          <TouchableOpacity style={pgm.chooseBtn} onPress={onUpgrade} activeOpacity={0.85}>
            <Text style={pgm.chooseBtnText}>Choose Plan</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={onClose} style={pgm.cancelBtn}>
          <Text style={pgm.cancelText}>Maybe later</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);
const pgm = StyleSheet.create({
  overlay:     { flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'flex-end' },
  sheet:       { backgroundColor:C.white, borderTopLeftRadius:20, borderTopRightRadius:20, padding:20, paddingBottom:36 },
  title:       { fontSize:16, fontWeight:'700', color:C.dark, textAlign:'center', marginBottom:12 },
  errorRow:    { flexDirection:'row', alignItems:'center', gap:8, backgroundColor:C.errorBg, borderRadius:8, padding:10, marginBottom:14 },
  errorIcon:   { fontSize:14 },
  errorText:   { fontSize:13, color:C.errorText, fontWeight:'600' },
  planCard:    { borderWidth:2, borderColor:C.purple, borderRadius:14, padding:16, marginBottom:12 },
  popularBadge:{ alignSelf:'flex-start', backgroundColor:C.purple, borderRadius:20, paddingHorizontal:10, paddingVertical:3, marginBottom:8 },
  popularText: { fontSize:11, fontWeight:'700', color:C.white },
  planName:    { fontSize:20, fontWeight:'800', color:C.dark, marginBottom:4 },
  planPrice:   { fontSize:28, fontWeight:'800', color:C.dark, marginBottom:12 },
  planCycle:   { fontSize:14, fontWeight:'400', color:C.subtle },
  featureRow:  { flexDirection:'row', alignItems:'center', gap:8, marginBottom:6 },
  featureTick: { fontSize:13, color:C.purple, fontWeight:'700', width:16 },
  featureText: { fontSize:13, color:C.body },
  chooseBtn:   { backgroundColor:C.purple, borderRadius:10, paddingVertical:13, alignItems:'center', marginTop:8 },
  chooseBtnText:{ fontSize:15, fontWeight:'700', color:C.white },
  cancelBtn:   { alignItems:'center', paddingVertical:10 },
  cancelText:  { fontSize:14, color:C.subtle },
});

// Premium-only Dietary Preferences modal — UC #64
const DietaryPrefsModal = ({ visible, prefs, onSave, onClose }) => {
  const [localPrefs, setLocalPrefs] = useState(prefs || { restrictions: [], allergies: [] });

  const toggle = (type, value) => {
    setLocalPrefs((prev) => {
      const list = prev[type];
      return { ...prev, [type]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] };
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={dp.overlay}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={dp.sheet}>
            <TouchableOpacity style={dp.closeBtn} onPress={onClose}><Text style={dp.closeIcon}>✕</Text></TouchableOpacity>
            <Text style={dp.title}>Dietary Preferences</Text>
            <Text style={dp.subtitle}>Set your dietary restrictions and allergies to filter recipes accordingly.</Text>

            <Text style={dp.heading}>Dietary Restrictions</Text>
            <View style={dp.grid}>
              {DIETARY_RESTRICTIONS.map((r) => (
                <TouchableOpacity key={r} style={dp.checkRow} onPress={() => toggle('restrictions', r)}>
                  <View style={[dp.checkbox, localPrefs.restrictions.includes(r) && dp.checkboxChecked]} />
                  <Text style={dp.checkLabel}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={dp.heading}>Allergies</Text>
            <View style={dp.grid}>
              {ALLERGIES.map((a) => (
                <TouchableOpacity key={a} style={dp.checkRow} onPress={() => toggle('allergies', a)}>
                  <View style={[dp.checkbox, localPrefs.allergies.includes(a) && dp.checkboxChecked]} />
                  <Text style={dp.checkLabel}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={dp.saveBtn} onPress={() => onSave(localPrefs)} activeOpacity={0.85}>
              <Text style={dp.saveBtnText}>Save Preferences</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};
const dp = StyleSheet.create({
  overlay:        { flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'flex-end' },
  sheet:          { backgroundColor:C.white, borderTopLeftRadius:20, borderTopRightRadius:20, padding:20, paddingBottom:36, paddingTop:40 },
  closeBtn:       { position:'absolute', top:12, right:16, padding:4 },
  closeIcon:      { fontSize:16, color:C.subtle },
  title:          { fontSize:16, fontWeight:'700', color:C.dark, textAlign:'center', marginBottom:4 },
  subtitle:       { fontSize:13, color:C.subtle, textAlign:'center', marginBottom:18 },
  heading:        { fontSize:14, fontWeight:'700', color:C.dark, marginBottom:10, marginTop:4 },
  grid:           { flexDirection:'row', flexWrap:'wrap', gap:0, marginBottom:14 },
  checkRow:       { flexDirection:'row', alignItems:'center', gap:8, width:'50%', marginBottom:12 },
  checkbox:       { width:18, height:18, borderRadius:4, borderWidth:1.5, borderColor:C.border, backgroundColor:C.white },
  checkboxChecked:{ backgroundColor:C.purple, borderColor:C.purple },
  checkLabel:     { fontSize:13, color:C.dark },
  saveBtn:        { backgroundColor:C.purple, borderRadius:10, paddingVertical:14, alignItems:'center', marginTop:8 },
  saveBtnText:    { fontSize:15, fontWeight:'700', color:C.white },
});


// MAIN SCREEN
// UC #22, #23, #24, #25 (Free)
// UC #61, #62, #63, #64, #66, #67 (Premium)

const RecipesScreen = ({ navigation, route }) => {
  const user      = route?.params?.user || null;
  const currentUserId =
    user?.userId != null
      ? String(user.userId)
      : user?.id != null
        ? String(user.id)
        : user?._id != null
          ? String(user._id)
          : '';
  const isPremium = user?.role === 'premium';

  const [allRecipes,     setAllRecipes]     = useState([]);
  const [isLoading,      setIsLoading]      = useState(true);
  const [quickFilter,    setQuickFilter]    = useState('All Recipes');
  const [dietTag,        setDietTag]        = useState('All');
  const [search,         setSearch]         = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState(null); // UC #24, #62
  const [banner,         setBanner]         = useState({ message:'', type:'' });
  const [isSaving,       setIsSaving]       = useState(false);
  const [showGate,       setShowGate]       = useState(false);   // Free premium gate
  const [showDietPrefs,  setShowDietPrefs]  = useState(false);   // Premium only
  const [dietPrefs,      setDietPrefs]      = useState({ restrictions:[], allergies:[] });
  const [likedRecipes,   setLikedRecipes]   = useState({});
  const [recipeLikeCounts, setRecipeLikeCounts] = useState({});
  const [likingRecipeIds, setLikingRecipeIds] = useState({});

  const incomingSearch = String(route?.params?.initialSearch || '').trim();
  const incomingFocusRecipeId = String(route?.params?.focusRecipeId || '').trim();

  const canLikeRecipe = (recipe) => Boolean(recipe?.isCurated);

  const handleSelectRecipe = useCallback(async (recipe) => {
    setSelectedRecipe(recipe);
    if (!currentUserId || !recipe?.recipeId) return;

    const result = await Recipe.recordView(recipe.recipeId, currentUserId);
    if (!result.success) return;

    const nextViewCount = Number(result.data?.viewCount ?? recipe.viewCount ?? 0);
    setAllRecipes((prev) =>
      prev.map((r) => (r.recipeId === recipe.recipeId ? { ...r, viewCount: nextViewCount } : r))
    );
    setSelectedRecipe((prev) =>
      prev && prev.recipeId === recipe.recipeId ? { ...prev, viewCount: nextViewCount } : prev
    );
  }, [currentUserId]);

  // Load recipes on mount
  useEffect(() => {
    viewCtrl.fetchRecipes().then((result) => {
      if (result.success) {
        setAllRecipes(result.data);
        const baselineLikes = {};
        (result.data || []).forEach((r) => {
          if (!canLikeRecipe(r)) return;
          baselineLikes[r.recipeId] = Number(r.likeCount ?? 0);
        });
        setRecipeLikeCounts(baselineLikes);

        if (currentUserId) {
          Recipe.fetchLikedRecipeIds(currentUserId).then((likedRes) => {
            if (!likedRes.success) return;
            const likedMap = {};
            (likedRes.data || []).forEach((id) => {
              likedMap[String(id)] = true;
            });
            setLikedRecipes(likedMap);
          });
        }
      }
      setIsLoading(false);
    });
  }, [currentUserId]);

  useEffect(() => {
    if (!incomingSearch && !incomingFocusRecipeId) return;

    if (incomingSearch) {
      setSearch(incomingSearch);
    }

    if (allRecipes.length > 0) {
      let targetRecipe = null;

      if (incomingFocusRecipeId) {
        targetRecipe = allRecipes.find((r) =>
          String(r.recipeId || r._id || '') === incomingFocusRecipeId
        );
      }

      if (!targetRecipe && incomingSearch) {
        const q = incomingSearch.toLowerCase();
        targetRecipe = allRecipes.find((r) =>
          String(r.title || '').toLowerCase().includes(q)
        );
      }

      if (targetRecipe) {
        handleSelectRecipe(targetRecipe);
      }
    }

    navigation.setParams({
      initialSearch: undefined,
      focusRecipeId: undefined,
    });
  }, [allRecipes, incomingSearch, incomingFocusRecipeId, navigation, handleSelectRecipe]);

  const toggleRecipeLike = useCallback(async (recipeId) => {
    if (likingRecipeIds[recipeId]) return;
    if (!currentUserId) {
      setBanner({ message: 'Unable to identify current user for likes.', type: 'error' });
      return;
    }

    const recipe = allRecipes.find((r) => r.recipeId === recipeId);
    if (!canLikeRecipe(recipe)) return;

    const currentlyLiked = Boolean(likedRecipes[recipeId]);
    const nextLikeState = !currentlyLiked;
    const incrementBy = currentlyLiked ? -1 : 1;
    const previousCount = Number(recipeLikeCounts[recipeId] ?? recipe?.likeCount ?? 0);
    const optimisticCount = Math.max(0, previousCount + incrementBy);

    setLikingRecipeIds((prev) => ({ ...prev, [recipeId]: true }));
    setLikedRecipes((prev) => ({ ...prev, [recipeId]: !currentlyLiked }));
    setRecipeLikeCounts((prev) => ({
      ...prev,
      [recipeId]: optimisticCount,
    }));

    const result = await Recipe.updateLike(recipeId, {
      userId: currentUserId,
      like: nextLikeState,
      incrementBy,
    });
    if (!result.success) {
      setLikedRecipes((prev) => ({ ...prev, [recipeId]: currentlyLiked }));
      setRecipeLikeCounts((prev) => ({ ...prev, [recipeId]: previousCount }));
      setBanner({ message: result.message || 'Unable to update recipe like.', type: 'error' });
      setLikingRecipeIds((prev) => ({ ...prev, [recipeId]: false }));
      return;
    }

    const serverIsLiked =
      typeof result.data?.isLiked === 'boolean' ? result.data.isLiked : nextLikeState;
    setLikedRecipes((prev) => ({ ...prev, [recipeId]: serverIsLiked }));
    const serverLikeCount = Number(result.data?.likeCount ?? optimisticCount);
    setRecipeLikeCounts((prev) => ({ ...prev, [recipeId]: serverLikeCount }));
    setAllRecipes((prev) =>
      prev.map((r) => (r.recipeId === recipeId ? { ...r, likeCount: serverLikeCount } : r))
    );
    setSelectedRecipe((prev) =>
      prev && prev.recipeId === recipeId ? { ...prev, likeCount: serverLikeCount } : prev
    );
    setLikingRecipeIds((prev) => ({ ...prev, [recipeId]: false }));
  }, [allRecipes, currentUserId, likedRecipes, likingRecipeIds, recipeLikeCounts]);

  // Derive visible recipes based on active filters
  const visibleRecipes = (() => {
    let list = allRecipes;

    // UC #23, #61 — quick filter tab
    if (quickFilter === 'High Protein')  list = viewCtrl.filterByTag(list, 'high-protein');
    else if (quickFilter === 'Vegetarian')  list = viewCtrl.filterByTag(list, 'vegetarian');
    else if (quickFilter === 'Quick & Easy') list = list.filter((r) => r.prepTimeMins <= 15);
    else if (quickFilter === 'Meal Prep') {
      // UC #66 — Meal Prep tab: Premium only, shows curated meal-prep recipes
      if (isPremium) list = viewCtrl.filterCuratedAndMealPrep(list, { mealPrep: true });
      else           list = []; // Free users see empty / lock state
    }

    // UC #23, #64 — diet tag chip filter
    if (dietTag && dietTag !== 'All') list = viewCtrl.filterByTag(list, dietTag);

    // UC #64 — dietary prefs filter (Premium: active restrictions narrow results)
    if (isPremium && dietPrefs.restrictions.length > 0) {
      list = list.filter((r) =>
        dietPrefs.restrictions.some((pref) => r.tags.includes(pref.toLowerCase()))
      );
    }

    // UC #64 — allergy exclusion filter (Premium)
    if (isPremium && dietPrefs.allergies.length > 0) {
      list = list.filter((r) => {
        const haystack = [
          r.title || '',
          r.description || '',
          ...(Array.isArray(r.tags) ? r.tags : []),
          ...(Array.isArray(r.ingredients) ? r.ingredients : []),
        ].join(' ').toLowerCase();

        return !dietPrefs.allergies.some((allergy) => {
          const needles = ALLERGY_KEYWORDS[allergy] || [String(allergy || '').toLowerCase()];
          return needles.some((kw) => haystack.includes(kw));
        });
      });
    }

    // UC #23, #61 — search
    if (search.trim()) list = viewCtrl.searchRecipes(list, search);

    return list;
  })();

  // UC #25, #67 — save recipe (role gated)
  const handleSave = useCallback(async () => {
    if (!selectedRecipe) return;
    setIsSaving(true);
    const result = await saveCtrl.saveRecipe(user?.role, user?.userId, selectedRecipe);
    setIsSaving(false);

    if (result.isPremiumGate) {
      setShowGate(true);     // show upgrade modal for Free users
    } else if (result.success) {
      setBanner({ message: result.message, type: 'success' });
      setTimeout(() => setBanner({ message:'', type:'' }), 4000);
    } else {
      setBanner({ message: result.message, type: 'error' });
    }
  }, [selectedRecipe, user]);

  // Premium: save dietary preferences
  const handleSaveDietPrefs = useCallback((prefs) => {
    setDietPrefs(prefs);
    setShowDietPrefs(false);
  }, []);

  if (selectedRecipe) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={C.white} />
        <NavBar onMenuPress={() => navigation.goBack()} />
        <Banner message={banner.message} type={banner.type} />
        <PremiumGateModal
          visible={showGate}
          onClose={() => setShowGate(false)}
          onUpgrade={() => { setShowGate(false); navigation.navigate('ViewPricingPlansScreen'); }}
        />
        <RecipeDetail
          recipe={selectedRecipe}
          user={user}
          onBack={() => setSelectedRecipe(null)}
          onSave={handleSave}
          isSaving={isSaving}
          isLiked={Boolean(likedRecipes[selectedRecipe.recipeId])}
          likeCount={recipeLikeCounts[selectedRecipe.recipeId] ?? selectedRecipe.likeCount ?? 0}
          onToggleLike={() => toggleRecipeLike(selectedRecipe.recipeId)}
          canLike={canLikeRecipe(selectedRecipe)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />
      <NavBar onMenuPress={() => navigation.goBack()} />
      <Banner message={banner.message} type={banner.type} />

      {/* Premium: Dietary Preferences modal — UC #64 */}
      {isPremium && (
        <DietaryPrefsModal
          visible={showDietPrefs}
          prefs={dietPrefs}
          onSave={handleSaveDietPrefs}
          onClose={() => setShowDietPrefs(false)}
        />
      )}

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >

        {/* Page title */}
        <Text style={styles.pageTitle}>Recipe Library</Text>

        {/* Quick filter tabs — UC #23 */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {QUICK_FILTERS.map((f) => {
            const isMealPrep   = f === 'Meal Prep';
            const isLocked     = isMealPrep && !isPremium;
            const isActive     = quickFilter === f;
            return (
              <TouchableOpacity
                key={f}
                style={[qt.tab, isActive && qt.tabActive, isLocked && qt.tabLocked]}
                onPress={() => setQuickFilter(f)}
                activeOpacity={0.8}
              >
                <Text style={[qt.tabText, isActive && qt.tabTextActive]}>
                  {f}{isMealPrep && !isPremium ? ' 🔒' : isMealPrep && isPremium ? ' ☆' : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Search + diet tag chips */}
        <View style={styles.filterCard}>
          <View style={styles.searchRow}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search recipes or ingredients..."
              placeholderTextColor={C.subtle}
              autoCorrect={false}
            />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap:8, paddingVertical:4 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
            {DIET_TAGS.map((t) => (
              <TouchableOpacity
                key={t}
                style={[dt.chip, dietTag === t && dt.chipActive]}
                onPress={() => setDietTag(t)}
                activeOpacity={0.8}
              >
                <Text style={[dt.chipText, dietTag === t && dt.chipTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Premium: Dietary Preferences floating button — UC #64 */}
        {isPremium && (
          <TouchableOpacity style={styles.dietPrefBtn} onPress={() => setShowDietPrefs(true)} activeOpacity={0.85}>
            <Text style={styles.dietPrefIcon}>⚙️</Text>
            <Text style={styles.dietPrefText}>Dietary Preferences</Text>
          </TouchableOpacity>
        )}

        {/* Meal Prep locked state for Free users */}
        {quickFilter === 'Meal Prep' && !isPremium && (
          <View style={styles.lockedCard}>
            <Text style={styles.lockedIcon}>🔒</Text>
            <Text style={styles.lockedTitle}>Meal Prep Recipes — Premium Feature</Text>
            <Text style={styles.lockedBody}>Upgrade to access curated meal-prep optimised recipes.</Text>
            <TouchableOpacity style={styles.lockedBtn} onPress={() => navigation.navigate('ViewPricingPlansScreen')} activeOpacity={0.85}>
              <Text style={styles.lockedBtnText}>Upgrade to Premium</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Recipe list */}
        {isLoading ? (
          <ActivityIndicator size="large" color={C.purple} style={{ marginTop:40 }} />
        ) : visibleRecipes.length === 0 && quickFilter !== 'Meal Prep' ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No recipes found.</Text>
          </View>
        ) : (
          visibleRecipes.map((recipe, idx) => (
            <RecipeCard
              key={recipe.recipeId || recipe._id || `${recipe.title || 'recipe'}-${idx}`}
              recipe={recipe}
              onPress={() => handleSelectRecipe(recipe)}
              isLiked={Boolean(likedRecipes[recipe.recipeId])}
              likeCount={recipeLikeCounts[recipe.recipeId] ?? recipe.likeCount ?? 0}
              onToggleLike={() => toggleRecipeLike(recipe.recipeId)}
              canLike={canLikeRecipe(recipe)}
            />
          ))
        )}

      </ScrollView>
          </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const qt = StyleSheet.create({
  tab:          { paddingHorizontal:14, paddingVertical:8, borderRadius:20, borderWidth:1, borderColor:C.border, backgroundColor:C.white, marginRight:8 },
  tabActive:    { backgroundColor:C.purpleLight, borderColor:C.purple },
  tabLocked:    { opacity:0.65 },
  tabText:      { fontSize:13, color:C.mid, fontWeight:'500' },
  tabTextActive:{ color:C.purple, fontWeight:'700' },
});
const dt = StyleSheet.create({
  chip:          { paddingHorizontal:12, paddingVertical:5, borderRadius:20, borderWidth:1, borderColor:C.border, backgroundColor:C.white },
  chipActive:    { backgroundColor:C.purple, borderColor:C.purple },
  chipText:      { fontSize:12, color:C.mid },
  chipTextActive:{ color:C.white, fontWeight:'600' },
});

const styles = StyleSheet.create({
  safe:         { flex:1, backgroundColor:C.bg },
  list: { flexGrow: 1, paddingHorizontal:16, paddingBottom:32 },
  pageTitle:    { fontSize:28, fontWeight:'800', color:C.dark, letterSpacing:-0.5, paddingVertical:20 },
  tabScroll:    { marginBottom:12 },
  tabContent:   { paddingRight:16 },
  filterCard:   { backgroundColor:C.white, borderRadius:14, padding:12, borderWidth:1, borderColor:C.border, marginBottom:12, gap:8 },
  searchRow:    { flexDirection:'row', alignItems:'center', backgroundColor:C.bg, borderRadius:8, paddingHorizontal:10, paddingVertical:8, borderWidth:1, borderColor:C.border, gap:8 },
  searchIcon:   { fontSize:14, color:C.subtle },
  searchInput:  { flex:1, fontSize:14, color:C.dark },
  dietPrefBtn:  { flexDirection:'row', alignItems:'center', gap:6, alignSelf:'flex-start', backgroundColor:C.purple, borderRadius:20, paddingHorizontal:14, paddingVertical:8, marginBottom:14 },
  dietPrefIcon: { fontSize:14 },
  dietPrefText: { fontSize:13, fontWeight:'600', color:C.white },
  lockedCard:   { backgroundColor:C.white, borderRadius:14, padding:24, alignItems:'center', borderWidth:1, borderColor:C.border, marginBottom:16 },
  lockedIcon:   { fontSize:36, marginBottom:10 },
  lockedTitle:  { fontSize:16, fontWeight:'700', color:C.dark, marginBottom:6, textAlign:'center' },
  lockedBody:   { fontSize:13, color:C.subtle, textAlign:'center', marginBottom:16 },
  lockedBtn:    { backgroundColor:C.purple, borderRadius:8, paddingVertical:10, paddingHorizontal:20 },
  lockedBtnText:{ fontSize:14, fontWeight:'700', color:C.white },
  emptyState:   { alignItems:'center', paddingVertical:48 },
  emptyIcon:    { fontSize:40, marginBottom:12 },
  emptyText:    { fontSize:14, color:C.subtle },
});

export default RecipesScreen;
