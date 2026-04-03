import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, StatusBar, ActivityIndicator, Modal, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import ViewHealthReportController  from '../controller/ViewHealthReportController';
import ViewWeightHistoryController from '../controller/ViewWeightHistoryController';
import ViewHeightHistoryController from '../controller/ViewHeightHistoryController';
import LogHeightController         from '../controller/LogHeightController';
import ViewHealthGoalController    from '../controller/ViewHealthGoalController';
import SetHealthGoalController     from '../controller/SetHealthGoalController';
import WeightEntry                 from '../entity/WeightEntry';
import { GOAL_TYPES, ACTIVITY_LEVELS } from '../entity/HealthGoal';

const reportCtrl = new ViewHealthReportController();
const weightCtrl = new ViewWeightHistoryController();
const heightCtrl = new ViewHeightHistoryController();
const logHtCtrl  = new LogHeightController();
const viewGoalCtrl = new ViewHealthGoalController();
const setGoalCtrl  = new SetHealthGoalController();

const TABS = ['Daily Progress', 'Body Metrics', 'History', 'Monthly Summary'];

const C = {
  purple:'#7C3AED', purpleLight:'#EDE9FE', dark:'#111827', mid:'#374151',
  body:'#4B5563', subtle:'#6B7280', white:'#FFFFFF', border:'#E5E7EB', bg:'#F9FAFB',
  green:'#16A34A', orange:'#D97706', red:'#DC2626',
  successBg:'#F0FDF4', successBorder:'#BBF7D0', successText:'#15803D',
};

const NavBar = ({ onMenu }) => (
  <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:20,paddingVertical:14,backgroundColor:C.white,borderBottomWidth:1,borderBottomColor:C.border}}>
    <View style={{flexDirection:'row',alignItems:'center',gap:6}}>
      <Text style={{fontSize:20}}>🍴</Text>
      <Text style={{fontSize:20,fontWeight:'800',color:C.dark}}>BiteWise</Text>
    </View>
    <TouchableOpacity onPress={onMenu} style={{padding:6,gap:4,alignItems:'flex-end'}}>
      <View style={{width:22,height:2.5,backgroundColor:C.dark,borderRadius:2}}/>
      <View style={{width:18,height:2.5,backgroundColor:C.dark,borderRadius:2}}/>
      <View style={{width:22,height:2.5,backgroundColor:C.dark,borderRadius:2}}/>
    </TouchableOpacity>
  </View>
);

const Banner = ({ msg }) => !msg ? null : (
  <View style={{flexDirection:'row',alignItems:'center',gap:10,paddingHorizontal:16,paddingVertical:12,backgroundColor:C.successBg,borderBottomWidth:1,borderBottomColor:C.successBorder}}>
    <Text style={{fontSize:16}}>✅</Text>
    <Text style={{flex:1,fontSize:14,fontWeight:'500',color:C.successText}}>{msg}</Text>
  </View>
);

const TabBar = ({ active, onSelect }) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{backgroundColor:C.white,borderBottomWidth:1,borderBottomColor:C.border}} contentContainerStyle={{paddingHorizontal:16}}>
    {TABS.map((t) => (
      <TouchableOpacity key={t} onPress={() => onSelect(t)}
        style={{paddingVertical:12,paddingHorizontal:14,borderBottomWidth:2,borderBottomColor:active===t?C.purple:'transparent',marginRight:4}}>
        <Text style={{fontSize:13,fontWeight:active===t?'700':'500',color:active===t?C.purple:C.subtle}}>{t}</Text>
      </TouchableOpacity>
    ))}
  </ScrollView>
);

const StatCard = ({ label, value, sub }) => (
  <View style={{backgroundColor:C.white,borderRadius:14,padding:16,borderWidth:1,borderColor:C.border,marginBottom:12}}>
    <Text style={{fontSize:13,color:C.subtle,marginBottom:4}}>{label}</Text>
    <Text style={{fontSize:28,fontWeight:'800',color:C.purple}}>{value}</Text>
    {sub ? <Text style={{fontSize:12,color:C.subtle,marginTop:2}}>{sub}</Text> : null}
  </View>
);

