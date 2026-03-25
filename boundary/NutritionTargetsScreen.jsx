import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ViewNutritionTargetsController from '../controller/ViewNutritionTargetsController';

const controller = new ViewNutritionTargetsController();

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
};


// SUB-COMPONENTS

// NavBar
const NavBar = ({ onMenuPress }) => (
  <View style={nav.bar}>
    <View style={nav.brand}>
      <Text style={nav.icon}>🍴</Text>
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
  bar:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  brand:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  icon:     { fontSize: 20 },
  brandName:{ fontSize: 20, fontWeight: '800', color: C.dark, letterSpacing: -0.3 },
  menuBtn:  { padding: 6, gap: 4, alignItems: 'flex-end' },
  menuLine: { width: 22, height: 2.5, backgroundColor: C.dark, borderRadius: 2 },
});

// Premium badge
const PremiumBadge = () => (
  <View style={pb.wrap}><Text style={pb.text}>☆ Premium</Text></View>
);
const pb = StyleSheet.create({
  wrap: { alignSelf: 'flex-start', backgroundColor: C.purple, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 8 },
  text: { fontSize: 11, fontWeight: '700', color: C.white },
});

// Macro progress row — consumed / goal / bar / remaining
const MacroRow = ({ label, consumed, goal, unit }) => {
  const pct = goal > 0 ? Math.min(consumed / goal, 1) : 0;
  const rem = Math.max(0, goal - consumed);
  return (
    <View style={mr.wrap}>
      <View style={mr.topRow}>
        <Text style={mr.label}>{label}</Text>
        <Text style={mr.value}>{consumed} / {goal} {unit}</Text>
      </View>
      <View style={mr.barTrack}>
        <View style={[mr.barFill, { width: `${Math.round(pct * 100)}%` }]} />
      </View>
      <Text style={mr.remaining}>{rem} {unit} remaining</Text>
    </View>
  );
};
const mr = StyleSheet.create({
  wrap:      { marginBottom: 16 },
  topRow:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label:     { fontSize: 14, fontWeight: '600', color: C.dark },
  value:     { fontSize: 13, fontWeight: '600', color: C.dark },
  barTrack:  { height: 6, backgroundColor: C.purpleLight, borderRadius: 3, marginBottom: 4, overflow: 'hidden' },
  barFill:   { height: 6, backgroundColor: C.purple, borderRadius: 3 },
  remaining: { fontSize: 12, color: C.subtle },
});

// Target row — label + description + purple value
const TargetRow = ({ label, description, value }) => (
  <View style={tr.row}>
    <View style={tr.left}>
      <Text style={tr.label}>{label}</Text>
      <Text style={tr.desc}>{description}</Text>
    </View>
    <Text style={tr.value}>{value}</Text>
  </View>
);
const tr = StyleSheet.create({
  row:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  left:  { flex: 1 },
  label: { fontSize: 14, fontWeight: '600', color: C.dark, marginBottom: 2 },
  desc:  { fontSize: 12, color: C.subtle },
  value: { fontSize: 18, fontWeight: '800', color: C.purple },
});

// Profile chip
const Chip = ({ label }) => (
  <View style={ch.wrap}><Text style={ch.text}>{label}</Text></View>
);
const ch = StyleSheet.create({
  wrap: { alignSelf: 'flex-start', backgroundColor: C.purpleLight, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  text: { fontSize: 13, color: C.purple, fontWeight: '600' },
});

// Macro distribution row
const DistRow = ({ label, pct }) => (
  <View style={dr.row}>
    <Text style={dr.label}>{label}</Text>
    <Text style={dr.pct}>{pct}%</Text>
  </View>
);
const dr = StyleSheet.create({
  row:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  label: { fontSize: 14, color: C.body },
  pct:   { fontSize: 14, fontWeight: '600', color: C.dark },
});

// Section card wrapper
const Card = ({ children, style }) => (
  <View style={[card.wrap, style]}>{children}</View>
);
const card = StyleSheet.create({
  wrap: { backgroundColor: C.white, borderRadius: 14, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: C.border },
});

// Section heading with icon
const SectionHeading = ({ icon, title }) => (
  <View style={sh.row}>
    <Text style={sh.icon}>{icon}</Text>
    <Text style={sh.title}>{title}</Text>
  </View>
);
const sh = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  icon:  { fontSize: 16, color: C.purple },
  title: { fontSize: 15, fontWeight: '700', color: C.dark },
});


// MAIN SCREEN

