// AdminDashboardScreen.jsx
// UC #99  System Admin – Log Out
// UC #100 System Admin – View User Accounts
// UC #101 System Admin – Terminate User Account
// UC #102 System Admin – Temporarily Ban User Account
// UC #103 System Admin – View User Reviews
// UC #104 System Admin – Manage Reviews (Remove)
// UC #105 System Admin – View Curator Applications
// UC #106 System Admin – Approve Curator Application
// UC #107 System Admin – Reject Curator Application
// UC #108 System Admin – Update Application (System Page)
// NEW-A   System Admin – View Dashboard Overview
//
// Design matches: maindashboard1/2, userManagement1/2,
//   ReviewModeration1/2, CuratorManagement1/2, SystemPage1/2 screenshots.

import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, StatusBar, Alert,
} from 'react-native';
import { SafeAreaView }   from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import AdminLogoutController                from '../controller/AdminLogoutController';
import AdminOverviewController              from '../controller/AdminOverviewController';
import AdminViewUsersController             from '../controller/AdminViewUsersController';
import AdminTerminateUserController         from '../controller/AdminTerminateUserController';
import AdminBanUserController               from '../controller/AdminBanUserController';
import AdminViewReviewsController           from '../controller/AdminViewReviewsController';
import AdminRemoveReviewController          from '../controller/AdminRemoveReviewController';
import AdminViewCuratorApplicationsController from '../controller/AdminViewCuratorApplicationsController';
import AdminApproveCuratorController        from '../controller/AdminApproveCuratorController';
import AdminRejectCuratorController         from '../controller/AdminRejectCuratorController';
import AdminSystemController                from '../controller/AdminSystemController';

const logoutCtrl    = new AdminLogoutController();
const overviewCtrl  = new AdminOverviewController();
const viewUsersCtrl = new AdminViewUsersController();
const terminateCtrl = new AdminTerminateUserController();
const banCtrl       = new AdminBanUserController();
const viewRevsCtrl  = new AdminViewReviewsController();
const removeRevCtrl = new AdminRemoveReviewController();
const viewAppsCtrl  = new AdminViewCuratorApplicationsController();
const approveCtrl   = new AdminApproveCuratorController();
const rejectCtrl    = new AdminRejectCuratorController();
const systemCtrl    = new AdminSystemController();

// ── Design Tokens ─────────────────────────────────────────────────────────────
const C = {
  purple:       '#7C3AED',
  purpleLight:  '#EDE9FE',
  dark:         '#111827',
  mid:          '#374151',
  body:         '#4B5563',
  subtle:       '#6B7280',
  white:        '#FFFFFF',
  border:       '#E5E7EB',
  bg:           '#F9FAFB',
  green:        '#16A34A',
  greenPale:    '#ECFDF5',
  greenBorder:  '#BBF7D0',
  red:          '#DC2626',
  redPale:      '#FEF2F2',
  redBorder:    '#FECACA',
  amber:        '#D97706',
  amberPale:    '#FFFBEB',
  amberBorder:  '#FDE68A',
  blue:         '#3B82F6',
  bluePale:     '#EFF6FF',
  blueBorder:   '#BFDBFE',
};

const TABS = ['Overview', 'Users', 'Reviews', 'Curators', 'System'];

// ── Admin Header ──────────────────────────────────────────────────────────────
const AdminHeader = ({ onLogout }) => (
  <View style={ah.header}>
    <View style={ah.left}>
      <Text style={ah.shield}>🛡️</Text>
      <Text style={ah.title}>BiteWise Admin Panel</Text>
    </View>
    <TouchableOpacity style={ah.logoutBtn} onPress={onLogout} accessibilityRole="button">
      <Text style={ah.logoutIcon}>→</Text>
    </TouchableOpacity>
  </View>
);
const ah = StyleSheet.create({
  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: C.purple },
  left:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  shield:    { fontSize: 20 },
  title:     { fontSize: 17, fontWeight: '800', color: C.white },
  logoutBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  logoutIcon:{ fontSize: 18, color: C.white, fontWeight: '700' },
});

