// FoodAlternativesScreen.jsx — UC #74 Premium User – View Healthier Food Alternatives
// Sprint 9: Complete UI rewrite matching screenshots.
// Layout: Header → Search bar → Smart Substitutions info card →
//         Food groups (original food + alternatives) → Tips section
// No category filter chips in new design — search replaces them.
// Premium User only

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, StatusBar ,
  KeyboardAvoidingView, Platform, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ViewFoodAlternativesController from '../controller/ViewFoodAlternativesController';

const ctrl = new ViewFoodAlternativesController();

const C = {
  purple:'#7C3AED', purpleLight:'#EDE9FE', dark:'#111827', mid:'#374151',
  body:'#4B5563', subtle:'#6B7280', white:'#FFFFFF', border:'#E5E7EB', bg:'#F9FAFB',
  infoBg:'#EFF6FF', infoBorder:'#BFDBFE', infoText:'#1E40AF',
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

// Alternative card inside a food group
const AltCard = ({alt}) => (
  <View style={ac.card}>
    <View style={ac.nameRow}>
      <Text style={ac.name}>{alt.name}</Text>
      <Text style={ac.arrow}>→</Text>
    </View>
    <View style={ac.goalBadge}><Text style={ac.goalTxt}>{alt.goal}</Text></View>
    <View style={ac.macroRow}>
      {[{v:alt.cal,l:'cal'},{v:alt.protein,l:'protein'},{v:alt.carbs,l:'carbs'},{v:alt.fat,l:'fat'}].map((m,i)=>(
        <React.Fragment key={i}>
          {i>0&&<View style={ac.sep}/>}
          <View style={ac.macroCol}>
            <Text style={ac.macroVal}>{m.v}</Text>
            <Text style={ac.macroLbl}>{m.l}</Text>
          </View>
        </React.Fragment>
      ))}
    </View>
    <View style={ac.divider}/>
    <Text style={ac.benefitsLbl}>Benefits:</Text>
    {alt.benefits.map((b,i)=>(
      <View key={i} style={ac.benefitRow}>
        <Text style={ac.check}>✓</Text>
        <Text style={ac.benefitTxt}>{b}</Text>
      </View>
    ))}
  </View>
);
const ac = StyleSheet.create({
  card:{backgroundColor:C.white,borderRadius:12,padding:14,marginBottom:10,borderWidth:1,borderColor:C.border},
  nameRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:8},
  name:{fontSize:16,fontWeight:'700',color:C.dark},arrow:{fontSize:16,color:C.purple,fontWeight:'700'},
  goalBadge:{alignSelf:'flex-start',backgroundColor:C.purpleLight,borderRadius:20,paddingHorizontal:10,paddingVertical:3,marginBottom:12},
  goalTxt:{fontSize:12,color:C.purple,fontWeight:'600'},
  macroRow:{flexDirection:'row',marginBottom:12},
  macroCol:{flex:1,alignItems:'center'},sep:{width:1,backgroundColor:C.border,marginHorizontal:4},
  macroVal:{fontSize:14,fontWeight:'700',color:C.dark},macroLbl:{fontSize:11,color:C.subtle,marginTop:2},
  divider:{height:1,backgroundColor:C.border,marginBottom:10},
  benefitsLbl:{fontSize:12,fontWeight:'700',color:C.dark,marginBottom:4},
  benefitRow:{flexDirection:'row',gap:6,marginBottom:2},
  check:{fontSize:12,color:C.purple},benefitTxt:{fontSize:12,color:C.body},
});

