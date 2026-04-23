// CuratorDashboardScreen.jsx — Sprint 9 Complete UI Rewrite
// Matches design screenshots exactly (CuratorDashboard1-3, WelcomeBanner).
// Single scrollable page — NO tabs.
//
// UC #99  login → LoginScreen (role check)
// UC #100 logout → LogOutController
// UC #109 view recipes → via profileCtrl
// UC #111 publish / UC #112 unpublish / UC #114 delete recipe
// UC #115 view curator profile
// UC #117 view blog posts → BlogPostsScreen
// UC #118 create blog post → EditBlogPostScreen
//
// Layout:
//   [Optional welcome banner]
//   [NavBar — BiteWise logo + hamburger]
//   [Hero: purple-pink gradient, chef hat avatar, title, username, Back button]
//   [+ Create Recipe] [+ Create Blog Post]
//   [My Recipes tile] [My Blog Posts tile]
//   [Stats: Total Views, Total Likes, Comments, Followers]
//   [Recipe Management section]
//   [Blog Post Management section]
//   [Curator Profile section]
// Curator role only

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView }   from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import ViewCuratorProfileController     from '../controller/ViewCuratorProfileController';
import DeleteCuratorRecipeController    from '../controller/DeleteCuratorRecipeController';
import PublishCuratorRecipeController   from '../controller/PublishCuratorRecipeController';
import UnpublishCuratorRecipeController from '../controller/UnpublishCuratorRecipeController';
import LogOutController                 from '../controller/LogOutController';

const profileCtrl   = new ViewCuratorProfileController();
const deleteCtrl    = new DeleteCuratorRecipeController();
const publishCtrl   = new PublishCuratorRecipeController();
const unpublishCtrl = new UnpublishCuratorRecipeController();
const logoutCtrl    = new LogOutController();

const C = {
  purple:'#7C3AED', purpleLight:'#EDE9FE', dark:'#111827', mid:'#374151',
  body:'#4B5563', subtle:'#6B7280', white:'#FFFFFF', border:'#E5E7EB', bg:'#F9FAFB',
  green:'#16A34A', greenPale:'#ECFDF5', greenBorder:'#A7F3D0',
  orange:'#D97706', orangePale:'#FFFBEB', orangeBorder:'#FDE68A',
  errorBg:'#FEF2F2', errorText:'#DC2626',
};

// ─── NavBar ────────────────────────────────────────────────────────────────
const NavBar = ({ onMenuPress }) => (
  <View style={nav.bar}>
    <View style={nav.brand}><Text style={nav.icon}>🍴</Text><Text style={nav.brandName}>BiteWise</Text></View>
    <TouchableOpacity onPress={onMenuPress} style={nav.menuBtn}>
      <View style={nav.menuLine}/><View style={[nav.menuLine,{width:18}]}/><View style={nav.menuLine}/>
    </TouchableOpacity>
  </View>
);
const nav = StyleSheet.create({
  bar:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:20,paddingVertical:14,backgroundColor:C.white,borderBottomWidth:1,borderBottomColor:C.border},
  brand:{flexDirection:'row',alignItems:'center',gap:6},icon:{fontSize:20},
  brandName:{fontSize:20,fontWeight:'800',color:C.dark,letterSpacing:-0.3},
  menuBtn:{padding:6,gap:4,alignItems:'flex-end'},menuLine:{width:22,height:2.5,backgroundColor:C.dark,borderRadius:2},
});

// ─── Welcome Banner ─────────────────────────────────────────────────────────
const WelcomeBanner = () => (
  <View style={wb.wrap}>
    <Text style={wb.icon}>✅</Text>
    <Text style={wb.text}>Application submitted and approved! Welcome to the Curator Program! 🎉</Text>
  </View>
);
const wb = StyleSheet.create({
  wrap:{flexDirection:'row',alignItems:'center',gap:10,paddingHorizontal:16,paddingVertical:14,backgroundColor:C.greenPale,borderBottomWidth:1,borderBottomColor:C.greenBorder},
  icon:{fontSize:18},text:{flex:1,fontSize:14,fontWeight:'600',color:C.green},
});