// ── Tab Bar ───────────────────────────────────────────────────────────────────
const TabBar = ({ active, onSelect }) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tb.wrap} contentContainerStyle={tb.row}>
    {TABS.map((t) => (
      <TouchableOpacity key={t} style={[tb.tab, active === t && tb.tabActive]} onPress={() => onSelect(t)}>
        <Text style={[tb.txt, active === t && tb.txtActive]}>
          {t === 'Overview' ? '↗ ' : t === 'Users' ? '👤 ' : t === 'Reviews' ? '💬 ' : t === 'Curators' ? '👑 ' : '⚙️ '}
          {t}
        </Text>
      </TouchableOpacity>
    ))}
  </ScrollView>
);
const tb = StyleSheet.create({
  wrap:      { backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  row:       { flexDirection: 'row', paddingHorizontal: 4 },
  tab:       { paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: C.purple },
  txt:       { fontSize: 13, fontWeight: '500', color: C.subtle },
  txtActive: { color: C.purple, fontWeight: '700' },
});

// ── Success Banner ────────────────────────────────────────────────────────────
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
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.greenPale, borderBottomWidth: 1, borderBottomColor: C.greenBorder },
  icon: { fontSize: 16 },
  text: { flex: 1, fontSize: 14, fontWeight: '500', color: C.green },
});

// ── Search Bar ────────────────────────────────────────────────────────────────
const SearchBar = ({ value, onChangeText, placeholder }) => (
  <View style={sb.wrap}>
    <Text style={sb.icon}>🔍</Text>
    <TextInput style={sb.input} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={C.subtle} autoCorrect={false} />
  </View>
);
const sb = StyleSheet.create({
  wrap:  { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: 10, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, marginBottom: 16 },
  icon:  { fontSize: 15, color: C.subtle, marginRight: 8 },
  input: { flex: 1, fontSize: 14, color: C.dark, paddingVertical: 11 },
});

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon, iconColor, badge }) => (
  <View style={sc.card}>
    <View style={sc.left}>
      <Text style={sc.label}>{label}</Text>
      <Text style={[sc.value, { color: iconColor || C.dark }]}>{value}</Text>
      {badge ? <View style={sc.badge}><Text style={sc.badgeTxt}>{badge}</Text></View> : null}
    </View>
    <Text style={[sc.icon, { color: iconColor || C.subtle, opacity: 0.35 }]}>{icon}</Text>
  </View>
);
const sc = StyleSheet.create({
  card:     { backgroundColor: C.white, borderRadius: 12, padding: 18, borderWidth: 1, borderColor: C.border, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  left:     { flex: 1 },
  label:    { fontSize: 13, color: C.subtle, marginBottom: 4 },
  value:    { fontSize: 30, fontWeight: '800' },
  icon:     { fontSize: 30 },
  badge:    { alignSelf: 'flex-start', backgroundColor: C.red, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4 },
  badgeTxt: { fontSize: 11, fontWeight: '700', color: C.white },
});

// ── NEW-A: Overview Tab ───────────────────────────────────────────────────────
const OverviewTab = () => {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const load = async () => {
        setLoading?.(true);

        const r = await overviewCtrl.fetchOverviewStats();
        console.log("OVERVIEW RESPONSE:", r);

        if (!isActive) return;

        if (r.success) setStats(r.data);

        setLoading?.(false);
      };

      load();

      return () => {
        isActive = false;
      };
    }, [])
  );

  if (loading) return <Text style={gs.loading}>Loading...</Text>;
  if (!stats)  return <Text style={gs.loading}>Unable to load overview.</Text>;

  return (
    <View>
      <Text style={gs.heading}>Dashboard Overview</Text>
      <StatCard label="Total Users"          value={stats.totalUsers}          icon="👥" iconColor={C.subtle}  />
      <StatCard label="Active Users"         value={stats.activeUsers}         icon="✅" iconColor={C.green}   />
      <StatCard label="Premium Users"        value={stats.premiumUsers}        icon="↗" iconColor={C.purple}  />
      <StatCard label="Banned Users"         value={stats.bannedUsers}         icon="🚫" iconColor={C.red}     />
      <StatCard label="Total Reviews"        value={stats.totalReviews}        icon="💬" iconColor={C.subtle}  badge={stats.flaggedReviews > 0 ? `${stats.flaggedReviews} flagged` : null} />
      <StatCard label="Pending Applications" value={stats.pendingApplications} icon="🕐" iconColor={C.amber}   />
      {/* System Status */}
      <View style={[sc.card, { flexDirection: 'column', alignItems: 'flex-start' }]}>
        <Text style={sc.label}>System Status</Text>
        <View style={gs.statusRow}>
          <View style={gs.statusDot} />
          <Text style={gs.statusTxt}>{stats.systemStatus}</Text>
        </View>
      </View>
    </View>
  );
};

