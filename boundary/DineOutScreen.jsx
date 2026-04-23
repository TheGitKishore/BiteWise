// DineOutScreen.jsx — UC NEW-E Premium User – View Dine Out Options
// Sprint 9: New screen. Shows restaurants with menu items that fit the user's
// remaining daily nutrition budget.
//
// Layout:
//   Header (Premium badge, title, subtitle)
//   Remaining calorie budget pill
//   Search bar
//   Cuisine filter chips
//   Restaurant cards (expandable menu items with calories prominent)
//
// Premium User only

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, StatusBar, ActivityIndicator ,
  KeyboardAvoidingView, Platform, Keyboard,
} from 'react-native';
import { SafeAreaView }   from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import ViewDineOutController              from '../controller/ViewDineOutController';
import ViewCurrentCalorieIntakeController from '../controller/ViewCurrentCalorieIntakeController';

const dineCtrl   = new ViewDineOutController();
const intakeCtrl = new ViewCurrentCalorieIntakeController();

const C = {
  purple:'#7C3AED', purpleLight:'#EDE9FE', dark:'#111827', mid:'#374151',
  body:'#4B5563', subtle:'#6B7280', white:'#FFFFFF', border:'#E5E7EB', bg:'#F9FAFB',
  green:'#16A34A', greenPale:'#ECFDF5', greenBorder:'#A7F3D0',
};

const NavBar = ({ onMenuPress }) => (
  <View style={nav.bar}>
    <View style={nav.brand}><Text style={nav.icon}>🍴</Text><Text style={nav.brandName}>BiteWise</Text></View>
    <TouchableOpacity onPress={onMenuPress} style={nav.menuBtn}>
      <View style={nav.menuLine}/><View style={[nav.menuLine,{width:18}]}/><View style={nav.menuLine}/>
    </TouchableOpacity>
  </View>
);
const nav = StyleSheet.create({
  bar:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:20,paddingVertical:14,backgroundColor:C.white,borderBottomWidth:1,borderBottomColor:C.border},
  brand:{flexDirection:'row',alignItems:'center',gap:6},icon:{fontSize:20},
  brandName:{fontSize:20,fontWeight:'800',color:C.dark,letterSpacing:-0.3},
  menuBtn:{padding:6,gap:4,alignItems:'flex-end'},menuLine:{width:22,height:2.5,backgroundColor:C.dark,borderRadius:2},
});

// Menu item row
const MenuItem = ({ item }) => (
  <View style={mi.wrap}>
    <View style={mi.nameRow}>
      <Text style={mi.name}>{item.name}</Text>
      <Text style={mi.price}>${item.price?.toFixed(2)}</Text>
    </View>
    <View style={mi.macroRow}>
      <View style={mi.calChip}><Text style={mi.calVal}>{item.calories} kcal</Text></View>
      <Text style={mi.macro}>P: {item.protein}g</Text>
      <Text style={mi.sep}>·</Text>
      <Text style={mi.macro}>C: {item.carbs}g</Text>
      <Text style={mi.sep}>·</Text>
      <Text style={mi.macro}>F: {item.fat}g</Text>
    </View>
    {item.tags?.length > 0 && (
      <View style={mi.tagRow}>
        {item.tags.slice(0,3).map((t,i) => <View key={i} style={mi.tag}><Text style={mi.tagTxt}>{t}</Text></View>)}
      </View>
    )}
  </View>
);
const mi = StyleSheet.create({
  wrap:{backgroundColor:C.bg,borderRadius:10,padding:12,marginBottom:8},
  nameRow:{flexDirection:'row',justifyContent:'space-between',marginBottom:6},
  name:{flex:1,fontSize:14,fontWeight:'600',color:C.dark,marginRight:8},
  price:{fontSize:13,fontWeight:'600',color:C.green},
  macroRow:{flexDirection:'row',alignItems:'center',gap:6,marginBottom:6,flexWrap:'wrap'},
  calChip:{backgroundColor:C.purple,borderRadius:6,paddingHorizontal:8,paddingVertical:3},
  calVal:{fontSize:12,fontWeight:'700',color:C.white},
  macro:{fontSize:11,color:C.subtle},sep:{fontSize:11,color:C.border},
  tagRow:{flexDirection:'row',gap:6,flexWrap:'wrap'},
  tag:{backgroundColor:C.purpleLight,borderRadius:20,paddingHorizontal:8,paddingVertical:2},
  tagTxt:{fontSize:10,color:C.purple},
});

