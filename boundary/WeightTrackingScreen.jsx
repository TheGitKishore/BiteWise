import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, StatusBar, Alert, Modal,
  Keyboard, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Image} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import LogWeightController        from '../controller/LogWeightController';
import ViewWeightHistoryController from '../controller/ViewWeightHistoryController';
import WeightEntry                 from '../entity/WeightEntry';

const logCtrl  = new LogWeightController();
const viewCtrl = new ViewWeightHistoryController();

const C = {
  purple:'#7C3AED', purpleLight:'#EDE9FE', dark:'#111827', mid:'#374151',
  body:'#4B5563', subtle:'#6B7280', white:'#FFFFFF', border:'#E5E7EB', bg:'#F9FAFB',
  successBg:'#F0FDF4', successBorder:'#BBF7D0', successText:'#15803D',
  errorText:'#DC2626', errorBg:'#FEF2F2', errorBorder:'#FECACA',
  green:'#16A34A', red:'#DC2626',
};

const NavBar = ({ onMenu }) => (
  <View style={nav.bar}>
    <View style={nav.brand}><Image source={require('../assets/BiteWiseLogo.png')} style={nav.logo} /><Text style={nav.name}>BiteWise</Text></View>
    <TouchableOpacity onPress={onMenu} style={{padding: 6}}>
          <Text style={{fontSize: 14, fontWeight: '500', color: '#374151'}}>← Back</Text>
        </TouchableOpacity>
  </View>
);
const nav = StyleSheet.create({
  bar:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:20,paddingVertical:14,backgroundColor:C.white,borderBottomWidth:1,borderBottomColor:C.border},
  brand:{flexDirection:'row',alignItems:'center',gap:6},icon:{fontSize:20},
  logo:      { width: 24, height: 24, resizeMode: 'contain' },
  name:{fontSize:20,fontWeight:'800',color:C.dark},
  btn:{padding:6,gap:4,alignItems:'flex-end'},line:{width:22,height:2.5,backgroundColor:C.dark,borderRadius:2},
});

const Banner = ({ msg }) => !msg ? null : (
  <View style={{flexDirection:'row',alignItems:'center',gap:10,paddingHorizontal:16,paddingVertical:12,backgroundColor:C.successBg,borderBottomWidth:1,borderBottomColor:C.successBorder}}>
    <Text style={{fontSize:16}}>✅</Text>
    <Text style={{flex:1,fontSize:14,fontWeight:'500',color:C.successText}}>{msg}</Text>
  </View>
);

const UpdateModal = ({ visible, onClose, onSubmit, isLoading, error }) => {
  const [weight, setWeight] = useState('');
  // Notes removed for now (kept commented so it is easy to restore later if needed)
  // const [notes,  setNotes]  = useState('');
  const handleSubmit = () => { onSubmit(weight); };
  const handleClose  = () => { setWeight(''); onClose(); };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={{flex:1,backgroundColor:'rgba(0,0,0,0.45)',justifyContent:'center',paddingHorizontal:16}}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={{backgroundColor:C.white,borderRadius:16,padding:22,paddingTop:36}}>
          <TouchableOpacity onPress={handleClose} style={{position:'absolute',top:12,right:16}}><Text style={{fontSize:16,color:C.subtle}}>✕</Text></TouchableOpacity>
          <Text style={{fontSize:16,fontWeight:'700',color:C.dark,textAlign:'center',marginBottom:18}}>Update Weight</Text>
          <Text style={{fontSize:13,fontWeight:'600',color:C.dark,marginBottom:4}}>Weight (kg) *</Text>
          <TextInput
            style={{backgroundColor:C.bg,borderRadius:8,paddingHorizontal:12,paddingVertical:10,fontSize:14,color:C.dark,borderWidth:1,borderColor:error?'#FECACA':C.border,marginBottom:4}}
            value={weight} onChangeText={setWeight} placeholder="e.g., 70.5" keyboardType="numeric" placeholderTextColor={C.subtle}
          />
          {error ? <Text style={{fontSize:12,color:C.errorText,marginBottom:8}}>{error}</Text> : <View style={{marginBottom:12}}/>}
          {/* Notes removed for now (kept commented so it is easy to restore later if needed)
          <Text style={{fontSize:13,fontWeight:'600',color:C.dark,marginBottom:4}}>Notes (optional)</Text>
          <TextInput
            style={{backgroundColor:C.bg,borderRadius:8,paddingHorizontal:12,paddingVertical:10,fontSize:14,color:C.dark,borderWidth:1,borderColor:C.border,marginBottom:16}}
            value={notes} onChangeText={setNotes} placeholder="e.g., After morning workout" placeholderTextColor={C.subtle}
          />
          */}
          <TouchableOpacity
            style={{backgroundColor:C.purple,borderRadius:10,paddingVertical:14,alignItems:'center',opacity:isLoading?0.6:1}}
            onPress={handleSubmit} disabled={isLoading}>
            <Text style={{fontSize:15,fontWeight:'700',color:C.white}}>{isLoading ? 'Saving...' : '+ Update Weight'}</Text>
          </TouchableOpacity>
        </View>
        </TouchableWithoutFeedback>
      </View>
    </Modal>
  );
};

