// CuratorRecipesScreen.jsx
// UC #109 Curator - View Own Recipes
// Opens EditCuratorRecipeScreen only for create/edit actions.

import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Alert, StyleSheet, StatusBar, Image} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import ViewCuratorRecipesController from '../controller/ViewCuratorRecipesController';
import PublishCuratorRecipeController from '../controller/PublishCuratorRecipeController';
import UnpublishCuratorRecipeController from '../controller/UnpublishCuratorRecipeController';

const viewCtrl = new ViewCuratorRecipesController();
const publishCtrl = new PublishCuratorRecipeController();
const unpublishCtrl = new UnpublishCuratorRecipeController();

const C = {
  purple: '#7C3AED', purpleLight: '#EDE9FE', dark: '#111827', mid: '#374151',
  subtle: '#6B7280', white: '#FFFFFF', border: '#E5E7EB', bg: '#F9FAFB',
  green: '#16A34A', greenBg: '#F0FDF4', greenBorder: '#BBF7D0',
  amber: '#D97706', amberBg: '#FFFBEB', amberBorder: '#FDE68A',
};

const StatusBadge = ({ status }) => {
  const isPub = status === 'PUBLISHED';
  return (
    <View style={[sb.badge, isPub ? sb.pubBadge : sb.draftBadge]}>
      <Text style={[sb.text, isPub ? sb.pubText : sb.draftText]}>{isPub ? 'Published' : 'Draft'}</Text>
    </View>
  );
};

