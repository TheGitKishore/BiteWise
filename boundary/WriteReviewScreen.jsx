import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, StatusBar,
  Keyboard, KeyboardAvoidingView, Platform} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import WriteReviewController from '../controller/WriteReviewController';

const controller = new WriteReviewController();

const C = {
  purple:'#7C3AED', purpleLight:'#EDE9FE', dark:'#111827', mid:'#374151',
  body:'#4B5563', subtle:'#6B7280', white:'#FFFFFF', border:'#E5E7EB', bg:'#F9FAFB',
  successBg:'#F0FDF4', successBorder:'#BBF7D0', successText:'#15803D',
  errorText:'#DC2626',
};

const PROFILE_TYPES = ['Meal Planner', 'Athlete', 'Health-Oriented'];

// #44 Free User Write Review / #97 Premium User Write Review
const WriteReviewScreen = ({ navigation, route }) => {
  const user = route?.params?.user || null;

  const [rating,      setRating]      = useState(0);
  const [title,       setTitle]       = useState('');
  const [content,     setContent]     = useState('');
  const [profileType, setProfileType] = useState('');
  const [errors,      setErrors]      = useState({});
  const [isLoading,   setIsLoading]   = useState(false);
  const [submitted,   setSubmitted]   = useState(false);

  const handleSubmit = useCallback(async () => {
    setErrors({});
    setIsLoading(true);
    const result = await controller.submitReview(user?.userId, { rating, title, content, profileType });
    setIsLoading(false);
    if (result.success) {
      setSubmitted(true);
    } else if (result.field) {
      setErrors({ [result.field]: result.message });
    }
  }, [rating, title, content, profileType, user]);

  if (submitted) {
    return (
      <SafeAreaView style={{flex:1,backgroundColor:C.bg}}>
        <View style={{flex:1,alignItems:'center',justifyContent:'center',paddingHorizontal:32}}>
          <Text style={{fontSize:56,marginBottom:16}}>🌟</Text>
          <Text style={{fontSize:22,fontWeight:'800',color:C.dark,marginBottom:8,textAlign:'center'}}>Thank You!</Text>
          <Text style={{fontSize:14,color:C.subtle,textAlign:'center',marginBottom:24,lineHeight:21}}>Your review has been submitted and will appear once approved by our team.</Text>
          <TouchableOpacity style={{backgroundColor:C.purple,borderRadius:10,paddingVertical:13,paddingHorizontal:32}} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <Text style={{fontSize:15,fontWeight:'700',color:C.white}}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{flex:1,backgroundColor:C.bg}}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
      <StatusBar barStyle="dark-content" backgroundColor={C.white}/>
      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:20,paddingVertical:14,backgroundColor:C.white,borderBottomWidth:1,borderBottomColor:C.border}}>
        <View style={{flexDirection:'row',alignItems:'center',gap:6}}><Text style={{fontSize:20}}>🍴</Text><Text style={{fontSize:20,fontWeight:'800',color:C.dark}}>BiteWise</Text></View>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{padding:4}}><Text style={{fontSize:14,color:C.mid,fontWeight:'500'}}>← Back</Text></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{paddingHorizontal:16,paddingBottom:32}} keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag">
        <Text style={{fontSize:26,fontWeight:'800',color:C.dark,paddingTop:20,marginBottom:4}}>Write a Review</Text>
        <Text style={{fontSize:13,color:C.subtle,marginBottom:20}}>Share your BiteWise experience with the community</Text>

        {/* Star Rating */}
        <View style={{backgroundColor:C.white,borderRadius:14,padding:16,borderWidth:1,borderColor:C.border,marginBottom:12}}>
          <Text style={{fontSize:14,fontWeight:'700',color:C.dark,marginBottom:12}}>Your Rating *</Text>
          <View style={{flexDirection:'row',gap:10}}>
            {[1,2,3,4,5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)} activeOpacity={0.8}>
                <Text style={{fontSize:36,color:star<=rating?'#F59E0B':'#D1D5DB'}}>{star<=rating?'★':'☆'}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.rating ? <Text style={{fontSize:12,color:C.errorText,marginTop:6}}>{errors.rating}</Text> : null}
        </View>

        {/* Profile type */}
        <View style={{backgroundColor:C.white,borderRadius:14,padding:16,borderWidth:1,borderColor:C.border,marginBottom:12}}>
          <Text style={{fontSize:14,fontWeight:'700',color:C.dark,marginBottom:12}}>I am a (optional)</Text>
          <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>
            {PROFILE_TYPES.map((p) => (
              <TouchableOpacity key={p} style={{paddingHorizontal:14,paddingVertical:8,borderRadius:20,borderWidth:1,borderColor:profileType===p?C.purple:C.border,backgroundColor:profileType===p?C.purpleLight:C.white}} onPress={() => setProfileType(profileType===p?'':p)} activeOpacity={0.8}>
                <Text style={{fontSize:13,color:profileType===p?C.purple:C.mid,fontWeight:profileType===p?'700':'400'}}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Title */}
        <View style={{backgroundColor:C.white,borderRadius:14,padding:16,borderWidth:1,borderColor:C.border,marginBottom:12}}>
          <Text style={{fontSize:14,fontWeight:'700',color:C.dark,marginBottom:8}}>Review Title *</Text>
          <TextInput
            style={{backgroundColor:C.bg,borderRadius:8,paddingHorizontal:12,paddingVertical:10,fontSize:14,color:C.dark,borderWidth:1,borderColor:errors.title?'#FECACA':C.border}}
            value={title} onChangeText={setTitle} placeholder="Summarise your experience..." placeholderTextColor={C.subtle} autoCorrect={false}
          />
          {errors.title ? <Text style={{fontSize:12,color:C.errorText,marginTop:4}}>{errors.title}</Text> : null}
        </View>

        {/* Content */}
        <View style={{backgroundColor:C.white,borderRadius:14,padding:16,borderWidth:1,borderColor:C.border,marginBottom:20}}>
          <Text style={{fontSize:14,fontWeight:'700',color:C.dark,marginBottom:8}}>Your Review *</Text>
          <TextInput
            style={{backgroundColor:C.bg,borderRadius:8,paddingHorizontal:12,paddingVertical:10,fontSize:14,color:C.dark,borderWidth:1,borderColor:errors.content?'#FECACA':C.border,minHeight:120,textAlignVertical:'top'}}
            value={content} onChangeText={setContent} placeholder="Tell others about your experience with BiteWise..." placeholderTextColor={C.subtle} multiline autoCorrect={false}
          />
          {errors.content ? <Text style={{fontSize:12,color:C.errorText,marginTop:4}}>{errors.content}</Text> : null}
        </View>

        <TouchableOpacity style={{backgroundColor:C.purple,borderRadius:12,paddingVertical:16,alignItems:'center',opacity:isLoading?0.6:1}} onPress={handleSubmit} disabled={isLoading} activeOpacity={0.85}>
          <Text style={{fontSize:16,fontWeight:'700',color:C.white}}>{isLoading ? 'Submitting...' : 'Submit Review'}</Text>
        </TouchableOpacity>
      </ScrollView>
          </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default WriteReviewScreen;
