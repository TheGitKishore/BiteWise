// MindfulSnackingScreen.jsx — UC #75 Premium User – View Mindful Snacking Guide
// Sprint 9: Complete UI rewrite matching screenshots exactly.
// Sections: Core Principles • Managing Cravings • When to Snack •
//           Smart Snack Ideas (filter chips) • Portion Control • Warning card
// Premium User only

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ViewMindfulSnackingController from '../controller/ViewMindfulSnackingController';

const ctrl = new ViewMindfulSnackingController();

const C = {
  purple:'#7C3AED', purpleLight:'#EDE9FE', dark:'#111827', mid:'#374151',
  body:'#4B5563', subtle:'#6B7280', white:'#FFFFFF', border:'#E5E7EB', bg:'#F9FAFB',
  orange:'#EA580C', orangeBg:'#FFF7ED', orangeBorder:'#FED7AA',
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

const Card = ({children,style}) => <View style={[cd.card,style]}>{children}</View>;
const cd = StyleSheet.create({card:{backgroundColor:C.white,borderRadius:14,padding:18,marginBottom:14,borderWidth:1,borderColor:C.border}});

const SectionHdr = ({icon,title}) => (
  <View style={sh.row}><Text style={sh.icon}>{icon}</Text><Text style={sh.title}>{title}</Text></View>
);
const sh = StyleSheet.create({
  row:{flexDirection:'row',alignItems:'center',gap:8,marginBottom:16},
  icon:{fontSize:18},title:{fontSize:16,fontWeight:'700',color:C.dark},
});

// Principle checklist item
const PrincipleItem = ({item}) => (
  <View style={pi.row}>
    <View style={pi.circle}><Text style={pi.check}>✓</Text></View>
    <View style={pi.content}>
      <Text style={pi.title}>{item.title}</Text>
      <Text style={pi.desc}>{item.description}</Text>
    </View>
  </View>
);
const pi = StyleSheet.create({
  row:{flexDirection:'row',gap:12,marginBottom:18},
  circle:{width:24,height:24,borderRadius:12,borderWidth:2,borderColor:C.purple,alignItems:'center',justifyContent:'center',marginTop:1},
  check:{fontSize:12,color:C.purple,fontWeight:'800'},
  content:{flex:1},title:{fontSize:15,fontWeight:'700',color:C.dark,marginBottom:3},
  desc:{fontSize:13,color:C.body,lineHeight:19},
});

// Craving item with colored left border
const CravingItem = ({item}) => (
  <View style={[cr.row,{borderLeftColor:item.borderColor}]}>
    <Text style={cr.title}>{item.title}</Text>
    <Text style={cr.desc}>{item.description}</Text>
  </View>
);
const cr = StyleSheet.create({
  row:{borderLeftWidth:4,paddingLeft:14,marginBottom:20},
  title:{fontSize:15,fontWeight:'700',color:C.dark,marginBottom:4},
  desc:{fontSize:13,color:C.body,lineHeight:19},
});

// When to Snack time card
const TimeCard = ({item}) => (
  <View style={[tc.card,{backgroundColor:item.bgColor}]}>
    <Text style={tc.label}>{item.label}</Text>
    <Text style={tc.desc}>{item.description}</Text>
    <Text style={[tc.best,{color:item.bestColor}]}>Best: {item.best}</Text>
  </View>
);
const tc = StyleSheet.create({
  card:{borderRadius:12,padding:16,marginBottom:10},
  label:{fontSize:15,fontWeight:'700',color:C.dark,marginBottom:6},
  desc:{fontSize:13,color:C.body,lineHeight:19,marginBottom:8},
  best:{fontSize:13,fontWeight:'700'},
});

// Smart Snack Idea card
const SnackCard = ({snack}) => (
  <View style={sc.card}>
    <Text style={sc.name}>{snack.name}</Text>
    <View style={sc.macroRow}>
      {[{v:snack.cal,l:'cal'},{v:`${snack.protein}g`,l:'protein'},{v:`${snack.fiber}g`,l:'fiber'}].map((m,i)=>(
        <View key={i} style={sc.chip}>
          <Text style={sc.chipVal}>{m.v}</Text>
          <Text style={sc.chipLbl}>{m.l}</Text>
        </View>
      ))}
    </View>
    <View style={sc.timingBadge}>
      <Text style={sc.timingIcon}>⏱</Text>
      <Text style={sc.timingTxt}>{snack.timing}</Text>
    </View>
    <View style={sc.divider}/>
    <Text style={sc.benefitsLbl}>Benefits:</Text>
    {snack.benefits.map((b,i)=>(
      <View key={i} style={sc.benefitRow}>
        <Text style={sc.benefitCheck}>✓</Text>
        <Text style={sc.benefitTxt}>{b}</Text>
      </View>
    ))}
    <View style={sc.divider}/>
    <TouchableOpacity style={sc.viewBtn}>
      <Text style={sc.viewBtnTxt}>🍽️  View Recipe</Text>
    </TouchableOpacity>
  </View>
);
const sc = StyleSheet.create({
  card:{backgroundColor:C.white,borderRadius:14,padding:16,marginBottom:12,borderWidth:1,borderColor:C.border},
  name:{fontSize:17,fontWeight:'700',color:C.dark,marginBottom:12},
  macroRow:{flexDirection:'row',gap:8,marginBottom:12},
  chip:{flex:1,backgroundColor:C.purpleLight,borderRadius:8,paddingVertical:8,alignItems:'center'},
  chipVal:{fontSize:15,fontWeight:'800',color:C.purple},
  chipLbl:{fontSize:11,color:C.purple,marginTop:1},
  timingBadge:{flexDirection:'row',alignItems:'center',gap:4,alignSelf:'flex-start',backgroundColor:C.purpleLight,borderRadius:20,paddingHorizontal:10,paddingVertical:4,marginBottom:12},
  timingIcon:{fontSize:12},timingTxt:{fontSize:12,fontWeight:'600',color:C.purple},
  divider:{height:1,backgroundColor:C.border,marginBottom:12},
  benefitsLbl:{fontSize:13,fontWeight:'700',color:C.dark,marginBottom:6},
  benefitRow:{flexDirection:'row',gap:6,marginBottom:4},
  benefitCheck:{fontSize:13,color:C.purple},benefitTxt:{fontSize:13,color:C.body},
  viewBtn:{alignItems:'center'},viewBtnTxt:{fontSize:14,fontWeight:'600',color:C.purple},
});

// Filter chips
const FILTERS = ['All','Morning','Afternoon','Evening'];
const FilterChips = ({active,onSelect}) => (
  <View style={fc.row}>
    {FILTERS.map(f=>(
      <TouchableOpacity key={f} style={[fc.chip,active===f&&fc.chipActive]} onPress={()=>onSelect(f)}>
        <Text style={[fc.txt,active===f&&fc.txtActive]}>{f}</Text>
      </TouchableOpacity>
    ))}
  </View>
);
const fc = StyleSheet.create({
  row:{flexDirection:'row',gap:8,flexWrap:'wrap',marginBottom:14},
  chip:{borderWidth:1,borderColor:C.border,borderRadius:20,paddingHorizontal:14,paddingVertical:7,backgroundColor:C.white},
  chipActive:{backgroundColor:C.purple,borderColor:C.purple},
  txt:{fontSize:13,color:C.mid,fontWeight:'500'},txtActive:{color:C.white,fontWeight:'700'},
});

// Bullet item
const BulletItem = ({text,bold}) => (
  <View style={bl.row}>
    <Text style={bl.dot}>•</Text>
    <Text style={bl.txt}>{bold?<Text style={bl.bold}>{bold} </Text>:null}{text}</Text>
  </View>
);
const bl = StyleSheet.create({
  row:{flexDirection:'row',gap:8,marginBottom:8},dot:{fontSize:14,color:C.purple,lineHeight:20},
  txt:{flex:1,fontSize:13,color:C.body,lineHeight:20},bold:{fontWeight:'700',color:C.dark},
});

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
const MindfulSnackingScreen = ({ navigation, route }) => {
  const user = route?.params?.user || null;
  const [content,     setContent]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [snackFilter, setSnackFilter] = useState('All');

  useEffect(() => {
    ctrl.fetchSnackingContent().then(r => {
      if (r.success) setContent(r.data);
      else setError(r.message);
      setLoading(false);
    });
  }, []);

  const filteredSnacks = content ? ctrl.filterSnackIdeas(content.snackIdeas, snackFilter) : [];

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white}/>
      <NavBar onMenuPress={() => navigation.navigate('AccountSettingsScreen', { user })}/>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <View style={s.header}>
          <View style={s.premBadge}><Text style={s.premBadgeTxt}>☆ Premium</Text></View>
          <Text style={s.pageTitle}>Mindful Snacking Guide</Text>
          <Text style={s.pageSub}>Master your cravings and maintain your dietary goals with smart snacking strategies</Text>
        </View>

        {loading ? <Text style={s.empty}>Loading guide...</Text> : error ? <Text style={s.empty}>{error}</Text> : (
          <>
            {/* Section 1 */}
            <Card>
              <SectionHdr icon="🧠" title="Core Principles of Mindful Snacking"/>
              {content.principles.map(p => <PrincipleItem key={p.id} item={p}/>)}
            </Card>

            {/* Section 2 */}
            <Card>
              <SectionHdr icon="🎯" title="Managing Cravings"/>
              {content.cravings.map(c => <CravingItem key={c.id} item={c}/>)}
            </Card>

            {/* Section 3 */}
            <Card>
              <SectionHdr icon="⏱" title="When to Snack"/>
              {content.whenToSnack.map(w => <TimeCard key={w.id} item={w}/>)}
            </Card>

            {/* Section 4 */}
            <Card>
              <SectionHdr icon="🍎" title="Smart Snack Ideas"/>
              <FilterChips active={snackFilter} onSelect={setSnackFilter}/>
              {filteredSnacks.map(s => <SnackCard key={s.id} snack={s}/>)}
            </Card>

            {/* Section 5 */}
            <Card>
              <SectionHdr icon="↘️" title="Portion Control Made Easy"/>
              <Text style={s.subHead}>Visual Portion Guides</Text>
              {content.portionControl.visualGuides.map((g,i) => <BulletItem key={i} bold={g.item+':'} text={g.guide}/>)}
              <Text style={[s.subHead,{marginTop:14}]}>Pre-Portioning Strategies</Text>
              {content.portionControl.strategies.map((str,i) => <BulletItem key={i} text={str}/>)}
            </Card>

            {/* Section 6 */}
            <View style={s.warningCard}>
              <View style={s.warnHdr}><Text style={s.warnIcon}>⚠️</Text><Text style={s.warnTitle}>{content.warning.title}</Text></View>
              <Text style={s.warnIntro}>{content.warning.intro}</Text>
              {content.warning.signs.map((sign,i) => <Text key={i} style={s.warnSign}>• {sign}</Text>)}
              <Text style={s.warnFooter}>{content.warning.footer}</Text>
            </View>
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
  subHead:{fontSize:15,fontWeight:'700',color:C.dark,marginBottom:10},
  empty:{textAlign:'center',color:C.subtle,paddingTop:40},
  warningCard:{backgroundColor:C.orangeBg,borderRadius:14,padding:18,marginBottom:14,borderWidth:1,borderColor:C.orangeBorder},
  warnHdr:{flexDirection:'row',alignItems:'center',gap:10,marginBottom:10},
  warnIcon:{fontSize:20},warnTitle:{fontSize:16,fontWeight:'700',color:C.orange},
  warnIntro:{fontSize:13,color:C.body,marginBottom:10},
  warnSign:{fontSize:13,color:C.body,lineHeight:22,marginBottom:2},
  warnFooter:{fontSize:13,color:C.body,marginTop:10,fontStyle:'italic'},
});

export default MindfulSnackingScreen;
