// Normal Flow:
//   1. Screen mounts → calls controller.fetchAllPlans()
//   2. Controller returns sorted MembershipPlan entities
//   3. Screen renders a card per plan; user browses
//
// Alt Flow: no plans → EmptyState with controller message
// Alt Flow: network error → same EmptyState pattern


import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, StatusBar, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ViewPricingPlansController from '../controller/ViewPricingPlansController';

const { width: SW } = Dimensions.get('window');

// Controller (single instance per screen session) 
const controller = new ViewPricingPlansController();

// Design Tokens
const C = {
  purple:      '#7C3AED',
  purpleMid:   '#6D28D9',
  purpleLight: '#EDE9FE',
  purplePale:  '#FAF5FF',
  dark:        '#111827',
  mid:         '#374151',
  body:        '#4B5563',
  subtle:      '#6B7280',
  white:       '#FFFFFF',
  border:      '#E5E7EB',
  bg:          '#F9FAFB',
  green:       '#059669',
  greenPale:   '#ECFDF5',
};


// SUB-COMPONENTS

// Back header bar 
const Header = ({ onBack }) => (
  <View style={hdr.bar}>
    <TouchableOpacity
      onPress={onBack}
      style={hdr.backBtn}
      accessibilityRole="button"
      accessibilityLabel="Go back"
    >
      <Text style={hdr.backArrow}>←</Text>
    </TouchableOpacity>
    <Text style={hdr.title}>Pricing Plans</Text>
    <View style={hdr.spacer} />
  </View>
);

const hdr = StyleSheet.create({
  bar: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: 16,
    paddingVertical:   14,
    backgroundColor:   C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: {
    padding: 4,
    width:   36,
  },
  backArrow: {
    fontSize:   22,
    color:      C.dark,
    fontWeight: '600',
  },
  title: {
    flex:       1,
    textAlign:  'center',
    fontSize:   17,
    fontWeight: '700',
    color:      C.dark,
  },
  spacer: { width: 36 },
});

// Feature tick row 
const FeatureRow = ({ text }) => (
  <View style={fr.row}>
    <View style={fr.tick}>
      <Text style={fr.tickMark}>✓</Text>
    </View>
    <Text style={fr.text}>{text}</Text>
  </View>
);

const fr = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    gap:           10,
    marginBottom:  9,
  },
  tick: {
    width:           20,
    height:          20,
    borderRadius:    10,
    backgroundColor: C.greenPale,
    alignItems:      'center',
    justifyContent:  'center',
    marginTop:       1,
  },
  tickMark: {
    fontSize:   11,
    fontWeight: '700',
    color:      C.green,
  },
  text: {
    flex:       1,
    fontSize:   14,
    color:      C.body,
    lineHeight: 21,
  },
});

// Plan Card
const PlanCard = ({ plan, onChoose }) => {
  const popular = plan.isMostPopular();

  return (
    <View style={[pc.card, popular && pc.cardPopular]}>

      {/* "Most Popular" badge */}
      {popular && (
        <View style={pc.badge}>
          <Text style={pc.badgeText}>Most Popular</Text>
        </View>
      )}

      {/* Plan name & price */}
      <Text style={[pc.planName, popular && pc.planNamePopular]}>
        {plan.name}
      </Text>
      <Text style={pc.price}>{plan.getFormattedPrice()}</Text>
      <Text style={pc.description}>{plan.description}</Text>

      {/* Divider */}
      <View style={pc.divider} />

      {/* Features */}
      {plan.getFeatureList().map((feat, i) => (
        <FeatureRow key={i} text={feat} />
      ))}

      {/* CTA */}
      <TouchableOpacity
        style={[pc.cta, popular && pc.ctaPopular]}
        onPress={() => onChoose(plan)}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={`Choose ${plan.name} plan`}
      >
        <Text style={[pc.ctaText, popular && pc.ctaTextPopular]}>
          {plan.isFree() ? 'Get Started Free' : `Choose ${plan.name}`}
        </Text>
      </TouchableOpacity>

    </View>
  );
};

