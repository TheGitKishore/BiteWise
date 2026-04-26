// AdminDashboardScreen.jsx
// UC #103 Manage Users, #104 Remove User Review,
// UC #105 View Curator Applications, #106 Approve/Reject Curator Applications
// System Admin only — reached after AdminLoginScreen

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar, Alert } from 'react-native';
import { SafeAreaView }   from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import AdminManageUsersController          from '../controller/AdminManageUsersController';
import AdminRemoveReviewController         from '../controller/AdminRemoveReviewController';
import ViewCuratorApplicationsController   from '../controller/ViewCuratorApplicationsController';
import ApproveCuratorApplicationController from '../controller/ApproveCuratorApplicationController';
import LogOutController                    from '../controller/LogOutController';

const usersCtrl    = new AdminManageUsersController();
const reviewsCtrl  = new AdminRemoveReviewController();
const viewAppsCtrl    = new ViewCuratorApplicationsController();
const approveAppsCtrl = new ApproveCuratorApplicationController();
const logoutCtrl   = new LogOutController();

const TABS = ['Users', 'Reviews', 'Curator Apps'];
const C = { purple: '#7C3AED', purpleLight: '#EDE9FE', dark: '#111827', mid: '#374151', subtle: '#6B7280', white: '#FFFFFF', border: '#E5E7EB', bg: '#F9FAFB', errorText: '#DC2626', errorBg: '#FEF2F2', green: '#16A34A', greenBg: '#F0FDF4', greenBorder: '#BBF7D0', amber: '#D97706', amberBg: '#FFFBEB', amberBorder: '#FDE68A' };

const TabBar = ({ active, onSelect }) => (
  <View style={tb.bar}>
    {TABS.map((t) => (
      <TouchableOpacity key={t} style={[tb.tab, active === t && tb.active]} onPress={() => onSelect(t)}>
        <Text style={[tb.txt, active === t && tb.activeTxt]}>{t}</Text>
      </TouchableOpacity>
    ))}
  </View>
);
const tb = StyleSheet.create({ bar: { flexDirection: 'row', backgroundColor: C.white, borderRadius: 10, borderWidth: 1, borderColor: C.border, marginBottom: 16, overflow: 'hidden' }, tab: { flex: 1, paddingVertical: 10, alignItems: 'center' }, active: { backgroundColor: C.purpleLight }, txt: { fontSize: 11, color: C.subtle }, activeTxt: { color: C.purple, fontWeight: '700' } });

// UC #103 — Users tab
const UsersTab = ({ adminId }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    usersCtrl.fetchAllUsers().then((r) => { if (r.success) setUsers(r.data); setLoading(false); });
  }, []));

  const handleToggle = useCallback((user) => {
    const action = user.isActive ? 'Deactivate' : 'Reactivate';
    Alert.alert(action + ' User', `${action} @${user.username}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: action, style: user.isActive ? 'destructive' : 'default', onPress: async () => {
          const r = user.isActive ? await usersCtrl.deactivateUser(user.userId) : await usersCtrl.reactivateUser(user.userId);
          if (r.success) setUsers((p) => p.map((u) => u.userId === user.userId ? { ...u, isActive: !u.isActive } : u));
        }},
    ]);
  }, []);

  if (loading) return <Text style={c.loading}>Loading...</Text>;
  return (
    <View>
      <Text style={c.count}>{users.length} users total</Text>
      {users.map((u) => (
        <View key={u.userId} style={c.row}>
          <View style={c.avatar}><Text style={c.avatarTxt}>{(u.firstName || u.username)[0].toUpperCase()}</Text></View>
          <View style={c.info}>
            <Text style={c.name}>{u.firstName} {u.lastName} <Text style={c.role}>({u.role})</Text></Text>
            <Text style={c.uname}>@{u.username}  •  {u.email}</Text>
            <View style={[c.statusBadge, u.isActive ? c.statusActive : c.statusInactive]}>
              <Text style={[c.statusTxt, u.isActive ? c.statusActiveTxt : c.statusInactiveTxt]}>{u.isActive ? 'Active' : 'Deactivated'}</Text>
            </View>
          </View>
          {u.role !== 'ADMIN' && (
            <TouchableOpacity style={[c.actionBtn, u.isActive ? c.deactivateBtn : c.reactivateBtn]} onPress={() => handleToggle(u)}>
              <Text style={[c.actionBtnTxt, u.isActive ? c.deactivateTxt : c.reactivateTxt]}>{u.isActive ? 'Deactivate' : 'Reactivate'}</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );
};

// UC #104 — Reviews tab
const ReviewsTab = ({ adminId }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    reviewsCtrl.fetchAllReviews().then((r) => { if (r.success) setReviews(r.data); setLoading(false); });
  }, []));

  const handleRemove = useCallback((reviewId, reviewerName) => {
    Alert.alert('Remove Review', `Remove @${reviewerName}'s review? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
          const r = await reviewsCtrl.removeReview(reviewId);
          if (r.success) setReviews((p) => p.filter((rev) => rev.reviewId !== reviewId));
        }},
    ]);
  }, []);

  if (loading) return <Text style={c.loading}>Loading...</Text>;
  return (
    <View>
      <Text style={c.count}>{reviews.length} reviews total</Text>
      {reviews.map((r) => (
        <View key={r.reviewId} style={c.reviewCard}>
          <View style={c.reviewHead}>
            <View style={c.reviewInfo}>
              <Text style={c.reviewAuthor}>{r.reviewerName} — {'★'.repeat(r.rating)}</Text>
              <Text style={c.reviewTitle}>{r.title}</Text>
              <View style={c.statusBadge}>
                <Text style={c.statusTxt}>Published</Text>
              </View>
            </View>
            <TouchableOpacity style={c.removeBtn} onPress={() => handleRemove(r.reviewId, r.reviewerName)}>
              <Text style={c.removeBtnTxt}>Remove</Text>
            </TouchableOpacity>
          </View>
          <Text style={c.reviewBody} numberOfLines={2}>{r.content}</Text>
        </View>
      ))}
    </View>
  );
};

