// FoodAlternativesScreen.jsx — UC #74 Premium User – View Healthier Food Alternatives
// Premium User only

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ViewFoodAlternativesController from '../controller/ViewFoodAlternativesController';

const ctrl = new ViewFoodAlternativesController();

const C = {
  purple: '#7C3AED', purpleLight: '#EDE9FE', dark: '#111827', mid: '#374151',
  subtle: '#6B7280', white: '#FFFFFF', border: '#E5E7EB', bg: '#F9FAFB',
  green: '#16A34A', greenBg: '#F0FDF4', greenBorder: '#BBF7D0',
};

const AlternativeCard = ({ item }) => (
  <View style={ac.card}>
    <View style={ac.header}>
      <Text style={ac.icon}>{item.icon}</Text>
      <View style={ac.catBadge}><Text style={ac.catText}>{item.category}</Text></View>
    </View>
    <View style={ac.swap}>
      <View style={ac.swapItem}>
        <Text style={ac.swapLabel}>Instead of</Text>
        <Text style={ac.original}>{item.original}</Text>
      </View>
      <Text style={ac.arrow}>→</Text>
      <View style={ac.swapItem}>
        <Text style={[ac.swapLabel, { color: C.green }]}>Try</Text>
        <Text style={ac.alternative}>{item.alternative}</Text>
      </View>
    </View>
    <View style={ac.benefitBox}>
      <Text style={ac.benefitText}>{item.benefit}</Text>
    </View>
    <View style={ac.savingRow}>
      <Text style={ac.savingLabel}>Saving: </Text>
      <Text style={ac.savingValue}>{item.calorieSaving}</Text>
    </View>
  </View>
);
const ac = StyleSheet.create({
  card:        { backgroundColor: C.white, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 12 },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  icon:        { fontSize: 28 },
  catBadge:    { backgroundColor: C.purpleLight, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  catText:     { fontSize: 11, fontWeight: '600', color: C.purple },
  swap:        { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  swapItem:    { flex: 1 },
  swapLabel:   { fontSize: 11, color: C.subtle, marginBottom: 2 },
  original:    { fontSize: 15, fontWeight: '700', color: C.mid },
  alternative: { fontSize: 15, fontWeight: '700', color: C.green },
  arrow:       { fontSize: 20, color: C.subtle },
  benefitBox:  { backgroundColor: C.bg, borderRadius: 8, padding: 10, marginBottom: 8 },
  benefitText: { fontSize: 13, color: C.mid, lineHeight: 18 },
  savingRow:   { flexDirection: 'row', alignItems: 'center' },
  savingLabel: { fontSize: 12, color: C.subtle },
  savingValue: { fontSize: 12, fontWeight: '700', color: C.green },
});

const FoodAlternativesScreen = ({ navigation, route }) => {
  const user = route?.params?.user || null;
  const [alternatives, setAlternatives] = useState([]);
  const [categories,   setCategories]   = useState(['All']);
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    ctrl.fetchAlternatives().then(r => {
      if (r.success) {
        setAlternatives(r.data);
        setCategories(ctrl.getCategories(r.data));
      } else {
        setError(r.message);
      }
      setLoading(false);
    });
  }, []);

  const displayed = ctrl.filterByCategory(alternatives, activeCategory);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />
      <View style={s.nav}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.back}>← Back</Text></TouchableOpacity>
        <Text style={s.navTitle}>Food Alternatives</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <View style={s.badge}><Text style={s.badgeTxt}>☆ Premium</Text></View>
          <Text style={s.pageTitle}>Healthier Food Alternatives</Text>
          <Text style={s.pageSub}>Simple swaps that cut calories without sacrificing taste or nutrition</Text>
        </View>

        {/* Category filter */}
        {!loading && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterBar} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[s.filterChip, activeCategory === cat && s.filterChipActive]}
                onPress={() => setActiveCategory(cat)}
              >
                <Text style={[s.filterChipTxt, activeCategory === cat && s.filterChipTxtActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <View style={s.listWrap}>
          {loading ? (
            <Text style={s.empty}>Loading...</Text>
          ) : error ? (
            <Text style={s.empty}>{error}</Text>
          ) : (
            displayed.map(item => <AlternativeCard key={item.altId} item={item} />)
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:              { flex: 1, backgroundColor: C.bg },
  nav:               { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  back:              { fontSize: 14, color: C.purple, fontWeight: '600' },
  navTitle:          { fontSize: 17, fontWeight: '700', color: C.dark },
  scroll:            { paddingBottom: 40 },
  header:            { paddingHorizontal: 16, paddingVertical: 20 },
  badge:             { alignSelf: 'flex-start', backgroundColor: C.purple, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 8 },
  badgeTxt:          { fontSize: 11, fontWeight: '700', color: C.white },
  pageTitle:         { fontSize: 26, fontWeight: '800', color: C.dark, letterSpacing: -0.5, marginBottom: 6 },
  pageSub:           { fontSize: 14, color: C.subtle, lineHeight: 20 },
  filterBar:         { marginBottom: 16 },
  filterChip:        { borderWidth: 1, borderColor: C.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: C.white },
  filterChipActive:  { backgroundColor: C.purple, borderColor: C.purple },
  filterChipTxt:     { fontSize: 13, color: C.mid, fontWeight: '500' },
  filterChipTxtActive:{ color: C.white, fontWeight: '700' },
  listWrap:          { paddingHorizontal: 16 },
  empty:             { textAlign: 'center', color: C.subtle, paddingTop: 40 },
});

export default FoodAlternativesScreen;