const pc = StyleSheet.create({
  card: {
    backgroundColor: C.white,
    borderRadius:    16,
    padding:         22,
    marginBottom:    16,
    borderWidth:     1.5,
    borderColor:     C.border,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.06,
    shadowRadius:    8,
    elevation:       3,
  },
  cardPopular: {
    borderColor:     C.purple,
    backgroundColor: C.purplePale,
  },

  // Badge
  badge: {
    alignSelf:         'flex-start',
    backgroundColor:   C.purple,
    borderRadius:      20,
    paddingHorizontal: 12,
    paddingVertical:   4,
    marginBottom:      12,
  },
  badgeText: {
    fontSize:   12,
    fontWeight: '700',
    color:      C.white,
    letterSpacing: 0.3,
  },

  // Name & price
  planName: {
    fontSize:     20,
    fontWeight:   '800',
    color:        C.dark,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  planNamePopular: { color: C.dark },
  price: {
    fontSize:     32,
    fontWeight:   '800',
    color:        C.purple,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  description: {
    fontSize:     14,
    color:        C.subtle,
    marginBottom: 16,
    lineHeight:   20,
  },

  divider: {
    height:          1,
    backgroundColor: C.border,
    marginBottom:    16,
  },

  // CTA button
  cta: {
    marginTop:       8,
    backgroundColor: C.bg,
    borderRadius:    10,
    paddingVertical: 14,
    alignItems:      'center',
    borderWidth:     1.5,
    borderColor:     C.border,
  },
  ctaPopular: {
    backgroundColor: C.purple,
    borderColor:     C.purple,
  },
  ctaText: {
    fontSize:   15,
    fontWeight: '700',
    color:      C.dark,
  },
  ctaTextPopular: { color: C.white },
});

// Empty / error state
const EmptyState = ({ message }) => (
  <View style={es.wrap}>
    <Text style={es.icon}>📋</Text>
    <Text style={es.text}>{message}</Text>
  </View>
);

const es = StyleSheet.create({
  wrap: {
    flex:            1,
    alignItems:      'center',
    justifyContent:  'center',
    paddingHorizontal: 40,
    paddingTop:      60,
  },
  icon: { fontSize: 48, marginBottom: 16 },
  text: {
    fontSize:   15,
    color:      C.subtle,
    textAlign:  'center',
    lineHeight: 23,
  },
});


// MAIN SCREEN

const ViewPricingPlansScreen = ({ navigation }) => {
  const [plans,     setPlans]     = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg,  setErrorMsg]  = useState('');

  // Normal Flow Step 1-2: load plans on mount
  const loadPlans = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg('');

    const result = await controller.fetchAllPlans();

    if (result.success) {
      setPlans(result.data);          // Step 2: plans ready for render
    } else {
      setErrorMsg(result.message);    // Alt Flow 1a / 1b
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  // UC #01 Step 3: user taps a plan → sign-up with plan
  // UC #09 (Choose a Subscription Plan) begins
  const handleChoosePlan = useCallback((plan) => {
    navigation.navigate('SignUpScreen', { selectedPlanId: plan.planId });
  }, [navigation]);

  // Render 
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />

      <Header onBack={() => navigation.goBack()} />

      {isLoading ? (
        <ActivityIndicator
          size="large"
          color={C.purple}
          style={styles.loader}
          accessibilityLabel="Loading pricing plans"
        />
      ) : errorMsg ? (
        // Alt Flow 1a-i: no-plans message
        <EmptyState message={errorMsg} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          {/* Page intro */}
          <View style={styles.intro}>
            <Text style={styles.introTitle}>Simple, Transparent Pricing</Text>
            <Text style={styles.introSub}>
              Choose a plan that fits your needs and budget
            </Text>
          </View>

          {/* UC #01 Step 3: scrollable plan cards */}
          {plans.map((plan) => (
            <PlanCard
              key={plan.planId}
              plan={plan}
              onChoose={handleChoosePlan}
            />
          ))}

          {/* Bottom nudge */}
          <Text style={styles.footNote}>
            All paid plans include a 7-day free trial. Cancel anytime.
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

// Styles 
const styles = StyleSheet.create({
  safe: {
    flex:            1,
    backgroundColor: C.bg,
  },
  loader: {
    flex:           1,
    justifyContent: 'center',
    alignItems:     'center',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom:     40,
  },
  intro: {
    paddingVertical: 28,
  },
  introTitle: {
    fontSize:      24,
    fontWeight:    '800',
    color:         C.dark,
    letterSpacing: -0.3,
    marginBottom:  6,
  },
  introSub: {
    fontSize:   15,
    color:      C.subtle,
    lineHeight: 22,
  },
  footNote: {
    fontSize:   13,
    color:      C.subtle,
    textAlign:  'center',
    marginTop:  8,
    lineHeight: 20,
  },
});

export default ViewPricingPlansScreen;