// Food group section
const FoodGroup = ({group}) => (
  <View style={fg.wrap}>
    <View style={fg.hdr}>
      <Text style={fg.food}>{group.originalFood}</Text>
      <Text style={fg.icon}>{group.icon}</Text>
    </View>
    {group.alternatives.map(a => <AltCard key={a.id} alt={a}/>)}
  </View>
);
const fg = StyleSheet.create({
  wrap:{backgroundColor:C.white,borderRadius:14,padding:16,marginBottom:14,borderWidth:1,borderColor:C.border},
  hdr:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:12},
  food:{fontSize:20,fontWeight:'800',color:C.dark},icon:{fontSize:22,color:C.purple},
});

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
const FoodAlternativesScreen = ({ navigation, route }) => {
  const user = route?.params?.user || null;
  const [allGroups, setAllGroups] = useState([]);
  const [tips,      setTips]      = useState([]);
  const [search,    setSearch]    = useState('');
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');

  useEffect(() => {
    ctrl.fetchFoodAlternativesGrouped().then(r => {
      if (r.success) { setAllGroups(r.data); setTips(r.tips || []); }
      else setError(r.message);
      setLoading(false);
    });
  }, []);

  const displayed = ctrl.searchAlternatives(allGroups, search);

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
          <Text style={s.pageTitle}>Healthier Food Alternatives</Text>
          <Text style={s.pageSub}>Discover healthier substitutes for your favorite foods without compromising taste</Text>
        </View>

        {/* Search bar */}
        <View style={s.searchBar}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            style={s.searchInput} value={search} onChangeText={setSearch}
            placeholder="Search for food alternatives..." placeholderTextColor={C.subtle} autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}><Text style={s.clearBtn}>✕</Text></TouchableOpacity>
          )}
        </View>

        {/* Smart Substitutions info card */}
        {!loading && (
          <View style={s.infoCard}>
            <View style={s.infoHdr}><Text style={s.infoArrow}>↗</Text><Text style={s.infoTitle}>Smart Substitutions</Text></View>
            <Text style={s.infoBody}>These alternatives maintain similar taste and texture while offering better nutrition. Swap ingredients to reduce calories, increase protein, or meet your dietary goals.</Text>
          </View>
        )}

        {loading ? <Text style={s.empty}>Loading...</Text>
          : error ? <Text style={s.empty}>{error}</Text>
          : displayed.length === 0 ? <Text style={s.empty}>No alternatives found for "{search}"</Text>
          : displayed.map(g => <FoodGroup key={g.id} group={g}/>)
        }

        {/* Tips */}
        {!loading && tips.length > 0 && displayed.length > 0 && (
          <View style={s.tipsCard}>
            <Text style={s.tipsTitle}>Tips for Using Alternatives</Text>
            {tips.map((tip,i) => (
              <View key={i} style={s.tipRow}>
                <Text style={s.tipDot}>•</Text>
                <Text style={s.tipTxt}>{tip}</Text>
              </View>
            ))}
          </View>
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
  searchBar:{flexDirection:'row',alignItems:'center',backgroundColor:C.white,borderRadius:12,borderWidth:1,borderColor:C.border,paddingHorizontal:14,paddingVertical:11,marginBottom:14,gap:8},
  searchIcon:{fontSize:16}, searchInput:{flex:1,fontSize:14,color:C.dark,padding:0}, clearBtn:{fontSize:14,color:C.subtle},
  infoCard:{backgroundColor:C.infoBg,borderRadius:14,padding:16,marginBottom:14,borderWidth:1,borderColor:C.infoBorder},
  infoHdr:{flexDirection:'row',alignItems:'center',gap:8,marginBottom:8},
  infoArrow:{fontSize:16,color:C.infoText}, infoTitle:{fontSize:15,fontWeight:'700',color:C.infoText},
  infoBody:{fontSize:13,color:C.body,lineHeight:19},
  tipsCard:{backgroundColor:C.white,borderRadius:14,padding:18,marginBottom:14,borderWidth:1,borderColor:C.border},
  tipsTitle:{fontSize:16,fontWeight:'700',color:C.dark,marginBottom:12},
  tipRow:{flexDirection:'row',gap:8,marginBottom:8},tipDot:{fontSize:14,color:C.purple},
  tipTxt:{flex:1,fontSize:13,color:C.body,lineHeight:19},
  empty:{textAlign:'center',color:C.subtle,paddingTop:40},
});

export default FoodAlternativesScreen;
