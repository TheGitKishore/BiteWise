import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, StatusBar, ActivityIndicator, Modal, Dimensions,
  Keyboard, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Image} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import ViewHealthReportController  from '../controller/ViewHealthReportController';
import ViewWeightHistoryController from '../controller/ViewWeightHistoryController';
import ViewHeightHistoryController from '../controller/ViewHeightHistoryController';
import LogWeightController         from '../controller/LogWeightController';
import LogHeightController         from '../controller/LogHeightController';
import ViewHealthGoalController    from '../controller/ViewHealthGoalController';
import SetHealthGoalController     from '../controller/SetHealthGoalController';
import WeightEntry                 from '../entity/WeightEntry';
import { GOAL_TYPES, ACTIVITY_LEVELS } from '../entity/HealthGoal';

const reportCtrl = new ViewHealthReportController();
const weightCtrl = new ViewWeightHistoryController();
const heightCtrl = new ViewHeightHistoryController();
const logWtCtrl  = new LogWeightController();
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
      <Image source={require('../assets/BiteWiseLogo.png')} style={{width:20,height:20,resizeMode:'contain'}} />
      <Text style={{fontSize:20,fontWeight:'800',color:C.dark}}>BiteWise</Text>
    </View>
    <TouchableOpacity onPress={onMenu} style={{padding: 6}}>
          <Text style={{fontSize: 14, fontWeight: '500', color: '#374151'}}>← Back</Text>
        </TouchableOpacity>
  </View>
);

const Banner = ({ msg }) => !msg ? null : (
  <View style={{flexDirection:'row',alignItems:'center',gap:10,paddingHorizontal:16,paddingVertical:12,backgroundColor:C.successBg,borderBottomWidth:1,borderBottomColor:C.successBorder}}>
    <Image source={require('../assets/icon-success.png')} style={{width:16,height:16,resizeMode:'contain'}} />
    <Text style={{flex:1,fontSize:14,fontWeight:'500',color:C.successText}}>{msg}</Text>
  </View>
);

