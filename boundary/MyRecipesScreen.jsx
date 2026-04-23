// MyRecipesScreen.jsx — UC #27, #70, NEW-C, NEW-D
// Sprint 9: Added Edit and Delete action buttons to each recipe card.
// Edit  → navigates to EditMyRecipeScreen (pre-filled).
// Delete → Alert confirm → DeleteCustomRecipeController → removes card + success banner.
// Boundary only: no axios, no api_config.

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView }   from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import ViewMyRecipesController      from '../controller/ViewMyRecipesController';
import DeleteCustomRecipeController from '../controller/DeleteCustomRecipeController';

const viewCtrl   = new ViewMyRecipesController();
const deleteCtrl = new DeleteCustomRecipeController();

const C = {
  purple:'#7C3AED', purpleLight:'#EDE9FE', dark:'#111827', mid:'#374151',
  body:'#4B5563', subtle:'#6B7280', white:'#FFFFFF', border:'#E5E7EB', bg:'#F9FAFB',
  successBg:'#F0FDF4', successBorder:'#BBF7D0', successText:'#15803D',
  errorBg:'#FEF2F2', errorBorder:'#FECACA', errorText:'#DC2626',
};

const NavBar = ({ onMenu }) => (
  <View style={nav.bar}>
    <View style={nav.brand}><Text style={nav.icon}>🍴</Text><Text style={nav.brandName}>BiteWise</Text></View>
    <TouchableOpacity onPress={onMenu} style={nav.menuBtn}>
      <View style={nav.menuLine}/><View style={[nav.menuLine,{width:18}]}/><View style={nav.menuLine}/>
    </TouchableOpacity>
  </View>
);
const nav = StyleSheet.create({
  bar:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:20,paddingVertical:14,backgroundColor:C.white,borderBottomWidth:1,borderBottomColor:C.border},
  brand:{flexDirection:'row',alignItems:'center',gap:6},icon:{fontSize:20},
  brandName:{fontSize:20,fontWeight:'800',color:C.dark},
  menuBtn:{padding:6,gap:4,alignItems:'flex-end'},menuLine:{width:22,height:2.5,backgroundColor:C.dark,borderRadius:2},
});

const Banner = ({ message, type }) => {
  if (!message) return null;
  const ok = type !== 'error';
  return (
    <View style={[bn.wrap, ok ? bn.success : bn.error]}>
      <Text style={bn.icon}>{ok ? '✅' : '⚠️'}</Text>
      <Text style={[bn.text, ok ? bn.successText : bn.errorText]}>{message}</Text>
    </View>
  );
};
const bn = StyleSheet.create({
  wrap:{flexDirection:'row',alignItems:'center',gap:10,paddingHorizontal:16,paddingVertical:12,borderBottomWidth:1},
  success:{backgroundColor:C.successBg,borderBottomColor:C.successBorder},
  error:{backgroundColor:C.errorBg,borderBottomColor:C.errorBorder},
  icon:{fontSize:16},text:{flex:1,fontSize:14,fontWeight:'500'},
  successText:{color:C.successText},errorText:{color:C.errorText},
});

