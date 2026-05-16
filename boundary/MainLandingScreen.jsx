import React, { useRef, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar, Dimensions, Image} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ViewReviewsController from '../controller/ViewReviewsController';

const { width: SW } = Dimensions.get('window');
const reviewController = new ViewReviewsController();

// Design Tokens
const C = {
  purple:      '#7C3AED',
  purpleLight: '#EDE9FE',
  purpleMid:   '#6D28D9',
  dark:        '#111827',
  mid:         '#374151',
  body:        '#4B5563',
  subtle:      '#6B7280',
  white:       '#FFFFFF',
  border:      '#E5E7EB',
  bg:          '#F9FAFB',
  bgTint:      '#F3F0FF',
  star:        '#FBBF24',
  green:       '#059669',
};

const TopBar = ({ navigation }) => (
  <View style={top.bar}>
    <View style={top.brand}>
      <Image source={require('../assets/BiteWiseLogo.png')} style={[top.icon,{width:20,height:20,resizeMode:'contain'}]} />
      <Text style={top.brandName}>BiteWise</Text>
    </View>
    <TouchableOpacity
      style={top.loginBtn}
      onPress={() => navigation.navigate('LoginScreen')}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel="Go to login"
    >
      <Text style={top.loginTxt}>Log In</Text>
    </TouchableOpacity>
  </View>
);

const top = StyleSheet.create({
  bar: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 20,
    paddingVertical:   14,
    backgroundColor:   C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  brand: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
  },
  icon: { fontSize: 20 },
  brandName: {
    fontSize:      20,
    fontWeight:    '800',
    color:         C.dark,
    letterSpacing: -0.3,
  },
  loginBtn: {
    backgroundColor: C.bg,
    borderRadius:    8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth:     1,
    borderColor:     C.border,
  },
  loginTxt: {
    fontSize:   13,
    fontWeight: '600',
    color:      C.mid,
  },
});


// SHARED LAYOUT COMPONENTS


const SectionWrap = ({ children, tinted, style }) => (
  <View style={[sw.wrap, tinted && { backgroundColor: C.bg }, style]}>
    {children}
  </View>
);
const sw = StyleSheet.create({
  wrap: {
    paddingHorizontal: 22,
    paddingVertical:   44,
    backgroundColor:   C.white,
  },
});

const SectionTitle = ({ title, subtitle }) => (
  <View style={st.wrap}>
    <Text style={st.title}>{title}</Text>
    {subtitle && <Text style={st.subtitle}>{subtitle}</Text>}
  </View>
);
const st = StyleSheet.create({
  wrap:     { marginBottom: 32 },
  title:    {
    fontSize:      26,
    fontWeight:    '800',
    color:         C.dark,
    letterSpacing: -0.4,
    lineHeight:    33,
    marginBottom:  8,
  },
  subtitle: {
    fontSize:   15,
    color:      C.subtle,
    lineHeight: 22,
  },
});

// Outlined "ghost" link button
const OutlineBtn = ({ label, onPress }) => (
  <TouchableOpacity style={ob.btn} onPress={onPress} activeOpacity={0.75}>
    <Text style={ob.text}>{label}  →</Text>
  </TouchableOpacity>
);
const ob = StyleSheet.create({
  btn: {
    alignSelf:         'center',
    borderWidth:       1.5,
    borderColor:       C.border,
    borderRadius:      10,
    paddingVertical:   12,
    paddingHorizontal: 24,
    marginTop:         28,
  },
  text: {
    fontSize:   15,
    fontWeight: '600',
    color:      C.dark,
  },
});


//  EVERYTHING YOU NEED TO SUCCEED Section

const FEATURES = [
  { icon: require('../assets/tile-nutrition-targets.png'),
    title: 'Set Your Goals',
    body:  'Define your daily calorie targets and track your progress towards a healthier you',
  },
  { icon: require('../assets/tile-camera-capture.png'),
    title: 'Smart Tracking',
    body:  'Log meals manually or use camera recognition for instant calorie calculation',
  },
  { icon: require('../assets/tile-recipes.png'),
    title: 'Recipe Library',
    body:  'Access thousands of healthy recipes tailored to your dietary needs and preferences',
  },
];

