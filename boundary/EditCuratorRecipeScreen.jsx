// EditCuratorRecipeScreen.jsx — UC #108 create, #113 edit, #114 delete
// Accepts route.params.recipe (null = create mode, populated = edit mode)
// Curator role only

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, StatusBar, Alert ,
  KeyboardAvoidingView, Platform, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import CreateCuratorRecipeController from '../controller/CreateCuratorRecipeController';
import EditCuratorRecipeController   from '../controller/EditCuratorRecipeController';
import DeleteCuratorRecipeController from '../controller/DeleteCuratorRecipeController';

const createCtrl = new CreateCuratorRecipeController();
const editCtrl   = new EditCuratorRecipeController();
const deleteCtrl = new DeleteCuratorRecipeController();

const C = { purple: '#7C3AED', dark: '#111827', mid: '#374151', subtle: '#6B7280', white: '#FFFFFF', border: '#E5E7EB', bg: '#F9FAFB', errorText: '#DC2626', errorBg: '#FEF2F2', green: '#16A34A', greenBg: '#F0FDF4', greenBorder: '#BBF7D0' };

const Field = ({ label, value, onChangeText, placeholder, multiline, error, keyboardType }) => (
  <View style={{ marginBottom: 14 }}>
    <Text style={f.label}>{label}</Text>
    {error ? <Text style={f.err}>{error}</Text> : null}
    <TextInput style={[f.input, multiline && f.multi, error && f.inputErr]} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={C.subtle} multiline={!!multiline} textAlignVertical={multiline ? 'top' : 'center'} keyboardType={keyboardType || 'default'} />
  </View>
);
const f = StyleSheet.create({ label: { fontSize: 13, fontWeight: '600', color: C.dark, marginBottom: 4 }, err: { fontSize: 12, color: C.errorText, marginBottom: 4 }, input: { backgroundColor: C.bg, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: C.dark, borderWidth: 1, borderColor: C.border }, multi: { minHeight: 80 }, inputErr: { borderColor: '#FECACA' } });

