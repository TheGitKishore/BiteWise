import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Design Tokens
const C = {
  purple:       '#7C3AED',
  purpleLight:  '#EDE9FE',
  purpleGrad1:  '#7C3AED',
  purpleGrad2:  '#A855F7',
  dark:         '#111827',
  mid:          '#374151',
  body:         '#4B5563',
  subtle:       '#6B7280',
  white:        '#FFFFFF',
  border:       '#E5E7EB',
  bg:           '#F9FAFB',
  successBg:    '#F0FDF4',
  successBorder:'#BBF7D0',
  successText:  '#15803D',
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

// Login success banner
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
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.successBg, borderBottomWidth: 1, borderBottomColor: C.successBorder },
  icon: { fontSize: 16 },
  text: { flex: 1, fontSize: 14, fontWeight: '500', color: C.successText },
});


// CALORIE PROGRESS CARD

const CalorieProgressCard = ({ consumed, goal }) => {
  const remaining = Math.max(0, goal - consumed);
  const pct       = goal > 0 ? Math.min(consumed / goal, 1) : 0;
  return (
    <View style={cp.card}>
      <View style={cp.headerRow}>
        <Text style={cp.headerIcon}>🎯</Text>
        <Text style={cp.headerTitle}>Today's Calorie Progress</Text>
      </View>
      <View style={cp.row}>
        <Text style={cp.label}>Consumed</Text>
        <Text style={cp.value}>{consumed} / {goal} kcal</Text>
      </View>
      <View style={cp.barTrack}>
        <View style={[cp.barFill, { width: `${Math.round(pct * 100)}%` }]} />
      </View>
      <View style={cp.row}>
        <Text style={cp.label}>Remaining</Text>
        <Text style={cp.value}>{remaining} kcal</Text>
      </View>
    </View>
  );
};
const cp = StyleSheet.create({
  card:      { backgroundColor: C.white, borderRadius: 14, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: C.border },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  headerIcon:{ fontSize: 16 },
  headerTitle:{ fontSize: 15, fontWeight: '700', color: C.dark },
  row:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label:     { fontSize: 13, color: C.subtle },
  value:     { fontSize: 13, fontWeight: '600', color: C.dark },
  barTrack:  { height: 6, backgroundColor: C.purpleLight, borderRadius: 3, marginBottom: 10, overflow: 'hidden' },
  barFill:   { height: 6, backgroundColor: C.purple, borderRadius: 3 },
});


// PREMIUM BADGE — small pill shown on premium tiles
const PremiumBadge = () => (
  <View style={pb.wrap}>
    <Text style={pb.text}>☆ Premium</Text>
  </View>
);
const pb = StyleSheet.create({
  wrap: { alignSelf: 'center', backgroundColor: C.purple, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, marginTop: 6, marginBottom: 4 },
  text: { fontSize: 11, fontWeight: '700', color: C.white },
});


// FEATURE TILE — regular (no badge) and premium (gradient icon + badge)