const FeaturesSection = () => (
  <SectionWrap>
    <SectionTitle
      title="Everything You Need to Succeed"
      subtitle="Powerful features designed to make nutrition tracking effortless"
    />
    {FEATURES.map((f, i) => (
      <View key={i} style={fs.item}>
        <View style={fs.iconWrap}>
          <Image source={f.icon} style={[fs.iconText,{width:32,height:32,resizeMode:'contain'}]} />
        </View>
        <Text style={fs.title}>{f.title}</Text>
        <Text style={fs.body}>{f.body}</Text>
      </View>
    ))}
  </SectionWrap>
);

const fs = StyleSheet.create({
  item: {
    alignItems:   'center',
    marginBottom: 40,
  },
  iconWrap: {
    width:           60,
    height:          60,
    borderRadius:    30,
    backgroundColor: C.purpleLight,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    14,
  },
  iconText: { fontSize: 26 },
  title: {
    fontSize:     18,
    fontWeight:   '700',
    color:        C.dark,
    marginBottom: 8,
  },
  body: {
    fontSize:   14,
    color:      C.subtle,
    textAlign:  'center',
    lineHeight: 21,
    maxWidth:   280,
  },
});

// HOW BITEWISE WORKS Section

const STEPS = [
  {
    num:   '1',
    title: 'Choose Your Profile',
    body:  'Select from Meal Planner, Athletes, or Health-Oriented profile to match your goals',
    link:  'Explore Profiles',
    dest:  'ProfilesScreen',
  },
  {
    num:   '2',
    title: 'Select Your Plan',
    body:  'Choose a subscription plan that fits your needs, from Free to Premium',
    link:  'View Pricing',
    dest:  'ViewPricingPlansScreen',
  },
  {
    num:   '3',
    title: 'Start Your Journey',
    body:  'Track meals, discover recipes, and achieve your nutrition goals with ease',
    link:  'Get Started',
    dest:  'SignUpScreen',
  },
];

const HowItWorksSection = ({ navigation }) => (
  <SectionWrap tinted>
    <SectionTitle
      title="How BiteWise Works"
      subtitle="Get started in three simple steps"
    />
    {STEPS.map((s, i) => (
      <View key={i} style={hw.step}>
        <View style={hw.numWrap}>
          <Text style={hw.num}>{s.num}</Text>
        </View>
        <Text style={hw.title}>{s.title}</Text>
        <Text style={hw.body}>{s.body}</Text>
        <TouchableOpacity onPress={() => navigation.navigate(s.dest)}>
          <Text style={hw.link}>{s.link} →</Text>
        </TouchableOpacity>
      </View>
    ))}
  </SectionWrap>
);

const hw = StyleSheet.create({
  step: {
    alignItems:   'center',
    marginBottom: 44,
  },
  numWrap: {
    width:           52,
    height:          52,
    borderRadius:    26,
    backgroundColor: C.purple,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    16,
  },
  num: {
    fontSize:   22,
    fontWeight: '800',
    color:      C.white,
  },
  title: {
    fontSize:     18,
    fontWeight:   '700',
    color:        C.dark,
    marginBottom: 8,
  },
  body: {
    fontSize:     14,
    color:        C.subtle,
    textAlign:    'center',
    lineHeight:   21,
    maxWidth:     280,
    marginBottom: 10,
  },
  link: {
    fontSize:   14,
    fontWeight: '600',
    color:      C.purple,
  },
});


// CHOOSE YOUR PERFECT PROFILE Section

const PROFILES = [
  {
    title:   'Meal Planner',
    body:    'Perfect for those who love planning their meals in advance',
    bullets: ['Weekly meal calendar', 'Grocery list generator', 'Recipe organisation'],
  },
  {
    title:   'Athletes',
    body:    'Optimised for peak athletic performance and recovery',
    bullets: ['Protein & macro tracking', 'Pre/post-workout meals', 'Performance insights'],
  },
  {
    title:   'Health-Oriented',
    body:    'Focus on overall wellness and healthy lifestyle choices',
    bullets: ['Balanced nutrition', 'Heart-healthy recipes', 'Weight management'],
  },
];

