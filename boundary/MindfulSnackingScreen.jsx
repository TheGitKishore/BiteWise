// MindfulSnackingScreen.jsx — UC #75 Premium User – View Mindful Snacking Recommendations
// Premium User only

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ViewMindfulSnackingController from '../controller/ViewMindfulSnackingController';

const ctrl = new ViewMindfulSnackingController();

const C = {
  purple: '#7C3AED', purpleLight: '#EDE9FE', dark: '#111827', mid: '#374151',
  subtle: '#6B7280', white: '#FFFFFF', border: '#E5E7EB', bg: '#F9FAFB',
  green: '#16A34A', amber: '#D97706', amberBg: '#FFFBEB', amberBorder: '#FDE68A',
};

const CATEGORY_COLORS = {
  Planning:        { bg: '#EFF6FF', border: '#BFDBFE', text: '#1D4ED8' },
  Nutrition:       { bg: '#F0FDF4', border: '#BBF7D0', text: '#15803D' },
  Mindfulness:     { bg: '#FDF4FF', border: '#E9D5FF', text: '#7C3AED' },
  'Portion Control':{ bg: '#FFF7ED', border: '#FED7AA', text: '#C2410C' },
  'Goal-Based':    { bg: '#ECFDF5', border: '#A7F3D0', text: '#047857' },
  Timing:          { bg: '#FFFBEB', border: '#FDE68A', text: '#B45309' },
};

const TipCard = ({ tip }) => {
  const [expanded, setExpanded] = useState(false);
  const col = CATEGORY_COLORS[tip.category] || { bg: C.purpleLight, border: '#C4B5FD', text: C.purple };

  return (
    <TouchableOpacity
      style={[tc.card, expanded && tc.cardExpanded]}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.85}
    >
      <View style={tc.header}>
        <Text style={tc.icon}>{tip.icon}</Text>
        <View style={tc.titleArea}>
          <Text style={tc.title}>{tip.title}</Text>
          <View style={[tc.catBadge, { backgroundColor: col.bg, borderColor: col.border }]}>
            <Text style={[tc.catText, { color: col.text }]}>{tip.category}</Text>
          </View>
        </View>
        <Text style={tc.chevron}>{expanded ? '▲' : '▼'}</Text>
      </View>
      {expanded && <Text style={tc.content}>{tip.content}</Text>}
    </TouchableOpacity>
  );
};
const tc = StyleSheet.create({
  card:         { backgroundColor: C.white, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 10 },
  cardExpanded: { borderColor: C.purple },
  header:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon:         { fontSize: 28, width: 36 },
  titleArea:    { flex: 1, gap: 4 },
  title:        { fontSize: 15, fontWeight: '700', color: C.dark },
  catBadge:     { alignSelf: 'flex-start', borderRadius: 20, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2 },
  catText:      { fontSize: 10, fontWeight: '600' },
  chevron:      { fontSize: 12, color: C.subtle },
  content:      { fontSize: 14, color: C.mid, lineHeight: 22, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border },
});

const MindfulSnackingScreen = ({ navigation, route }) => {
  const user = route?.params?.user || null;
  const [tips,    setTips]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    ctrl.fetchSnackingTips().then(r => {
      if (r.success) setTips(r.data);
      else           setError(r.message);
      setLoading(false);
    });
  }, []);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />
      <View style={s.nav}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.back}>← Back</Text></TouchableOpacity>
        <Text style={s.navTitle}>Mindful Snacking</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <View style={s.badge}><Text style={s.badgeTxt}>☆ Premium</Text></View>
          <Text style={s.pageTitle}>Mindful Snacking Guide</Text>
          <Text style={s.pageSub}>Smart strategies to manage cravings and stay on track with your goals</Text>
        </View>

        {/* Quick stats banner */}
        <View style={s.statsBanner}>
          <View style={s.stat}><Text style={s.statNum}>6</Text><Text style={s.statLbl}>Tips</Text></View>
          <View style={s.divider} />
          <View style={s.stat}><Text style={s.statNum}>150–250</Text><Text style={s.statLbl}>Ideal snack kcal</Text></View>
          <View style={s.divider} />
          <View style={s.stat}><Text style={s.statNum}>2–3h</Text><Text style={s.statLbl}>Between snacks</Text></View>
        </View>

        {loading ? (
          <Text style={s.empty}>Loading tips...</Text>
        ) : error ? (
          <Text style={s.empty}>{error}</Text>
        ) : (
          <>
            <Text style={s.sectionLabel}>Tap any tip to expand</Text>
            {tips.map(tip => <TipCard key={tip.tipId} tip={tip} />)}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: C.bg },
  nav:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  back:        { fontSize: 14, color: C.purple, fontWeight: '600' },
  navTitle:    { fontSize: 17, fontWeight: '700', color: C.dark },
  scroll:      { paddingHorizontal: 16, paddingBottom: 40 },
  header:      { paddingVertical: 20 },
  badge:       { alignSelf: 'flex-start', backgroundColor: C.purple, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 8 },
  badgeTxt:    { fontSize: 11, fontWeight: '700', color: C.white },
  pageTitle:   { fontSize: 26, fontWeight: '800', color: C.dark, letterSpacing: -0.5, marginBottom: 6 },
  pageSub:     { fontSize: 14, color: C.subtle, lineHeight: 20 },
  statsBanner: { flexDirection: 'row', backgroundColor: C.white, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 20, justifyContent: 'space-around', alignItems: 'center' },
  stat:        { alignItems: 'center', flex: 1 },
  statNum:     { fontSize: 18, fontWeight: '800', color: C.purple, marginBottom: 2 },
  statLbl:     { fontSize: 11, color: C.subtle, textAlign: 'center' },
  divider:     { width: 1, height: 32, backgroundColor: C.border },
  sectionLabel:{ fontSize: 13, color: C.subtle, marginBottom: 12 },
  empty:       { textAlign: 'center', color: C.subtle, paddingTop: 40 },
});

export default MindfulSnackingScreen;
