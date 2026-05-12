import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, StatusBar, Image} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ViewUserProfileFeaturesController from '../controller/ViewUserProfileFeaturesController';

const controller = new ViewUserProfileFeaturesController();

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
  bg:          '#F3F4F6',
};


// SUB-COMPONENTS

// NavBar
const NavBar = ({ onMenuPress }) => (
  <View style={nav.bar}>
    <View style={nav.brand}>
      <Image source={require('../assets/BiteWiseLogo.png')} style={nav.logo} />
      <Text style={nav.brandName}>BiteWise</Text>
    </View>
    <TouchableOpacity onPress={onMenuPress} style={nav.backBtn}>
          <Text style={nav.backText}>← Back</Text>
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
    borderBottomWidth: 1,
    borderBottomColor: C.border,
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
    padding:    6,
    gap:        4,
    alignItems: 'flex-end',
  },
  menuLine: {
    width:           22,
    height:          2.5,
    backgroundColor: C.dark,
    borderRadius:    2,
  },
  backBtn:  { padding: 6 },
  backText: { fontSize: 14, fontWeight: '500', color: '#374151' },
});

// Feature tick row
const FeatureRow = ({ text }) => (
  <View style={fr.row}>
    <Text style={fr.tick}>✓</Text>
    <Text style={fr.text}>{text}</Text>
  </View>
);

const fr = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    gap:           10,
    marginBottom:  8,
  },
  tick: {
    fontSize:   15,
    fontWeight: '700',
    color:      C.purple,
    marginTop:  1,
    width:      16,
  },
  text: {
    flex:       1,
    fontSize:   14,
    color:      C.mid,
    lineHeight: 21,
  },
});

// Profile Card — one per profile, satisfies UC #04 / #05 / #06
const ProfileCard = ({ profile }) => (
  <View style={pc.card}>
    {/* Image area — replace emoji placeholder with Image component when assets are ready */}
    <View style={pc.imageArea}>
      <Text style={pc.imageEmoji}>
        {profile.type === 'MEAL_PLANNER'    ? '📖' :
         profile.type === 'ATHLETE'         ? '🏃' : '🥗'}
      </Text>
    </View>

    <View style={pc.body}>
      <Text style={pc.name}>{profile.displayName}</Text>
      <Text style={pc.description}>{profile.description}</Text>

      <Text style={pc.featuresLabel}>Key Features:</Text>

      {profile.getFeatureList().map((feat, i) => (
        <FeatureRow key={i} text={feat} />
      ))}
    </View>
  </View>
);

const pc = StyleSheet.create({
  card: {
    backgroundColor: C.white,
    borderRadius:    16,
    marginBottom:    20,
    overflow:        'hidden',
    borderWidth:     1,
    borderColor:     C.border,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 1 },
    shadowOpacity:   0.05,
    shadowRadius:    4,
    elevation:       2,
  },
  imageArea: {
    width:           '100%',
    height:          180,
    backgroundColor: C.bg,
    alignItems:      'center',
    justifyContent:  'center',
  },
  imageEmoji:  { fontSize: 64 },
  body: {
    padding: 20,
  },
  name: {
    fontSize:     22,
    fontWeight:   '800',
    color:        C.dark,
    marginBottom: 4,
  },
  description: {
    fontSize:     14,
    color:        C.subtle,
    lineHeight:   21,
    marginBottom: 16,
  },
  featuresLabel: {
    fontSize:     14,
    fontWeight:   '700',
    color:        C.dark,
    marginBottom: 10,
  },
});

// Empty / error state
const EmptyState = ({ message }) => (
  <View style={es.wrap}>
    <Text style={es.icon}>👤</Text>
    <Text style={es.text}>{message}</Text>
  </View>
);

const es = StyleSheet.create({
  wrap: {
    flex:              1,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: 40,
    paddingTop:        60,
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

const ViewUserProfileFeaturesScreen = ({ navigation }) => {
  const [profiles,  setProfiles]  = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg,  setErrorMsg]  = useState('');

  // Normal Flow Step 1-2: load all profiles on mount (UC #03)
  const loadProfiles = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg('');

    const result = await controller.fetchAllProfiles();

    if (result.success) {
      setProfiles(result.data);
    } else {
      // Alt Flow 1a: no profiles
      setErrorMsg(result.message);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />

      <NavBar onMenuPress={() => navigation.goBack()} />

      {isLoading ? (
        <ActivityIndicator size="large" color={C.purple} style={styles.loader} />
      ) : errorMsg ? (
        <EmptyState message={errorMsg} />
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>

          {/* Page header */}
          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>User Profiles</Text>
            <Text style={styles.pageSubtitle}>
              Find the perfect profile that matches your nutrition goals
            </Text>
          </View>

          {/* UC #03 Step 2-3 / UC #04 #05 #06 — one card per profile */}
          {profiles.map((profile) => (
            <ProfileCard key={profile.profileTypeId} profile={profile} />
          ))}

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
  pageHeader: {
    paddingVertical: 28,
    alignItems:      'center',
  },
  pageTitle: {
    fontSize:      28,
    fontWeight:    '800',
    color:         C.dark,
    letterSpacing: -0.4,
    marginBottom:  6,
  },
  pageSubtitle: {
    fontSize:   15,
    color:      C.subtle,
    textAlign:  'center',
    lineHeight: 22,
  },
});

export default ViewUserProfileFeaturesScreen;