// ─── Hero Banner ────────────────────────────────────────────────────────────
const HeroBanner = ({ username, onBackToDashboard }) => (
  <View style={hb.wrap}>
    <View style={hb.avatarCircle}><Text style={hb.avatarEmoji}>🍽️</Text></View>
    <Text style={hb.title}>Curator Dashboard</Text>
    <Text style={hb.subtitle}>Welcome back, {username}!</Text>
    <TouchableOpacity style={hb.backBtn} onPress={onBackToDashboard} activeOpacity={0.85}>
      <Text style={hb.backBtnTxt}>Back to Dashboard</Text>
    </TouchableOpacity>
  </View>
);
const hb = StyleSheet.create({
  wrap:{paddingTop:28,paddingBottom:24,paddingHorizontal:20,alignItems:'center',backgroundColor:'#7C3AED'},
  avatarCircle:{width:72,height:72,borderRadius:36,backgroundColor:'rgba(255,255,255,0.2)',alignItems:'center',justifyContent:'center',marginBottom:14,borderWidth:2,borderColor:'rgba(255,255,255,0.4)'},
  avatarEmoji:{fontSize:32},
  title:{fontSize:24,fontWeight:'800',color:C.white,letterSpacing:-0.3,marginBottom:4},
  subtitle:{fontSize:14,color:'rgba(255,255,255,0.85)',marginBottom:16},
  backBtn:{borderWidth:1,borderColor:'rgba(255,255,255,0.5)',borderRadius:8,paddingVertical:9,paddingHorizontal:24},
  backBtnTxt:{fontSize:14,fontWeight:'600',color:C.white},
});

// ─── Action Button ──────────────────────────────────────────────────────────
const ActionBtn = ({ label, onPress, bgColor }) => (
  <TouchableOpacity style={[ab.btn,{backgroundColor:bgColor}]} onPress={onPress} activeOpacity={0.85}>
    <Text style={ab.txt}>+ {label}</Text>
  </TouchableOpacity>
);
const ab = StyleSheet.create({
  btn:{borderRadius:12,paddingVertical:16,alignItems:'center',marginBottom:10},
  txt:{fontSize:15,fontWeight:'700',color:C.white,letterSpacing:0.2},
});

// ─── Nav Tile ───────────────────────────────────────────────────────────────
const NavTile = ({ icon, label, onPress }) => (
  <TouchableOpacity style={nt.card} onPress={onPress} activeOpacity={0.8}>
    <Text style={nt.icon}>{icon}</Text>
    <Text style={nt.label}>{label}</Text>
  </TouchableOpacity>
);
const nt = StyleSheet.create({
  card:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10,backgroundColor:C.white,borderRadius:12,paddingVertical:16,marginBottom:10,borderWidth:1,borderColor:C.border},
  icon:{fontSize:18},label:{fontSize:15,fontWeight:'600',color:C.dark},
});

// ─── Stat Card ──────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon, valueColor }) => (
  <View style={sc.card}>
    <View><Text style={sc.label}>{label}</Text><Text style={[sc.value,{color:valueColor||C.purple}]}>{value}</Text></View>
    <Text style={[sc.icon,{color:valueColor||C.purple}]}>{icon}</Text>
  </View>
);
const sc = StyleSheet.create({
  card:{backgroundColor:C.white,borderRadius:12,padding:18,marginBottom:10,flexDirection:'row',justifyContent:'space-between',alignItems:'center',borderWidth:1,borderColor:C.border},
  label:{fontSize:13,color:C.subtle,marginBottom:4},value:{fontSize:28,fontWeight:'800'},icon:{fontSize:28},
});

