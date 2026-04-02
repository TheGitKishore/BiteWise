import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import API_CONFIG from '../entity/api_config.js';

const C = {
  purple:'#7C3AED', purpleLight:'#EDE9FE', dark:'#111827', mid:'#374151',
  body:'#4B5563', subtle:'#6B7280', white:'#FFFFFF', border:'#E5E7EB', bg:'#F9FAFB',
  successBg:'#F0FDF4', successBorder:'#BBF7D0', successText:'#15803D',
};

const NavBar = ({ onMenu }) => (
  <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:20,paddingVertical:14,backgroundColor:C.white,borderBottomWidth:1,borderBottomColor:C.border}}>
    <View style={{flexDirection:'row',alignItems:'center',gap:6}}><Text style={{fontSize:20}}>🍴</Text><Text style={{fontSize:20,fontWeight:'800',color:C.dark}}>BiteWise</Text></View>
    <TouchableOpacity onPress={onMenu} style={{padding:6,gap:4,alignItems:'flex-end'}}>
      <View style={{width:22,height:2.5,backgroundColor:C.dark,borderRadius:2}}/><View style={{width:18,height:2.5,backgroundColor:C.dark,borderRadius:2}}/><View style={{width:22,height:2.5,backgroundColor:C.dark,borderRadius:2}}/>
    </TouchableOpacity>
  </View>
);

// #27, #70 — My Custom Recipes: view list + navigate to CreateRecipeScreen
const MyRecipesScreen = ({ navigation, route }) => {
  const user = route?.params?.user || null;
  const [recipes,   setRecipes]   = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [banner,    setBanner]    = useState(route?.params?.banner || '');

  useEffect(() => {
    if (banner) setTimeout(() => setBanner(''), 4000);
    axios.get(`${API_CONFIG}/recipes/user/${user?.userId}`)
      .then((res) => { setRecipes(res.data || []); })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <SafeAreaView style={{flex:1,backgroundColor:C.bg}}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white}/>
      <NavBar onMenu={() => navigation.navigate('AccountSettingsScreen', { user })}/>
      {banner ? (
        <View style={{flexDirection:'row',alignItems:'center',gap:10,paddingHorizontal:16,paddingVertical:12,backgroundColor:C.successBg,borderBottomWidth:1,borderBottomColor:C.successBorder}}>
          <Text style={{fontSize:16}}>✅</Text><Text style={{flex:1,fontSize:14,fontWeight:'500',color:C.successText}}>{banner}</Text>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={{paddingHorizontal:16,paddingBottom:32}}>
        <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingTop:20,marginBottom:4}}>
          <View>
            <Text style={{fontSize:24,fontWeight:'800',color:C.dark}}>My Custom Recipes</Text>
            <Text style={{fontSize:13,color:C.subtle,marginTop:2}}>Create and save your favourite recipes</Text>
          </View>
          <TouchableOpacity style={{backgroundColor:C.purple,borderRadius:8,paddingVertical:9,paddingHorizontal:14}}
            onPress={() => navigation.navigate('CreateRecipeScreen', { user })} activeOpacity={0.85}>
            <Text style={{fontSize:13,fontWeight:'700',color:C.white}}>+ Create Recipe</Text>
          </TouchableOpacity>
        </View>

        <View style={{height:20}}/>

        {isLoading ? <ActivityIndicator size="large" color={C.purple}/> : recipes.length === 0 ? (
          <View style={{backgroundColor:C.white,borderRadius:14,padding:32,alignItems:'center',borderWidth:1,borderColor:C.border}}>
            <Text style={{fontSize:48,marginBottom:12}}>👨‍🍳</Text>
            <Text style={{fontSize:18,fontWeight:'700',color:C.dark,marginBottom:6}}>No Custom Recipes Yet</Text>
            <Text style={{fontSize:13,color:C.subtle,textAlign:'center',marginBottom:20}}>Start creating your own recipes to keep your favourites organised</Text>
            <TouchableOpacity style={{backgroundColor:C.purple,borderRadius:8,paddingVertical:10,paddingHorizontal:20}}
              onPress={() => navigation.navigate('CreateRecipeScreen', { user })} activeOpacity={0.85}>
              <Text style={{fontSize:13,fontWeight:'700',color:C.white}}>+ Create Your First Recipe</Text>
            </TouchableOpacity>
          </View>
        ) : (
          recipes.map((r, i) => (
            <View key={i} style={{backgroundColor:C.white,borderRadius:14,padding:14,borderWidth:1,borderColor:C.border,marginBottom:12}}>
              <Text style={{fontSize:16,fontWeight:'700',color:C.dark,marginBottom:4}}>{r.title}</Text>
              <Text style={{fontSize:13,color:C.subtle,marginBottom:6}}>⏱ {r.prepTimeMins} min  •  {r.calories} kcal  •  {r.difficulty}</Text>
              {r.tags?.length > 0 && (
                <View style={{flexDirection:'row',flexWrap:'wrap',gap:6}}>
                  {r.tags.map((t, ti) => <View key={ti} style={{backgroundColor:C.purpleLight,borderRadius:20,paddingHorizontal:8,paddingVertical:3}}><Text style={{fontSize:11,color:C.purple}}>{t}</Text></View>)}
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default MyRecipesScreen;