const ProfilesSection = ({ navigation }) => (
  <SectionWrap>
    <SectionTitle
      title="Choose Your Perfect Profile"
      subtitle="Tailored features for every nutrition journey"
    />
    {PROFILES.map((p, i) => (
      <View key={i} style={ps.card}>
        <Text style={ps.cardTitle}>{p.title}</Text>
        <Text style={ps.cardBody}>{p.body}</Text>
        {p.bullets.map((b, j) => (
          <Text key={j} style={ps.bullet}>• {b}</Text>
        ))}
      </View>
    ))}
    <OutlineBtn
      label="View All Profile Features"
      onPress={() => navigation.navigate('ProfilesScreen')}
    />
  </SectionWrap>
);

const ps = StyleSheet.create({
  card: {
    backgroundColor: C.white,
    borderRadius:    14,
    padding:         20,
    marginBottom:    14,
    borderWidth:     1,
    borderColor:     C.border,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 1 },
    shadowOpacity:   0.05,
    shadowRadius:    4,
    elevation:       2,
  },
  cardTitle: {
    fontSize:     18,
    fontWeight:   '700',
    color:        C.purple,
    marginBottom: 6,
  },
  cardBody: {
    fontSize:     13,
    color:        C.body,
    lineHeight:   20,
    marginBottom: 10,
  },
  bullet: {
    fontSize:   13,
    color:      C.mid,
    lineHeight: 22,
  },
});


// SIMPLE, TRANSPARENT PRICING Section

const PLANS_PREVIEW = [
  { name: 'Free',    price: '$0',     note: 'Perfect for getting started', popular: false },
  { name: 'Premium', price: '$19.99', note: 'All features included',       popular: true  },
];

const PricingPreviewSection = ({ navigation }) => (
  <SectionWrap tinted>
    <SectionTitle
      title="Simple, Transparent Pricing"
      subtitle="Choose a plan that fits your needs and budget"
    />
    {PLANS_PREVIEW.map((plan, i) => (
      <View
        key={i}
        style={[pp.card, plan.popular && pp.cardPopular]}
      >
        {plan.popular && (
          <View style={pp.badge}>
            <Text style={pp.badgeText}>Most Popular</Text>
          </View>
        )}
        <Text style={[pp.name, plan.popular && pp.namePopular]}>
          {plan.name}
        </Text>
        <Text style={pp.price}>{plan.price}</Text>
        <Text style={pp.note}>{plan.note}</Text>
      </View>
    ))}
    <OutlineBtn
      label="Compare All Plans"
      onPress={() => navigation.navigate('ViewPricingPlansScreen')}
    />
  </SectionWrap>
);

const pp = StyleSheet.create({
  card: {
    backgroundColor: C.white,
    borderRadius:    14,
    padding:         20,
    marginBottom:    12,
    borderWidth:     1,
    borderColor:     C.border,
    alignItems:      'center',
  },
  cardPopular: {
    borderColor:     C.purple,
    borderWidth:     2,
    backgroundColor: '#FAF5FF',
  },
  badge: {
    backgroundColor:   C.purple,
    borderRadius:      20,
    paddingHorizontal: 14,
    paddingVertical:   4,
    marginBottom:      10,
  },
  badgeText: {
    fontSize:   12,
    fontWeight: '700',
    color:      C.white,
  },
  name: {
    fontSize:     17,
    fontWeight:   '700',
    color:        C.dark,
    marginBottom: 4,
  },
  namePopular: { color: C.dark },
  price: {
    fontSize:     28,
    fontWeight:   '800',
    color:        C.purple,
    marginBottom: 4,
  },
  note: {
    fontSize: 13,
    color:    C.subtle,
  },
});


// LOVED BY OUR COMMUNITY Section

const StarRow = ({ count }) => (
  <View style={rv.stars}>
    {[1, 2, 3, 4, 5].map((s) => (
      <Image key={s} source={require('../assets/icon-star-filled.png')} style={[rv.star, s <= count && rv.starFilled, {width:20,height:20,resizeMode:'contain'}]} />
    ))}
  </View>
);

const ReviewsSection = ({ navigation, averageRating, totalReviews }) => (
  <SectionWrap>
    <SectionTitle
      title="Loved by Our Community"
      subtitle="See what our users have to say"
    />

    {/* Overall rating only — individual cards live on ReviewsScreen */}
    <View style={rv.ratingRow}>
      <StarRow count={Math.round(averageRating)} />
        <Text style={rv.ratingText}>
          {Math.floor(averageRating)} out of 5
        </Text>
    </View>

    <OutlineBtn
      label="Read All Reviews"
      onPress={() => navigation.navigate('ReviewsScreen')}
    />
  </SectionWrap>
);