// ─── Management Section ──────────────────────────────────────────────────────
const ManagementSection = ({ icon, title, publishedCount, draftCount, onViewAll, onCreateNew, createLabel, createColor }) => (
  <View style={ms.card}>
    <View style={ms.hdr}>
      <View style={ms.titleRow}><Text style={ms.icon}>{icon}</Text><Text style={ms.title}>{title}</Text></View>
      <TouchableOpacity style={ms.viewAllBtn} onPress={onViewAll}><Text style={ms.viewAllTxt}>View All</Text></TouchableOpacity>
    </View>
    <View style={[ms.row,ms.rowPublished]}>
      <View><Text style={ms.rowLabel}>Published {title.split(' ')[0]}s</Text><Text style={ms.pubCount}>{publishedCount}</Text></View>
      <View style={ms.liveBadge}><Text style={ms.liveTxt}>Live</Text></View>
    </View>
    <View style={[ms.row,ms.rowDraft]}>
      <View><Text style={ms.rowLabel}>Draft {title.split(' ')[0]}s</Text><Text style={ms.draftCount}>{draftCount}</Text></View>
      <View style={ms.draftBadge}><Text style={ms.draftTxt}>Draft</Text></View>
    </View>
    <TouchableOpacity style={[ms.createBtn,{backgroundColor:createColor}]} onPress={onCreateNew} activeOpacity={0.85}>
      <Text style={ms.createBtnTxt}>+ {createLabel}</Text>
    </TouchableOpacity>
  </View>
);
const ms = StyleSheet.create({
  card:{backgroundColor:C.white,borderRadius:14,padding:16,marginBottom:14,borderWidth:1,borderColor:C.border},
  hdr:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:14},
  titleRow:{flexDirection:'row',alignItems:'center',gap:8},icon:{fontSize:18},title:{fontSize:16,fontWeight:'700',color:C.dark},
  viewAllBtn:{borderWidth:1,borderColor:C.border,borderRadius:8,paddingVertical:5,paddingHorizontal:12},
  viewAllTxt:{fontSize:12,fontWeight:'600',color:C.mid},
  row:{borderRadius:8,padding:12,marginBottom:8,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  rowPublished:{backgroundColor:C.greenPale},rowDraft:{backgroundColor:C.orangePale},
  rowLabel:{fontSize:12,color:C.subtle,marginBottom:2},
  pubCount:{fontSize:20,fontWeight:'800',color:C.green},
  draftCount:{fontSize:20,fontWeight:'800',color:C.orange},
  liveBadge:{backgroundColor:C.green,borderRadius:20,paddingHorizontal:10,paddingVertical:4},
  liveTxt:{fontSize:11,fontWeight:'700',color:C.white},
  draftBadge:{backgroundColor:C.orange,borderRadius:20,paddingHorizontal:10,paddingVertical:4},
  draftTxt:{fontSize:11,fontWeight:'700',color:C.white},
  createBtn:{borderRadius:10,paddingVertical:13,alignItems:'center',marginTop:6},
  createBtnTxt:{fontSize:14,fontWeight:'700',color:C.white},
});

