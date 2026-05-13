// CuratorProgramScreen.jsx — UC #83
// Boundary only: no axios, no api_config.
// Data access delegated to ApplyCuratorProgramController → User entity.

import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, StatusBar,
  Keyboard, KeyboardAvoidingView, Platform, Image} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ApplyCuratorProgramController from '../controller/ApplyCuratorProgramController';

const controller = new ApplyCuratorProgramController();

const C = {
  purple:'#7C3AED', purpleLight:'#EDE9FE', dark:'#111827', mid:'#374151',
  body:'#4B5563', subtle:'#6B7280', white:'#FFFFFF', border:'#E5E7EB', bg:'#F9FAFB',
  successBg:'#F0FDF4', successBorder:'#BBF7D0', successText:'#15803D',
  errorText:'#DC2626',
};

const NavBar = ({ onMenu }) => (
  <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:20,paddingVertical:14,backgroundColor:C.white,borderBottomWidth:1,borderBottomColor:C.border}}>
    <View style={{flexDirection:'row',alignItems:'center',gap:6}}><Image source={require('../assets/BiteWiseLogo.png')} style={{width:20,height:20,resizeMode:'contain'}} /><Text style={{fontSize:20,fontWeight:'800',color:C.dark}}>BiteWise</Text></View>
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

const Field = ({ label, value, onChange, placeholder, multiline, error }) => (
  <View style={{marginBottom:14}}>
    <Text style={{fontSize:13,fontWeight:'600',color:C.dark,marginBottom:4}}>{label}</Text>
    <TextInput
      style={{backgroundColor:C.bg,borderRadius:8,paddingHorizontal:12,paddingVertical:10,fontSize:14,color:C.dark,borderWidth:1,borderColor:error?'#FECACA':C.border,minHeight:multiline?80:44,textAlignVertical:multiline?'top':'center'}}
      value={value} onChangeText={onChange} placeholder={placeholder}
      placeholderTextColor={C.subtle} multiline={multiline} autoCorrect={false}
    />
    {error ? <Text style={{fontSize:12,color:C.errorText,marginTop:3}}>{error}</Text> : null}
  </View>
);

