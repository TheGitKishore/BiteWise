// CuratorDashboardScreen.jsx
// UC #99  Curator – Login (handled by LoginScreen, role check → CURATOR)
// UC #100 Curator – Logout (LogOutController)
// UC #109 Curator – View Own Recipes
// UC #115 Curator – View Profile
// Sprint 9: Rewritten as single scrollable page — no tabs.
//           Role check fixed: String(user?.role || '').toUpperCase() === 'CURATOR'
//           Hero banner, stats cards, recipe management, blog post management,
//           curator profile section — all in one scroll.

import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Alert, StyleSheet, StatusBar,, Image} from 'react-native';
import { SafeAreaView }   from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import ViewCuratorProfileController from '../controller/ViewCuratorProfileController';
import LogOutController              from '../controller/LogOutController';

const profileCtrl = new ViewCuratorProfileController();
const logoutCtrl  = new LogOutController();

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
  blue:        '#3B82F6',
  green:       '#16A34A',
  greenBg:     '#F0FDF4',
  greenBorder: '#BBF7D0',
  orange:      '#D97706',
  orangeBg:    '#FFF7ED',
  orangeBorder:'#FDE68A',
  pink:        '#F43F5E',
  successBg:   '#F0FDF4',
  successBorder:'#BBF7D0',
  successText: '#15803D',
};

// ── NavBar ───────────────────────────────────────────────────────────────────
const NavBar = ({ onMenuPress }) => (
  <View style={nav.bar}>
    <View style={nav.brand}>
      <Image source={require('../assets/BiteWiseLogo.png')} style={nav.logo} />
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
  logo:      { width: 24, height: 24, resizeMode: 'contain' },
  brandName: { fontSize: 20, fontWeight: '800', color: C.dark, letterSpacing: -0.3 },
  menuBtn:   { padding: 6, gap: 4, alignItems: 'flex-end' },
  menuLine:  { width: 22, height: 2.5, backgroundColor: C.dark, borderRadius: 2 },
});

// ── Welcome Banner (shown when route.params.showWelcome === true) ─────────────
const WelcomeBanner = ({ visible }) => {
  if (!visible) return null;
  return (
    <View style={wb.wrap}>
      <Text style={wb.icon}>✅</Text>
      <Text style={wb.text}>Application submitted and approved! Welcome to the Curator Program! 🎉</Text>
    </View>
  );
};
const wb = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.successBg, borderBottomWidth: 1, borderBottomColor: C.successBorder },
  icon: { fontSize: 16 },
  text: { flex: 1, fontSize: 13, fontWeight: '500', color: C.successText },
});

// ── Hero Banner ───────────────────────────────────────────────────────────────
const HeroBanner = ({ username, onBackToDashboard }) => (
  <View style={hb.banner}>
    <View style={hb.avatarCircle}>
      <Text style={hb.avatarIcon}>👨‍🍳</Text>
    </View>
    <Text style={hb.title}>Curator Dashboard</Text>
    <Text style={hb.subtitle}>Welcome back, {username}!</Text>
    <TouchableOpacity style={hb.backBtn} onPress={onBackToDashboard}>
      <Text style={hb.backBtnTxt}>Back to Dashboard</Text>
    </TouchableOpacity>
  </View>
);
const hb = StyleSheet.create({
  banner:      { backgroundColor: C.purple, paddingVertical: 28, paddingHorizontal: 20, alignItems: 'center' },
  avatarCircle:{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarIcon:  { fontSize: 30 },
  title:       { fontSize: 24, fontWeight: '800', color: C.white, marginBottom: 4 },
  subtitle:    { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginBottom: 18 },
  backBtn:     { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.7)', borderRadius: 10, paddingVertical: 9, paddingHorizontal: 32, alignSelf: 'stretch' },
  backBtnTxt:  { color: C.white, fontWeight: '600', fontSize: 14, textAlign: 'center' },
});

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, emoji, emojiColor }) => (
  <View style={sc.card}>
    <View>
      <Text style={sc.label}>{label}</Text>
      <Text style={[sc.value, { color: emojiColor }]}>{value}</Text>
    </View>
    <Text style={[sc.emoji, { color: emojiColor }]}>{emoji}</Text>
  </View>
);
const sc = StyleSheet.create({
  grid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  card:  { width: '48%', minHeight: 104, backgroundColor: C.white, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontSize: 13, color: C.subtle, marginBottom: 4 },
  value: { fontSize: 28, fontWeight: '800' },
  emoji: { fontSize: 28, opacity: 0.35 },
});