// UC #105 + #106 — Curator Applications tab
const CuratorAppsTab = ({ adminId }) => {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    viewAppsCtrl.fetchApplications().then((r) => { if (r.success) setApps(r.data); setLoading(false); });
  }, []));

  const STATUS_COLOR = { PENDING: { bg: C.amberBg, border: C.amberBorder, txt: C.amber }, APPROVED: { bg: C.greenBg, border: C.greenBorder, txt: C.green }, REJECTED: { bg: C.errorBg, border: C.errorBorder, txt: C.errorText } };

  const handleApprove = useCallback((app) => {
    Alert.alert('Approve Application', `Approve @${app.username} as a Curator?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Approve', onPress: async () => {
          const r = await approveAppsCtrl.approveApplication(app.applicationId, adminId);
          if (r.success) setApps((p) => p.map((a) => a.applicationId === app.applicationId ? { ...a, status: 'APPROVED' } : a));
        }},
    ]);
  }, [adminId]);

  const handleReject = useCallback((app) => {
    Alert.prompt('Reject Application', `Reason for rejecting @${app.username}:`, async (reason) => {
      if (!reason) return;
      const r = await approveAppsCtrl.rejectApplication(app.applicationId, adminId, reason);
      if (r.success) setApps((p) => p.map((a) => a.applicationId === app.applicationId ? { ...a, status: 'REJECTED' } : a));
    }, 'plain-text', '', 'default');
  }, [adminId]);

  if (loading) return <Text style={c.loading}>Loading...</Text>;
  return (
    <View>
      <Text style={c.count}>{apps.length} applications total</Text>
      {apps.map((app) => {
        const sc = STATUS_COLOR[app.status] || STATUS_COLOR.PENDING;
        return (
          <View key={app.applicationId} style={c.appCard}>
            <View style={c.appHead}>
              <View style={c.appInfo}>
                <Text style={c.appName}>@{app.username}</Text>
                <Text style={c.appDate}>{new Date(app.createdAt).toLocaleDateString('en-SG')}</Text>
                <View style={[c.statusBadge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
                  <Text style={[c.statusTxt, { color: sc.txt }]}>{app.status}</Text>
                </View>
              </View>
              {app.status === 'PENDING' && (
                <View style={c.appActions}>
                  <TouchableOpacity style={c.approveBtn} onPress={() => handleApprove(app)}><Text style={c.approveBtnTxt}>Approve</Text></TouchableOpacity>
                  <TouchableOpacity style={c.rejectBtn}  onPress={() => handleReject(app)}><Text style={c.rejectBtnTxt}>Reject</Text></TouchableOpacity>
                </View>
              )}
            </View>
            <Text style={c.appField}>Expertise: {app.expertise}</Text>
            <Text style={c.appField} numberOfLines={2}>Motivation: {app.motivation}</Text>
          </View>
        );
      })}
    </View>
  );
};

const c = StyleSheet.create({
  loading:         { textAlign: 'center', color: C.subtle, paddingTop: 40 },
  count:           { fontSize: 13, color: C.subtle, marginBottom: 12 },
  row:             { backgroundColor: C.white, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border, marginBottom: 10, flexDirection: 'row', gap: 10, alignItems: 'center' },
  avatar:          { width: 40, height: 40, borderRadius: 20, backgroundColor: C.purple, alignItems: 'center', justifyContent: 'center' },
  avatarTxt:       { fontSize: 16, fontWeight: '700', color: C.white },
  info:            { flex: 1 },
  name:            { fontSize: 14, fontWeight: '700', color: C.dark },
  role:            { fontWeight: '400', color: C.subtle, fontSize: 12 },
  uname:           { fontSize: 12, color: C.subtle, marginBottom: 4 },
  statusBadge:     { alignSelf: 'flex-start', borderRadius: 20, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2 },
  statusActive:    { backgroundColor: C.greenBg, borderColor: C.greenBorder },
  statusInactive:  { backgroundColor: C.errorBg, borderColor: '#FECACA' },
  statusTxt:       { fontSize: 11, fontWeight: '600' },
  statusActiveTxt: { color: C.green },
  statusInactiveTxt:{ color: C.errorText },
  actionBtn:       { borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10, borderWidth: 1 },
  deactivateBtn:   { backgroundColor: C.errorBg, borderColor: '#FECACA' },
  reactivateBtn:   { backgroundColor: C.greenBg, borderColor: C.greenBorder },
  actionBtnTxt:    { fontSize: 11, fontWeight: '600' },
  deactivateTxt:   { color: C.errorText },
  reactivateTxt:   { color: C.green },
  reviewCard:      { backgroundColor: C.white, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border, marginBottom: 10 },
  reviewHead:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  reviewInfo:      { flex: 1 },
  reviewAuthor:    { fontSize: 13, fontWeight: '700', color: C.dark, marginBottom: 2 },
  reviewTitle:     { fontSize: 13, color: C.mid, marginBottom: 4 },
  reviewBody:      { fontSize: 12, color: C.subtle },
  removeBtn:       { backgroundColor: C.errorBg, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10, borderWidth: 1, borderColor: '#FECACA', alignSelf: 'flex-start' },
  removeBtnTxt:    { fontSize: 11, fontWeight: '600', color: C.errorText },
  errorBorder:     '#FECACA',
  appCard:         { backgroundColor: C.white, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border, marginBottom: 10 },
  appHead:         { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  appInfo:         { flex: 1 },
  appName:         { fontSize: 14, fontWeight: '700', color: C.dark, marginBottom: 2 },
  appDate:         { fontSize: 12, color: C.subtle, marginBottom: 4 },
  appActions:      { gap: 6, alignItems: 'flex-end' },
  approveBtn:      { backgroundColor: C.greenBg, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10, borderWidth: 1, borderColor: C.greenBorder },
  approveBtnTxt:   { fontSize: 11, fontWeight: '600', color: C.green },
  rejectBtn:       { backgroundColor: C.errorBg, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10, borderWidth: 1, borderColor: '#FECACA' },
  rejectBtnTxt:    { fontSize: 11, fontWeight: '600', color: C.errorText },
  appField:        { fontSize: 12, color: C.mid, marginBottom: 4 },
});

const AdminDashboardScreen = ({ navigation, route }) => {
  const user = route?.params?.user || null;
  const [activeTab, setActiveTab] = useState('Users');

  const handleLogout = useCallback(async () => {
    const r = await logoutCtrl.logout();
    if (r.success) navigation.replace('AdminLoginScreen');
  }, [navigation]);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />
      <View style={s.nav}>
        <Text style={s.navTitle}>🛡️  Admin Dashboard</Text>
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}><Text style={s.logoutTxt}>Log Out</Text></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={s.scroll}>
        <TabBar active={activeTab} onSelect={setActiveTab} />
        {activeTab === 'Users'        && <UsersTab       adminId={user?.userId} />}
        {activeTab === 'Reviews'      && <ReviewsTab     adminId={user?.userId} />}
        {activeTab === 'Curator Apps' && <CuratorAppsTab adminId={user?.userId} />}
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: C.bg },
  nav:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  navTitle:  { fontSize: 18, fontWeight: '800', color: C.dark },
  logoutBtn: { backgroundColor: C.bg, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1, borderColor: C.border },
  logoutTxt: { fontSize: 13, fontWeight: '600', color: C.mid },
  scroll:    { paddingHorizontal: 16, paddingVertical: 16, paddingBottom: 40 },
});

export default AdminDashboardScreen;
