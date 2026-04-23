// EditMyRecipeScreen.jsx — UC NEW-C Premium User – Edit Custom Recipe
// Sprint 9: New screen. Pre-fills the form from route.params.recipe.
// Design mirrors CreateRecipeScreen exactly (same fields, same layout).
// On save → navigates back to MyRecipesScreen with success banner.
// Premium User only

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, StatusBar ,
  KeyboardAvoidingView, Platform, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import UpdateCustomRecipeController from '../controller/UpdateCustomRecipeController';

const ctrl = new UpdateCustomRecipeController();

const C = {
  purple:'#7C3AED', purpleLight:'#EDE9FE', dark:'#111827', mid:'#374151',
  body:'#4B5563', subtle:'#6B7280', white:'#FFFFFF', border:'#E5E7EB', bg:'#F9FAFB',
  errorText:'#DC2626', errorBorder:'#FECACA',
  successBg:'#F0FDF4', successBorder:'#BBF7D0', successText:'#15803D',
};

const DIFFICULTIES = ['Easy','Medium','Hard'];
const TAG_OPTIONS  = ['high-protein','low-carb','vegetarian','vegan','gluten-free','breakfast','lunch','dinner','meal-prep','batch-cooking','quick','indian'];

const NavBar = ({ onBack }) => (
  <View style={nav.bar}>
    <View style={nav.brand}><Text style={nav.icon}>🍴</Text><Text style={nav.brandName}>BiteWise</Text></View>
    <TouchableOpacity onPress={onBack} style={nav.backBtn}><Text style={nav.backText}>← Back</Text></TouchableOpacity>
  </View>
);
const nav = StyleSheet.create({
  bar:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:20,paddingVertical:14,backgroundColor:C.white,borderBottomWidth:1,borderBottomColor:C.border},
  brand:{flexDirection:'row',alignItems:'center',gap:6},icon:{fontSize:20},
  brandName:{fontSize:20,fontWeight:'800',color:C.dark,letterSpacing:-0.3},
  backBtn:{padding:4},backText:{fontSize:14,color:C.mid,fontWeight:'500'},
});

const Banner = ({ message }) => {
  if (!message) return null;
  return (
    <View style={bn.wrap}><Text style={bn.icon}>✅</Text><Text style={bn.text}>{message}</Text></View>
  );
};
const bn = StyleSheet.create({
  wrap:{flexDirection:'row',alignItems:'center',gap:10,paddingHorizontal:16,paddingVertical:12,backgroundColor:C.successBg,borderBottomWidth:1,borderBottomColor:C.successBorder},
  icon:{fontSize:16},text:{flex:1,fontSize:14,fontWeight:'500',color:C.successText},
});

const Field = ({ label, value, onChangeText, placeholder, keyboardType, error, multiline }) => (
  <View style={fi.wrap}>
    <Text style={fi.label}>{label}</Text>
    {error ? <Text style={fi.err}>{error}</Text> : null}
    <TextInput
      style={[fi.input, multiline&&fi.multiline, error&&fi.inputErr]}
      value={value} onChangeText={onChangeText} placeholder={placeholder}
      placeholderTextColor={C.subtle} keyboardType={keyboardType||'default'}
      multiline={multiline} autoCorrect={false}
    />
  </View>
);
const fi = StyleSheet.create({
  wrap:{marginBottom:16},label:{fontSize:14,fontWeight:'600',color:C.dark,marginBottom:6},
  err:{fontSize:12,color:C.errorText,marginBottom:4},
  input:{backgroundColor:C.bg,borderRadius:8,paddingHorizontal:14,paddingVertical:11,fontSize:15,color:C.dark,borderWidth:1,borderColor:C.border},
  multiline:{height:100,textAlignVertical:'top'},inputErr:{borderColor:C.errorBorder},
});

