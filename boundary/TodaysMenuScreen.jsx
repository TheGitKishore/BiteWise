// TodaysMenuScreen.jsx — Today's Menu (Premium User, UC NEW-A)
// Sprint 9: New screen. Recommends recipes based on remaining nutrition targets.
// Sources: recipe library + custom recipes via Recipe entity.
//
// Sections:
//   • Header (Premium badge, title, subtitle)
//   • Remaining budget summary card (purple)
//   • Today's Progress macro bars (Calories / Protein / Carbs / Fat)
//   • Matching recipe cards (calorie count shown prominently)
//   • Empty state if budget nearly exhausted
//
// Entry: PremiumUserDashboardScreen "Today's Menu" tile (all 3 profiles)

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView }   from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import ViewTodaysMenuController            from '../controller/ViewTodaysMenuController';
import ViewCurrentCalorieIntakeController  from '../controller/ViewCurrentCalorieIntakeController';

const menuCtrl   = new ViewTodaysMenuController();
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

const RemainingBudgetCard = ({ remaining, targets }) => (
  <View style={rb.card}>
    <Text style={rb.heading}>Remaining Today</Text>
    <Text style={rb.calRemaining}>{remaining.calories} kcal</Text>
    <View style={rb.macroRow}>
      {[{v:remaining.protein,l:'protein left'},{v:remaining.carbs,l:'carbs left'},{v:remaining.fat,l:'fat left'}].map((m,i)=>(
        <React.Fragment key={i}>
          {i>0&&<View style={rb.sep}/>}
          <View style={rb.macroItem}>
            <Text style={rb.macroVal}>{m.v}g</Text>
            <Text style={rb.macroLbl}>{m.l}</Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  </View>
);
const rb = StyleSheet.create({
  card:{backgroundColor:C.purple,borderRadius:14,padding:18,marginBottom:14},
  heading:{fontSize:12,fontWeight:'600',color:'rgba(255,255,255,0.75)',marginBottom:4},
  calRemaining:{fontSize:36,fontWeight:'800',color:C.white,marginBottom:14},
  macroRow:{flexDirection:'row',justifyContent:'space-around',alignItems:'center'},
  macroItem:{alignItems:'center',flex:1},
  macroVal:{fontSize:16,fontWeight:'800',color:C.white},
  macroLbl:{fontSize:10,color:'rgba(255,255,255,0.7)',marginTop:2},
  sep:{width:1,height:28,backgroundColor:'rgba(255,255,255,0.3)'},
});

const MacroBar = ({ label, consumed, goal, unit, percentage }) => (
  <View style={mb.wrap}>
    <View style={mb.topRow}>
      <Text style={mb.label}>{label}</Text>
      <Text style={mb.value}>{consumed} / {goal} {unit}</Text>
    </View>
    <View style={mb.track}>
      <View style={[mb.fill,{width:`${percentage}%`}]}/>
    </View>
    <Text style={mb.remaining}>{Math.max(0,goal-consumed)} {unit} remaining</Text>
  </View>
);
const mb = StyleSheet.create({
  wrap:{marginBottom:14},
  topRow:{flexDirection:'row',justifyContent:'space-between',marginBottom:4},
  label:{fontSize:13,fontWeight:'600',color:C.dark},value:{fontSize:12,color:C.subtle},
  track:{height:6,backgroundColor:C.purpleLight,borderRadius:3,overflow:'hidden',marginBottom:4},
  fill:{height:6,backgroundColor:C.purple,borderRadius:3},
  remaining:{fontSize:11,color:C.subtle},
});

const RecipeCard = ({ recipe }) => (
  <View style={rc.card}>
    <View style={rc.hdr}>
      <Text style={rc.title} numberOfLines={2}>{recipe.title}</Text>
      <View style={rc.calBadge}>
        <Text style={rc.calVal}>{recipe.calories}</Text>
        <Text style={rc.calUnit}>kcal</Text>
      </View>
    </View>
    <Text style={rc.meta}>⏱ {recipe.prepTimeMins} min  •  {recipe.difficulty || 'Easy'}</Text>
    <View style={rc.macroRow}>
      {recipe.protein>0&&<View style={rc.chip}><Text style={rc.chipTxt}>P: {recipe.protein}g</Text></View>}
      {recipe.carbs>0&&<View style={rc.chip}><Text style={rc.chipTxt}>C: {recipe.carbs}g</Text></View>}
      {recipe.fat>0&&<View style={rc.chip}><Text style={rc.chipTxt}>F: {recipe.fat}g</Text></View>}
    </View>
    {recipe.tags?.length>0&&(
      <View style={rc.tagRow}>
        {recipe.tags.slice(0,3).map((t,i)=><View key={i} style={rc.tag}><Text style={rc.tagTxt}>{t}</Text></View>)}
      </View>
    )}
    {recipe.isCurated&&(
      <View style={rc.curatorBadge}><Text style={rc.curatorTxt}>✓ Curator Recipe</Text></View>
    )}
  </View>
);
const rc = StyleSheet.create({
  card:{backgroundColor:C.white,borderRadius:14,padding:16,marginBottom:12,borderWidth:1,borderColor:C.border},
  hdr:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6,gap:10},
  title:{flex:1,fontSize:16,fontWeight:'700',color:C.dark,lineHeight:22},
  calBadge:{backgroundColor:C.purple,borderRadius:10,paddingHorizontal:10,paddingVertical:4,alignItems:'center',minWidth:56},
  calVal:{fontSize:16,fontWeight:'800',color:C.white},calUnit:{fontSize:10,color:'rgba(255,255,255,0.8)'},
  meta:{fontSize:12,color:C.subtle,marginBottom:10},
  macroRow:{flexDirection:'row',gap:6,marginBottom:8,flexWrap:'wrap'},
  chip:{backgroundColor:C.purpleLight,borderRadius:6,paddingHorizontal:8,paddingVertical:3},
  chipTxt:{fontSize:11,color:C.purple,fontWeight:'600'},
  tagRow:{flexDirection:'row',gap:6,flexWrap:'wrap'},
  tag:{borderRadius:20,paddingHorizontal:8,paddingVertical:2,backgroundColor:C.bg,borderWidth:1,borderColor:C.border},
  tagTxt:{fontSize:10,color:C.mid},
  curatorBadge:{alignSelf:'flex-start',marginTop:8,backgroundColor:C.greenPale,borderRadius:20,paddingHorizontal:8,paddingVertical:2,borderWidth:1,borderColor:C.greenBorder},
  curatorTxt:{fontSize:10,color:C.green,fontWeight:'600'},
});

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
const TodaysMenuScreen = ({ navigation, route }) => {
  const user = route?.params?.user || null;
  const [menuData, setMenuData] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  const loadMenu = useCallback(async () => {
    if (!user?.userId) return;
    setLoading(true); setError('');
    const entries = await intakeCtrl.fetchTodayEntries(user.userId).catch(() => []);
    const result  = await menuCtrl.fetchTodaysMenu(user.userId, entries || []);
    if (result.success) setMenuData(result);
    else setError(result.message || 'Unable to load recommendations.');
    setLoading(false);
  }, [user?.userId]);

  useFocusEffect(useCallback(() => { loadMenu(); }, [loadMenu]));

  const macroProgress = menuData ? menuCtrl.getMacroProgress(menuData.targets, menuData.consumed) : [];

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white}/>
      <NavBar onMenuPress={() => navigation.navigate('AccountSettingsScreen', { user })}/>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <View style={s.header}>
          <View style={s.premBadge}><Text style={s.premBadgeTxt}>☆ Premium</Text></View>
          <Text style={s.pageTitle}>Today's Menu</Text>
          <Text style={s.pageSub}>Recipes recommended based on your remaining nutrition targets for today</Text>
        </View>

        {loading ? <ActivityIndicator size="large" color={C.purple} style={{marginTop:40}}/> : error ? (
          <Text style={s.errorTxt}>{error}</Text>
        ) : (
          <>
            <RemainingBudgetCard remaining={menuData.remaining} targets={menuData.targets}/>

            <View style={s.progressCard}>
              <Text style={s.progressTitle}>📊 Today's Progress</Text>
              {macroProgress.map(m=>(
                <MacroBar key={m.label} label={m.label} consumed={m.consumed}
                  goal={m.goal} unit={m.unit} percentage={m.percentage}/>
              ))}
            </View>

            {menuData.matchingRecipes.length === 0 ? (
              <View style={s.emptyCard}>
                <Text style={s.emptyEmoji}>🎯</Text>
                <Text style={s.emptyTitle}>Budget Nearly Full</Text>
                <Text style={s.emptyBody}>{menuData.message || "You've made great progress today!"}</Text>
              </View>
            ) : (
              <>
                <Text style={s.sectionTitle}>{menuData.matchingRecipes.length} Recipe{menuData.matchingRecipes.length!==1?'s':''} That Fit Your Budget</Text>
                {menuData.matchingRecipes.map((r,i) => <RecipeCard key={r._id||r.recipeId||i} recipe={r}/>)}
              </>
            )}
          </>
        )}
      </ScrollView>
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
  progressCard:{backgroundColor:C.white,borderRadius:14,padding:18,marginBottom:14,borderWidth:1,borderColor:C.border},
  progressTitle:{fontSize:15,fontWeight:'700',color:C.dark,marginBottom:14},
  sectionTitle:{fontSize:15,fontWeight:'700',color:C.dark,marginBottom:10},
  emptyCard:{backgroundColor:C.white,borderRadius:14,padding:40,alignItems:'center',borderWidth:1,borderColor:C.border},
  emptyEmoji:{fontSize:48,marginBottom:12},emptyTitle:{fontSize:18,fontWeight:'700',color:C.dark,marginBottom:6},
  emptyBody:{fontSize:14,color:C.subtle,textAlign:'center',lineHeight:20},
  errorTxt:{textAlign:'center',color:'#DC2626',paddingTop:40},
});

export default TodaysMenuScreen;