const FeatureTile = ({ icon, title, subtitle, isPremium, onPress }) => (
  <TouchableOpacity style={ft.card} onPress={onPress} activeOpacity={0.8}>
    <View style={[ft.iconWrap, isPremium && ft.iconWrapPremium]}>
      <Text style={ft.icon}>{icon}</Text>
    </View>
    {isPremium && <PremiumBadge />}
    <Text style={ft.title}>{title}</Text>
    <Text style={ft.subtitle}>{subtitle}</Text>
  </TouchableOpacity>
);
const ft = StyleSheet.create({
  card:           { backgroundColor: C.white, borderRadius: 14, padding: 20, marginBottom: 12, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  iconWrap:       { width: 52, height: 52, borderRadius: 26, backgroundColor: C.purpleLight, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  iconWrapPremium:{ backgroundColor: C.purple },
  icon:           { fontSize: 22 },
  title:          { fontSize: 15, fontWeight: '700', color: C.dark, marginBottom: 4 },
  subtitle:       { fontSize: 13, color: C.subtle, textAlign: 'center' },
});


// GETTING STARTED SECTION — same as Free but no upgrade CTA

const GettingStartedSection = () => (
  <View style={gs.card}>
    <Text style={gs.heading}>Getting Started with BiteWise</Text>
    <Text style={gs.sectionLabel}>Quick Tips</Text>
    {[
      'Log your meals as you eat them for more accurate tracking',
      'Stay hydrated - aim for 8 glasses of water per day',
      'Check out our recipe library for meal inspiration',
    ].map((tip, i) => (
      <Text key={i} style={gs.bullet}>• {tip}</Text>
    ))}
  </View>
);
const gs = StyleSheet.create({
  card:         { backgroundColor: C.white, borderRadius: 14, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: C.border },
  heading:      { fontSize: 15, fontWeight: '700', color: C.dark, marginBottom: 14 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: C.purple, marginBottom: 8 },
  bullet:       { fontSize: 13, color: C.body, lineHeight: 21, marginBottom: 3 },
});


// MAIN SCREEN

const PremiumUserDashboardScreen = ({ navigation, route }) => {
  const user           = route?.params?.user           || null;
  const successMessage = route?.params?.successMessage || '';

  // Sprint 2 replaces with real FoodIntakeEntry data
  const consumed = 0;
  const goal     = user?.dailyCalorieLimit || 2000;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />

      <NavBar onMenuPress={() => navigation.navigate('AccountSettingsScreen', { user })} />
      <Banner message={successMessage} />

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>

        {/* Greeting */}
        <View style={styles.greetingWrap}>
          <Text style={styles.greetingTitle}>
            Welcome back, {user?.username || 'User'}!
          </Text>
          <Text style={styles.greetingSub}>
            Subscription: <Text style={styles.greetingPlan}>Premium</Text>
          </Text>
        </View>

        {/* Calorie Progress */}
        <CalorieProgressCard consumed={consumed} goal={goal} />

        {/* Regular tile — Food Tracking (#50, #51, #52, #54, #55, #56, #57) */}
        <FeatureTile
          icon="🍴"
          title="Food Tracking"
          subtitle="Log your meals and track calories"
          onPress={() => navigation.navigate('FoodTrackingLandingScreen', { user })}
        />

        {/* Premium tiles */}
        <FeatureTile
          icon="⚡"
          title="Nutrition Targets"
          subtitle="Personalized macro goals"
          isPremium
          onPress={() => navigation.navigate('NutritionTargetsScreen', { user })}
        />
        <FeatureTile
          icon="📈"
          title="Activity Tracking"
          subtitle="Log exercise & sync devices"
          isPremium
          onPress={() => navigation.navigate('ActivityTrackingScreen', { user })}
        />
        <FeatureTile
          icon="❤️"
          title="Saved Recipes"
          subtitle="Your recipe collection"
          isPremium
          onPress={() => navigation.navigate('SavedRecipesScreen', { user })}
        />
        <FeatureTile
          icon="🔄"
          title="Food Alternatives"
          subtitle="Healthier substitutes"
          isPremium
          onPress={() => navigation.navigate('FoodAlternativesScreen', { user })}
        />
        <FeatureTile
          icon="🍎"
          title="Mindful Snacking"
          subtitle="Smart snacking guidance"
          isPremium
          onPress={() => navigation.navigate('MindfulSnackingScreen', { user })}
        />
        <FeatureTile
          icon="📖"
          title="Health Diary"
          subtitle="Document your journey"
          isPremium
          onPress={() => navigation.navigate('HealthDiaryScreen', { user })}
        />
        <FeatureTile
          icon="⚖️"
          title="Weight Tracking"
          subtitle="Monitor weight progress"
          isPremium
          onPress={() => navigation.navigate('WeightTrackingScreen', { user })}
        />
        <FeatureTile
          icon="🏅"
          title="Curator Program"
          subtitle="Become a curator"
          isPremium
          onPress={() => navigation.navigate('CuratorProgramScreen', { user })}
        />
        <FeatureTile
          icon="🛒"
          title="Grocery List"
          subtitle="Auto-generate from recipes"
          isPremium
          onPress={() => navigation.navigate('GroceryListScreen', { user })}
        />

        {/* Regular tiles */}
        <FeatureTile
          icon="📅"
          title="Meal Plans"
          subtitle="Create and manage meal plans"
          onPress={() => navigation.navigate('MealPlansScreen', { user })}
        />
        <FeatureTile
          icon="📋"
          title="Recipes"
          subtitle="Browse healthy recipe ideas"
          onPress={() => navigation.navigate('RecipesScreen', { user })}
        />
        <FeatureTile
          icon="👨‍🍳"
          title="My Recipes"
          subtitle="Create your own recipes"
          onPress={() => navigation.navigate('MyRecipesScreen', { user })}
        />
        <FeatureTile
          icon="📊"
          title="Reports"
          subtitle="View your progress over time"
          onPress={() => navigation.navigate('ReportsScreen', { user })}
        />
        <FeatureTile
          icon="👤"
          title="Account"
          subtitle="Manage your profile and settings"
          onPress={() => navigation.navigate('AccountSettingsScreen', { user })}
        />

        {/* Getting Started — no upgrade CTA for Premium */}
        <GettingStartedSection />

      </ScrollView>
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: C.bg },
  list:         { paddingHorizontal: 16, paddingBottom: 32 },
  greetingWrap: { paddingVertical: 20 },
  greetingTitle:{ fontSize: 22, fontWeight: '800', color: C.dark, letterSpacing: -0.3, marginBottom: 4 },
  greetingSub:  { fontSize: 14, color: C.subtle },
  greetingPlan: { color: C.purple, fontWeight: '600' },
});

export default PremiumUserDashboardScreen;