const RecipeCard = ({ recipe, onEdit, onPublish, onUnpublish }) => (
  <View style={rc.card}>
    <View style={rc.top}>
      <StatusBadge status={recipe.status} />
      <Text style={rc.date}>{recipe.createdAt ? new Date(recipe.createdAt).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</Text>
    </View>
    <Text style={rc.title}>{recipe.title || 'Untitled Recipe'}</Text>
    {recipe.description ? <Text style={rc.preview} numberOfLines={2}>{recipe.description}</Text> : null}
    <View style={rc.metaRow}>
      <Text style={rc.meta}>Prep: {recipe.prepTimeMins || 0} min</Text>
      <Text style={rc.meta}>{recipe.calories || 0} kcal</Text>
      <Text style={rc.meta}>{recipe.servings || 1} servings</Text>
    </View>
    {Array.isArray(recipe.tags) && recipe.tags.length > 0 ? (
      <View style={rc.tagRow}>
        {recipe.tags.slice(0, 3).map((tag) => (
          <View key={tag} style={rc.tag}><Text style={rc.tagTxt}>#{tag}</Text></View>
        ))}
      </View>
    ) : null}
    <View style={rc.actions}>
      {recipe.status === 'PUBLISHED' ? (
        <TouchableOpacity style={[rc.actionBtn, rc.unpubBtn]} onPress={() => onUnpublish(recipe.recipeId)} activeOpacity={0.85}>
          <Text style={[rc.actionTxt, rc.unpubTxt]}>Unpublish</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={[rc.actionBtn, rc.pubBtn]} onPress={() => onPublish(recipe.recipeId)} activeOpacity={0.85}>
          <Text style={[rc.actionTxt, rc.pubTxt]}>Publish</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={rc.editBtn}
        onPress={() => onEdit(recipe)}
        activeOpacity={0.85}
        disabled={recipe.status === 'PUBLISHED'}
      >
        <Text style={[rc.editBtnTxt, recipe.status === 'PUBLISHED' && rc.disabledTxt]}>
          {recipe.status === 'PUBLISHED' ? 'Unpublish to Edit' : 'Edit / Delete'}
        </Text>
      </TouchableOpacity>
    </View>
  </View>
);

const CuratorRecipesScreen = ({ navigation, route }) => {
  const user = route?.params?.user || null;
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [banner, setBanner] = useState('');

  const showBanner = useCallback((msg) => {
    setBanner(msg);
    setTimeout(() => setBanner(''), 3000);
  }, []);

  const loadRecipes = useCallback(() => {
    if (!user?.userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    viewCtrl.fetchCuratorRecipes(user.userId).then((result) => {
      if (result.success) {
        setRecipes(result.data);
        setMessage(result.message || '');
      } else {
        setRecipes([]);
        setMessage(result.message || 'Unable to load recipes.');
      }
      setLoading(false);
    });
  }, [user?.userId]);

  useFocusEffect(
    useCallback(() => {
      loadRecipes();
    }, [loadRecipes])
  );

  const handlePublish = useCallback((recipeId) => {
    Alert.alert('Publish Recipe', 'Make this recipe visible in the recipe library?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Publish',
        onPress: async () => {
          const result = await publishCtrl.publishRecipe(recipeId, user.userId);

          if (result.success) {
            showBanner(result.message || 'Recipe published successfully.');
            loadRecipes();
          } else {
            Alert.alert('Error', result.message || 'Unable to publish recipe.');
          }
        }
      },
    ]);
  }, [loadRecipes, showBanner, user?.userId]);

  const handleUnpublish = useCallback((recipeId) => {
    Alert.alert('Unpublish Recipe', 'Move this recipe back to drafts so it can be edited?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unpublish',
        onPress: async () => {
          const result = await unpublishCtrl.unpublishRecipe(recipeId, user.userId);
        
          if (result.success) {
            showBanner(result.message || 'Recipe moved to drafts.');
            loadRecipes();
          } else {
            Alert.alert('Error', result.message || 'Unable to unpublish recipe.');
          }
        }
      },
    ]);
  }, [loadRecipes, showBanner, user?.userId]);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />
      <View style={s.nav}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.back}>Back</Text></TouchableOpacity>
        <Text style={s.navTitle}>My Recipes</Text>
        <View style={{ width: 60 }} />
      </View>

      {banner ? (
        <View style={s.bannerBar}><View style={{flexDirection:'row',alignItems:'center',gap:4}}><Image source={require('../assets/icon-success.png')} style={{width:20,height:20,resizeMode:'contain'}} /><Text style={s.bannerTxt}>{banner}</Text></View></View>
      ) : null}

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          style={s.createBtn}
          onPress={() => navigation.navigate('EditCuratorRecipeScreen', { user, recipe: null })}
          activeOpacity={0.85}
        >
          <Text style={s.createBtnTxt}>+ Create Recipe</Text>
        </TouchableOpacity>

        {loading ? (
          <Text style={s.empty}>Loading...</Text>
        ) : recipes.length === 0 ? (
          <View style={s.emptyCard}>
            <Text style={s.emptyTitle}>No Recipes Yet</Text>
            <Text style={s.emptyBody}>{message || 'Create your first curator recipe to start building your collection.'}</Text>
          </View>
        ) : (
          recipes.map((recipe) => (
            <RecipeCard
              key={`${recipe.status}-${recipe.recipeId}`}
              recipe={recipe}
              onEdit={(selected) => navigation.navigate('EditCuratorRecipeScreen', { user, recipe: selected })}
              onPublish={handlePublish}
              onUnpublish={handleUnpublish}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const sb = StyleSheet.create({
  badge: { alignSelf: 'flex-start', borderRadius: 20, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  pubBadge: { backgroundColor: C.greenBg, borderColor: C.greenBorder },
  draftBadge: { backgroundColor: C.amberBg, borderColor: C.amberBorder },
  text: { fontSize: 11, fontWeight: '600' },
  pubText: { color: C.green },
  draftText: { color: C.amber },
});

const rc = StyleSheet.create({
  card: { backgroundColor: C.white, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 12 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  date: { fontSize: 11, color: C.subtle },
  title: { fontSize: 16, fontWeight: '700', color: C.dark, marginBottom: 6 },
  preview: { fontSize: 13, color: C.mid, lineHeight: 19, marginBottom: 10 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  meta: { fontSize: 12, color: C.subtle },
  tagRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 12 },
  tag: { backgroundColor: C.purpleLight, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  tagTxt: { fontSize: 10, color: C.purple },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, borderRadius: 8, paddingVertical: 9, alignItems: 'center', borderWidth: 1 },
  pubBtn: { backgroundColor: C.greenBg, borderColor: C.greenBorder },
  unpubBtn: { backgroundColor: C.amberBg, borderColor: C.amberBorder },
  actionTxt: { fontSize: 13, fontWeight: '600' },
  pubTxt: { color: C.green },
  unpubTxt: { color: C.amber },
  editBtn: { flex: 1, borderRadius: 8, paddingVertical: 9, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  editBtnTxt: { fontSize: 13, fontWeight: '600', color: C.mid },
  disabledTxt: { color: C.subtle },
});

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  back: { fontSize: 14, color: C.purple, fontWeight: '600' },
  navTitle: { fontSize: 17, fontWeight: '700', color: C.dark },
  bannerBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.greenBg, borderBottomWidth: 1, borderBottomColor: C.greenBorder },
  bannerTxt: { fontSize: 14, fontWeight: '500', color: C.green },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  createBtn: { backgroundColor: C.purple, borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginVertical: 16 },
  createBtnTxt: { fontSize: 15, fontWeight: '700', color: C.white },
  empty: { textAlign: 'center', color: C.subtle, paddingTop: 40 },
  emptyCard: { alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.dark, marginBottom: 6 },
  emptyBody: { fontSize: 13, color: C.subtle, textAlign: 'center' },
});

export default CuratorRecipesScreen;
