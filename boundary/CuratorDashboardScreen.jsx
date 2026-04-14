// CuratorDashboardScreen.jsx
// UC #99 login → handled by existing LoginScreen.jsx (role check: user.role === 'CURATOR')
// UC #100 logout → LogOutController (same as Free/Premium)
// UC #109 view own recipes
// UC #115 view profile
// Curator role only

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView }   from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import ViewCuratorRecipesController from '../controller/ViewCuratorRecipesController';
import ViewCuratorProfileController  from '../controller/ViewCuratorProfileController';
import DeleteCuratorRecipeController from '../controller/DeleteCuratorRecipeController';
import LogOutController              from '../controller/LogOutController';

const recipesCtrl = new ViewCuratorRecipesController();
const profileCtrl = new ViewCuratorProfileController();
const deleteCtrl  = new DeleteCuratorRecipeController();
const logoutCtrl  = new LogOutController();

const TABS = ['My Recipes', 'Profile'];
const C = { purple: '#7C3AED', purpleLight: '#EDE9FE', dark: '#111827', mid: '#374151', subtle: '#6B7280', white: '#FFFFFF', border: '#E5E7EB', bg: '#F9FAFB', errorText: '#DC2626', errorBg: '#FEF2F2' };

const TabBar = ({ active, onSelect }) => (
  <View style={tb.bar}>
    {TABS.map((t) => (
      <TouchableOpacity key={t} style={[tb.tab, active === t && tb.active]} onPress={() => onSelect(t)}>
        <Text style={[tb.txt, active === t && tb.activeTxt]}>{t}</Text>
      </TouchableOpacity>
    ))}
  </View>
);
const tb = StyleSheet.create({ bar: { flexDirection: 'row', backgroundColor: C.white, borderRadius: 10, borderWidth: 1, borderColor: C.border, marginBottom: 16, overflow: 'hidden' }, tab: { flex: 1, paddingVertical: 10, alignItems: 'center' }, active: { backgroundColor: C.purpleLight }, txt: { fontSize: 13, color: C.subtle }, activeTxt: { color: C.purple, fontWeight: '700' } });