const rv = StyleSheet.create({
  ratingRow: {
    alignItems:   'center',
    marginBottom: 8,
  },
  stars: {
    flexDirection: 'row',
    gap:           3,
    marginBottom:  6,
  },
  star: {
    fontSize: 26,
    tintColor:    '#D1D5DB',
  },
  starFilled: {
    tintColor: C.star,
  },
  ratingText: {
    fontSize:   15,
    fontWeight: '600',
    color:      C.mid,
  },
});


// CTA BANNER + FOOTER Section

const CTASection = ({ navigation }) => (
  <View style={cta.wrap}>
    <Text style={cta.headline}>Ready to Transform{'\n'}Your Health?</Text>
    <Text style={cta.body}>
      Join thousands of users who have achieved their nutrition goals with BiteWise
    </Text>
    <TouchableOpacity
      style={cta.btnPrimary}
      onPress={() => navigation.navigate('SignUpScreen')}
      activeOpacity={0.85}
    >
      <Text style={cta.btnPrimaryText}>Start Your Free Trial  →</Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={cta.btnSecondary}
      onPress={() => navigation.navigate('ViewPricingPlansScreen')}
      activeOpacity={0.75}
    >
      <Text style={cta.btnSecondaryText}>View All Plans</Text>
    </TouchableOpacity>
  </View>
);

const cta = StyleSheet.create({
  wrap: {
    backgroundColor:   C.purple,
    paddingHorizontal: 22,
    paddingVertical:   52,
    alignItems:        'center',
  },
  headline: {
    fontSize:      26,
    fontWeight:    '800',
    color:         C.white,
    textAlign:     'center',
    lineHeight:    34,
    letterSpacing: -0.3,
    marginBottom:  12,
  },
  body: {
    fontSize:     14,
    color:        'rgba(255,255,255,0.80)',
    textAlign:    'center',
    lineHeight:   21,
    maxWidth:     300,
    marginBottom: 28,
  },
  btnPrimary: {
    width:           SW - 44,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth:     1.5,
    borderColor:     'rgba(255,255,255,0.50)',
    borderRadius:    12,
    paddingVertical: 15,
    alignItems:      'center',
    marginBottom:    12,
  },
  btnPrimaryText: {
    fontSize:   16,
    fontWeight: '700',
    color:      C.white,
  },
  btnSecondary: {
    width:           SW - 44,
    borderWidth:     1.5,
    borderColor:     'rgba(255,255,255,0.50)',
    borderRadius:    12,
    paddingVertical: 15,
    alignItems:      'center',
  },
  btnSecondaryText: {
    fontSize:   16,
    fontWeight: '700',
    color:      C.white,
  },
});

const Footer = ({ navigation }) => (
  <View style={foot.wrap}>
    <Text style={foot.copy}>© 2025 BiteWise. All rights reserved.</Text>
    <TouchableOpacity onPress={() => navigation.navigate('AdminLoginScreen')}>
      <Text style={foot.admin}>Admin Access</Text>
    </TouchableOpacity>
  </View>
);

const foot = StyleSheet.create({
  wrap: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'center',
    paddingHorizontal: 22,
    paddingVertical:   18,
    backgroundColor:   '#111827',
  },
  copy:  { fontSize: 12, color: '#9CA3AF' },
  admin: { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },
});

// MAIN SCREEN

const MainLandingScreen = ({ navigation }) => {
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  const reviewController = new ViewReviewsController();

  useEffect(() => {
    const loadReviews = async () => {
      const result = await reviewController.fetchAllReviews();

      if (result.success) {
        setAverageRating(result.averageRating);
        setTotalReviews(result.data.length);
      }
    };

    loadReviews();
  }, []);

  useEffect(() => {
    console.log(navigation.getState());
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.white }}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />
      <TopBar navigation={navigation} />
      <ScrollView showsVerticalScrollIndicator={false} bounces={true}>
        <FeaturesSection />
        <HowItWorksSection navigation={navigation} />
        <ProfilesSection navigation={navigation} />
        <PricingPreviewSection navigation={navigation} />

        <ReviewsSection
          navigation={navigation}
          averageRating={averageRating}
          totalReviews={totalReviews}
        />

        <CTASection navigation={navigation} />
        <Footer navigation={navigation} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default MainLandingScreen;