// ── UC #100 / #101 / #102: Users Tab ─────────────────────────────────────────
const UsersTab = ({ adminUser, onBanner }) => {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const load = async () => {
        setLoading(true);

        const r = await viewUsersCtrl.fetchAllUsers();
        // 👆 IMPORTANT: adjust name if your controller uses different method

        if (!isActive) return;

        if (r.success) setUsers(r.data);

        setLoading(false);
      };

      load();

      return () => {
        isActive = false;
      };
    }, [])
  );

  const displayed = viewUsersCtrl.searchUsers(users, query);

  // UC #101 — Terminate
  const handleTerminate = useCallback((user) => {
    Alert.alert('Terminate Account', `Permanently terminate ${user.username}'s account? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Terminate', style: 'destructive', onPress: async () => {
          const r = await terminateCtrl.terminateUser(user.userId);
          if (r.success) {
            setUsers((prev) => prev.map((u) => u.userId === user.userId ? { ...u, status: 'terminated' } : u));
            onBanner(r.message);
          }
        }},
    ]);
  }, [onBanner]);

  // UC #102 — Ban / Unban
  const handleBanToggle = useCallback((user) => {
    const isCurrentlyBanned = !user.isActive;

    Alert.alert(
      isCurrentlyBanned ? 'Unban Account' : 'Ban Account',
      isCurrentlyBanned
        ? `Restore access for ${user.username}?`
        : `Temporarily ban ${user.username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isCurrentlyBanned ? 'Unban' : 'Ban',
          style: isCurrentlyBanned ? 'default' : 'destructive',
          onPress: async () => {
            const r = isCurrentlyBanned
              ? await banCtrl.unbanUser(user.userId)
              : await banCtrl.banUser(user.userId);

            if (r.success) {
              setUsers((prev) =>
                prev.map((u) =>
                  u.userId === user.userId
                    ? { ...u, isActive: !u.isActive }
                    : u
                )
              );

              onBanner(r.message);
            }
          },
        },
      ]
    );
  }, [onBanner]);

  const statusBadge = (status) => {
    const map = {
      active:     { bg: C.greenPale,  border: C.greenBorder,  txt: C.green,  label: 'active'     },
      banned:     { bg: C.amberPale,  border: C.amberBorder,  txt: C.amber,  label: 'banned'     },
      terminated: { bg: C.redPale,    border: C.redBorder,    txt: C.red,    label: 'terminated' },
    };
    return map[status] || map.active;
  };

  const planBadge = (plan) => {
    const map = { yearly: C.purple, monthly: C.purple, free: C.subtle };
    return map[plan] || C.subtle;
  };

  const getUserPlan = (user) => {
    if (user.role === 'premium' || user.role === 'curator') return 'premium';
    if (user.role === 'free') return 'free';
    return 'free';
  };

  if (loading) return <Text style={gs.loading}>Loading...</Text>;

  return (
    <View>
      <Text style={gs.heading}>User Management</Text>
      <SearchBar value={query} onChangeText={setQuery} placeholder="Search users by name or email..." />
      <Text style={gs.countLabel}>All User Accounts ({users.length})</Text>
      {displayed.map((user) => {
        const sb = statusBadge(user.isActive ? 'active' : 'banned');
        const terminated = user.status === 'terminated';
        const banned = !user.isActive;
        const plan = getUserPlan(user);
        const isPremium = plan === 'premium';
        return (
          <View key={user.userId} style={ut.card}>
            <View style={ut.nameRow}>
              <Text style={ut.name}>{user.username}</Text>
              <View style={[ut.badge, { backgroundColor: sb.bg, borderColor: sb.border }]}>
                <Text style={[ut.badgeTxt, { color: sb.txt }]}>{sb.label}</Text>
              </View>
              <View
                style={[
                  ut.badge,
                  {
                    backgroundColor: isPremium ? C.purpleLight : '#F3F4F6',
                    borderColor: isPremium ? '#C4B5FD' : C.border,
                  },
                ]}>
                <Text
                  style={[
                    ut.badgeTxt,
                    { color: isPremium ? C.purple : C.subtle },
                  ]}>
                  {isPremium ? 'Premium' : 'Free'}
                </Text>
              </View>
            </View>
            <Text style={ut.email}>{user.email}</Text>
            <Text style={ut.meta}>Joined: {user.joinedAt}   Last Active: {user.lastActive}</Text>

            {terminated ? (
              <View style={[ut.badge, { backgroundColor: C.redPale, borderColor: C.redBorder, marginTop: 8, alignSelf: 'flex-start' }]}>
                <Text style={[ut.badgeTxt, { color: C.red }]}>Account Terminated</Text>
              </View>
            ) : (
              <View style={ut.actionRow}>
                {/* UC #102 — Ban / Unban */}
                <TouchableOpacity
                  style={[ut.banBtn, banned && ut.unbanBtn]}
                  onPress={() => handleBanToggle(user)}
                >
                  <Text style={[ut.banIcon, banned && ut.unbanIcon]}>{banned ? '✓' : '🚫'}</Text>
                </TouchableOpacity>
                {/* UC #101 — Terminate */}
                <TouchableOpacity style={ut.deleteBtn} onPress={() => handleTerminate(user)}>
                  <Text style={ut.deleteIcon}>🗑</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
};
const ut = StyleSheet.create({
  card:       { backgroundColor: C.white, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.border, marginBottom: 10 },
  nameRow:    { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  name:       { fontSize: 15, fontWeight: '700', color: C.dark },
  badge:      { borderRadius: 20, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2 },
  planBadge:  {},
  badgeTxt:   { fontSize: 11, fontWeight: '600' },
  email:      { fontSize: 13, color: C.subtle, marginBottom: 2 },
  meta:       { fontSize: 12, color: C.subtle, marginBottom: 8 },
  actionRow:  { flexDirection: 'row', gap: 10 },
  banBtn:     { flex: 1, height: 40, borderRadius: 8, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', backgroundColor: C.white },
  unbanBtn:   { borderColor: C.greenBorder, backgroundColor: C.greenPale },
  banIcon:    { fontSize: 18 },
  unbanIcon:  { fontSize: 16, color: C.green, fontWeight: '700' },
  deleteBtn:  { flex: 1, height: 40, borderRadius: 8, backgroundColor: C.red, alignItems: 'center', justifyContent: 'center' },
  deleteIcon: { fontSize: 18, color: C.white },
});

// ── UC #103 / #104: Reviews Tab ───────────────────────────────────────────────
const ReviewsTab = ({ onBanner }) => {
  const [reviews, setReviews] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const load = async () => {
        setLoading(true);

        const r = await viewRevsCtrl.fetchAllReviews();
        console.log("REVIEWS RESPONSE:", r);

        if (!isActive) return;

        if (r.success) setReviews(r.data);

        setLoading(false);
      };

      load();

      return () => {
        isActive = false;
      };
    }, [])
  );

  const displayed = viewRevsCtrl.searchReviews(reviews, query);

  // UC #104 — Remove review
  const handleRemove = useCallback((review) => {
    Alert.alert('Remove Review', `Remove ${review.reviewer_name}'s review? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
          const r = await removeRevCtrl.removeReview(review.review_id);
          if (r.success) {
            setReviews((prev) => prev.filter((rv) => rv.review_id !== review.review_id));
            onBanner('Review has been removed');
          }
        }},
    ]);
  }, [onBanner]);

  const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);

  if (loading) return <Text style={gs.loading}>Loading...</Text>;

  return (
    <View>
      <Text style={gs.heading}>Review Moderation</Text>
      <SearchBar value={query} onChangeText={setQuery} placeholder="Search reviews..." />
      <Text style={gs.countLabel}>All User Reviews ({reviews.length})</Text>
      {displayed.map((review) => (
        <View key={review.review_id} style={[rt.card, review.flagged && rt.flaggedCard]}>
          <View style={rt.topRow}>
            <Text style={rt.name}>{review.reviewer_name}</Text>
            <Text style={rt.stars}>{stars(review.rating)}</Text>
            <View style={[rt.badge, review.flagged ? rt.flaggedBadge : rt.approvedBadge]}>
              <Text style={[rt.badgeTxt, review.flagged ? { color: C.red } : { color: C.purple }]}>
                {review.flagged ? 'flagged' : 'approved'}
              </Text>
            </View>
          </View>
          <Text style={rt.date}>{review.created_at}</Text>

          {/* UC #104 — Remove button */}
          <TouchableOpacity style={rt.removeBtn} onPress={() => handleRemove(review)}>
            <Text style={rt.removeBtnTxt}>🗑  Remove</Text>
          </TouchableOpacity>

          <Text style={rt.content}>{review.content}</Text>

          {review.flagged && (
            <View style={rt.flagWarning}>
              <Text style={rt.flagWarnTxt}>⚠  This review has been flagged for violating community guidelines</Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );
};
const rt = StyleSheet.create({
  card:         { backgroundColor: C.white, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.border, marginBottom: 10 },
  flaggedCard:  { borderColor: C.redBorder, backgroundColor: '#FFFAFA' },
  topRow:       { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 2 },
  name:         { fontSize: 14, fontWeight: '700', color: C.dark },
  stars:        { fontSize: 13, color: '#F59E0B' },
  badge:        { borderRadius: 20, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2 },
  approvedBadge:{ backgroundColor: C.purpleLight, borderColor: '#C4B5FD' },
  flaggedBadge: { backgroundColor: C.redPale, borderColor: C.redBorder },
  badgeTxt:     { fontSize: 11, fontWeight: '600' },
  date:         { fontSize: 12, color: C.subtle, marginBottom: 8 },
  removeBtn:    { alignSelf: 'flex-start', backgroundColor: C.red, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14, marginBottom: 10 },
  removeBtnTxt: { fontSize: 13, fontWeight: '600', color: C.white },
  content:      { fontSize: 13, color: C.mid, lineHeight: 19 },
  flagWarning:  { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: C.redPale, borderRadius: 6, padding: 10, marginTop: 8, borderWidth: 1, borderColor: C.redBorder },
  flagWarnTxt:  { fontSize: 12, color: C.red, flex: 1 },
});

// ── UC #105 / #106 / #107: Curators Tab ──────────────────────────────────────
const CuratorsTab = ({ adminUser, onBanner }) => {
  const [apps, setApps] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const load = async () => {
        setLoading(true);

        const r = await viewAppsCtrl.fetchApplications();

        if (!isActive) return;

        if (r.success) setApps(r.data);

        setLoading(false);
      };

      load();

      return () => {
        isActive = false;
      };
    }, [])
  );

  const displayed = viewAppsCtrl.searchApplications(apps, query);

  // UC #106 — Approve
  const handleApprove = useCallback((app) => {
    approveCtrl.approveApplication(app.applicationId, adminUser?.adminId).then((r) => {
      if (r.success) {
        setApps((prev) => prev.map((a) => a.applicationId === app.applicationId ? { ...a, status: 'approved' } : a));
        onBanner('Curator application approved!');
      } else {
        Alert.alert('Error', r.message);
      }
    });
  }, [adminUser, onBanner]);

  // UC #107 — Reject
  const handleReject = useCallback((app) => {
    Alert.alert('Reject Application', `Reject ${app.username}'s curator application?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reject', style: 'destructive', onPress: async () => {
          const r = await rejectCtrl.rejectApplication(app.applicationId, adminUser?.adminId);
          if (r.success) {
            setApps((prev) => prev.map((a) => a.applicationId === app.applicationId ? { ...a, status: 'rejected' } : a));
            onBanner('Curator application rejected.');
          } else {
            Alert.alert('Error', r.message);
          }
        }},
    ]);
  }, [adminUser, onBanner]);

  const statusStyle = (status) => {
    const map = {
      pending:  { bg: C.amberPale,  border: C.amberBorder,  txt: C.amber  },
      approved: { bg: C.greenPale,  border: C.greenBorder,  txt: C.green  },
      rejected: { bg: C.redPale,    border: C.redBorder,    txt: C.red    },
    };
    return map[status] || map.pending;
  };

  const formatDate = (iso) => {
    try {
      const d = new Date(iso);
      return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}, ${d.toLocaleTimeString('en-US')}`;
    } catch { return iso; }
  };

  if (loading) return <Text style={gs.loading}>Loading...</Text>;

  return (
    <View>
      <Text style={gs.heading}>Curator Applications</Text>
      <SearchBar value={query} onChangeText={setQuery} placeholder="Search applications..." />
      <Text style={gs.countLabel}>Curator Applications ({apps.length})</Text>
      {displayed.map((app) => {
        const ss = statusStyle(app.status);
        const isPending = app.status === 'PENDING';
        return (
          <View key={app.applicationId} style={[ct.card, !isPending && { backgroundColor: app.status === 'approved' ? '#F0FDF4' : C.redPale }]}>
            <View style={ct.nameRow}>
              <Text style={ct.name}>{app.username}</Text>
              <View style={[ct.badge, { backgroundColor: ss.bg, borderColor: ss.border }]}>
                <Text style={[ct.badgeTxt, { color: ss.txt }]}>{app.status}</Text>
              </View>
            </View>
            <Text style={ct.email}>{app.email}</Text>
            <Text style={ct.fieldLabel}>Expertise:</Text>
            <Text style={ct.fieldVal}>{app.expertise}</Text>
            <Text style={ct.fieldLabel}>Motivation:</Text>
            <Text style={ct.fieldVal} numberOfLines={3}>{app.motivation}</Text>
            <Text style={ct.date}>Submitted: {formatDate(app.createdAt)}</Text>

            {isPending && (
              <View style={ct.actionRow}>
                {/* UC #106 — Approve */}
                <TouchableOpacity style={ct.approveBtn} onPress={() => handleApprove(app)}>
                  <Text style={ct.approveIcon}>✓</Text>
                </TouchableOpacity>
                {/* UC #107 — Reject */}
                <TouchableOpacity style={ct.rejectBtn} onPress={() => handleReject(app)}>
                  <Text style={ct.rejectIcon}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
};
const ct = StyleSheet.create({
  card:       { backgroundColor: C.white, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.border, marginBottom: 10 },
  nameRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  name:       { fontSize: 15, fontWeight: '700', color: C.dark },
  badge:      { borderRadius: 20, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2 },
  badgeTxt:   { fontSize: 11, fontWeight: '600' },
  email:      { fontSize: 13, color: C.subtle, marginBottom: 8 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: C.dark, marginBottom: 2 },
  fieldVal:   { fontSize: 13, color: C.mid, marginBottom: 6 },
  date:       { fontSize: 11, color: C.subtle, marginBottom: 10 },
  actionRow:  { flexDirection: 'row', gap: 10 },
  approveBtn: { flex: 1, height: 42, borderRadius: 8, borderWidth: 1.5, borderColor: C.greenBorder, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  approveIcon:{ fontSize: 18, color: C.green, fontWeight: '700' },
  rejectBtn:  { flex: 1, height: 42, borderRadius: 8, backgroundColor: C.red, alignItems: 'center', justifyContent: 'center' },
  rejectIcon: { fontSize: 18, color: C.white, fontWeight: '700' },
});

// ── UC #108: System Tab ───────────────────────────────────────────────────────
const SystemTab = () => {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const updateStatus = systemCtrl.getUpdateStatus();
  
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const load = async () => {
        setLoading(true);

        const r = await systemCtrl.fetchSystemInfo();

        if (!isActive) return;

        if (r.success) setInfo(r.data);

        setLoading(false);
      };

      load();

      return () => {
        isActive = false;
      };
    }, [])
  );

  if (!info) return <Text style={gs.loading}>Loading...</Text>;

  return (
    <View>
      <Text style={gs.heading}>System Updates</Text>

      {/* Deploy section */}
      <Text style={st.sectionHeading}>Deploy Application Updates</Text>

      {/* Current Version */}
      <View style={[st.card, st.versionCard]}>
        <Text style={st.versionLabel}>Current Version</Text>
        <Text style={st.versionNum}>{info.currentVersion}</Text>
        <Text style={st.versionDate}>Last updated: {info.lastUpdated}</Text>
      </View>

      {/* Pending Updates */}
      <View style={st.card}>
        <Text style={st.cardHeading}>Pending Updates</Text>
        {info.pendingUpdates.map((u, i) => (
          <View key={i} style={st.updateRow}>
            <Text style={st.checkIcon}>✅</Text>
            <Text style={st.updateTxt}>{u}</Text>
          </View>
        ))}
      </View>

      {/* UC #108 — Deploy button hardcoded as "No Updates Available" */}
      <TouchableOpacity style={st.deployBtn} disabled={!updateStatus.available} activeOpacity={0.9}>
        <Text style={st.deployBtnTxt}>{updateStatus.message}</Text>
      </TouchableOpacity>

      {/* Important Notes */}
      <View style={st.notesCard}>
        <Text style={st.notesIcon}>⚠️</Text>
        <View style={st.notesBody}>
          <Text style={st.notesHeading}>Important Notes</Text>
          {info.importantNotes.map((n, i) => (
            <Text key={i} style={st.noteTxt}>• {n}</Text>
          ))}
        </View>
      </View>

      {/* System Health */}
      <Text style={[st.sectionHeading, { marginTop: 8 }]}>System Health</Text>

      {[
        { label: 'API Response Time', value: info.health.apiResponseTime,  sub: info.health.apiStatus  },
        { label: 'Server Uptime',     value: info.health.serverUptime,     sub: info.health.uptimeLabel },
        { label: 'Database Status',   value: info.health.dbStatus,         sub: info.health.dbLabel    },
      ].map((h) => (
        <View key={h.label} style={st.healthCard}>
          <Text style={st.healthLabel}>{h.label}</Text>
          <Text style={st.healthValue}>{h.value}</Text>
          <Text style={st.healthSub}>{h.sub}</Text>
        </View>
      ))}
    </View>
  );
};
const st = StyleSheet.create({
  sectionHeading:{ fontSize: 15, fontWeight: '700', color: C.dark, marginBottom: 12 },
  card:          { backgroundColor: C.white, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.border, marginBottom: 10 },
  versionCard:   { backgroundColor: C.bluePale, borderColor: C.blueBorder },
  versionLabel:  { fontSize: 12, color: C.blue, fontWeight: '600', marginBottom: 6 },
  versionNum:    { fontSize: 28, fontWeight: '900', color: C.blue, marginBottom: 2 },
  versionDate:   { fontSize: 12, color: C.subtle },
  cardHeading:   { fontSize: 14, fontWeight: '700', color: C.dark, marginBottom: 12 },
  updateRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  checkIcon:     { fontSize: 14 },
  updateTxt:     { fontSize: 13, color: C.mid, flex: 1 },
  deployBtn:     { backgroundColor: C.purple, borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginBottom: 14, opacity: 0.7 },
  deployBtnTxt:  { fontSize: 15, fontWeight: '700', color: C.white },
  notesCard:     { flexDirection: 'row', gap: 12, backgroundColor: C.amberPale, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.amberBorder, marginBottom: 10 },
  notesIcon:     { fontSize: 18, marginTop: 2 },
  notesBody:     { flex: 1 },
  notesHeading:  { fontSize: 13, fontWeight: '700', color: C.amber, marginBottom: 6 },
  noteTxt:       { fontSize: 12, color: C.mid, lineHeight: 19 },
  healthCard:    { backgroundColor: C.white, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.border, marginBottom: 10 },
  healthLabel:   { fontSize: 12, color: C.subtle, marginBottom: 4 },
  healthValue:   { fontSize: 24, fontWeight: '800', color: C.green, marginBottom: 2 },
  healthSub:     { fontSize: 12, color: C.subtle },
});

// ── Shared styles ─────────────────────────────────────────────────────────────
const gs = StyleSheet.create({
  loading:    { textAlign: 'center', color: C.subtle, paddingTop: 40 },
  heading:    { fontSize: 22, fontWeight: '800', color: C.dark, marginBottom: 16 },
  countLabel: { fontSize: 13, fontWeight: '600', color: C.dark, marginBottom: 12 },
  statusRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  statusDot:  { width: 10, height: 10, borderRadius: 5, backgroundColor: C.green },
  statusTxt:  { fontSize: 15, fontWeight: '600', color: C.dark },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
const AdminDashboardScreen = ({ navigation, route }) => {
  const user = route?.params?.user || null;
  const [activeTab, setActiveTab] = useState('Overview');
  const [banner,    setBanner]    = useState('');

  const showBanner = useCallback((msg) => {
    setBanner(msg);
    setTimeout(() => setBanner(''), 4000);
  }, []);

  // UC #99 — Log Out
  const handleLogout = useCallback(async () => {
    const r = await logoutCtrl.logout();
    if (r.success) {
      navigation.replace('AdminLoginScreen', { showLogoutBanner: true });
    }
  }, [navigation]);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.purple} />
      <AdminHeader onLogout={handleLogout} />
      <TabBar active={activeTab} onSelect={setActiveTab} />
      <Banner message={banner} />
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {activeTab === 'Overview' && <OverviewTab />}
        {activeTab === 'Users'    && <UsersTab    adminUser={user} onBanner={showBanner} />}
        {activeTab === 'Reviews'  && <ReviewsTab  onBanner={showBanner} />}
        {activeTab === 'Curators' && <CuratorsTab adminUser={user} onBanner={showBanner} />}
        {activeTab === 'System'   && <SystemTab />}
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
});

export default AdminDashboardScreen;