const EditCuratorRecipeScreen = ({ navigation, route }) => {
  const user   = route?.params?.user   || null;
  const recipe = route?.params?.recipe || null; // null = create mode
  const isEdit = recipe !== null;
  const recipeId = recipe?._id || recipe?.recipeId;
  console.log('🔥 RECEIVED recipe:', recipe);

  const [title,        setTitle]        = useState(recipe?.title        || '');
  const [description,  setDescription]  = useState(recipe?.description  || '');
  const [prepTimeMins, setPrepTimeMins] = useState(String(recipe?.prepTimeMins || ''));
  const [calories,     setCalories]     = useState(String(recipe?.calories     || ''));
  const [protein,      setProtein]      = useState(String(recipe?.protein      || ''));
  const [carbs,        setCarbs]        = useState(String(recipe?.carbs        || ''));
  const [fat,          setFat]          = useState(String(recipe?.fat          || ''));
  const [servings,     setServings]     = useState(String(recipe?.servings     || '1'));
  const [difficulty,   setDifficulty]   = useState(recipe?.difficulty   || 'Easy');
  const [ingredients,  setIngredients]  = useState((recipe?.ingredients  || []).join('\n'));
  const [instructions, setInstructions] = useState((recipe?.instructions || []).join('\n'));
  const [tags,         setTags]         = useState((recipe?.tags         || []).join(', '));
  const [errors,       setErrors]       = useState({});
  const [saving,       setSaving]       = useState(false);
  const [banner,       setBanner]       = useState('');

  const showBanner = (msg) => { setBanner(msg); setTimeout(() => setBanner(''), 3000); };

  const buildFields = () => ({
    title, description, difficulty,
    prepTimeMins: Number(prepTimeMins), calories: Number(calories),
    protein:      Number(protein),      carbs:    Number(carbs), fat: Number(fat),
    servings:     Number(servings),
    ingredients:  ingredients.split('\n').map((l) => l.trim()).filter(Boolean),
    instructions: instructions.split('\n').map((l) => l.trim()).filter(Boolean),
    tags:         tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean),
    isMealPrep:   false,
  });

  // UC #108 create / UC #113 edit
  const handleSave = useCallback(async () => {
    console.log('🔥 handleSave TRIGGERED');
    console.log('isEdit:', isEdit);
    console.log('recipeId:', recipeId);
    console.log('userId:', user?.userId);

    if (isEdit && !recipeId) {
      console.log('❌ Missing recipeId for edit');
      return;
    }

    setErrors({});
    setSaving(true);

    let result;

    const fields = buildFields();

    console.log('➡️ Fields:', fields);

    try {
      if (isEdit) {
        console.log('➡️ Calling updateRecipe');

        result = await editCtrl.updateRecipe(
          recipe,
          user.userId,
          fields
        );

        console.log('⬅️ updateRecipe RESULT:', result);
      } else {
        console.log('➡️ Calling createRecipe');

        result = await createCtrl.createRecipe(
          user.userId,
          fields
        );

        console.log('⬅️ createRecipe RESULT:', result);
      }

    } catch (err) {
      console.log('❌ Unexpected error:', err);
      result = {
        success: false,
        message: 'Unexpected error occurred',
      };
    }

    setSaving(false);

    if (result?.success) {
      showBanner(result.message);

      // 🔥 IMPORTANT: force refresh when going back
      setTimeout(() => {
        navigation.navigate('CuratorDashboardScreen', {
          user,
          refreshKey: Date.now(),
        });
      }, 1200);

    } else if (result?.field) {
      setErrors({ [result.field]: result.message });

    } else {
      console.log('⚠️ Failed result:', result);
    }
  }, [
    isEdit,
    recipeId,
    user?.userId,
    title,
    description,
    prepTimeMins,
    calories,
    protein,
    carbs,
    fat,
    servings,
    difficulty,
    ingredients,
    instructions,
    tags
  ]);

  // UC #114 delete
  const handleDelete = useCallback(() => {
    Alert.alert('Delete Recipe', 'Permanently delete this recipe?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const r = await deleteCtrl.deleteRecipe(recipeId, user.userId); // ✅ FIX
          if (r.success) navigation.goBack();
          else Alert.alert('Error', r.message);
        }
      },
    ]);
  }, [recipeId, user?.userId]);

  const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />
      <View style={s.nav}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.back}>← Back</Text></TouchableOpacity>
        <Text style={s.navTitle}>{isEdit ? 'Edit Recipe' : 'Create Recipe'}</Text>
        {isEdit ? <TouchableOpacity onPress={handleDelete}><Text style={s.delNav}>Delete</Text></TouchableOpacity> : <View style={{ width: 50 }} />}
      </View>
      {banner ? <View style={s.bannerBar}><Text style={s.bannerTxt}>✅  {banner}</Text></View> : null}

      <KeyboardAvoidingView

        style={{ flex: 1 }}

        behavior={Platform.OS === 'ios' ? 'padding' : undefined}

      >
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <Field label="Recipe Name *" value={title} onChangeText={setTitle} placeholder="e.g. High-Protein Chicken Bowl" error={errors.title} />
        <Field label="Description" value={description} onChangeText={setDescription} placeholder="Brief description of the recipe" multiline />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}><Field label="Prep Time (min)" value={prepTimeMins} onChangeText={setPrepTimeMins} placeholder="30" keyboardType="numeric" /></View>
          <View style={{ flex: 1 }}><Field label="Servings" value={servings} onChangeText={setServings} placeholder="1" keyboardType="numeric" /></View>
        </View>
        <Text style={{ fontSize: 13, fontWeight: '600', color: C.dark, marginBottom: 8 }}>Difficulty</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
          {DIFFICULTIES.map((d) => (
            <TouchableOpacity key={d} style={[s.diffChip, difficulty === d && s.diffActive]} onPress={() => setDifficulty(d)}>
              <Text style={[s.diffTxt, difficulty === d && s.diffActiveTxt]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={{ fontSize: 13, fontWeight: '700', color: C.dark, marginBottom: 8, marginTop: 4 }}>Nutrition (per serving)</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}><Field label="Calories" value={calories} onChangeText={setCalories} placeholder="450" keyboardType="numeric" /></View>
          <View style={{ flex: 1 }}><Field label="Protein (g)" value={protein} onChangeText={setProtein} placeholder="40" keyboardType="numeric" /></View>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}><Field label="Carbs (g)" value={carbs} onChangeText={setCarbs} placeholder="35" keyboardType="numeric" /></View>
          <View style={{ flex: 1 }}><Field label="Fat (g)" value={fat} onChangeText={setFat} placeholder="12" keyboardType="numeric" /></View>
        </View>
        <Field label="Ingredients * (one per line)" value={ingredients} onChangeText={setIngredients} placeholder={"150g chicken breast\n1 cup brown rice\n..."} multiline error={errors.ingredients} />
        <Field label="Instructions * (one step per line)" value={instructions} onChangeText={setInstructions} placeholder={"Preheat oven to 200°C.\nSeason chicken and grill...\n..."} multiline error={errors.instructions} />
        <Field label="Tags (comma separated)" value={tags} onChangeText={setTags} placeholder="high-protein, meal-prep, gluten-free" />
        <TouchableOpacity style={[s.saveBtn, saving && s.disabled]} onPress={handleSave} disabled={saving}>
          <Text style={s.saveBtnTxt}>{saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Recipe'}</Text>
        </TouchableOpacity>
      </ScrollView>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: C.bg },
  nav:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  back:        { fontSize: 14, color: C.purple, fontWeight: '600' },
  navTitle:    { fontSize: 17, fontWeight: '700', color: C.dark },
  delNav:      { fontSize: 14, color: C.errorText, fontWeight: '600' },
  bannerBar:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.greenBg, borderBottomWidth: 1, borderBottomColor: C.greenBorder },
  bannerTxt:   { fontSize: 14, fontWeight: '500', color: C.green },
  scroll:      { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40 },
  diffChip:    { borderWidth: 1, borderColor: C.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  diffActive:  { backgroundColor: C.purple, borderColor: C.purple },
  diffTxt:     { fontSize: 13, color: C.mid },
  diffActiveTxt:{ color: C.white, fontWeight: '600' },
  saveBtn:     { backgroundColor: C.purple, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  saveBtnTxt:  { fontSize: 15, fontWeight: '700', color: C.white },
  disabled:    { opacity: 0.6 },
});

export default EditCuratorRecipeScreen;
