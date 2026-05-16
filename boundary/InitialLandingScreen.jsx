import React, { useRef, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, StatusBar, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SW } = Dimensions.get('window');

// Design Tokens 
const C = {
  purple:      '#7C3AED',
  purpleLight: '#EDE9FE',
  dark:        '#111827',
  body:        '#4B5563',
  white:       '#FFFFFF',
  border:      '#E5E7EB',
  bg:          '#F5F3FF',
};

// Sub-component: NavBar
const NavBar = ({ onMenuPress }) => (
  <View style={nav.bar}>
    <View style={nav.brand}>
      {/* Fork & knife icon mark */}
      <Image source={require('../assets/BiteWiseLogo.png')} style={nav.logo} />
      <Text style={nav.brandName}>BiteWise</Text>
    </View>
    <TouchableOpacity
      onPress={onMenuPress}
      style={nav.menuBtn}
      accessibilityLabel="Open navigation menu"
      accessibilityRole="button"
    >
      {/* Hamburger — three lines */}
      <View style={nav.menuLine} />
      <View style={[nav.menuLine, { width: 18 }]} />
      <View style={nav.menuLine} />
    </TouchableOpacity>
  </View>
);

const nav = StyleSheet.create({
  bar: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 20,
    paddingVertical:   14,
    backgroundColor:   C.white,
  },
  brand: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
  },
  icon:      { fontSize: 20 },
  logo:      { width: 24, height: 24, resizeMode: 'contain' },
  brandName: {
    fontSize:      20,
    fontWeight:    '800',
    color:         C.dark,
    letterSpacing: -0.3,
  },
  menuBtn: {
    padding: 6,
    gap:     4,
    alignItems: 'flex-end',
  },
  menuLine: {
    width:           22,
    height:          2.5,
    backgroundColor: C.dark,
    borderRadius:    2,
  },
});

// Main Screen 
const InitialLandingScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue:         1,
      duration:        600,
      useNativeDriver: true,
    }).start();
  }, []);

  // ── Navigation handlers ───────────────────────────────────
  const handleGetStarted = () => navigation.navigate('MainLandingScreen');
  const handleMenu = () => navigation.navigate('MainLandingScreen');

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />

      {/* Navigation Bar*/}
      <NavBar onMenuPress={handleMenu} />

      {/* Hero Food Image */}
      <Image
        source={require('../assets/acai-bowl.jpg')}
        style={styles.heroImage}
        resizeMode="cover"
        accessibilityLabel="Colourful acai bowl with fresh fruit"
      />

      {/* ── Content card below image ──────────────────────── */}
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>

        {/* Headline */}
        <Text style={styles.headline}>
          Your Smart Companion for{' '}
          <Text style={styles.headlineAccent}>Healthy Eating</Text>
        </Text>

        {/* Body copy */}
        <Text style={styles.body}>
          Track calories, discover recipes, and achieve your nutrition goals
          with BiteWise. The intelligent way to manage your diet and build
          healthy habits.
        </Text>

        {/* Primary CTA */}
        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={handleGetStarted}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Get Started Free"
        >
          <Text style={styles.btnPrimaryText}>Get Started Free</Text>
          <Text style={styles.btnArrow}>→</Text>
        </TouchableOpacity>

      </Animated.View>
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  safe: {
    flex:            1,
    backgroundColor: C.white,
  },
  heroImage: {
    width:  SW,
    height: SW * 0.72,       // ~16:11 ratio matching screenshot
  },
  content: {
    flex:              1,
    paddingHorizontal: 22,
    paddingTop:        24,
    paddingBottom:     16,
    backgroundColor:   C.white,
  },
  headline: {
    fontSize:      28,
    fontWeight:    '800',
    color:         C.dark,
    lineHeight:    36,
    letterSpacing: -0.4,
    marginBottom:  12,
  },
  headlineAccent: {
    color: C.purple,
  },
  body: {
    fontSize:     15,
    color:        C.body,
    lineHeight:   23,
    marginBottom: 24,
  },
  btnPrimary: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'center',
    gap:               8,
    backgroundColor:   C.purple,
    borderRadius:      12,
    paddingVertical:   16,
    marginBottom:      12,
  },
  btnPrimaryText: {
    fontSize:   16,
    fontWeight: '700',
    color:      C.white,
  },
  btnArrow: {
    fontSize:   16,
    fontWeight: '700',
    color:      C.white,
  },
});

export default InitialLandingScreen;