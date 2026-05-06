import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, StatusBar,
  Keyboard, KeyboardAvoidingView, Platform, TouchableWithoutFeedback} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import CreateRecipeController from '../controller/CreateRecipeController';

const controller = new CreateRecipeController();

const C = {
  purple:      '#7C3AED',
  purpleLight: '#EDE9FE',
  dark:        '#111827',
  mid:         '#374151',
  body:        '#4B5563',
  subtle:      '#6B7280',
  white:       '#FFFFFF',
  border:      '#E5E7EB',
  bg:          '#F9FAFB',
  errorText:   '#DC2626',
  successBg:   '#F0FDF4',
  successBorder:'#BBF7D0',
  successText: '#15803D',
};

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const TAG_OPTIONS  = ['high-protein', 'low-carb', 'vegetarian', 'vegan', 'gluten-free', 'breakfast', 'lunch', 'dinner', 'meal-prep', 'batch-cooking', 'quick', 'indian'];


const NavBar = ({ onBack }) => (
  <View style={nav.bar}>
    <View style={nav.brand}>
      <Text style={nav.icon}>🍴</Text>
      <Text style={nav.brandName}>BiteWise</Text>
    </View>
    <TouchableOpacity onPress={onBack} style={nav.backBtn}>
      <Text style={nav.backText}>← Back</Text>
    </TouchableOpacity>
  </View>
);
const nav = StyleSheet.create({
  bar:      { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:20, paddingVertical:14, backgroundColor:C.white, borderBottomWidth:1, borderBottomColor:C.border },
  brand:    { flexDirection:'row', alignItems:'center', gap:6 },
  icon:     { fontSize:20 },
  brandName:{ fontSize:20, fontWeight:'800', color:C.dark, letterSpacing:-0.3 },
  backBtn:  { padding:4 },
  backText: { fontSize:14, color:C.mid, fontWeight:'500' },
});

const Banner = ({ message }) => {
  if (!message) return null;
  return (
    <View style={bn.wrap}><Text style={bn.icon}>✅</Text><Text style={bn.text}>{message}</Text></View>
  );
};
const bn = StyleSheet.create({
  wrap: { flexDirection:'row', alignItems:'center', gap:10, paddingHorizontal:16, paddingVertical:12, backgroundColor:C.successBg, borderBottomWidth:1, borderBottomColor:C.successBorder },
  icon: { fontSize:16 },
  text: { flex:1, fontSize:14, fontWeight:'500', color:C.successText },
});

const Field = ({ label, value, onChangeText, placeholder, keyboardType, error, multiline }) => (
  <View style={fl.wrap}>
    <Text style={fl.label}>{label}</Text>
    <TextInput style={[fl.input, multiline && fl.multiline, error && fl.inputError]} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={C.subtle} keyboardType={keyboardType || 'default'} multiline={multiline} autoCorrect={false} autoCapitalize="none" />
    {error ? <Text style={fl.error}>{error}</Text> : null}
  </View>
);
const fl = StyleSheet.create({
  wrap:      { marginBottom:14 },
  label:     { fontSize:13, fontWeight:'600', color:C.dark, marginBottom:4 },
  input:     { backgroundColor:C.bg, borderRadius:8, paddingHorizontal:12, paddingVertical:10, fontSize:14, color:C.dark, borderWidth:1, borderColor:C.border },
  multiline: { minHeight:90, textAlignVertical:'top' },
  inputError:{ borderColor:'#FECACA' },
  error:     { fontSize:12, color:C.errorText, marginTop:3 },
});


// MAIN SCREEN — UC #27 (Free), #70 (Premium)