// Premium only — UC #83 (view Curator Program info + apply)
const CuratorProgramScreen = ({ navigation, route }) => {
  const user = route?.params?.user || null;

  if (user?.role !== 'premium') {
    return (
      <SafeAreaView style={{flex:1,backgroundColor:C.bg}}>
        <NavBar onMenu={() => navigation.goBack()}/>
        <View style={{flex:1,alignItems:'center',justifyContent:'center',paddingHorizontal:32}}>
          <Image source={require('../assets/empty-locked.png')} style={{width:48,height:48,resizeMode:'contain'}} />
          <Text style={{fontSize:20,fontWeight:'800',color:C.dark,marginBottom:8}}>Premium Feature</Text>
          <Text style={{fontSize:14,color:C.subtle,textAlign:'center',marginBottom:20}}>The Curator Program is available to Premium members.</Text>
          <TouchableOpacity style={{backgroundColor:C.purple,borderRadius:10,paddingVertical:13,paddingHorizontal:24}} onPress={() => navigation.navigate('ViewPricingPlansScreen')}>
            <Text style={{fontSize:14,fontWeight:'700',color:C.white}}>Upgrade to Premium</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const [showForm,   setShowForm]   = useState(false);
  const [motivation, setMotivation] = useState('');
  const [journey,    setJourney]    = useState('');
  const [expertise,  setExpertise]  = useState('');
  const [social,     setSocial]     = useState('');
  const [errors,     setErrors]     = useState({});
  const [isLoading,  setIsLoading]  = useState(false);
  const [banner,     setBanner]     = useState('');
  const [submitted,  setSubmitted]  = useState(false);

  // UC #83 — delegate entirely to controller; no axios in this file
  const handleSubmit = useCallback(async () => {
    const { valid, errors: fieldErrors } = controller.validateApplication({ motivation, journey, expertise });
    if (!valid) { setErrors(fieldErrors); return; }

    setErrors({});
    setIsLoading(true);

    const result = await controller.submitApplication(
      user.userId,
      user.username,   // ADD THIS
      {
        motivation,
        journey,
        expertise,
        social,
      }
    );

    setIsLoading(false);
    setBanner(result.message || 'Application submitted! We will review it within 5–7 business days.');
    setSubmitted(true);
    setShowForm(false);
  }, [motivation, journey, expertise, social, user]);

  return (
    <SafeAreaView style={{flex:1,backgroundColor:C.bg}}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
      <StatusBar barStyle="dark-content" backgroundColor={C.white}/>
      <NavBar onMenu={() => navigation.goBack()}/>
      <Banner msg={banner}/>

      <ScrollView contentContainerStyle={{flexGrow: 1, paddingHorizontal:16,paddingBottom:32}}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
        <View style={{paddingTop:20,marginBottom:14}}>
          <View style={{alignSelf:'flex-start',backgroundColor:C.purple,borderRadius:20,paddingHorizontal:10,paddingVertical:3,marginBottom:8}}>
            <View style={{flexDirection:'row',alignItems:'center',gap:4}}><Image source={require('../assets/icon-premium-star.png')} style={{width:12,height:12,resizeMode:'contain'}} /><Text style={{fontSize:11,fontWeight:'700',color:C.white}}>Premium</Text></View>
          </View>
          <Text style={{fontSize:26,fontWeight:'800',color:C.dark,marginBottom:4}}>Curator Program</Text>
          <Text style={{fontSize:13,color:C.subtle}}>Become a BiteWise Curator and inspire others on their health journey</Text>
        </View>

        {/* What is a curator */}
        <View style={{backgroundColor:C.white,borderRadius:14,padding:16,borderWidth:1,borderColor:C.border,marginBottom:12}}>
          <View style={{flexDirection:'row',alignItems:'center',gap:4}}><Image source={require('../assets/icon-premium-star.png')} style={{width:12,height:12,resizeMode:'contain'}} /><Text style={{fontSize:15,fontWeight:'700',color:C.dark,marginBottom:8}}>What is a BiteWise Curator?</Text></View>
          <Text style={{fontSize:13,color:C.body,lineHeight:20,marginBottom:12}}>Curators are experienced Premium members who inspire and guide the BiteWise community. They share their health journey, create valuable content, and help others achieve their wellness goals.</Text>
          <View style={{backgroundColor:C.purpleLight,borderRadius:10,padding:12}}>
            <Text style={{fontSize:13,fontWeight:'600',color:C.purple,marginBottom:8}}>Curators are influencers within BiteWise who:</Text>
            {['Have achieved significant health milestones and want to share their experience','Are passionate about nutrition, fitness, and holistic wellness','Want to motivate and support others in the community'].map((t,i)=>(
              <View key={i} style={{flexDirection:'row',gap:8,marginBottom:6}}><Image source={require('../assets/icon-check.png')} style={{width:13,height:13,resizeMode:'contain'}} /><Text style={{flex:1,fontSize:13,color:C.body}}>{t}</Text></View>
            ))}
          </View>
        </View>

        {/* Abilities */}
        <View style={{backgroundColor:C.white,borderRadius:14,padding:16,borderWidth:1,borderColor:C.border,marginBottom:12}}>
          <View style={{flexDirection:'row',alignItems:'center',gap:4}}><Image source={require('../assets/section-badge.png')} style={{width:15,height:15,resizeMode:'contain'}} /><Text style={{fontSize:15,fontWeight:'700',color:C.dark,marginBottom:12}}>Curator Abilities & Benefits</Text></View>
          <Text style={{fontSize:13,fontWeight:'700',color:C.purple,marginBottom:8}}>What You Can Do:</Text>
          {[{icon:require('../assets/stat-users.png'),t:'Share Your Journey',d:'Post updates, transformation photos, and progress stories'},{ icon: require('../assets/tile-recipes.png'),t:'Create Content',d:'Publish recipes, meal plans, and wellness tips'},{icon:require('../assets/icon-check.png'),t:'Verified Badge',d:'Receive a special Curator badge on your profile'},{icon:require('../assets/icon-premium-star.png'),t:'Featured Content',d:'Your content may be featured in the app discovery feed'}].map((a,i)=>(
            <View key={i} style={{flexDirection:'row',gap:12,marginBottom:12}}>
              <View style={{width:36,height:36,borderRadius:18,backgroundColor:C.purpleLight,alignItems:'center',justifyContent:'center'}}><Text style={{fontSize:16}}>{a.icon}</Text></View>
              <View style={{flex:1}}><Text style={{fontSize:14,fontWeight:'600',color:C.dark}}>{a.t}</Text><Text style={{fontSize:13,color:C.subtle}}>{a.d}</Text></View>
            </View>
          ))}
          <Text style={{fontSize:13,fontWeight:'700',color:C.purple,marginBottom:8,marginTop:4}}>Exclusive Perks:</Text>
          {['Early Access: Test new features before public release','Curator Community: Private group for networking','Recognition: Highlighted in app and social media','Priority Support: Dedicated support from BiteWise team','Monetization: Potential to earn through content and partnerships'].map((p,i)=>(
            <View key={i} style={{flexDirection:'row',gap:8,marginBottom:6}}><Image source={require('../assets/icon-check.png')} style={{width:13,height:13,resizeMode:'contain'}} /><Text style={{flex:1,fontSize:13,color:C.body}}>{p}</Text></View>
          ))}
        </View>

        {/* Requirements */}
        <View style={{backgroundColor:C.white,borderRadius:14,padding:16,borderWidth:1,borderColor:C.border,marginBottom:12}}>
          <Text style={{fontSize:15,fontWeight:'700',color:C.dark,marginBottom:12}}>Curator Requirements</Text>
          {[{t:'Active Premium Membership',d:'Must maintain an active Premium subscription'},{t:'Documented Journey',d:'At least 3 months of consistent tracking on BiteWise'},{t:'Passion for Wellness',d:'Genuine interest in helping others achieve health goals'},{t:'Content Commitment',d:'Ability to create quality content regularly (at least 2-3 posts per week)'}].map((r,i)=>(
            <View key={i} style={{flexDirection:'row',gap:8,marginBottom:10}}><Image source={require('../assets/icon-check.png')} style={{width:13,height:13,resizeMode:'contain'}} /><View style={{flex:1}}><Text style={{fontSize:14,fontWeight:'600',color:C.dark}}>{r.t}</Text><Text style={{fontSize:13,color:C.subtle}}>{r.d}</Text></View></View>
          ))}
        </View>

        {/* Apply CTA or form */}
        {submitted ? (
          <View style={{backgroundColor:C.successBg,borderRadius:14,padding:20,alignItems:'center',borderWidth:1,borderColor:C.successBorder}}>
            <Image source={require('../assets/empty-goal-reached.png')} style={{width:32,height:32,resizeMode:'contain'}} />
            <Text style={{fontSize:16,fontWeight:'700',color:C.dark,marginBottom:4}}>Application Submitted!</Text>
            <Text style={{fontSize:13,color:C.body,textAlign:'center'}}>We will review it within 5-7 business days and notify you via email.</Text>
          </View>
        ) : !showForm ? (
          <View style={{backgroundColor:C.purpleLight,borderRadius:14,padding:24,alignItems:'center',borderWidth:1,borderColor:C.border}}>
            <View style={{width:56,height:56,borderRadius:28,backgroundColor:C.purple,alignItems:'center',justifyContent:'center',marginBottom:12}}><Image source={require('../assets/icon-premium-star.png')} style={{width:24,height:24,resizeMode:'contain'}} /></View>
            <Text style={{fontSize:18,fontWeight:'800',color:C.dark,marginBottom:6,textAlign:'center'}}>Ready to Become a Curator?</Text>
            <Text style={{fontSize:13,color:C.body,textAlign:'center',marginBottom:16,lineHeight:20}}>Join our community of wellness influencers. Applications are reviewed within 5-7 business days.</Text>
            <TouchableOpacity style={{backgroundColor:C.purple,borderRadius:10,paddingVertical:13,paddingHorizontal:32,flexDirection:'row',alignItems:'center',gap:8}} onPress={() => setShowForm(true)} activeOpacity={0.85}>
              <Image source={require('../assets/icon-send.png')} style={{width:14,height:14,resizeMode:'contain'}} />
              <Text style={{fontSize:15,fontWeight:'700',color:C.white}}>Apply Now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{backgroundColor:C.white,borderRadius:14,padding:16,borderWidth:1,borderColor:C.border}}>
            <View style={{flexDirection:'row',alignItems:'center',gap:8,marginBottom:16}}><Image source={require('../assets/icon-send.png')} style={{width:16,height:16,resizeMode:'contain'}} /><Text style={{fontSize:15,fontWeight:'700',color:C.dark}}>Curator Application</Text></View>
            <Field label="Why do you want to become a Curator?*" value={motivation} onChange={setMotivation} placeholder="Share your motivation and what you hope to achieve..." multiline error={errors.motivation}/>
            <Field label="Describe your health & fitness journey*" value={journey} onChange={setJourney} placeholder="Tell us about your transformation, challenges, and achievements..." multiline error={errors.journey}/>
            <Field label="What are your areas of expertise?*" value={expertise} onChange={setExpertise} placeholder="e.g., Meal prep, weight loss, muscle building..." error={errors.expertise}/>
            <Field label="Social Media Links (optional)" value={social} onChange={setSocial} placeholder="Instagram, YouTube, or blog links..."/>
            <View style={{backgroundColor:C.purpleLight,borderRadius:8,padding:12,marginBottom:16}}>
              <Text style={{fontSize:12,color:C.body,lineHeight:18}}><Text style={{fontWeight:'700'}}>Note:</Text> By submitting this application, you agree to the Curator Program guidelines and commit to creating positive, evidence-based content that aligns with BiteWise values.</Text>
            </View>
            <View style={{flexDirection:'row',gap:10}}>
              <TouchableOpacity style={{flex:1,backgroundColor:C.purple,borderRadius:10,paddingVertical:13,alignItems:'center',flexDirection:'row',justifyContent:'center',gap:8,opacity:isLoading?0.6:1}} onPress={handleSubmit} disabled={isLoading} activeOpacity={0.85}>
                <Image source={require('../assets/icon-send.png')} style={{width:14,height:14,resizeMode:'contain'}} />
                <Text style={{fontSize:15,fontWeight:'700',color:C.white}}>{isLoading?'Submitting...':'Submit Application'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{borderWidth:1,borderColor:C.border,borderRadius:10,paddingVertical:13,paddingHorizontal:20,alignItems:'center'}} onPress={() => { setShowForm(false); setErrors({}); }}>
                <Text style={{fontSize:14,color:C.mid,fontWeight:'600'}}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
          </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CuratorProgramScreen;