const NutritionTargetsScreen = ({ navigation, route }) => {
  const user = route?.params?.user || null;

  const [targets,   setTargets]   = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg,  setErrorMsg]  = useState('');

  // Seed today's intake — Sprint 2 wires real FoodIntakeEntry data
  const todayConsumed = { calories: 330, protein: 62, carbs: 0, fat: 7 };

  useEffect(() => {
    controller.fetchNutritionTargets(user).then((result) => {
      if (result.success) setTargets(result.data);
      else setErrorMsg(result.message);
      setIsLoading(false);
    });
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <NavBar onMenuPress={() => navigation.goBack()} />
        <ActivityIndicator size="large" color="#7C3AED" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  if (errorMsg) {
    return (
      <SafeAreaView style={styles.safe}>
        <NavBar onMenuPress={() => navigation.goBack()} />
        <View style={styles.errorWrap}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />
      <NavBar onMenuPress={() => navigation.navigate('AccountSettingsScreen', { user })} />

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <PremiumBadge />
          <Text style={styles.pageTitle}>Personalized Nutrition{'\n'}Targets</Text>
          <Text style={styles.pageSubtitle}>Your daily nutritional goals tailored to your needs</Text>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate('EditNutritionTargetsScreen', { user, targets })}
            activeOpacity={0.85}
          >
            <Text style={styles.editBtnText}>Edit Targets</Text>
          </TouchableOpacity>
        </View>

        {/* Today's Progress — UC #56 */}
        <Card>
          <SectionHeading icon="🎯" title="Today's Progress" />
          <MacroRow label="Calories" consumed={todayConsumed.calories} goal={targets.calories} unit="kcal" />
          <MacroRow label="Protein"  consumed={todayConsumed.protein}  goal={targets.protein}  unit="g" />
          <MacroRow label="Carbs"    consumed={todayConsumed.carbs}    goal={targets.carbs}    unit="g" />
          <MacroRow label="Fat"      consumed={todayConsumed.fat}      goal={targets.fat}      unit="g" />
        </Card>

        {/* Your Targets */}
        <Card>
          <SectionHeading icon="↗️" title="Your Targets" />
          <TargetRow label="Daily Calories"  description="Based on your activity level" value={`${targets.calories} kcal`} />
          <TargetRow label="Protein"         description="For muscle maintenance"        value={`${targets.protein} g`} />
          <TargetRow label="Carbohydrates"   description="Your energy source"            value={`${targets.carbs} g`} />
          <TargetRow label="Fats"            description="Essential for health"          value={`${targets.fat} g`} />
          <TargetRow label="Fiber"           description="For digestive health"          value={`${targets.fiber} g`} />
        </Card>

        {/* Your Profile */}
        <Card>
          <SectionHeading icon="📈" title="Your Profile" />
          <Text style={styles.profileLabel}>Activity Level</Text>
          <Chip label={targets.activityLevel} />
          <Text style={[styles.profileLabel, { marginTop: 12 }]}>Goal</Text>
          <Chip label={targets.goal} />
        </Card>

        {/* Macro Distribution */}
        <Card>
          <Text style={styles.distHeading}>Macro Distribution</Text>
          <DistRow label="Protein" pct={30} />
          <DistRow label="Carbs"   pct={40} />
          <DistRow label="Fat"     pct={30} />
        </Card>

        {/* Nutrition Tips */}
        <Card>
          <Text style={styles.tipsHeading}>Nutrition Tips</Text>
          {[
            'Aim to hit your protein target daily for optimal muscle maintenance and recovery.',
            'It\'s okay to be within ±10% of your targets. Perfect accuracy isn\'t necessary.',
            'Adjust your activity level and goals as your lifestyle changes.',
            'Use the auto-calculate feature to update targets based on your current weight.',
          ].map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <Text style={styles.tipCheck}>✓</Text>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </Card>

      </ScrollView>
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: C.bg },
  list:         { paddingHorizontal: 16, paddingBottom: 32 },
  header:       { paddingVertical: 20 },
  pageTitle:    { fontSize: 28, fontWeight: '800', color: C.dark, letterSpacing: -0.5, marginBottom: 6, lineHeight: 34 },
  pageSubtitle: { fontSize: 14, color: C.subtle, marginBottom: 16 },
  editBtn:      { backgroundColor: C.purple, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  editBtnText:  { fontSize: 15, fontWeight: '700', color: C.white },
  profileLabel: { fontSize: 13, color: C.subtle, marginBottom: 6 },
  distHeading:  { fontSize: 15, fontWeight: '700', color: C.dark, marginBottom: 12 },
  tipsHeading:  { fontSize: 15, fontWeight: '700', color: C.dark, marginBottom: 12 },
  tipRow:       { flexDirection: 'row', gap: 8, marginBottom: 10 },
  tipCheck:     { fontSize: 13, color: C.purple, fontWeight: '700', marginTop: 1 },
  tipText:      { flex: 1, fontSize: 13, color: C.body, lineHeight: 19 },
  errorWrap:    { alignItems: 'center', paddingTop: 60 },
  errorText:    { fontSize: 14, color: C.errorText },
});

export default NutritionTargetsScreen;