const CreateRecipeScreen = ({ navigation, route }) => {
  const user = route?.params?.user || null;

  const [title,        setTitle]        = useState('');
  const [description,  setDescription]  = useState('');
  const [prepTimeMins, setPrepTimeMins] = useState('');
  const [calories,     setCalories]     = useState('');
  const [protein,      setProtein]      = useState('');
  const [carbs,        setCarbs]        = useState('');
  const [fat,          setFat]          = useState('');
  const [servings,     setServings]     = useState('1');
  const [difficulty,   setDifficulty]   = useState('Easy');
  const [ingredients,  setIngredients]  = useState(['', '', '']);
  const [instructions, setInstructions] = useState(['', '']);
  const [selectedTags, setSelectedTags] = useState([]);
  const [fieldErrors,  setFieldErrors]  = useState({});
  const [isLoading,    setIsLoading]    = useState(false);
  const [banner,       setBanner]       = useState('');

  const updateListItem = (list, setList, idx, value) => {
    const updated = [...list];
    updated[idx] = value;
    setList(updated);
  };

  const addIngredient    = () => setIngredients((prev) => [...prev, '']);
  const addInstruction   = () => setInstructions((prev) => [...prev, '']);

  const toggleTag = (tag) => setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);

  const handleCreate = useCallback(async () => {
    setFieldErrors({});
    setIsLoading(true);

    const result = await controller.createRecipe(user?.userId, {
      title,
      description,
      prepTimeMins: Number(prepTimeMins) || 0,
      calories:     Number(calories)     || 0,
      protein:      Number(protein)      || 0,
      carbs:        Number(carbs)        || 0,
      fat:          Number(fat)          || 0,
      servings:     Number(servings)     || 1,
      difficulty,
      ingredients:  ingredients.filter((i) => i.trim()),
      instructions: instructions.filter((i) => i.trim()),
      tags:         selectedTags,
    });

    setIsLoading(false);

    if (result.success) {
      setBanner(result.message);
      // Reset form
      setTitle(''); setDescription(''); setPrepTimeMins(''); setCalories('');
      setProtein(''); setCarbs(''); setFat(''); setServings('1');
      setDifficulty('Easy'); setIngredients(['','','']); setInstructions(['','']);
      setSelectedTags([]);
      setTimeout(() => setBanner(''), 4000);
    } else if (result.field) {
      setFieldErrors({ [result.field]: result.message });
    }
  }, [title, description, prepTimeMins, calories, protein, carbs, fat, servings, difficulty, ingredients, instructions, selectedTags, user]);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />
      <NavBar onBack={() => navigation.goBack()} />
      <Banner message={banner} />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag">

        <Text style={styles.pageTitle}>Create Recipe</Text>
        <Text style={styles.pageSubtitle}>Add your own custom recipe to your collection</Text>

        {/* Basic details */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Recipe Details</Text>
          <Field label="Recipe Name *" value={title} onChangeText={setTitle} placeholder="e.g., Grilled Chicken Salad" error={fieldErrors.title} />
          <Field label="Description" value={description} onChangeText={setDescription} placeholder="Brief description of the recipe..." multiline />

          <View style={styles.rowGroup}>
            <View style={styles.halfField}><Field label="Prep Time (min)" value={prepTimeMins} onChangeText={setPrepTimeMins} placeholder="20" keyboardType="numeric" /></View>
            <View style={styles.halfField}><Field label="Servings" value={servings} onChangeText={setServings} placeholder="1" keyboardType="numeric" /></View>
          </View>

          <Text style={{ fontSize:13, fontWeight:'600', color:C.dark, marginBottom:8 }}>Difficulty</Text>
          <View style={styles.chipRow}>
            {DIFFICULTIES.map((d) => (
              <TouchableOpacity key={d} style={[ch.chip, difficulty === d && ch.chipActive]} onPress={() => setDifficulty(d)} activeOpacity={0.8}>
                <Text style={[ch.chipText, difficulty === d && ch.chipTextActive]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Nutrition */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Nutrition (per serving)</Text>
          <View style={styles.rowGroup}>
            <View style={styles.halfField}><Field label="Calories" value={calories} onChangeText={setCalories} placeholder="350" keyboardType="numeric" /></View>
            <View style={styles.halfField}><Field label="Protein (g)" value={protein} onChangeText={setProtein} placeholder="35" keyboardType="numeric" /></View>
          </View>
          <View style={styles.rowGroup}>
            <View style={styles.halfField}><Field label="Carbs (g)" value={carbs} onChangeText={setCarbs} placeholder="25" keyboardType="numeric" /></View>
            <View style={styles.halfField}><Field label="Fat (g)" value={fat} onChangeText={setFat} placeholder="12" keyboardType="numeric" /></View>
          </View>
        </View>

        {/* Ingredients */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Ingredients *</Text>
          {fieldErrors.ingredients ? <Text style={{ color:C.errorText, fontSize:12, marginBottom:6 }}>{fieldErrors.ingredients}</Text> : null}
          {ingredients.map((ing, i) => (
            <TextInput
              key={i}
              style={styles.listInput}
              value={ing}
              onChangeText={(v) => updateListItem(ingredients, setIngredients, i, v)}
              placeholder={`Ingredient ${i + 1}...`}
              placeholderTextColor={C.subtle}
              autoCorrect={false}
            />
          ))}
          <TouchableOpacity style={styles.addRowBtn} onPress={addIngredient}>
            <Text style={styles.addRowBtnText}>+ Add Ingredient</Text>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Instructions *</Text>
          {fieldErrors.instructions ? <Text style={{ color:C.errorText, fontSize:12, marginBottom:6 }}>{fieldErrors.instructions}</Text> : null}
          {instructions.map((step, i) => (
            <View key={i} style={styles.stepInputRow}>
              <View style={styles.stepNumBadge}><Text style={styles.stepNumText}>{i + 1}</Text></View>
              <TextInput
                style={[styles.listInput, { flex:1 }]}
                value={step}
                onChangeText={(v) => updateListItem(instructions, setInstructions, i, v)}
                placeholder={`Step ${i + 1}...`}
                placeholderTextColor={C.subtle}
                multiline
                autoCorrect={false}
              />
            </View>
          ))}
          <TouchableOpacity style={styles.addRowBtn} onPress={addInstruction}>
            <Text style={styles.addRowBtnText}>+ Add Step</Text>
          </TouchableOpacity>
        </View>

        {/* Tags */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Tags</Text>
          <View style={styles.chipRow}>
            {TAG_OPTIONS.map((tag) => (
              <TouchableOpacity key={tag} style={[ch.chip, selectedTags.includes(tag) && ch.chipActive]} onPress={() => toggleTag(tag)} activeOpacity={0.8}>
                <Text style={[ch.chipText, selectedTags.includes(tag) && ch.chipTextActive]}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Submit */}
        <TouchableOpacity style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]} onPress={handleCreate} activeOpacity={0.85} disabled={isLoading}>
          <Text style={styles.submitBtnText}>{isLoading ? 'Creating Recipe...' : 'Create Recipe'}</Text>
        </TouchableOpacity>

      </ScrollView>
      </View>
      </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const ch = StyleSheet.create({
  chip:          { paddingHorizontal:12, paddingVertical:6, borderRadius:20, borderWidth:1, borderColor:C.border, backgroundColor:C.white, marginRight:8, marginBottom:8 },
  chipActive:    { backgroundColor:C.purple, borderColor:C.purple },
  chipText:      { fontSize:12, color:C.mid },
  chipTextActive:{ color:C.white, fontWeight:'600' },
});

const styles = StyleSheet.create({
  safe:          { flex:1, backgroundColor:C.bg },
  list: { flexGrow: 1, paddingHorizontal:16, paddingBottom:32 },
  pageTitle:     { fontSize:26, fontWeight:'800', color:C.dark, letterSpacing:-0.3, paddingTop:20, marginBottom:4 },
  pageSubtitle:  { fontSize:13, color:C.subtle, marginBottom:16 },
  card:          { backgroundColor:C.white, borderRadius:14, padding:16, marginBottom:14, borderWidth:1, borderColor:C.border },
  cardHeading:   { fontSize:15, fontWeight:'700', color:C.dark, marginBottom:12 },
  rowGroup:      { flexDirection:'row', gap:10 },
  halfField:     { flex:1 },
  chipRow:       { flexDirection:'row', flexWrap:'wrap' },
  listInput:     { backgroundColor:C.bg, borderRadius:8, paddingHorizontal:12, paddingVertical:9, fontSize:13, color:C.dark, borderWidth:1, borderColor:C.border, marginBottom:8 },
  addRowBtn:     { alignSelf:'flex-start', paddingVertical:4 },
  addRowBtnText: { fontSize:13, color:C.purple, fontWeight:'600' },
  stepInputRow:  { flexDirection:'row', alignItems:'flex-start', gap:10, marginBottom:8 },
  stepNumBadge:  { width:26, height:26, borderRadius:13, backgroundColor:C.purple, alignItems:'center', justifyContent:'center', marginTop:8, flexShrink:0 },
  stepNumText:   { fontSize:12, fontWeight:'700', color:C.white },
  submitBtn:     { backgroundColor:C.purple, borderRadius:12, paddingVertical:16, alignItems:'center', marginBottom:8 },
  submitBtnDisabled:{ opacity:0.6 },
  submitBtnText: { fontSize:16, fontWeight:'700', color:C.white },
});

export default CreateRecipeScreen;