// Recipe card with Edit + Delete buttons
const RecipeCard = ({ recipe, onEdit, onDelete }) => (
  <View style={rc.card}>
    <Text style={rc.title}>{recipe.title}</Text>
    <Text style={rc.meta}>⏱ {recipe.prepTimeMins} min  •  {recipe.calories} kcal  •  {recipe.difficulty}</Text>
    {recipe.tags?.length > 0 && (
      <View style={rc.tagRow}>
        {recipe.tags.map((t,i) => <View key={i} style={rc.tag}><Text style={rc.tagText}>{t}</Text></View>)}
      </View>
    )}
    <View style={rc.actions}>
      <TouchableOpacity style={rc.editBtn}   onPress={() => onEdit(recipe)}   activeOpacity={0.8}>
        <Text style={rc.editBtnText}>✏️  Edit</Text>
      </TouchableOpacity>
      <TouchableOpacity style={rc.deleteBtn} onPress={() => onDelete(recipe)} activeOpacity={0.8}>
        <Text style={rc.deleteBtnText}>🗑️  Delete</Text>
      </TouchableOpacity>
    </View>
  </View>
);
const rc = StyleSheet.create({
  card:{backgroundColor:C.white,borderRadius:14,padding:14,borderWidth:1,borderColor:C.border,marginBottom:12},
  title:{fontSize:16,fontWeight:'700',color:C.dark,marginBottom:4},
  meta:{fontSize:13,color:C.subtle,marginBottom:6},
  tagRow:{flexDirection:'row',flexWrap:'wrap',gap:6,marginBottom:10},
  tag:{backgroundColor:C.purpleLight,borderRadius:20,paddingHorizontal:8,paddingVertical:3},
  tagText:{fontSize:11,color:C.purple},
  actions:{flexDirection:'row',gap:10,borderTopWidth:1,borderTopColor:C.border,paddingTop:10},
  editBtn:{flex:1,backgroundColor:C.purpleLight,borderRadius:8,paddingVertical:9,alignItems:'center'},
  editBtnText:{fontSize:13,fontWeight:'600',color:C.purple},
  deleteBtn:{flex:1,backgroundColor:C.errorBg,borderRadius:8,paddingVertical:9,alignItems:'center'},
  deleteBtnText:{fontSize:13,fontWeight:'600',color:C.errorText},
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
  wrap:{backgroundColor:C.white,borderRadius:14,padding:32,alignItems:'center',borderWidth:1,borderColor:C.border},
  emoji:{fontSize:48,marginBottom:12},heading:{fontSize:18,fontWeight:'700',color:C.dark,marginBottom:6},
  body:{fontSize:13,color:C.subtle,textAlign:'center',marginBottom:20},
  btn:{backgroundColor:C.purple,borderRadius:8,paddingVertical:10,paddingHorizontal:20},
  btnText:{fontSize:13,fontWeight:'700',color:C.white},
});

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
const MyRecipesScreen = ({ navigation, route }) => {
  const user = route?.params?.user || null;
  const [recipes,   setRecipes]   = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [banner,    setBanner]    = useState({ message: route?.params?.banner || '', type: 'success' });

  const showBanner = (message, type = 'success') => {
    setBanner({ message, type });
    setTimeout(() => setBanner({ message: '', type: 'success' }), 4000);
  };

  useFocusEffect(
    useCallback(() => {
      if (!user?.userId) { setIsLoading(false); return; }
      setIsLoading(true);
      viewCtrl.fetchMyRecipes(user.userId).then(r => {
        if (r.success) setRecipes(r.data);
        setIsLoading(false);
      });
    }, [user?.userId])
  );

  const goToCreate = () => navigation.navigate('CreateRecipeScreen', { user });

  // UC NEW-C — navigate to edit screen pre-filled
  const handleEdit = useCallback((recipe) => {
    navigation.navigate('EditMyRecipeScreen', { user, recipe });
  }, [navigation, user]);

  // UC NEW-D — confirm then delete
  const handleDelete = useCallback((recipe) => {
    Alert.alert(
      'Delete Recipe',
      `Are you sure you want to delete "${recipe.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
            const recipeId = recipe._id || recipe.recipeId;
            const result = await deleteCtrl.deleteRecipe(recipeId, user?.userId);
            if (result.success) {
              setRecipes(prev => prev.filter(r => (r._id || r.recipeId) !== recipeId));
              showBanner(result.message, 'success');
            } else {
              showBanner(result.message, 'error');
            }
          }
        },
      ]
    );
  }, [user?.userId]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white}/>
      <NavBar onMenu={() => navigation.navigate('AccountSettingsScreen', { user })}/>
      <Banner message={banner.message} type={banner.type}/>
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.pageTitle}>My Custom Recipes</Text>
            <Text style={styles.pageSubtitle}>Create and save your favourite recipes</Text>
          </View>
          <TouchableOpacity style={styles.createBtn} onPress={goToCreate} activeOpacity={0.85}>
            <Text style={styles.createBtnText}>+ Create</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.spacer}/>
        {isLoading ? (
          <ActivityIndicator size="large" color={C.purple}/>
        ) : recipes.length === 0 ? (
          <EmptyState onCreate={goToCreate}/>
        ) : (
          recipes.map(r => (
            <RecipeCard
              key={r._id ?? r.recipeId ?? r.title}
              recipe={r}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:C.bg},
  list:{paddingHorizontal:16,paddingBottom:32},
  headerRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingTop:20,marginBottom:4},
  pageTitle:{fontSize:24,fontWeight:'800',color:C.dark},
  pageSubtitle:{fontSize:13,color:C.subtle,marginTop:2},
  createBtn:{backgroundColor:C.purple,borderRadius:8,paddingVertical:9,paddingHorizontal:14},
  createBtnText:{fontSize:13,fontWeight:'700',color:C.white},
  spacer:{height:20},
});

export default MyRecipesScreen;