// Premium only — #84, #85, #86
const WeightTrackingScreen = ({ navigation, route }) => {
  const user = route?.params?.user || null;
  // Role check uses lowercase to avoid PREMIUM/premium mismatch from different API flows.
  const isPremium = String(user?.role || '').toLowerCase() === 'premium';

  if (!isPremium) {
    return (
      <SafeAreaView style={{flex:1,backgroundColor:C.bg}}>
        <NavBar onMenu={() => navigation.goBack()} />
        <View style={{flex:1,alignItems:'center',justifyContent:'center',paddingHorizontal:32}}>
          <Text style={{fontSize:48,marginBottom:16}}>🔒</Text>
          <Text style={{fontSize:20,fontWeight:'800',color:C.dark,marginBottom:8}}>Premium Feature</Text>
          <Text style={{fontSize:14,color:C.subtle,textAlign:'center',marginBottom:20}}>Weight tracking requires a Premium membership.</Text>
          <TouchableOpacity style={{backgroundColor:C.purple,borderRadius:10,paddingVertical:13,paddingHorizontal:24}} onPress={() => navigation.navigate('ViewPricingPlansScreen')}>
            <Text style={{fontSize:14,fontWeight:'700',color:C.white}}>Upgrade to Premium</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const [entries,     setEntries]     = useState([]);
  const [isLoading,   setIsLoading]   = useState(true);
  const [showModal,   setShowModal]   = useState(false);
  const [fieldError,  setFieldError]  = useState('');
  const [isSaving,    setIsSaving]    = useState(false);
  const [banner,      setBanner]      = useState('');

  const showBanner = (msg) => { setBanner(msg); setTimeout(() => setBanner(''), 4000); };

  useEffect(() => {
    viewCtrl.fetchWeightHistory(user.userId).then((r) => {
      if (r.success) setEntries(r.data);
      setIsLoading(false);
    });
  }, []);

  const latest      = WeightEntry.getLatest(entries);
  const totalChange = WeightEntry.getTotalChange(entries);
  const currentBMI  = latest && user?.heightCm
    ? WeightEntry.calculateBMI(latest.weightKg, user.heightCm) : null;

  const handleSubmit = useCallback(async (weight) => {
    setFieldError('');
    setIsSaving(true);
    const result = await logCtrl.logWeight(user.userId, { weightKg: weight });
    setIsSaving(false);
    if (result.success) {
      const newEntry = result.data;
      setEntries((prev) => [newEntry, ...prev]);
      setShowModal(false);
      showBanner('Weight updated successfully');
    } else {
      setFieldError(result.message);
    }
  }, [user]);

  const handleDelete = useCallback((entryId) => {
    Alert.alert('Remove Entry', 'Remove this weight record?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        const r = await viewCtrl.deleteEntry(entryId);
        if (r.success) {
          setEntries((prev) => prev.filter((e) => e.entryId !== entryId));
          showBanner('Entry removed');
        }
      }},
    ]);
  }, []);

  return (
    <SafeAreaView style={{flex:1,backgroundColor:C.bg}}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />
      <NavBar onMenu={() => navigation.goBack()} />
      <Banner msg={banner} />
      <UpdateModal visible={showModal} onClose={() => setShowModal(false)} onSubmit={handleSubmit} isLoading={isSaving} error={fieldError} />

      <ScrollView contentContainerStyle={{flexGrow: 1, paddingHorizontal:16,paddingBottom:32}} showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
        <View style={{paddingTop:20,marginBottom:14}}>
          <View style={{alignSelf:'flex-start',backgroundColor:C.purple,borderRadius:20,paddingHorizontal:10,paddingVertical:3,marginBottom:8}}>
            <Text style={{fontSize:11,fontWeight:'700',color:C.white}}>☆ Premium</Text>
          </View>
          <Text style={{fontSize:26,fontWeight:'800',color:C.dark,marginBottom:4}}>Weight Tracking</Text>
          <Text style={{fontSize:13,color:C.subtle}}>Monitor your weight changes and track long-term progress</Text>
        </View>

        <TouchableOpacity style={{backgroundColor:C.purple,borderRadius:10,paddingVertical:14,alignItems:'center',marginBottom:16}} onPress={() => { setFieldError(''); setShowModal(true); }} activeOpacity={0.85}>
          <Text style={{fontSize:15,fontWeight:'700',color:C.white}}>+ Update Weight</Text>
        </TouchableOpacity>

        {/* Current stats */}
        {latest && (
          <>
            <View style={scard.card}>
              <Text style={{fontSize:13,color:C.subtle,marginBottom:4}}>⚖️  Current Weight</Text>
              <Text style={{fontSize:32,fontWeight:'800',color:C.purple}}>{latest.weightKg} kg</Text>
              <Text style={{fontSize:12,color:C.subtle,marginTop:4}}>Last updated {new Date(latest.loggedAt).toLocaleDateString('en-SG')}</Text>
            </View>
            {entries.length >= 2 && (
              <View style={scard.card}>
                <Text style={{fontSize:13,color:C.subtle,marginBottom:4}}>{totalChange <= 0 ? '↘' : '↗'}  Total Change</Text>
                <Text style={{fontSize:28,fontWeight:'800',color:totalChange <= 0 ? C.green : C.red}}>{totalChange > 0 ? '+' : ''}{totalChange} kg</Text>
                <Text style={{fontSize:12,color:C.subtle,marginTop:4}}>Since {new Date(entries[entries.length-1]?.loggedAt).toLocaleDateString('en-SG')}</Text>
              </View>
            )}
          </>
        )}

        {/* Weight history */}
        <View style={{backgroundColor:C.white,borderRadius:14,padding:16,borderWidth:1,borderColor:C.border,marginBottom:16}}>
          <View style={{flexDirection:'row',alignItems:'center',gap:8,marginBottom:14}}>
            <Text style={{fontSize:15}}>📅</Text>
            <Text style={{fontSize:15,fontWeight:'700',color:C.dark}}>Weight History</Text>
          </View>
          {isLoading ? (
            <Text style={{color:C.subtle,textAlign:'center',paddingVertical:20}}>Loading...</Text>
          ) : entries.length === 0 ? (
            <View style={{alignItems:'center',paddingVertical:32}}>
              <Text style={{fontSize:36,marginBottom:10}}>⚖️</Text>
              <Text style={{fontSize:16,fontWeight:'700',color:C.dark,marginBottom:6}}>No Weight Records Yet</Text>
              <Text style={{fontSize:13,color:C.subtle,textAlign:'center',marginBottom:16}}>Start tracking your weight to monitor your progress over time</Text>
              <TouchableOpacity style={{backgroundColor:C.purple,borderRadius:8,paddingVertical:10,paddingHorizontal:20}} onPress={() => setShowModal(true)}>
                <Text style={{fontSize:13,fontWeight:'700',color:C.white}}>+ Add First Entry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            entries.map((e, i) => {
              const prev = entries[i + 1];
              const change = prev ? Math.round((e.weightKg - prev.weightKg) * 10) / 10 : null;
              return (
                <View key={e.entryId || i} style={{flexDirection:'row',alignItems:'center',paddingVertical:12,borderTopWidth:i===0?0:1,borderTopColor:C.border}}>
                  <View style={{width:52,height:52,borderRadius:8,backgroundColor:C.purpleLight,alignItems:'center',justifyContent:'center',marginRight:12}}>
                    <Text style={{fontSize:16,fontWeight:'800',color:C.purple}}>{e.weightKg}</Text>
                    <Text style={{fontSize:10,color:C.purple}}>kg</Text>
                  </View>
                  <View style={{flex:1}}>
                    <Text style={{fontSize:14,fontWeight:'600',color:C.dark}}>
                      {new Date(e.loggedAt).toLocaleDateString('en-SG',{weekday:'short',day:'numeric',month:'short',year:'numeric'})}
                    </Text>
                    {/* Notes removed for now (kept commented so it is easy to restore later if needed)
                    {e.notes ? <Text style={{fontSize:12,color:C.subtle}}>{e.notes}</Text> : null}
                    */}
                    {change !== null && (
                      <View style={{alignSelf:'flex-start',backgroundColor:change<=0?'#DCFCE7':'#FEE2E2',borderRadius:20,paddingHorizontal:8,paddingVertical:2,marginTop:4}}>
                        <Text style={{fontSize:11,color:change<=0?C.green:C.red,fontWeight:'600'}}>{change>0?'+':''}{change} kg from previous</Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity onPress={() => handleDelete(e.entryId)} style={{padding:8}}>
                    <Text style={{fontSize:18}}>🗑</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>

        {/* Tips */}
        <View style={{backgroundColor:C.purpleLight,borderRadius:14,padding:16,borderWidth:1,borderColor:C.border}}>
          <Text style={{fontSize:14,fontWeight:'700',color:C.dark,marginBottom:10}}>Weight Tracking Tips</Text>
          {[
            { b:'Weigh at the same time:', t:'First thing in the morning, after using the bathroom, provides the most consistent readings' },
            { b:"Don't obsess over daily fluctuations:", t:'Weight can vary 1-2 kg day-to-day due to water retention, food intake, etc.' },
            { b:'Focus on trends:', t:'Look at weekly or monthly averages rather than individual data points' },
            { b:'Healthy rate of change:', t:'Aim for 0.5-1 kg per week for sustainable weight loss' },
          ].map((tip, i) => (
            <Text key={i} style={{fontSize:13,color:C.body,marginBottom:6}}>• <Text style={{fontWeight:'700'}}>{tip.b}</Text> {tip.t}</Text>
          ))}
        </View>
      </ScrollView>
          </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const scard = StyleSheet.create({
  card:{backgroundColor:C.white,borderRadius:14,padding:16,borderWidth:1,borderColor:C.border,marginBottom:12},
});

export default WeightTrackingScreen;