// Restaurant card (expandable)
const RestaurantCard = ({ restaurant }) => {
  const [expanded, setExpanded] = useState(true);
  const items = restaurant.filteredItems || restaurant.menuItems || [];
  return (
    <View style={rc.card}>
      <TouchableOpacity style={rc.hdr} onPress={() => setExpanded(!expanded)} activeOpacity={0.8}>
        <Text style={rc.emoji}>{restaurant.emoji}</Text>
        <View style={rc.info}>
          <Text style={rc.name}>{restaurant.name}</Text>
          <Text style={rc.meta}>{restaurant.cuisine}  •  {restaurant.priceRange}  •  ⭐ {restaurant.rating}</Text>
          <Text style={rc.address}>📍 {restaurant.address}</Text>
        </View>
        <Text style={rc.chevron}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      <View style={rc.badgeRow}>
        <View style={rc.badge}>
          <Text style={rc.badgeTxt}>{items.length} item{items.length !== 1 ? 's' : ''} match your budget</Text>
        </View>
      </View>
      {expanded && items.map(item => <MenuItem key={item.itemId} item={item}/>)}
    </View>
  );
};
const rc = StyleSheet.create({
  card:{backgroundColor:C.white,borderRadius:14,padding:16,marginBottom:14,borderWidth:1,borderColor:C.border},
  hdr:{flexDirection:'row',alignItems:'flex-start',gap:12,marginBottom:10},
  emoji:{fontSize:36,width:44,textAlign:'center'},
  info:{flex:1},
  name:{fontSize:17,fontWeight:'800',color:C.dark,marginBottom:3},
  meta:{fontSize:12,color:C.subtle,marginBottom:2},
  address:{fontSize:12,color:C.subtle},
  chevron:{fontSize:12,color:C.subtle,marginTop:4},
  badgeRow:{marginBottom:10},
  badge:{alignSelf:'flex-start',backgroundColor:C.greenPale,borderRadius:20,paddingHorizontal:10,paddingVertical:4},
  badgeTxt:{fontSize:12,fontWeight:'600',color:C.green},
});

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
const DineOutScreen = ({ navigation, route }) => {
  const user = route?.params?.user || null;
  const [allRestaurants, setAllRestaurants] = useState([]);
  const [remainingCals,  setRemainingCals]  = useState(0);
  const [targetCals,     setTargetCals]     = useState(2000);
  const [cuisines,       setCuisines]       = useState(['All']);
  const [activeCuisine,  setActiveCuisine]  = useState('All');
  const [search,         setSearch]         = useState('');
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState('');

  const loadData = useCallback(async () => {
    if (!user?.userId) return;
    setLoading(true); setError('');
    const entries = await intakeCtrl.fetchTodayEntries(user.userId).catch(() => []);
    const result  = await dineCtrl.fetchDineOutOptions(user.userId, entries || []);
    if (result.success) {
      setAllRestaurants(result.data);
      setRemainingCals(result.remainingCalories || 0);
      setTargetCals(result.targetCalories || 2000);
      setCuisines(dineCtrl.getCuisines(result.data));
      if (result.message) setError(result.message);
    } else {
      setError(result.message || 'Unable to load options.');
    }
    setLoading(false);
  }, [user?.userId]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  let displayed = dineCtrl.filterByCuisine(allRestaurants, activeCuisine);
  displayed = dineCtrl.search(displayed, search);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white}/>
      <NavBar onMenuPress={() => navigation.navigate('AccountSettingsScreen', { user })}/>

      <KeyboardAvoidingView

        style={{ flex: 1 }}

        behavior={Platform.OS === 'ios' ? 'padding' : undefined}

      >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <View style={s.header}>
          <View style={s.premBadge}><Text style={s.premBadgeTxt}>☆ Premium</Text></View>
          <Text style={s.pageTitle}>Dine Out Options</Text>
          <Text style={s.pageSub}>Restaurants with menu items that match your remaining nutrition targets</Text>
        </View>

        {!loading && (
          <View style={s.budgetPill}>
            <Text style={s.budgetLbl}>Calorie Budget Remaining</Text>
            <Text style={s.budgetVal}>{remainingCals} / {targetCals} kcal</Text>
          </View>
        )}

        <View style={s.searchBar}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput style={s.searchInput} value={search} onChangeText={setSearch}
            placeholder="Search restaurants or dishes..." placeholderTextColor={C.subtle} autoCorrect={false}/>
          {search.length > 0 && <TouchableOpacity onPress={() => setSearch('')}><Text style={s.clearBtn}>✕</Text></TouchableOpacity>}
        </View>

        {!loading && cuisines.length > 1 && (
          <ScrollView keyboardShouldPersistTaps="handled" horizontal showsHorizontalScrollIndicator={false} style={s.filterBar} contentContainerStyle={{gap:8,paddingRight:16}}>
            {cuisines.map(c => (
              <TouchableOpacity key={c} style={[s.chip,activeCuisine===c&&s.chipActive]} onPress={() => setActiveCuisine(c)}>
                <Text style={[s.chipTxt,activeCuisine===c&&s.chipTxtActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {loading ? (
          <ActivityIndicator size="large" color={C.purple} style={{marginTop:40}}/>
        ) : displayed.length === 0 ? (
          <View style={s.emptyCard}>
            <Text style={s.emptyEmoji}>🍽️</Text>
            <Text style={s.emptyTitle}>{error ? 'No Matches Found' : 'No Results'}</Text>
            <Text style={s.emptyBody}>{error || `Try a different search or cuisine filter.`}</Text>
          </View>
        ) : (
          <>
            <Text style={s.countLabel}>{displayed.length} restaurant{displayed.length !== 1 ? 's' : ''} with matching options</Text>
            {displayed.map(r => <RestaurantCard key={r.restaurantId} restaurant={r}/>)}
          </>
        )}
      </ScrollView>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:{flex:1,backgroundColor:C.bg}, scroll:{paddingHorizontal:16,paddingBottom:40},
  header:{paddingVertical:20},
  premBadge:{alignSelf:'flex-start',backgroundColor:C.purple,borderRadius:20,paddingHorizontal:10,paddingVertical:3,marginBottom:8},
  premBadgeTxt:{fontSize:11,fontWeight:'700',color:C.white},
  pageTitle:{fontSize:28,fontWeight:'800',color:C.dark,letterSpacing:-0.5,marginBottom:6,lineHeight:34},
  pageSub:{fontSize:14,color:C.subtle,lineHeight:20},
  budgetPill:{backgroundColor:C.purple,borderRadius:12,padding:14,marginBottom:14,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  budgetLbl:{fontSize:13,color:'rgba(255,255,255,0.8)'},
  budgetVal:{fontSize:16,fontWeight:'800',color:C.white},
  searchBar:{flexDirection:'row',alignItems:'center',backgroundColor:C.white,borderRadius:12,borderWidth:1,borderColor:C.border,paddingHorizontal:14,paddingVertical:11,marginBottom:12,gap:8},
  searchIcon:{fontSize:16},searchInput:{flex:1,fontSize:14,color:C.dark,padding:0},clearBtn:{fontSize:14,color:C.subtle},
  filterBar:{marginBottom:14},
  chip:{borderWidth:1,borderColor:C.border,borderRadius:20,paddingHorizontal:14,paddingVertical:7,backgroundColor:C.white},
  chipActive:{backgroundColor:C.purple,borderColor:C.purple},
  chipTxt:{fontSize:13,color:C.mid,fontWeight:'500'},chipTxtActive:{color:C.white,fontWeight:'700'},
  countLabel:{fontSize:13,color:C.subtle,marginBottom:10},
  emptyCard:{backgroundColor:C.white,borderRadius:14,padding:40,alignItems:'center',borderWidth:1,borderColor:C.border},
  emptyEmoji:{fontSize:48,marginBottom:12},
  emptyTitle:{fontSize:18,fontWeight:'700',color:C.dark,marginBottom:6},
  emptyBody:{fontSize:14,color:C.subtle,textAlign:'center',lineHeight:20},
});

export default DineOutScreen;