// ── Management Section ────────────────────────────────────────────────────────
const ManagementSection = ({
  title, icon, published, draft,
  publishedLabel, draftLabel,
  createLabel, createColor,
  onViewAll, onCreate,
}) => (
  <View style={ms.card}>
    <View style={ms.header}>
      <View style={ms.titleRow}>
        <Text style={ms.icon}>{icon}</Text>
        <Text style={ms.title}>{title}</Text>
      </View>
      <TouchableOpacity style={ms.viewAllBtn} onPress={onViewAll}>
        <Text style={ms.viewAllTxt}>View All</Text>
      </TouchableOpacity>
    </View>

    {/* Published row */}
    <View style={[ms.statRow, { backgroundColor: C.greenBg }]}>
      <View>
        <Text style={ms.statLabel}>{publishedLabel}</Text>
        <Text style={[ms.statNum, { color: C.green }]}>{published}</Text>
      </View>
      <View style={[ms.badge, { backgroundColor: C.green }]}>
        <Text style={ms.badgeTxt}>Live</Text>
      </View>
    </View>

    {/* Draft row */}
    <View style={[ms.statRow, { backgroundColor: C.orangeBg }]}>
      <View>
        <Text style={ms.statLabel}>{draftLabel}</Text>
        <Text style={[ms.statNum, { color: C.orange }]}>{draft}</Text>
      </View>
      <View style={[ms.badge, { backgroundColor: C.orange }]}>
        <Text style={ms.badgeTxt}>Draft</Text>
      </View>
    </View>

    {/* Create button */}
    <TouchableOpacity style={[ms.createBtn, { backgroundColor: createColor }]} onPress={onCreate}>
      <Text style={ms.createBtnTxt}>+ {createLabel}</Text>
    </TouchableOpacity>
  </View>
);
const ms = StyleSheet.create({
  card:       { backgroundColor: C.white, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 14 },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  titleRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  icon:       { fontSize: 18 },
  title:      { fontSize: 16, fontWeight: '800', color: C.dark },
  viewAllBtn: { borderWidth: 1, borderColor: C.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  viewAllTxt: { fontSize: 13, fontWeight: '600', color: C.mid },
  statRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 10, padding: 12, marginBottom: 8 },
  statLabel:  { fontSize: 12, color: C.subtle, marginBottom: 2 },
  statNum:    { fontSize: 22, fontWeight: '800' },
  badge:      { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  badgeTxt:   { fontSize: 12, fontWeight: '700', color: C.white },
  createBtn:  { borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginTop: 4 },
  createBtnTxt:{ fontSize: 15, fontWeight: '700', color: C.white },
});

// ── Curator Profile Section ───────────────────────────────────────────────────
const CuratorProfileSection = ({ profileData, onUpdateProfile }) => {
  const { user, expertise, bio } = profileData;
  const initial = (user?.username || user?.firstName || 'C')[0].toUpperCase();
  const username = user?.username || user?.firstName || 'Curator';
  const email    = user?.email || '';

  return (
    <View style={cp.card}>
      <View style={cp.header}>
        <View style={cp.titleRow}>
          <Text style={cp.icon}>👤</Text>
          <Text style={cp.title}>Curator Profile</Text>
        </View>
        <TouchableOpacity style={cp.editBtn} onPress={onUpdateProfile}>
          <Text style={cp.editBtnTxt}>⚙️ Update Profile</Text>
        </TouchableOpacity>
      </View>

      <View style={cp.profileRow}>
        <View style={cp.avatar}>
          <Text style={cp.avatarTxt}>{initial}</Text>
        </View>
        <View style={cp.infoBlock}>
          <Text style={cp.username}>{username}</Text>
          <Text style={cp.email}>{email}</Text>
        </View>
      </View>

      {expertise ? (
        <View style={cp.fieldWrap}>
          <Text style={cp.fieldLabel}>Expertise:</Text>
          <Text style={cp.fieldVal}>{expertise}</Text>
        </View>
      ) : null}

      {bio ? (
        <View style={cp.fieldWrap}>
          <Text style={cp.fieldLabel}>Bio:</Text>
          <Text style={cp.fieldVal}>{bio}</Text>
        </View>
      ) : null}
    </View>
  );
};
const cp = StyleSheet.create({
  card:       { backgroundColor: C.white, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 14 },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  titleRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  icon:       { fontSize: 18, color: C.purple },
  title:      { fontSize: 16, fontWeight: '800', color: C.dark },
  editBtn:    { borderWidth: 1, borderColor: C.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  editBtnTxt: { fontSize: 13, fontWeight: '600', color: C.mid },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  avatar:     { width: 60, height: 60, borderRadius: 30, backgroundColor: C.purple, alignItems: 'center', justifyContent: 'center' },
  avatarTxt:  { fontSize: 24, fontWeight: '800', color: C.white },
  infoBlock:  { flex: 1 },
  username:   { fontSize: 18, fontWeight: '800', color: C.dark, marginBottom: 2 },
  email:      { fontSize: 13, color: C.subtle },
  fieldWrap:  { marginBottom: 8 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: C.dark, marginBottom: 1 },
  fieldVal:   { fontSize: 13, color: C.body },
});

// ── Nav Tile ──────────────────────────────────────────────────────────────────
const NavTile = ({ icon, label, onPress }) => (
  <TouchableOpacity style={nt.tile} onPress={onPress}>
    <Text style={nt.icon}>{icon}</Text>
    <Text style={nt.label}>{label}</Text>
  </TouchableOpacity>
);
const nt = StyleSheet.create({
  tile:  { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.white, borderRadius: 14, paddingHorizontal: 18, paddingVertical: 16, borderWidth: 1, borderColor: C.border, marginBottom: 10 },
  icon:  { fontSize: 20 },
  label: { fontSize: 15, fontWeight: '600', color: C.dark },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
const CuratorDashboardScreen = ({ navigation, route }) => {
  const user         = route?.params?.user || null;
  const showWelcome  = route?.params?.showWelcome === true;

  const [profileData, setProfileData] = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [banner,      setBanner]      = useState(route?.params?.banner || '');

  // Show incoming banner from UpdateCuratorProfileScreen
  useFocusEffect(
    useCallback(() => {
      if (route?.params?.banner) {
        setBanner(route.params.banner);
        setTimeout(() => setBanner(''), 4000);
      }
    }, [route?.params?.banner])
  );

  // Role guard — fixed: compare uppercase
  if (String(user?.role || '').toUpperCase() !== 'CURATOR') {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.gateWrap}>
          <Text style={s.gateTitle}>Curator Access Only</Text>
          <Text style={s.gateBody}>This dashboard is for approved Curators only.</Text>
        </View>
      </SafeAreaView>
    );
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      profileCtrl.fetchProfile(user.userId).then((r) => {
        if (r.success) setProfileData(r.data);
        setLoading(false);
      });
    }, [user?.userId])
  );

  const handleLogout = useCallback(async () => {
    const r = await logoutCtrl.logout();
    if (r.success) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainLandingScreen' }],
      });
    }
  }, [navigation]);

  const handleBackToDashboard = useCallback(() => {
    navigation.navigate('PremiumUserDashboardScreen', { user });
  }, [navigation, user]);

  const handleMenuPress = () => handleBackToDashboard();

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />
      <NavBar onMenuPress={handleMenuPress} />
      <WelcomeBanner visible={showWelcome} />
      {banner ? (
        <View style={{ flexDirection:'row', alignItems:'center', gap:10, paddingHorizontal:16, paddingVertical:12, backgroundColor:'#F0FDF4', borderBottomWidth:1, borderBottomColor:'#BBF7D0' }}>
          <Text style={{ fontSize:16 }}>✅</Text>
          <Text style={{ flex:1, fontSize:14, fontWeight:'500', color:'#15803D' }}>{banner}</Text>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero Banner */}
        <HeroBanner
          username={user?.username || user?.firstName || 'Curator'}
          onBackToDashboard={handleBackToDashboard}
        />

        <View style={s.content}>

          {/* + Create Recipe */}
          <TouchableOpacity
            style={s.createRecipeBtn}
            onPress={() => navigation.navigate('EditCuratorRecipeScreen', { user, recipe: null })}
          >
            <Text style={s.createBtnTxt}>+ Create Recipe</Text>
          </TouchableOpacity>

          {/* + Create Blog Post */}
          <TouchableOpacity
            style={s.createBlogBtn}
            onPress={() => navigation.navigate('EditBlogPostScreen', { user, post: null })}
          >
            <Text style={s.createBtnTxt}>+ Create Blog Post</Text>
          </TouchableOpacity>

          {/* My Recipes nav tile */}
          <NavTile
            icon="📄"
            label="My Recipes"
            onPress={() => navigation.navigate('CuratorRecipesScreen', { user })}
          />

          {/* My Blog Posts nav tile */}
          <NavTile
            icon="📖"
            label="My Blog Posts"
            onPress={() => navigation.navigate('BlogPostsScreen', { user })}
          />

          {/* Stats */}
          {loading ? (
            <Text style={s.loading}>Loading...</Text>
          ) : profileData ? (
            <>
              <View style={sc.grid}>
                <StatCard label="Total Views"  value={profileData.curatorStats.views}     emoji="👁"  emojiColor={C.purple} />
                <StatCard label="Total Likes"  value={profileData.curatorStats.likes}     emoji="🤍"  emojiColor={C.pink}   />
              </View>

              {/* Recipe Management */}
              <ManagementSection
                title="Recipe Management"
                icon="👨‍🍳"
                published={profileData.recipes.published}
                draft={profileData.recipes.draft}
                publishedLabel="Published Recipes"
                draftLabel="Draft Recipes"
                createLabel="Create New Recipe"
                createColor={C.purple}
                onViewAll={() => navigation.navigate('CuratorRecipesScreen', { user })}
                onCreate={() => navigation.navigate('EditCuratorRecipeScreen', { user, recipe: null })}
              />

              {/* Blog Post Management */}
              <ManagementSection
                title="Blog Post Management"
                icon="📖"
                published={profileData.blogPosts.published}
                draft={profileData.blogPosts.draft}
                publishedLabel="Published Posts"
                draftLabel="Draft Posts"
                createLabel="Create New Blog Post"
                createColor={C.blue}
                onViewAll={() => navigation.navigate('BlogPostsScreen', { user })}
                onCreate={() => navigation.navigate('EditBlogPostScreen', { user, post: null })}
              />

              {/* Curator Profile */}
              <CuratorProfileSection
                profileData={profileData}
                onUpdateProfile={() => navigation.navigate('UpdateCuratorProfileScreen', {
                  user,
                  expertise: profileData?.expertise || '',
                  bio:       profileData?.bio       || '',
                })}
              />
            </>
          ) : (
            <Text style={s.error}>Unable to load dashboard data.</Text>
          )}

          {/* Logout */}
          <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
            <Text style={s.logoutTxt}>Log Out</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: C.bg },
  gateWrap:        { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  gateTitle:       { fontSize: 20, fontWeight: '700', color: C.dark, marginBottom: 8 },
  gateBody:        { fontSize: 14, color: C.subtle, textAlign: 'center' },
  scroll:          { paddingBottom: 40 },
  content:         { paddingHorizontal: 16, paddingTop: 16 },
  createRecipeBtn: { borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginBottom: 10, backgroundColor: C.purple },
  createBlogBtn:   { borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginBottom: 10, backgroundColor: C.blue },
  createBtnTxt:    { fontSize: 16, fontWeight: '700', color: C.white },
  loading:         { textAlign: 'center', color: C.subtle, paddingVertical: 24 },
  error:           { textAlign: 'center', color: '#DC2626', paddingVertical: 16 },
  logoutBtn:       { backgroundColor: C.white, borderRadius: 12, borderWidth: 1, borderColor: C.border, paddingVertical: 13, alignItems: 'center', marginTop: 4 },
  logoutTxt:       { fontSize: 15, fontWeight: '600', color: C.mid },
});

export default CuratorDashboardScreen;