// ─── Curator Profile Section ─────────────────────────────────────────────────
const CuratorProfileSection = ({ profile, onEditProfile }) => {
  const { user, expertise, bio } = profile;
  const initial = (user.username || user.firstName || 'C')[0].toUpperCase();
  return (
    <View style={cp.card}>
      <View style={cp.hdr}>
        <View style={cp.hdrLeft}><Text style={cp.profileIcon}>👤</Text><Text style={cp.sectionTitle}>Curator Profile</Text></View>
        <TouchableOpacity style={cp.editBtn} onPress={onEditProfile}>
          <Text style={cp.editIcon}>⚙️</Text><Text style={cp.editTxt}>Edit Profile</Text>
        </TouchableOpacity>
      </View>
      <View style={cp.profileRow}>
        <View style={cp.avatar}><Text style={cp.avatarTxt}>{initial}</Text></View>
        <View style={cp.info}>
          <Text style={cp.username}>{user.username}</Text>
          <Text style={cp.email}>{user.email}</Text>
          {expertise ? <><Text style={cp.fieldLbl}>Expertise:</Text><Text style={cp.fieldVal}>{expertise}</Text></> : null}
          {bio       ? <><Text style={cp.fieldLbl}>Bio:</Text><Text style={cp.fieldVal}>{bio}</Text></> : null}
        </View>
      </View>
    </View>
  );
};
const cp = StyleSheet.create({
  card:{backgroundColor:C.white,borderRadius:14,padding:16,marginBottom:14,borderWidth:1,borderColor:C.border},
  hdr:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:16},
  hdrLeft:{flexDirection:'row',alignItems:'center',gap:8},profileIcon:{fontSize:18,color:C.purple},
  sectionTitle:{fontSize:16,fontWeight:'700',color:C.dark},
  editBtn:{flexDirection:'row',alignItems:'center',gap:4,borderWidth:1,borderColor:C.border,borderRadius:8,paddingVertical:5,paddingHorizontal:10},
  editIcon:{fontSize:14},editTxt:{fontSize:12,fontWeight:'600',color:C.mid},
  profileRow:{flexDirection:'row',gap:14},
  avatar:{width:68,height:68,borderRadius:34,backgroundColor:C.purple,alignItems:'center',justifyContent:'center'},
  avatarTxt:{fontSize:26,fontWeight:'800',color:C.white},
  info:{flex:1},
  username:{fontSize:18,fontWeight:'800',color:C.dark,marginBottom:2},
  email:{fontSize:13,color:C.subtle,marginBottom:8},
  fieldLbl:{fontSize:12,fontWeight:'700',color:C.dark,marginTop:4},
  fieldVal:{fontSize:13,color:C.body,marginTop:1},
});

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
const CuratorDashboardScreen = ({ navigation, route }) => {
  const user        = route?.params?.user        || null;
  const showWelcome = route?.params?.showWelcome === true;

  const [profileData, setProfileData] = useState(null);
  const [loading,     setLoading]     = useState(true);

  // Fix: role stored as 'CURATOR' (uppercase) in User entity
  const isCurator = String(user?.role || '').toUpperCase() === 'CURATOR';

  useFocusEffect(
    useCallback(() => {
      if (!user?.userId || !isCurator) { setLoading(false); return; }
      setLoading(true);
      profileCtrl.fetchProfile(user.userId).then(r => {
        if (r.success) setProfileData(r.data);
        setLoading(false);
      });
    }, [user?.userId])
  );

  if (!isCurator) {
    return (
      <SafeAreaView style={s.safe}>
        <NavBar onMenuPress={() => navigation.goBack()}/>
        <View style={s.gateWrap}>
          <Text style={s.gateTitle}>Curator Access Only</Text>
          <Text style={s.gateBody}>This dashboard is for approved Curators only.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleLogout = useCallback(async () => {
    const r = await logoutCtrl.logout();
    if (r.success) navigation.replace('LoginScreen');
  }, [navigation]);

  const stats = profileData?.curatorStats || { totalViews: 0, totalLikes: 0, comments: 0, followers: 0 };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white}/>
      <NavBar onMenuPress={handleLogout}/>

      {showWelcome && <WelcomeBanner/>}

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <HeroBanner
          username={user?.username || user?.firstName || 'Curator'}
          onBackToDashboard={() => navigation.navigate('PremiumUserDashboardScreen', { user })}
        />

        <View style={s.content}>
          {/* Action buttons */}
          <ActionBtn label="Create Recipe"    bgColor={C.purple}    onPress={() => navigation.navigate('EditCuratorRecipeScreen', { user })}/>
          <ActionBtn label="Create Blog Post" bgColor="#3B82F6"     onPress={() => navigation.navigate('EditBlogPostScreen', { user, post: null })}/>

          {/* Nav tiles */}
          <NavTile icon="📄" label="My Recipes"    onPress={() => navigation.navigate('EditCuratorRecipeScreen', { user })}/>
          <NavTile icon="📖" label="My Blog Posts" onPress={() => navigation.navigate('BlogPostsScreen', { user })}/>

          {loading ? <Text style={s.loadingTxt}>Loading dashboard...</Text> : (
            <>
              {/* Stats */}
              <StatCard label="Total Views"  value={stats.totalViews}  icon="👁"  valueColor={C.purple}/>
              <StatCard label="Total Likes"  value={stats.totalLikes}  icon="🤍"  valueColor="#F43F5E"/>
              <StatCard label="Comments"     value={stats.comments}    icon="💬"  valueColor="#3B82F6"/>
              <StatCard label="Followers"    value={stats.followers}   icon="📈"  valueColor={C.purple}/>

              {/* Recipe Management */}
              <ManagementSection
                icon="🍽️" title="Recipe Management"
                publishedCount={profileData?.recipes?.published?.length ?? 0}
                draftCount={profileData?.recipes?.draft?.length ?? 0}
                onViewAll={() => navigation.navigate('EditCuratorRecipeScreen', { user })}
                onCreateNew={() => navigation.navigate('EditCuratorRecipeScreen', { user })}
                createLabel="Create New Recipe" createColor={C.purple}
              />

              {/* Blog Post Management */}
              <ManagementSection
                icon="📖" title="Blog Post Management"
                publishedCount={profileData?.blogPosts?.published?.length ?? 0}
                draftCount={profileData?.blogPosts?.draft?.length ?? 0}
                onViewAll={() => navigation.navigate('BlogPostsScreen', { user })}
                onCreateNew={() => navigation.navigate('EditBlogPostScreen', { user, post: null })}
                createLabel="Create New Blog Post" createColor="#3B82F6"
              />

              {/* Curator Profile */}
              {profileData?.user && (
                <CuratorProfileSection
                  profile={profileData}
                  onEditProfile={() => navigation.navigate('AccountSettingsScreen', { user })}
                />
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:{flex:1,backgroundColor:C.bg},
  scroll:{paddingBottom:40},
  content:{paddingHorizontal:16,paddingTop:16},
  loadingTxt:{textAlign:'center',color:C.subtle,paddingVertical:32},
  gateWrap:{flex:1,alignItems:'center',justifyContent:'center',padding:32},
  gateTitle:{fontSize:20,fontWeight:'700',color:C.dark,marginBottom:8},
  gateBody:{fontSize:14,color:C.subtle,textAlign:'center'},
});

export default CuratorDashboardScreen;