// Simple bar chart — no external lib
const BarChart = ({ data, label }) => {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <View style={{backgroundColor:C.white,borderRadius:14,padding:16,borderWidth:1,borderColor:C.border,marginBottom:12}}>
      {label ? <Text style={{fontSize:14,fontWeight:'700',color:C.dark,marginBottom:12}}>{label}</Text> : null}
      <View style={{flexDirection:'row',alignItems:'flex-end',gap:4,height:80}}>
        {data.map((d, i) => (
          <View key={i} style={{alignItems:'center',flex:1}}>
            <View style={{width:'80%',height:Math.max(4,(d.value/max)*70),backgroundColor:C.purple,borderRadius:3}}/>
            <Text style={{fontSize:9,color:C.subtle,marginTop:2,textAlign:'center'}} numberOfLines={1}>{d.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// ────────────────────────────────────────────────────────────────
// REUSABLE: Height Log Modal (#36, #87 Log / #89 Update)
// ────────────────────────────────────────────────────────────────
const HeightModal = ({ visible, onClose, onSubmit, isLoading, error }) => {
  const [height, setHeight] = useState('');
  // Notes removed for now (kept commented so it is easy to restore later if needed)
  // const [notes,  setNotes]  = useState('');
  const handleClose = () => { setHeight(''); onClose(); };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={{flex:1,backgroundColor:'rgba(0,0,0,0.45)',justifyContent:'center',paddingHorizontal:16}}>
        <View style={{backgroundColor:C.white,borderRadius:16,padding:22,paddingTop:40}}>
          <TouchableOpacity onPress={handleClose} style={{position:'absolute',top:12,right:16}}>
            <Text style={{fontSize:16,color:C.subtle}}>✕</Text>
          </TouchableOpacity>
          <Text style={{fontSize:16,fontWeight:'700',color:C.dark,textAlign:'center',marginBottom:18}}>Update Height</Text>
          <Text style={{fontSize:13,fontWeight:'600',color:C.dark,marginBottom:4}}>Height (cm) *</Text>
          <TextInput
            style={{backgroundColor:C.bg,borderRadius:8,paddingHorizontal:12,paddingVertical:10,fontSize:14,color:C.dark,borderWidth:1,borderColor:error?'#FECACA':C.border,marginBottom:4}}
            value={height} onChangeText={setHeight} placeholder="e.g., 170" keyboardType="numeric" placeholderTextColor={C.subtle}
          />
          {error ? <Text style={{fontSize:12,color:C.red,marginBottom:8}}>{error}</Text> : <View style={{marginBottom:12}}/>}
          {/* Notes removed for now (kept commented so it is easy to restore later if needed)
          <Text style={{fontSize:13,fontWeight:'600',color:C.dark,marginBottom:4}}>Notes (optional)</Text>
          <TextInput
            style={{backgroundColor:C.bg,borderRadius:8,paddingHorizontal:12,paddingVertical:10,fontSize:14,color:C.dark,borderWidth:1,borderColor:C.border,marginBottom:16}}
            value={notes} onChangeText={setNotes} placeholder="e.g., Annual checkup" placeholderTextColor={C.subtle}
          />
          */}
          <TouchableOpacity
            style={{backgroundColor:C.purple,borderRadius:10,paddingVertical:14,alignItems:'center',opacity:isLoading?0.6:1}}
            onPress={() => onSubmit(height)} disabled={isLoading} activeOpacity={0.85}>
            <Text style={{fontSize:15,fontWeight:'700',color:C.white}}>{isLoading?'Saving...':'Update Height'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ────────────────────────────────────────────────────────────────
// REUSABLE: Health Goal Modal (#38, #40, #90)
// ────────────────────────────────────────────────────────────────
const GoalModal = ({ visible, existingGoal, onClose, onSave, isLoading, errors }) => {
  const [goalType,     setGoalType]     = useState(existingGoal?.goalType     || '');
  const [customGoal,   setCustomGoal]   = useState(existingGoal?.customGoal   || '');
  const [activityLevel,setActivityLevel]= useState(existingGoal?.activityLevel|| '');
  const [targetWeight, setTargetWeight] = useState(existingGoal?.targetWeight ? String(existingGoal.targetWeight) : '');
  const [targetDate,   setTargetDate]   = useState(existingGoal?.targetDate   || '');

  const handleClose = () => { onClose(); };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={{flex:1,backgroundColor:'rgba(0,0,0,0.45)',justifyContent:'flex-end'}}>
        <View style={{backgroundColor:C.white,borderTopLeftRadius:20,borderTopRightRadius:20,padding:20,paddingTop:40,maxHeight:'90%'}}>
          <TouchableOpacity onPress={handleClose} style={{position:'absolute',top:12,right:16}}>
            <Text style={{fontSize:16,color:C.subtle}}>✕</Text>
          </TouchableOpacity>
          <Text style={{fontSize:16,fontWeight:'700',color:C.dark,marginBottom:4}}>{existingGoal?'Update Goal':'Set Health Goal'}</Text>
          <Text style={{fontSize:13,color:C.subtle,marginBottom:18}}>Define your goal to get personalised recommendations</Text>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={{fontSize:13,fontWeight:'600',color:C.dark,marginBottom:8}}>Goal Type *</Text>
            <View style={{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:errors?.goalType?0:14}}>
              {Object.values(GOAL_TYPES).map((g) => (
                <TouchableOpacity key={g} style={{paddingHorizontal:12,paddingVertical:7,borderRadius:20,borderWidth:1,borderColor:goalType===g?C.purple:C.border,backgroundColor:goalType===g?C.purpleLight:C.white}}
                  onPress={() => setGoalType(g)} activeOpacity={0.8}>
                  <Text style={{fontSize:13,color:goalType===g?C.purple:C.mid,fontWeight:goalType===g?'700':'400'}}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors?.goalType ? <Text style={{fontSize:12,color:C.red,marginBottom:10}}>{errors.goalType}</Text> : null}

            {goalType === 'Custom' && (
              <>
                <Text style={{fontSize:13,fontWeight:'600',color:C.dark,marginBottom:4}}>Describe your goal *</Text>
                <TextInput style={{backgroundColor:C.bg,borderRadius:8,paddingHorizontal:12,paddingVertical:10,fontSize:14,color:C.dark,borderWidth:1,borderColor:errors?.customGoal?'#FECACA':C.border,marginBottom:errors?.customGoal?0:12}}
                  value={customGoal} onChangeText={setCustomGoal} placeholder="e.g., Run 5km without stopping" placeholderTextColor={C.subtle}/>
                {errors?.customGoal ? <Text style={{fontSize:12,color:C.red,marginBottom:10}}>{errors.customGoal}</Text> : null}
              </>
            )}

            <Text style={{fontSize:13,fontWeight:'600',color:C.dark,marginBottom:8}}>Activity Level *</Text>
            <View style={{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:errors?.activityLevel?0:14}}>
              {Object.values(ACTIVITY_LEVELS).map((a) => (
                <TouchableOpacity key={a} style={{paddingHorizontal:12,paddingVertical:7,borderRadius:20,borderWidth:1,borderColor:activityLevel===a?C.purple:C.border,backgroundColor:activityLevel===a?C.purpleLight:C.white}}
                  onPress={() => setActivityLevel(a)} activeOpacity={0.8}>
                  <Text style={{fontSize:13,color:activityLevel===a?C.purple:C.mid,fontWeight:activityLevel===a?'700':'400'}}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors?.activityLevel ? <Text style={{fontSize:12,color:C.red,marginBottom:10}}>{errors.activityLevel}</Text> : null}

            <Text style={{fontSize:13,fontWeight:'600',color:C.dark,marginBottom:4}}>Target Weight (kg, optional)</Text>
            <TextInput style={{backgroundColor:C.bg,borderRadius:8,paddingHorizontal:12,paddingVertical:10,fontSize:14,color:C.dark,borderWidth:1,borderColor:C.border,marginBottom:12}}
              value={targetWeight} onChangeText={setTargetWeight} placeholder="e.g., 65" keyboardType="numeric" placeholderTextColor={C.subtle}/>

            <Text style={{fontSize:13,fontWeight:'600',color:C.dark,marginBottom:4}}>Target Date (optional)</Text>
            <TextInput style={{backgroundColor:C.bg,borderRadius:8,paddingHorizontal:12,paddingVertical:10,fontSize:14,color:C.dark,borderWidth:1,borderColor:C.border,marginBottom:20}}
              value={targetDate} onChangeText={setTargetDate} placeholder="YYYY-MM-DD" placeholderTextColor={C.subtle}/>

            <TouchableOpacity style={{backgroundColor:C.purple,borderRadius:10,paddingVertical:14,alignItems:'center',opacity:isLoading?0.6:1}}
              onPress={() => onSave({ goalType, customGoal, activityLevel, targetWeight: targetWeight||null, targetDate: targetDate||null })}
              disabled={isLoading} activeOpacity={0.85}>
              <Text style={{fontSize:15,fontWeight:'700',color:C.white}}>{isLoading?'Saving...':'Save Goal'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ── DAILY PROGRESS TAB — #31, #32, #33, #80, #81, #82 ──────────────────────
const DailyProgressTab = ({ userId }) => {
  const [report,  setReport]  = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    reportCtrl.fetchDailyReport(userId, today).then((r) => {
      if (r.success) setReport(r.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <ActivityIndicator size="large" color={C.purple} style={{marginTop:40}}/>;

  const calorieData = report?.weeklyCalories || [];
  const macroData   = report?.weeklyMacros   || [];

  return (
    <ScrollView contentContainerStyle={{paddingHorizontal:16,paddingBottom:32}}>
      <View style={{height:20}}/>
      {calorieData.length > 0
        ? <BarChart data={calorieData} label="7-Day Calorie Trend"/>
        : null}
      {report && (
        <View style={{backgroundColor:C.white,borderRadius:14,padding:16,borderWidth:1,borderColor:C.border,marginBottom:12}}>
          <Text style={{fontSize:14,fontWeight:'700',color:C.dark,marginBottom:12}}>7-Day Macronutrient Breakdown</Text>
          <View style={{flexDirection:'row',flexWrap:'wrap',gap:12}}>
            {[
              {l:'Avg Daily Calories', v:report.avgCalories??0},
              {l:'Avg Daily Protein',  v:`${report.avgProtein??0}g`},
              {l:'Avg Daily Carbs',    v:`${report.avgCarbs??0}g`},
              {l:'Avg Daily Fat',      v:`${report.avgFat??0}g`},
            ].map((s) => (
              <View key={s.l} style={{width:'45%'}}>
                <Text style={{fontSize:11,color:C.subtle,marginBottom:2}}>{s.l}</Text>
                <Text style={{fontSize:22,fontWeight:'800',color:C.dark}}>{s.v}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
      {!report && (
        <View style={{alignItems:'center',paddingVertical:48}}>
          <Text style={{fontSize:40,marginBottom:12}}>📊</Text>
          <Text style={{fontSize:16,fontWeight:'700',color:C.dark,marginBottom:6}}>No Data Yet</Text>
          <Text style={{fontSize:13,color:C.subtle,textAlign:'center'}}>Start logging meals to see your daily progress report.</Text>
        </View>
      )}
    </ScrollView>
  );
};

// ── BODY METRICS TAB — #34-37, #41-42, #84-87, #89, #91-92, goal #38-40, #90 ─
const BodyMetricsTab = ({ userId, navigation, user, onBanner }) => {
  const [weightData,  setWeightData]  = useState({ latest: null, loading: true });
  const [heightData,  setHeightData]  = useState({ latest: null, loading: true });
  const [goal,        setGoal]        = useState(null);
  const [showHtModal, setShowHtModal] = useState(false);
  const [showGoalModal,setShowGoalModal]=useState(false);
  const [htError,     setHtError]     = useState('');
  const [htLoading,   setHtLoading]   = useState(false);
  const [goalLoading, setGoalLoading] = useState(false);
  const [goalErrors,  setGoalErrors]  = useState({});

  const loadBodyMetrics = useCallback(() => {
    weightCtrl.fetchWeightHistory(userId).then((r) => setWeightData({ latest: r.latest, loading: false }));
    heightCtrl.fetchHeightHistory(userId).then((r) => setHeightData({ latest: r.latest, loading: false }));
    viewGoalCtrl.fetchGoal(userId).then((r) => { if (r.success) setGoal(r.data); });
  }, [userId]);

  useEffect(() => {
    loadBodyMetrics();
  }, [loadBodyMetrics]);

  // Refresh metrics whenever Reports screen becomes active again
  // (e.g. after returning from WeightTrackingScreen).
  useFocusEffect(
    useCallback(() => {
      loadBodyMetrics();
    }, [loadBodyMetrics])
  );

  const weight = weightData.latest?.weightKg ?? null;
  const height = heightData.latest?.heightCm ?? null;
  const bmi    = WeightEntry.calculateBMI(weight, height);
  const bmiCat = WeightEntry.getBMICategory(bmi);
  const bmiColor = !bmi ? C.subtle : bmi < 18.5 ? C.orange : bmi < 25 ? C.green : bmi < 30 ? C.orange : C.red;

  // UC #36, #87, #89 — log/update height
  const handleHeightSubmit = useCallback(async (ht) => {
    setHtError('');
    setHtLoading(true);
    const result = await logHtCtrl.logHeight(userId, { heightCm: ht });
    setHtLoading(false);
    if (result.success) {
      setHeightData({ latest: result.data, loading: false });
      setShowHtModal(false);
      onBanner('Height updated successfully');
    } else {
      setHtError(result.message);
    }
  }, [userId]);

  // UC #38, #40, #90 — save/update health goal
  const handleGoalSave = useCallback(async (fields) => {
    setGoalErrors({});
    setGoalLoading(true);
    const result = goal?.goalId
      ? await setGoalCtrl.updateGoal(goal.goalId, fields)
      : await setGoalCtrl.setGoal(userId, fields);
    setGoalLoading(false);
    if (result.success) {
      setGoal(result.data);
      setShowGoalModal(false);
      onBanner(goal ? 'Goal updated!' : 'Health goal set!');
    } else if (result.field) {
      setGoalErrors({ [result.field]: result.message });
    }
  }, [goal, userId]);

  return (
    <ScrollView contentContainerStyle={{paddingHorizontal:16,paddingBottom:32}}>
      <View style={{height:20}}/>

      {/* Health Goal — UC #38, #39, #40, #90 */}
      <View style={{backgroundColor:C.white,borderRadius:14,padding:16,borderWidth:1,borderColor:C.border,marginBottom:12}}>
        <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
          <Text style={{fontSize:14,fontWeight:'700',color:C.dark}}>🎯  Health Goal</Text>
          <TouchableOpacity onPress={() => setShowGoalModal(true)} activeOpacity={0.8}
            style={{backgroundColor:C.purpleLight,borderRadius:20,paddingHorizontal:12,paddingVertical:5}}>
            <Text style={{fontSize:12,fontWeight:'600',color:C.purple}}>{goal ? 'Edit Goal' : 'Set Goal'}</Text>
          </TouchableOpacity>
        </View>
        {goal ? (
          <>
            <Text style={{fontSize:20,fontWeight:'800',color:C.purple,marginBottom:4}}>{goal.getDisplayGoal?.() || goal.goalType}</Text>
            <Text style={{fontSize:13,color:C.subtle}}>Activity: {goal.activityLevel}</Text>
            {goal.targetWeight ? <Text style={{fontSize:13,color:C.subtle}}>Target weight: {goal.targetWeight} kg</Text> : null}
            {goal.targetDate   ? <Text style={{fontSize:13,color:C.subtle}}>Target date: {goal.targetDate}</Text> : null}
          </>
        ) : (
          <View style={{alignItems:'center',paddingVertical:16}}>
            <Text style={{fontSize:13,color:C.subtle,textAlign:'center',marginBottom:12}}>No goal set yet. Set a health goal to get personalised recommendations.</Text>
            <TouchableOpacity style={{backgroundColor:C.purple,borderRadius:8,paddingVertical:9,paddingHorizontal:20}} onPress={() => setShowGoalModal(true)} activeOpacity={0.85}>
              <Text style={{fontSize:13,fontWeight:'700',color:C.white}}>+ Set Your Goal</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Current Weight — UC #84, #86 */}
      <View style={{backgroundColor:C.white,borderRadius:14,padding:16,borderWidth:1,borderColor:C.border,marginBottom:12}}>
        <Text style={{fontSize:13,color:C.subtle,marginBottom:4}}>⚖️  Current Weight</Text>
        {weightData.loading ? <ActivityIndicator color={C.purple}/> : (
          <>
            <Text style={{fontSize:32,fontWeight:'800',color:C.dark,marginBottom:10}}>
              {weight ? `${weight} kg` : '—'}
            </Text>
            <TouchableOpacity style={{backgroundColor:C.purple,borderRadius:8,paddingVertical:11,alignItems:'center'}}
              onPress={() => navigation.navigate('WeightTrackingScreen', { user })} activeOpacity={0.85}>
              <Text style={{fontSize:14,fontWeight:'700',color:C.white}}>Update Weight</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Current Height — UC #36, #87, #89 */}
      <View style={{backgroundColor:C.white,borderRadius:14,padding:16,borderWidth:1,borderColor:C.border,marginBottom:12}}>
        <Text style={{fontSize:13,color:C.subtle,marginBottom:4}}>📏  Current Height</Text>
        {heightData.loading ? <ActivityIndicator color={C.purple}/> : (
          <>
            <Text style={{fontSize:32,fontWeight:'800',color:C.dark,marginBottom:10}}>
              {height ? `${height} cm` : '—'}
            </Text>
            <TouchableOpacity style={{backgroundColor:C.purple,borderRadius:8,paddingVertical:11,alignItems:'center'}}
              onPress={() => { setHtError(''); setShowHtModal(true); }} activeOpacity={0.85}>
              <Text style={{fontSize:14,fontWeight:'700',color:C.white}}>Update Height</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Current BMI — UC #41, #42, #91, #92 */}
      <View style={{backgroundColor:C.white,borderRadius:14,padding:16,borderWidth:1,borderColor:C.border,marginBottom:12}}>
        <Text style={{fontSize:13,color:C.subtle,marginBottom:4}}>📈  Current BMI</Text>
        <Text style={{fontSize:36,fontWeight:'800',color:bmiColor,marginBottom:4}}>{bmi ?? '—'}</Text>
        {bmi && <Text style={{fontSize:14,color:bmiColor,fontWeight:'600',marginBottom:10}}>{bmiCat}</Text>}
        <View style={{backgroundColor:C.bg,borderRadius:8,padding:10}}>
          {[{l:'Underweight',v:'< 18.5'},{l:'Normal',v:'18.5 - 24.9'},{l:'Overweight',v:'25 - 29.9'},{l:'Obese',v:'≥ 30'}].map((b) => (
            <Text key={b.l} style={{fontSize:12,color:C.body,marginBottom:2}}>• {b.l}: {b.v}</Text>
          ))}
        </View>
      </View>

      {/* Modals */}
      <HeightModal visible={showHtModal} onClose={() => setShowHtModal(false)} onSubmit={handleHeightSubmit} isLoading={htLoading} error={htError}/>
      <GoalModal   visible={showGoalModal} existingGoal={goal} onClose={() => setShowGoalModal(false)} onSave={handleGoalSave} isLoading={goalLoading} errors={goalErrors}/>
    </ScrollView>
  );
};

// ── HISTORY TAB — #35, #37, #43, #85, #88, #93 ─────────────────────────────
const HistoryTab = ({ userId }) => {
  const [weightEntries, setWeightEntries] = useState([]);
  const [heightEntries, setHeightEntries] = useState([]);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    Promise.all([
      weightCtrl.fetchWeightHistory(userId),
      heightCtrl.fetchHeightHistory(userId),
    ]).then(([w, h]) => {
      if (w.success) setWeightEntries(w.data);
      if (h.success) setHeightEntries(h.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <ActivityIndicator size="large" color={C.purple} style={{marginTop:40}}/>;

  const wData = weightEntries.slice(0,7).reverse().map((e) => ({
    label: new Date(e.loggedAt).toLocaleDateString('en-SG',{month:'short',day:'numeric'}),
    value: e.weightKg,
  }));
  const hData = heightEntries.slice(0,7).reverse().map((e) => ({
    label: new Date(e.loggedAt).toLocaleDateString('en-SG',{month:'short',day:'numeric'}),
    value: e.heightCm,
  }));

  const Section = ({ title, entries, unit, chartData }) => (
    <View style={{backgroundColor:C.white,borderRadius:14,padding:16,borderWidth:1,borderColor:C.border,marginBottom:12}}>
      <Text style={{fontSize:14,fontWeight:'700',color:C.dark,marginBottom:10}}>{title}</Text>
      {entries.length > 0 ? (
        <>
          {chartData.length > 1 && <BarChart data={chartData} label=""/>}
          <Text style={{fontSize:13,fontWeight:'600',color:C.dark,marginBottom:6}}>Recent Entries:</Text>
          {entries.slice(0,5).map((e,i) => (
            <View key={i} style={{flexDirection:'row',justifyContent:'space-between',paddingVertical:6,borderTopWidth:i===0?0:1,borderTopColor:C.border}}>
              <Text style={{fontSize:13,color:C.body}}>{new Date(e.loggedAt).toLocaleDateString('en-SG')}</Text>
              <Text style={{fontSize:13,fontWeight:'700',color:C.dark}}>{e[unit==='kg'?'weightKg':'heightCm']} {unit}</Text>
            </View>
          ))}
        </>
      ) : <Text style={{fontSize:13,color:C.subtle,textAlign:'center',paddingVertical:16}}>No records yet.</Text>}
    </View>
  );

  return (
    <ScrollView contentContainerStyle={{paddingHorizontal:16,paddingBottom:32}}>
      <View style={{height:20}}/>
      <Section title="Weight History" entries={weightEntries} unit="kg" chartData={wData}/>
      <Section title="Height History" entries={heightEntries} unit="cm" chartData={hData}/>
      {/* BMI History — #43, #93 */}
      <View style={{backgroundColor:C.white,borderRadius:14,padding:16,borderWidth:1,borderColor:C.border}}>
        <Text style={{fontSize:14,fontWeight:'700',color:C.dark,marginBottom:10}}>BMI History</Text>
        {weightEntries.length > 0 && heightEntries.length > 0 ? (
          weightEntries.slice(0,5).map((w,i) => {
            const bmi = WeightEntry.calculateBMI(w.weightKg, heightEntries[0]?.heightCm);
            return bmi ? (
              <View key={i} style={{flexDirection:'row',justifyContent:'space-between',paddingVertical:6,borderTopWidth:i===0?0:1,borderTopColor:C.border}}>
                <Text style={{fontSize:13,color:C.body}}>{new Date(w.loggedAt).toLocaleDateString('en-SG')}</Text>
                <Text style={{fontSize:13,fontWeight:'700',color:C.dark}}>{bmi} — {WeightEntry.getBMICategory(bmi)}</Text>
              </View>
            ) : null;
          })
        ) : <Text style={{fontSize:13,color:C.subtle,textAlign:'center',paddingVertical:16}}>No BMI history available. Update your weight and height to track BMI!</Text>}
      </View>
    </ScrollView>
  );
};

// ── MONTHLY SUMMARY TAB — #33, #82 ──────────────────────────────────────────
const MonthlySummaryTab = ({ userId }) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
    reportCtrl.fetchMonthlyReport(userId, now.getFullYear(), now.getMonth() + 1).then((r) => {
      if (r.success) setSummary(r.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <ActivityIndicator size="large" color={C.purple} style={{marginTop:40}}/>;

  return (
    <ScrollView contentContainerStyle={{paddingHorizontal:16,paddingBottom:32}}>
      <View style={{height:20}}/>
      <StatCard label="Total Entries"   value={summary?.totalEntries   ?? 0} sub="Food items logged"/>
      <StatCard label="Total Calories"  value={summary?.totalCalories  ?? 0} sub="Calories tracked"/>
      <StatCard label="Daily Average"   value={summary?.avgCalories    ?? 0} sub="Calories per day"/>
      {!summary && (
        <View style={{alignItems:'center',paddingVertical:32}}>
          <Text style={{fontSize:40,marginBottom:12}}>📋</Text>
          <Text style={{fontSize:16,fontWeight:'700',color:C.dark,marginBottom:6}}>No Summary Yet</Text>
          <Text style={{fontSize:13,color:C.subtle,textAlign:'center'}}>Log meals consistently to generate a monthly summary.</Text>
        </View>
      )}
    </ScrollView>
  );
};

// ── MAIN SCREEN ──────────────────────────────────────────────────────────────
const ReportsScreen = ({ navigation, route }) => {
  const user = route?.params?.user || null;
  const [activeTab, setActiveTab] = useState('Daily Progress');
  const [banner,    setBanner]    = useState('');

  const handleBanner = (msg) => { setBanner(msg); setTimeout(() => setBanner(''), 4000); };

  return (
    <SafeAreaView style={{flex:1,backgroundColor:C.bg}}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white}/>
      <NavBar onMenu={() => navigation.navigate('AccountSettingsScreen', { user })}/>
      <Banner msg={banner}/>
      <View style={{paddingHorizontal:16,paddingTop:16,paddingBottom:8,backgroundColor:C.white}}>
        <Text style={{fontSize:24,fontWeight:'800',color:C.dark}}>Health Reports & Metrics</Text>
      </View>
      <TabBar active={activeTab} onSelect={setActiveTab}/>
      {activeTab === 'Daily Progress'  && <DailyProgressTab  userId={user?.userId}/>}
      {activeTab === 'Body Metrics'    && <BodyMetricsTab    userId={user?.userId} navigation={navigation} user={user} onBanner={handleBanner}/>}
      {activeTab === 'History'         && <HistoryTab        userId={user?.userId}/>}
      {activeTab === 'Monthly Summary' && <MonthlySummaryTab userId={user?.userId}/>}
    </SafeAreaView>
  );
};

export default ReportsScreen;