const SectionCard = ({ title, children }) => (
  <View style={sc.card}><Text style={sc.title}>{title}</Text>{children}</View>
);
const sc = StyleSheet.create({
  card:{backgroundColor:C.white,borderRadius:14,padding:16,marginBottom:14,borderWidth:1,borderColor:C.border},
  title:{fontSize:15,fontWeight:'700',color:C.dark,marginBottom:14},
});

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
const EditMyRecipeScreen = ({ navigation, route }) => {
  const user   = route?.params?.user   || null;
  const recipe = route?.params?.recipe || {};

  const [title,        setTitle]        = useState(recipe.title        || '');
  const [description,  setDescription]  = useState(recipe.description  || '');
  const [prepTimeMins, setPrepTimeMins] = useState(String(recipe.prepTimeMins || ''));
  const [calories,     setCalories]     = useState(String(recipe.calories  || ''));
  const [protein,      setProtein]      = useState(String(recipe.protein   || ''));
  const [carbs,        setCarbs]        = useState(String(recipe.carbs     || ''));
  const [fat,          setFat]          = useState(String(recipe.fat       || ''));
  const [servings,     setServings]     = useState(String(recipe.servings  || '1'));
  const [difficulty,   setDifficulty]   = useState(recipe.difficulty   || 'Easy');
  const [ingredients,  setIngredients]  = useState((recipe.ingredients  || []).join('\n'));
  const [instructions, setInstructions] = useState((recipe.instructions || []).join('\n'));
  const [selectedTags, setSelectedTags] = useState(recipe.tags || []);
  const [isMealPrep,   setIsMealPrep]   = useState(recipe.isMealPrep || false);
  const [fieldErrors,  setFieldErrors]  = useState({});
  const [banner,       setBanner]       = useState('');
  const [isSaving,     setIsSaving]     = useState(false);

  const toggleTag = (tag) =>
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const handleSave = useCallback(async () => {
    setFieldErrors({}); setIsSaving(true);
    const recipeId = recipe._id || recipe.recipeId;
    const result = await ctrl.updateRecipe(recipeId, user?.userId, {
      title, description,
      prepTimeMins: Number(prepTimeMins) || 0,
      calories:     Number(calories)     || 0,
      protein:      Number(protein)      || 0,
      carbs:        Number(carbs)        || 0,
      fat:          Number(fat)          || 0,
      servings:     Number(servings)     || 1,
      difficulty,
      ingredients:  ingredients.split('\n').map(s => s.trim()).filter(Boolean),
      instructions: instructions.split('\n').map(s => s.trim()).filter(Boolean),
      tags:         selectedTags,
      isMealPrep,
    });
    setIsSaving(false);
    if (result.success) {
      setBanner(result.message);
      setTimeout(() => navigation.navigate('MyRecipesScreen', { user, banner: result.message }), 1200);
    } else if (result.field) {
      setFieldErrors({ [result.field]: result.message });
    }
  }, [title,description,prepTimeMins,calories,protein,carbs,fat,servings,difficulty,ingredients,instructions,selectedTags,isMealPrep,recipe,user,navigation]);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white}/>
      <NavBar onBack={() => navigation.goBack()}/>
      <Banner message={banner}/>

      <KeyboardAvoidingView

        style={{ flex: 1 }}

        behavior={Platform.OS === 'ios' ? 'padding' : undefined}

      >
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <Text style={s.pageTitle}>Edit Recipe</Text>
        <Text style={s.pageSub}>Update your custom recipe details</Text>

        <SectionCard title="Basic Details">
          <Field label="Recipe Name *" value={title} onChangeText={setTitle} placeholder="e.g. Grilled Chicken Bowl" error={fieldErrors.title}/>
          <Field label="Description" value={description} onChangeText={setDescription} placeholder="Short description..." multiline/>
          <View style={s.row}>
            <View style={s.half}><Field label="Prep Time (min)" value={prepTimeMins} onChangeText={setPrepTimeMins} placeholder="30" keyboardType="numeric"/></View>
            <View style={s.gap}/>
            <View style={s.half}><Field label="Servings" value={servings} onChangeText={setServings} placeholder="1" keyboardType="numeric"/></View>
          </View>
          <Text style={s.label}>Difficulty</Text>
          <View style={s.chipRow}>
            {DIFFICULTIES.map(d => (
              <TouchableOpacity key={d} style={[s.chip,difficulty===d&&s.chipActive]} onPress={() => setDifficulty(d)}>
                <Text style={[s.chipTxt,difficulty===d&&s.chipTxtActive]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </SectionCard>

        <SectionCard title="Nutrition (per serving)">
          <View style={s.row}>
            <View style={s.half}><Field label="Calories (kcal)" value={calories} onChangeText={setCalories} placeholder="450" keyboardType="numeric"/></View>
            <View style={s.gap}/>
            <View style={s.half}><Field label="Protein (g)" value={protein} onChangeText={setProtein} placeholder="35" keyboardType="numeric"/></View>
          </View>
          <View style={s.row}>
            <View style={s.half}><Field label="Carbs (g)" value={carbs} onChangeText={setCarbs} placeholder="50" keyboardType="numeric"/></View>
            <View style={s.gap}/>
            <View style={s.half}><Field label="Fat (g)" value={fat} onChangeText={setFat} placeholder="15" keyboardType="numeric"/></View>
          </View>
        </SectionCard>

        <SectionCard title="Ingredients *">
          {fieldErrors.ingredients ? <Text style={s.err}>{fieldErrors.ingredients}</Text> : null}
          <TextInput style={[s.bigInput,fieldErrors.ingredients&&s.bigInputErr]} value={ingredients} onChangeText={setIngredients}
            placeholder={"One per line:\n200g chicken breast\n1 cup rice"} placeholderTextColor={C.subtle} multiline textAlignVertical="top"/>
        </SectionCard>

        <SectionCard title="Instructions *">
          {fieldErrors.instructions ? <Text style={s.err}>{fieldErrors.instructions}</Text> : null}
          <TextInput style={[s.bigInput,fieldErrors.instructions&&s.bigInputErr]} value={instructions} onChangeText={setInstructions}
            placeholder={"One step per line:\nSeason the chicken\nHeat oil in pan"} placeholderTextColor={C.subtle} multiline textAlignVertical="top"/>
        </SectionCard>

        <SectionCard title="Tags">
          <View style={s.chipRow}>
            {TAG_OPTIONS.map(tag => (
              <TouchableOpacity key={tag} style={[s.chip,selectedTags.includes(tag)&&s.chipActive]} onPress={() => toggleTag(tag)}>
                <Text style={[s.chipTxt,selectedTags.includes(tag)&&s.chipTxtActive]}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={[s.mealPrepBtn,isMealPrep&&s.mealPrepBtnActive]} onPress={() => setIsMealPrep(!isMealPrep)}>
            <Text style={[s.mealPrepTxt,isMealPrep&&s.mealPrepTxtActive]}>
              {isMealPrep ? '✓ Meal Prep Ready' : 'Mark as Meal Prep'}
            </Text>
          </TouchableOpacity>
        </SectionCard>

        <TouchableOpacity style={[s.saveBtn,isSaving&&s.saveBtnDisabled]} onPress={handleSave} disabled={isSaving} activeOpacity={0.85}>
          <Text style={s.saveBtnText}>{isSaving ? 'Saving...' : 'Save Changes'}</Text>
        </TouchableOpacity>
      </ScrollView>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:{flex:1,backgroundColor:C.bg},scroll:{paddingHorizontal:16,paddingTop:20,paddingBottom:40},
  pageTitle:{fontSize:24,fontWeight:'800',color:C.dark,marginBottom:4},
  pageSub:{fontSize:14,color:C.subtle,marginBottom:20},
  row:{flexDirection:'row'},half:{flex:1},gap:{width:12},
  label:{fontSize:14,fontWeight:'600',color:C.dark,marginBottom:8},
  chipRow:{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:14},
  chip:{borderWidth:1,borderColor:C.border,borderRadius:20,paddingHorizontal:12,paddingVertical:6,backgroundColor:C.white},
  chipActive:{backgroundColor:C.purple,borderColor:C.purple},
  chipTxt:{fontSize:12,color:C.mid},chipTxtActive:{color:C.white,fontWeight:'600'},
  bigInput:{backgroundColor:C.bg,borderRadius:8,paddingHorizontal:14,paddingVertical:11,fontSize:14,color:C.dark,borderWidth:1,borderColor:C.border,height:120,textAlignVertical:'top'},
  bigInputErr:{borderColor:C.errorBorder},err:{fontSize:12,color:C.errorText,marginBottom:6},
  mealPrepBtn:{borderWidth:1,borderColor:C.border,borderRadius:8,paddingVertical:10,alignItems:'center'},
  mealPrepBtnActive:{backgroundColor:C.purpleLight,borderColor:C.purple},
  mealPrepTxt:{fontSize:13,fontWeight:'600',color:C.mid},mealPrepTxtActive:{color:C.purple},
  saveBtn:{backgroundColor:C.purple,borderRadius:12,paddingVertical:15,alignItems:'center',marginTop:8},
  saveBtnDisabled:{opacity:0.6},saveBtnText:{fontSize:16,fontWeight:'700',color:C.white},
});

export default EditMyRecipeScreen;