const TabBar = ({ active, onSelect }) => (
  <View style={{
    flexDirection:     'row',
    backgroundColor:   C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  }}>
    {TABS.map((t) => (
      <TouchableOpacity
        key={t}
        onPress={() => onSelect(t)}
        style={{
          flex:              1,
          paddingVertical:   11,
          paddingHorizontal: 4,
          alignItems:        'center',
          borderBottomWidth: 2,
          borderBottomColor: active === t ? C.purple : 'transparent',
        }}
      >
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
          style={{
            fontSize:   12,
            fontWeight: active === t ? '700' : '500',
            color:      active === t ? C.purple : C.subtle,
            textAlign:  'center',
          }}
        >
          {t}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
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

const LineChart = ({ data, label }) => {
  if (!data || data.length === 0) return null;

  const [selectedIndex, setSelectedIndex] = useState(null);
  const yAxisWidth = 38;
  const chartWidth = Math.min(Dimensions.get('window').width - 64, 360) - yAxisWidth;
  const chartHeight = 132;
  const rawMax = Math.max(...data.map((d) => Number(d.value) || 0), 1);
  const max = Math.max(50, Math.ceil(rawMax / 50) * 50);
  const stepX = data.length > 1 ? chartWidth / (data.length - 1) : chartWidth;
  const tickCount = 5;
  const tickValues = Array.from({ length: tickCount }, (_, i) =>
    Math.round(max - ((max * i) / (tickCount - 1)))
  );

  const points = data.map((d, i) => {
    const x = i * stepX;
    const y = chartHeight - (((Number(d.value) || 0) / max) * chartHeight);
    return { x, y, value: d.value, label: d.label };
  });

  const smoothPoints = (() => {
    if (points.length < 3) return points;

    const stepsPerSegment = 24;
    const n = points.length;
    const y = points.map((p) => p.y);
    const d = [];
    for (let i = 0; i < n - 1; i += 1) d.push(y[i + 1] - y[i]);

    // Fritsch-Carlson style monotone tangents to prevent overshoot
    const m = new Array(n).fill(0);
    m[0] = d[0];
    m[n - 1] = d[n - 2];
    for (let i = 1; i < n - 1; i += 1) {
      m[i] = (d[i - 1] * d[i] <= 0) ? 0 : (d[i - 1] + d[i]) / 2;
    }
    for (let i = 0; i < n - 1; i += 1) {
      if (d[i] === 0) {
        m[i] = 0;
        m[i + 1] = 0;
      } else {
        const a = m[i] / d[i];
        const b = m[i + 1] / d[i];
        const h = Math.hypot(a, b);
        if (h > 3) {
          const t = 3 / h;
          m[i] = t * a * d[i];
          m[i + 1] = t * b * d[i];
        }
      }
    }

    const interpolated = [];
    for (let i = 0; i < n - 1; i += 1) {
      const x0 = points[i].x;
      const x1 = points[i + 1].x;
      const y0 = y[i];
      const y1 = y[i + 1];
      const minY = Math.min(y0, y1);
      const maxY = Math.max(y0, y1);

      for (let step = 0; step < stepsPerSegment; step += 1) {
        const t = step / stepsPerSegment;
        const t2 = t * t;
        const t3 = t2 * t;
        const h00 = (2 * t3) - (3 * t2) + 1;
        const h10 = t3 - (2 * t2) + t;
        const h01 = (-2 * t3) + (3 * t2);
        const h11 = t3 - t2;

        const xVal = x0 + (x1 - x0) * t;
        let yVal = (h00 * y0) + (h10 * m[i]) + (h01 * y1) + (h11 * m[i + 1]);
        yVal = Math.min(maxY, Math.max(minY, yVal));
        yVal = Math.max(0, Math.min(chartHeight, yVal));
        interpolated.push({ x: xVal, y: yVal });
      }
    }

    interpolated.push({ x: points[n - 1].x, y: points[n - 1].y });
    return interpolated;
  })();

  const selectedPoint = selectedIndex !== null ? points[selectedIndex] : null;
  const tooltipLeft = selectedPoint
    ? Math.min(
        Math.max(yAxisWidth + selectedPoint.x - 48, yAxisWidth + 2),
        yAxisWidth + chartWidth - 96
      )
    : 0;

  return (
    <View style={{backgroundColor:C.white,borderRadius:14,padding:16,borderWidth:1,borderColor:C.border,marginBottom:12}}>
      {label ? <Text style={{fontSize:14,fontWeight:'700',color:C.dark,marginBottom:10}}>{label}</Text> : null}
      <View style={{flexDirection:'row'}}>
        <View style={{width:yAxisWidth,height:chartHeight}}>
          {tickValues.map((tick, i) => (
            <Text
              key={`line-y-${i}`}
              style={{
                position:'absolute',
                top:(i / (tickCount - 1)) * chartHeight - 8,
                right:4,
                fontSize:10,
                color:C.subtle,
              }}
            >
              {tick}
            </Text>
          ))}
        </View>
        <View style={{width:chartWidth,height:chartHeight,position:'relative'}}>
          {tickValues.map((_, i) => (
            <View
              key={`line-grid-${i}`}
              style={{
                position:'absolute',
                left:0,
                right:0,
                top:(i / (tickCount - 1)) * chartHeight,
                borderTopWidth:1,
                borderTopColor:'#D1D5DB',
                borderStyle:'dashed',
              }}
            />
          ))}
          {points.map((p, i) => (
            <View
              key={`line-grid-x-${i}`}
              style={{
                position:'absolute',
                top:0,
                bottom:0,
                left:p.x,
                borderLeftWidth:1,
                borderLeftColor:'#D1D5DB',
                borderStyle:'dashed',
              }}
            />
          ))}
          <View style={{position:'absolute',left:0,top:0,bottom:0,width:1,backgroundColor:'#9CA3AF'}}/>
          <View style={{position:'absolute',left:0,right:0,bottom:0,height:1,backgroundColor:'#9CA3AF'}}/>
          {smoothPoints.map((p, i) => (
            <React.Fragment key={`curve-${i}`}>
              {i > 0 && (() => {
                const prev = smoothPoints[i - 1];
                const dx = p.x - prev.x;
                const dy = p.y - prev.y;
                const segmentLength = Math.max(1, Math.sqrt((dx * dx) + (dy * dy)));
                const angle = Math.atan2(dy, dx);
                return (
                  <View
                    style={{
                      position:'absolute',
                      left: ((prev.x + p.x) / 2) - (segmentLength / 2),
                      top: ((prev.y + p.y) / 2) - 1,
                      width: segmentLength,
                      height: 2,
                      borderRadius: 2,
                      backgroundColor: '#9333EA',
                      transform: [{ rotateZ: `${angle}rad` }],
                    }}
                  />
                );
              })()}
            </React.Fragment>
          ))}
          {points.map((p, i) => (
            <React.Fragment key={`dot-${i}`}>
              <View
                style={{
                  position:'absolute',
                  left: Math.max(0, p.x - 4),
                  top: Math.max(0, p.y - 4),
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: selectedIndex === i ? '#6D28D9' : '#9333EA',
                }}
              />
            </React.Fragment>
          ))}
          {selectedPoint && (
            <>
                <View
                  style={{
                    position:'absolute',
                    left: selectedPoint.x,
                    top: selectedPoint.y,
                    bottom:0,
                    width:1,
                    backgroundColor:C.purpleLight,
                  }}
                />
              <View
                style={{
                  position:'absolute',
                  left: tooltipLeft,
                  top: Math.max(2, selectedPoint.y - 46),
                  backgroundColor:C.dark,
                  borderRadius:8,
                  paddingVertical:6,
                  paddingHorizontal:8,
                }}
              >
                <Text style={{fontSize:10,color:C.white,fontWeight:'700'}}>{selectedPoint.label}</Text>
                <Text style={{fontSize:10,color:C.white}}>{selectedPoint.value} kcal</Text>
              </View>
            </>
          )}
          <View style={{position:'absolute',left:0,right:0,top:0,bottom:0,flexDirection:'row'}}>
            {data.map((_, i) => (
              <TouchableOpacity
                key={`line-hit-${i}`}
                style={{flex:1}}
                activeOpacity={0.9}
                onPress={() => setSelectedIndex(i)}
              />
            ))}
          </View>
        </View>
      </View>
      <View style={{flexDirection:'row'}}>
        <View style={{width:yAxisWidth}}/>
        <View style={{flex:1,flexDirection:'row',justifyContent:'space-between'}}>
        {data.map((d, i) => (
          <Text key={`label-${i}`} style={{fontSize:9,color:C.subtle,width:32,textAlign:'center'}} numberOfLines={1}>
            {d.label}
          </Text>
        ))}
        </View>
      </View>
    </View>
  );
};

const GroupedMacroBarChart = ({ data, label }) => {
  if (!data || data.length === 0) return null;

  const [selectedIndex, setSelectedIndex] = useState(null);
  const yAxisWidth = 38;
  const plotHeight = 92;
  const seriesMax = Math.max(
    ...data.map((d) => Math.max(d.protein || 0, d.carbs || 0, d.fat || 0)),
    1
  );
  const tickCount = 5;
  const tickValues = Array.from({ length: tickCount }, (_, i) =>
    Math.round(seriesMax - ((seriesMax * i) / (tickCount - 1)))
  );

  const legend = [
    { key: 'protein', text: 'Protein', color: '#2563EB' },
    { key: 'carbs', text: 'Carbs', color: '#F59E0B' },
    { key: 'fat', text: 'Fat', color: '#16A34A' },
  ];
  const selected = selectedIndex !== null ? data[selectedIndex] : null;

  return (
    <View style={{backgroundColor:C.white,borderRadius:14,padding:16,borderWidth:1,borderColor:C.border,marginBottom:12}}>
      {label ? <Text style={{fontSize:14,fontWeight:'700',color:C.dark,marginBottom:8}}>{label}</Text> : null}
      <View style={{flexDirection:'row',gap:10,marginBottom:10}}>
        {legend.map((item) => (
          <View key={item.key} style={{flexDirection:'row',alignItems:'center',gap:5}}>
            <View style={{width:10,height:10,borderRadius:2,backgroundColor:item.color}}/>
            <Text style={{fontSize:11,color:C.subtle}}>{item.text}</Text>
          </View>
        ))}
      </View>
      {selected && (
        <View style={{backgroundColor:C.dark,borderRadius:8,padding:8,marginBottom:10}}>
          <Text style={{fontSize:10,fontWeight:'700',color:C.white,marginBottom:2}}>{selected.label}</Text>
          <Text style={{fontSize:10,color:C.white}}>Protein: {selected.protein || 0}g | Carbs: {selected.carbs || 0}g | Fat: {selected.fat || 0}g</Text>
        </View>
      )}
      <View style={{flexDirection:'row'}}>
        <View style={{width:yAxisWidth,height:plotHeight}}>
          {tickValues.map((tick, i) => (
            <Text
              key={`bar-y-${i}`}
              style={{
                position:'absolute',
                top:(i / (tickCount - 1)) * plotHeight - 8,
                right:4,
                fontSize:10,
                color:C.subtle,
              }}
            >
              {tick}
            </Text>
          ))}
        </View>
        <View style={{flex:1,height:plotHeight}}>
          {tickValues.map((_, i) => (
            <View
              key={`bar-grid-${i}`}
              style={{
                position:'absolute',
                left:0,
                right:0,
                top:(i / (tickCount - 1)) * plotHeight,
                borderTopWidth:1,
                borderTopColor:C.border,
              }}
            />
          ))}
          <View style={{flexDirection:'row',alignItems:'flex-end',gap:6,height:plotHeight}}>
            {data.map((d, idx) => (
              <TouchableOpacity
                key={`macro-${idx}`}
                style={{flex:1,alignItems:'center'}}
                activeOpacity={0.85}
                onPress={() => setSelectedIndex(idx)}
              >
                <View style={{width:'100%',height:plotHeight,flexDirection:'row',justifyContent:'space-between',alignItems:'flex-end'}}>
                  <View style={{width:'30%',height:Math.max(3, ((d.protein || 0) / seriesMax) * plotHeight),backgroundColor:'#2563EB',borderRadius:2}}/>
                  <View style={{width:'30%',height:Math.max(3, ((d.carbs || 0) / seriesMax) * plotHeight),backgroundColor:'#F59E0B',borderRadius:2}}/>
                  <View style={{width:'30%',height:Math.max(3, ((d.fat || 0) / seriesMax) * plotHeight),backgroundColor:'#16A34A',borderRadius:2}}/>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
      <View style={{flexDirection:'row',marginTop:4}}>
        <View style={{width:yAxisWidth}}/>
        <View style={{flex:1,flexDirection:'row',gap:6}}>
          {data.map((d, idx) => (
            <View key={`macro-label-${idx}`} style={{flex:1,alignItems:'center'}}>
              <Text style={{fontSize:9,color:C.subtle}} numberOfLines={1}>{d.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

// ────────────────────────────────────────────────────────────────
// REUSABLE: Metric Log Modals (#34, #36, #84, #87, #89)
// ────────────────────────────────────────────────────────────────
const WeightModal = ({ visible, onClose, onSubmit, isLoading, error }) => {
  const [weight, setWeight] = useState('');
  const handleClose = () => { setWeight(''); onClose(); };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={{flex:1,backgroundColor:'rgba(0,0,0,0.45)',justifyContent:'center',paddingHorizontal:16}}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={{backgroundColor:C.white,borderRadius:16,padding:22,paddingTop:40}}>
          <TouchableOpacity onPress={handleClose} style={{position:'absolute',top:12,right:16}}>
            <Image source={require('../assets/icon-close.png')} style={{width:16,height:16,resizeMode:'contain'}} />
          </TouchableOpacity>
          <Text style={{fontSize:16,fontWeight:'700',color:C.dark,textAlign:'center',marginBottom:18}}>Update Weight</Text>
          <Text style={{fontSize:13,fontWeight:'600',color:C.dark,marginBottom:4}}>Weight (kg) *</Text>
          <TextInput
            style={{backgroundColor:C.bg,borderRadius:8,paddingHorizontal:12,paddingVertical:10,fontSize:14,color:C.dark,borderWidth:1,borderColor:error?'#FECACA':C.border,marginBottom:4}}
            value={weight} onChangeText={setWeight} placeholder="e.g., 70.5" keyboardType="numeric" placeholderTextColor={C.subtle}
          />
          {error ? <Text style={{fontSize:12,color:C.red,marginBottom:8}}>{error}</Text> : <View style={{marginBottom:12}}/>}
          <TouchableOpacity
            style={{backgroundColor:C.purple,borderRadius:10,paddingVertical:14,alignItems:'center',opacity:isLoading?0.6:1}}
            onPress={() => onSubmit(weight)} disabled={isLoading} activeOpacity={0.85}>
            <Text style={{fontSize:15,fontWeight:'700',color:C.white}}>{isLoading?'Saving...':'Update Weight'}</Text>
          </TouchableOpacity>
        </View>
        </TouchableWithoutFeedback>
      </View>
    </Modal>
  );
};

const HeightModal = ({ visible, onClose, onSubmit, isLoading, error }) => {
  const [height, setHeight] = useState('');
  const [notes,  setNotes]  = useState('');
  const handleClose = () => { setHeight(''); setNotes(''); onClose(); };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={{flex:1,backgroundColor:'rgba(0,0,0,0.45)',justifyContent:'center',paddingHorizontal:16}}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={{backgroundColor:C.white,borderRadius:16,padding:22,paddingTop:40}}>
          <TouchableOpacity onPress={handleClose} style={{position:'absolute',top:12,right:16}}>
            <Image source={require('../assets/icon-close.png')} style={{width:16,height:16,resizeMode:'contain'}} />
          </TouchableOpacity>
          <Text style={{fontSize:16,fontWeight:'700',color:C.dark,textAlign:'center',marginBottom:18}}>Update Height</Text>
          <Text style={{fontSize:13,fontWeight:'600',color:C.dark,marginBottom:4}}>Height (cm) *</Text>
          <TextInput
            style={{backgroundColor:C.bg,borderRadius:8,paddingHorizontal:12,paddingVertical:10,fontSize:14,color:C.dark,borderWidth:1,borderColor:error?'#FECACA':C.border,marginBottom:4}}
            value={height} onChangeText={setHeight} placeholder="e.g., 170" keyboardType="numeric" placeholderTextColor={C.subtle}
          />
          {error ? <Text style={{fontSize:12,color:C.red,marginBottom:8}}>{error}</Text> : <View style={{marginBottom:12}}/>}
          <Text style={{fontSize:13,fontWeight:'600',color:C.dark,marginBottom:4}}>Notes (optional)</Text>
          <TextInput
            style={{backgroundColor:C.bg,borderRadius:8,paddingHorizontal:12,paddingVertical:10,fontSize:14,color:C.dark,borderWidth:1,borderColor:C.border,marginBottom:16}}
            value={notes} onChangeText={setNotes} placeholder="e.g., Annual checkup" placeholderTextColor={C.subtle}
          />
          <TouchableOpacity
            style={{backgroundColor:C.purple,borderRadius:10,paddingVertical:14,alignItems:'center',opacity:isLoading?0.6:1}}
            onPress={() => onSubmit(height, notes)} disabled={isLoading} activeOpacity={0.85}>
            <Text style={{fontSize:15,fontWeight:'700',color:C.white}}>{isLoading?'Saving...':'Update Height'}</Text>
          </TouchableOpacity>
        </View>
        </TouchableWithoutFeedback>
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
  
  useEffect(() => {
    if (existingGoal) {
      setGoalType(existingGoal.goalType || '');
      setCustomGoal(existingGoal.customGoal || '');
      setActivityLevel(existingGoal.activityLevel || '');
      setTargetWeight(
        existingGoal.targetWeight ? String(existingGoal.targetWeight) : ''
      );
      setTargetDate(existingGoal.targetDate || '');
    } else {
      // Reset for new goal
      setGoalType('');
      setCustomGoal('');
      setActivityLevel('');
      setTargetWeight('');
      setTargetDate('');
    }
  }, [existingGoal, visible]);  

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={{flex:1,backgroundColor:'rgba(0,0,0,0.45)',justifyContent:'flex-end'}}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={{backgroundColor:C.white,borderTopLeftRadius:20,borderTopRightRadius:20,padding:20,paddingTop:40,maxHeight:'90%'}}>
          <TouchableOpacity onPress={handleClose} style={{position:'absolute',top:12,right:16}}>
            <Image source={require('../assets/icon-close.png')} style={{width:16,height:16,resizeMode:'contain'}} />
          </TouchableOpacity>
          <Text style={{fontSize:16,fontWeight:'700',color:C.dark,marginBottom:4}}>{existingGoal?'Update Goal':'Set Health Goal'}</Text>
          <Text style={{fontSize:13,color:C.subtle,marginBottom:18}}>Define your goal to get personalised recommendations</Text>

          <ScrollView keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>
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
              onPress={() => {
                console.log("GOAL MODAL SUBMIT CLICKED");
                onSave({
                  goalType,
                  customGoal,
                  activityLevel,
                  targetWeight: targetWeight || null,
                  targetDate: targetDate || null
                });
              }}
              disabled={isLoading} activeOpacity={0.85}>
              <Text style={{fontSize:15,fontWeight:'700',color:C.white}}>{isLoading?'Saving...':'Save Goal'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
        </TouchableWithoutFeedback>
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
    <ScrollView contentContainerStyle={{flexGrow: 1, paddingHorizontal:16,paddingBottom:32}}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
      <View style={{height:20}}/>
      {calorieData.length > 0
        ? <LineChart data={calorieData} label="7-Day Calorie Trend"/>
        : null}
      {macroData.length > 0
        ? <GroupedMacroBarChart data={macroData} label="7-Day Macronutrient Breakdown"/>
        : null}
      {report && (
        <View style={{backgroundColor:C.white,borderRadius:14,padding:16,borderWidth:1,borderColor:C.border,marginBottom:12}}>
          <View style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between'}}>
            {[
              {l:'Avg Daily Calories', v:report.avgCalories??0, c:C.purple},
              {l:'Avg Daily Protein',  v:`${report.avgProtein??0}g`},
              {l:'Avg Daily Carbs',    v:`${report.avgCarbs??0}g`},
              {l:'Avg Daily Fat',      v:`${report.avgFat??0}g`},
            ].map((s) => (
              <View key={s.l} style={{width:'48%',marginBottom:12,backgroundColor:C.bg,borderRadius:10,padding:12,borderWidth:1,borderColor:C.border}}>
                <Text style={{fontSize:11,color:C.subtle,marginBottom:4}}>{s.l}</Text>
                <Text style={{fontSize:20,fontWeight:'800',color:s.c || C.dark}}>{s.v}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
      {!report && (
        <View style={{alignItems:'center',paddingVertical:48}}>
          <Image source={require('../assets/empty-reports.png')} style={{width:40,height:40,resizeMode:'contain'}} />
          <Text style={{fontSize:16,fontWeight:'700',color:C.dark,marginBottom:6}}>No Data Yet</Text>
          <Text style={{fontSize:13,color:C.subtle,textAlign:'center'}}>Start logging meals to see your daily progress report.</Text>
        </View>
      )}
    </ScrollView>
  );
};

// ── BODY METRICS TAB — #34-37, #41-42, #84-87, #89, #91-92, goal #38-40, #90 ─
const BodyMetricsTab = ({ userId, onBanner }) => {
  const [weightData,  setWeightData]  = useState({ latest: null, loading: true });
  const [heightData,  setHeightData]  = useState({ latest: null, loading: true });
  const [goal,        setGoal]        = useState(null);
  const [showWtModal, setShowWtModal] = useState(false);
  const [showHtModal, setShowHtModal] = useState(false);
  const [showGoalModal,setShowGoalModal]=useState(false);
  const [wtError,     setWtError]     = useState('');
  const [wtLoading,   setWtLoading]   = useState(false);
  const [htError,     setHtError]     = useState('');
  const [htLoading,   setHtLoading]   = useState(false);
  const [goalLoading, setGoalLoading] = useState(false);
  const [goalErrors,  setGoalErrors]  = useState({});

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        const [weightRes, heightRes, goalRes] = await Promise.all([
          weightCtrl.fetchWeightHistory(userId),
          heightCtrl.fetchHeightHistory(userId),
          viewGoalCtrl.fetchGoal(userId)
        ]);
        console.log("FETCH GOAL RESPONSE:", goalRes);
        setWeightData({ latest: weightRes.latest, loading: false });
        setHeightData({ latest: heightRes.latest, loading: false });

        if (goalRes.success) {
          setGoal(goalRes.data);
        }
      };

      loadData();
    }, [userId])
  );

  const weight = weightData.latest?.weightKg ?? null;
  const height = heightData.latest?.heightCm ?? null;
  const bmi    = WeightEntry.calculateBMI(weight, height);
  const bmiCat = WeightEntry.getBMICategory(bmi);
  const bmiColor = !bmi ? C.subtle : bmi < 18.5 ? C.orange : bmi < 25 ? C.green : bmi < 30 ? C.orange : C.red;

  // UC #34, #84, #86 - log/update weight
  const handleWeightSubmit = useCallback(async (wt) => {
    setWtError('');
    setWtLoading(true);
    const result = await logWtCtrl.logWeight(userId, { weightKg: wt });
    setWtLoading(false);
    if (result.success) {
      setWeightData({ latest: result.data, loading: false });
      setShowWtModal(false);
      onBanner('Weight updated successfully');
    } else {
      setWtError(result.message);
    }
  }, [userId]);

  // UC #36, #87, #89 — log/update height
  const handleHeightSubmit = useCallback(async (ht, notes) => {
    setHtError('');
    setHtLoading(true);
    const result = await logHtCtrl.logHeight(userId, { heightCm: ht, notes });
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

    console.log("SAVE RESPONSE:", result);
    
    setGoalLoading(false);
    if (result.success) {
      setGoal(result.data);
      setShowGoalModal(false);
      onBanner(goal ? 'Goal updated!' : 'Health goal set!');
    } else if (result.field) {
      setGoalErrors({ [result.field]: result.message });
    }
  }, [goal, userId]);
  console.log("GoalModal render, handleGoalSave:", !!handleGoalSave);
  return (
    <ScrollView contentContainerStyle={{flexGrow: 1, paddingHorizontal:16,paddingBottom:32}}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
      <View style={{height:20}}/>

      {/* Health Goal — UC #38, #39, #40, #90 */}
      <View style={{backgroundColor:C.white,borderRadius:14,padding:16,borderWidth:1,borderColor:C.border,marginBottom:12}}>
        <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
          <View style={{flexDirection:'row',alignItems:'center',gap:4}}><Image source={require('../assets/section-goals.png')} style={{width:16,height:16,resizeMode:'contain'}} /><Text style={{fontSize:14,fontWeight:'700',color:C.dark}}>Health Goal</Text>
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
        <View style={{flexDirection:'row',alignItems:'center',gap:4}}><Image source={require('../assets/stat-weight.png')} style={{width:13,height:13,resizeMode:'contain'}} /><Text style={{fontSize:13,color:C.subtle,marginBottom:4}}>Current Weight</Text></View>
        {weightData.loading ? <ActivityIndicator color={C.purple}/> : (
          <>
            <Text style={{fontSize:32,fontWeight:'800',color:C.dark,marginBottom:10}}>
              {weight ? `${weight} kg` : '—'}
            </Text>
            <TouchableOpacity style={{backgroundColor:C.purple,borderRadius:8,paddingVertical:11,alignItems:'center'}}
              onPress={() => { setWtError(''); setShowWtModal(true); }} activeOpacity={0.85}>
              <Text style={{fontSize:14,fontWeight:'700',color:C.white}}>Update Weight</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Current Height — UC #36, #87, #89 */}
      <View style={{backgroundColor:C.white,borderRadius:14,padding:16,borderWidth:1,borderColor:C.border,marginBottom:12}}>
        <View style={{flexDirection:'row',alignItems:'center',gap:4}}><Image source={require('../assets/stat-height.png')} style={{width:13,height:13,resizeMode:'contain'}} /><Text style={{fontSize:13,color:C.subtle,marginBottom:4}}>Current Height</Text>
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
        <View style={{flexDirection:'row',alignItems:'center',gap:4}}><Image source={require('../assets/section-trends.png')} style={{width:13,height:13,resizeMode:'contain'}} /><Text style={{fontSize:13,color:C.subtle,marginBottom:4}}>Current BMI</Text>
        <Text style={{fontSize:36,fontWeight:'800',color:bmiColor,marginBottom:4}}>{bmi ?? '—'}</Text>
        {bmi && <Text style={{fontSize:14,color:bmiColor,fontWeight:'600',marginBottom:10}}>{bmiCat}</Text>}
        <View style={{backgroundColor:C.bg,borderRadius:8,padding:10}}>
          {[{l:'Underweight',v:'< 18.5'},{l:'Normal',v:'18.5 - 24.9'},{l:'Overweight',v:'25 - 29.9'},{l:'Obese',v:'≥ 30'}].map((b) => (
            <Text key={b.l} style={{fontSize:12,color:C.body,marginBottom:2}}>• {b.l}: {b.v}</Text>
          ))}
        </View>
      </View>

      {/* Modals */}
      <WeightModal visible={showWtModal} onClose={() => setShowWtModal(false)} onSubmit={handleWeightSubmit} isLoading={wtLoading} error={wtError}/>
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
    <ScrollView contentContainerStyle={{flexGrow: 1, paddingHorizontal:16,paddingBottom:32}}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
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
    <ScrollView contentContainerStyle={{flexGrow: 1, paddingHorizontal:16,paddingBottom:32}}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
      <View style={{height:20}}/>
      <StatCard label="Total Entries"   value={summary?.totalEntries   ?? 0} sub="Food items logged"/>
      <StatCard label="Total Calories"  value={summary?.totalCalories  ?? 0} sub="Calories tracked"/>
      <StatCard label="Daily Average"   value={summary?.avgCalories    ?? 0} sub="Calories per day"/>
      <StatCard label="Total Protein"   value={`${summary?.totalProtein ?? 0} g`} sub="Protein consumed this month"/>

      {!summary && (
        <View style={{alignItems:'center',paddingVertical:32}}>
          <Image source={require('../assets/empty-list.png')} style={{width:40,height:40,resizeMode:'contain'}} />
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
      <StatusBar barStyle="dark-content" backgroundColor={C.white}/>
      <NavBar onMenu={() => navigation.goBack()}/>
      <Banner msg={banner}/>
      <View style={{paddingHorizontal:16,paddingTop:16,paddingBottom:8,backgroundColor:C.white}}>
        <Text style={{fontSize:24,fontWeight:'800',color:C.dark}}>Health Reports & Metrics</Text>
      </View>
      <TabBar active={activeTab} onSelect={setActiveTab}/>
      {activeTab === 'Daily Progress'  && <DailyProgressTab  userId={user?.userId}/>}
      {activeTab === 'Body Metrics'    && <BodyMetricsTab    userId={user?.userId} onBanner={handleBanner}/>}
      {activeTab === 'History'         && <HistoryTab        userId={user?.userId}/>}
      {activeTab === 'Monthly Summary' && <MonthlySummaryTab userId={user?.userId}/>}
          </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ReportsScreen;