// UC #109 — My Recipes tab
const MyRecipesTab = ({ userId, navigation, user }) => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    recipesCtrl.fetchCuratorRecipes(userId).then((r) => { if (r.success) setRecipes(r.data); setLoading(false); });
  }, [userId]));

  const handleDelete = useCallback((recipeId) => {
    Alert.alert('Delete Recipe', 'Permanently delete this recipe?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          const r = await deleteCtrl.deleteRecipe(recipeId, userId);
          if (r.success) setRecipes((p) => p.filter((rec) => rec.recipeId !== recipeId));
        }},
    ]);
  }, [userId]);

  if (loading) return <Text style={rs.loading}>Loading...</Text>;
  return (
    <View>
      <TouchableOpacity style={rs.createBtn} onPress={() => navigation.navigate('EditCuratorRecipeScreen', { user, recipe: null })}>
        <Text style={rs.createBtnTxt}>+ Create Recipe</Text>
      </TouchableOpacity>
      {recipes.length === 0 ? (
        <View style={rs.empty}><Text style={rs.emptyEmoji}>👨‍🍳</Text><Text style={rs.emptyTitle}>No Recipes Yet</Text><Text style={rs.emptyBody}>Create your first curator recipe to share with the community.</Text></View>
      ) : recipes.map((r) => (
        <View key={r.recipeId} style={rs.card}>
          <View style={rs.cardInfo}>
            <Text style={rs.cardTitle}>{r.title}</Text>
            <Text style={rs.cardMeta}>{r.prepTimeMins} min  •  {r.calories} kcal  •  {r.difficulty}</Text>
            <View style={rs.tagRow}>{r.tags?.slice(0,3).map((t) => <View key={t} style={rs.tag}><Text style={rs.tagTxt}>{t}</Text></View>)}</View>
          </View>
          <View style={rs.actions}>
            <TouchableOpacity style={rs.editBtn} onPress={() => navigation.navigate('EditCuratorRecipeScreen', { user, recipe: r })}><Text style={rs.editBtnTxt}>Edit</Text></TouchableOpacity>
            <TouchableOpacity style={rs.delBtn} onPress={() => handleDelete(r.recipeId)}><Text style={rs.delBtnTxt}>Delete</Text></TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
};
const rs = StyleSheet.create({
  loading:       { textAlign: 'center', color: C.subtle, paddingTop: 40 },
  createBtn:     { backgroundColor: C.purple, borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginBottom: 16 },
  createBtnTxt:  { fontSize: 15, fontWeight: '700', color: C.white },
  empty:         { backgroundColor: C.white, borderRadius: 14, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  emptyEmoji:    { fontSize: 48, marginBottom: 12 },
  emptyTitle:    { fontSize: 18, fontWeight: '700', color: C.dark, marginBottom: 6 },
  emptyBody:     { fontSize: 13, color: C.subtle, textAlign: 'center' },
  card:          { backgroundColor: C.white, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border, marginBottom: 12, flexDirection: 'row', gap: 10 },
  cardInfo:      { flex: 1 },
  cardTitle:     { fontSize: 15, fontWeight: '700', color: C.dark, marginBottom: 2 },
  cardMeta:      { fontSize: 12, color: C.subtle, marginBottom: 6 },
  tagRow:        { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  tag:           { backgroundColor: C.purpleLight, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  tagTxt:        { fontSize: 10, color: C.purple },
  actions:       { justifyContent: 'center', gap: 6 },
  editBtn:       { backgroundColor: C.purpleLight, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  editBtnTxt:    { fontSize: 12, fontWeight: '600', color: C.purple },
  delBtn:        { backgroundColor: C.errorBg, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  delBtnTxt:     { fontSize: 12, fontWeight: '600', color: C.errorText },
});

// UC #115 — Profile tab
const ProfileTab = ({ userId }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    profileCtrl.fetchProfile(userId).then((r) => { if (r.success) setProfile(r.data); setLoading(false); });
  }, [userId]));

  if (loading) return <Text style={{ textAlign: 'center', color: C.subtle, paddingTop: 40 }}>Loading...</Text>;
  if (!profile) return <Text style={{ textAlign: 'center', color: C.subtle, paddingTop: 40 }}>Unable to load profile.</Text>;

  const { user, recipeCount } = profile;
  return (
    <View>
      <View style={ps.card}>
        <View style={ps.avatar}><Text style={ps.avatarTxt}>{(user.firstName || user.username || 'C')[0].toUpperCase()}</Text></View>
        <Text style={ps.name}>{user.firstName} {user.lastName}</Text>
        <Text style={ps.username}>@{user.username}</Text>
        <View style={ps.curatorBadge}><Text style={ps.curatorBadgeTxt}>✓ Curator</Text></View>
      </View>
      <View style={ps.statsRow}>
        <View style={ps.stat}><Text style={ps.statVal}>{recipeCount}</Text><Text style={ps.statLbl}>Recipes</Text></View>
        <View style={ps.stat}><Text style={ps.statVal}>{user.profileType?.replace('_', ' ') || '—'}</Text><Text style={ps.statLbl}>Profile</Text></View>
      </View>
      <View style={ps.infoCard}>
        <Text style={ps.infoLbl}>Email</Text><Text style={ps.infoVal}>{user.email}</Text>
        <Text style={ps.infoLbl}>Member Since</Text><Text style={ps.infoVal}>{user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-SG', { month: 'long', year: 'numeric' }) : '—'}</Text>
      </View>
    </View>
  );
};
const ps = StyleSheet.create({
  card:           { backgroundColor: C.white, borderRadius: 14, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: C.border, marginBottom: 12 },
  avatar:         { width: 72, height: 72, borderRadius: 36, backgroundColor: C.purple, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarTxt:      { fontSize: 28, fontWeight: '800', color: C.white },
  name:           { fontSize: 20, fontWeight: '700', color: C.dark, marginBottom: 2 },
  username:       { fontSize: 14, color: C.subtle, marginBottom: 8 },
  curatorBadge:   { backgroundColor: C.purpleLight, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  curatorBadgeTxt:{ fontSize: 12, fontWeight: '700', color: C.purple },
  statsRow:       { flexDirection: 'row', gap: 12, marginBottom: 12 },
  stat:           { flex: 1, backgroundColor: C.white, borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  statVal:        { fontSize: 24, fontWeight: '800', color: C.dark, marginBottom: 2 },
  statLbl:        { fontSize: 12, color: C.subtle },
  infoCard:       { backgroundColor: C.white, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border },
  infoLbl:        { fontSize: 12, color: C.subtle, marginBottom: 2 },
  infoVal:        { fontSize: 15, fontWeight: '600', color: C.dark, marginBottom: 12 },
});

// ── Main Screen ──────────────────────────────────────────────────────────────
const CuratorDashboardScreen = ({ navigation, route }) => {
  const user = route?.params?.user || null;
  const [activeTab, setActiveTab] = useState('My Recipes');

  // Role guard
  if (user?.role !== 'CURATOR') {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.gateWrap}><Text style={s.gateTitle}>Curator Access Only</Text><Text style={s.gateBody}>This dashboard is for approved Curators only.</Text></View>
      </SafeAreaView>
    );
  }

  // UC #100 — log out (reuses shared LogOutController)
  const handleLogout = useCallback(async () => {
    const r = await logoutCtrl.logout();
    if (r.success) navigation.replace('LoginScreen');
  }, [navigation]);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />
      <View style={s.nav}>
        <View style={s.brand}><Text style={s.navTitle}>Curator</Text></View>
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}><Text style={s.logoutTxt}>Log Out</Text></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.header}>
          <View style={s.badge}><Text style={s.badgeTxt}>✓ Curator</Text></View>
          <Text style={s.pageTitle}>Curator Dashboard</Text>
          <Text style={s.pageSub}>Manage your recipes and profile</Text>
        </View>
        <TabBar active={activeTab} onSelect={setActiveTab} />
        {activeTab === 'My Recipes' && <MyRecipesTab userId={user.userId} navigation={navigation} user={user} />}
        {activeTab === 'Profile'    && <ProfileTab   userId={user.userId} />}
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: C.bg },
  nav:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  brand:     { flex: 1 },
  navTitle:  { fontSize: 20, fontWeight: '800', color: C.dark },
  logoutBtn: { backgroundColor: C.bg, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1, borderColor: C.border },
  logoutTxt: { fontSize: 13, fontWeight: '600', color: C.mid },
  scroll:    { paddingHorizontal: 16, paddingBottom: 32 },
  header:    { paddingVertical: 20 },
  badge:     { alignSelf: 'flex-start', backgroundColor: C.purple, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 8 },
  badgeTxt:  { fontSize: 11, fontWeight: '700', color: C.white },
  pageTitle: { fontSize: 28, fontWeight: '800', color: C.dark, letterSpacing: -0.5, marginBottom: 4 },
  pageSub:   { fontSize: 14, color: C.subtle },
  gateWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  gateTitle: { fontSize: 20, fontWeight: '700', color: C.dark, marginBottom: 8 },
  gateBody:  { fontSize: 14, color: C.subtle, textAlign: 'center' },
});

export default CuratorDashboardScreen;
