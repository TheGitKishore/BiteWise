import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ViewReviewsController from '../controller/ViewReviewsController';

const controller = new ViewReviewsController();

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
  star:        '#FBBF24',
  starEmpty:   '#E5E7EB',
};


// SUB-COMPONENTS

// NavBar
const NavBar = ({ onMenuPress }) => (
  <View style={nav.bar}>
    <View style={nav.brand}>
      <Text style={nav.icon}>🍴</Text>
      <Text style={nav.brandName}>BiteWise</Text>
    </View>
    <TouchableOpacity
      onPress={onMenuPress}
      style={nav.menuBtn}
      accessibilityRole="button"
      accessibilityLabel="Open menu"
    >
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
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  brand: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
  },
  icon:      { fontSize: 20 },
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
});

// Star row
const StarRow = ({ rating }) => (
  <View style={sr.row}>
    {[1, 2, 3, 4, 5].map((s) => (
      <Text key={s} style={[sr.star, { color: s <= rating ? C.star : C.starEmpty }]}>★</Text>
    ))}
  </View>
);

const sr = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap:           2,
    marginBottom:  4,
  },
  star: {
    fontSize:   20,
  },
});

// Profile type badge
const ProfileBadge = ({ label }) => (
  <View style={pb.wrap}>
    <Text style={pb.text}>{label}</Text>
  </View>
);

const pb = StyleSheet.create({
  wrap: {
    alignSelf:         'flex-start',
    backgroundColor:   C.purpleLight,
    borderRadius:      20,
    paddingHorizontal: 10,
    paddingVertical:   3,
  },
  text: {
    fontSize:   12,
    fontWeight: '600',
    color:      C.purple,
  },
});

// Review card
const ReviewCard = ({ review }) => (
  <View style={rc.card}>
    <View style={rc.topRow}>
      {/* Avatar initials circle */}
      <View style={rc.avatar}>
        <Text style={rc.avatarText}>{review.reviewerInitials}</Text>
      </View>
      <View style={rc.nameBadgeCol}>
        <Text style={rc.name}>{review.reviewerName}</Text>
        <ProfileBadge label={review.profileType} />
      </View>
    </View>

    <StarRow rating={review.rating} />
    <Text style={rc.date}>{review.createdAt}</Text>
    <Text style={rc.content}>{review.content}</Text>
  </View>
);

const rc = StyleSheet.create({
  card: {
    backgroundColor: C.white,
    borderRadius:    14,
    padding:         18,
    marginBottom:    14,
    borderWidth:     1,
    borderColor:     C.border,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 1 },
    shadowOpacity:   0.04,
    shadowRadius:    4,
    elevation:       2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    gap:           12,
    marginBottom:  12,
  },
  avatar: {
    width:           44,
    height:          44,
    borderRadius:    22,
    backgroundColor: C.bg,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1,
    borderColor:     C.border,
  },
  avatarText: {
    fontSize:   14,
    fontWeight: '700',
    color:      C.mid,
  },
  nameBadgeCol: {
    flex: 1,
    gap:  4,
  },
  name: {
    fontSize:   15,
    fontWeight: '700',
    color:      C.dark,
  },
  date: {
    fontSize:     12,
    color:        C.subtle,
    marginBottom: 8,
  },
  content: {
    fontSize:   14,
    color:      C.body,
    lineHeight: 21,
  },
});

// Average rating summary card
const AverageRatingCard = ({ averageRating, totalCount }) => (
  <View style={avg.card}>
    <Text style={avg.star}>★</Text>
    <Text style={avg.value}>{averageRating}</Text>
    <Text style={avg.label}>Average rating from {totalCount} reviews</Text>
  </View>
);

const avg = StyleSheet.create({
  card: {
    backgroundColor: C.white,
    borderRadius:    14,
    padding:         24,
    alignItems:      'center',
    marginVertical:  16,
    borderWidth:     1,
    borderColor:     C.border,
  },
  star: {
    fontSize:     32,
    color:        C.star,
    marginBottom: 4,
  },
  value: {
    fontSize:     28,
    fontWeight:   '800',
    color:        C.dark,
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    color:    C.subtle,
  },
});

// Empty / error state
const EmptyState = ({ message }) => (
  <View style={es.wrap}>
    <Text style={es.icon}>💬</Text>
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

const ViewReviewsScreen = ({ navigation }) => {
  const [reviews,       setReviews]       = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [isLoading,     setIsLoading]     = useState(true);
  const [errorMsg,      setErrorMsg]      = useState('');

  // Normal Flow Step 1-2: load reviews on mount (UC #07)
  const loadReviews = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg('');

    const result = await controller.fetchAllReviews();

    if (result.success) {
      setReviews(result.data);
      setAverageRating(result.averageRating);
    } else {
      // Alt Flow 1a: no reviews
      setErrorMsg(result.message);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />

      <NavBar onMenuPress={() => navigation.navigate('MainLandingScreen')} />

      {isLoading ? (
        <ActivityIndicator size="large" color={C.purple} style={styles.loader} />
      ) : errorMsg ? (
        <EmptyState message={errorMsg} />
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>

          {/* Page header */}
          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>User Reviews</Text>
            <Text style={styles.pageSubtitle}>
              See what our community has to say about BiteWise
            </Text>
          </View>

          {/* UC #07 Step 2-3: review cards */}
          {reviews.map((review) => (
            <ReviewCard key={review.reviewId} review={review} />
          ))}

          {/* Average rating summary */}
          <AverageRatingCard
            averageRating={averageRating}
            totalCount={reviews.length}
          />

          {/* Write a Review — requires account, routes to sign up (UC #08) */}
          <TouchableOpacity
            style={styles.writeBtn}
            onPress={() => navigation.navigate('SignUpScreen')}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Write a review"
          >
            <Text style={styles.writeBtnIcon}>☆</Text>
            <Text style={styles.writeBtnText}>Write a Review</Text>
          </TouchableOpacity>

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
  writeBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             8,
    backgroundColor: C.purple,
    borderRadius:    12,
    paddingVertical: 16,
    marginTop:       4,
  },
  writeBtnIcon: {
    fontSize: 16,
    color:    C.white,
  },
  writeBtnText: {
    fontSize:   16,
    fontWeight: '700',
    color:      C.white,
  },
});

export default ViewReviewsScreen;