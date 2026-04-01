import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, StatusBar, ActivityIndicator, Modal, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ViewMealPlansController    from '../controller/ViewMealPlansController';
import CreateMealPlanController   from '../controller/CreateMealPlanController';
import GenerateMealPlanController from '../controller/GenerateMealPlanController';
import DeleteMealPlanController   from '../controller/DeleteMealPlanController';
import UpdateMealPlanController from '../controller/UpdateMealPlanController';

const viewCtrl     = new ViewMealPlansController();
const createCtrl   = new CreateMealPlanController();
const generateCtrl = new GenerateMealPlanController();
const deleteCtrl   = new DeleteMealPlanController();
const updateCtrl = new UpdateMealPlanController();

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
  dangerText:  '#DC2626',
};

const DAY_OPTIONS      = [{ label:'3 Days', value:3 }, { label:'5 Days', value:5 }, { label:'7 Days (1 Week)', value:7 }, { label:'14 Days (2 Weeks)', value:14 }];
const PLAN_TYPES       = ['Balanced Diet', 'High Protein', 'Weight Loss', 'Vegetarian', 'Keto'];
const MEAL_SLOTS       = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];


const NavBar = ({ onMenuPress }) => (
  <View style={nav.bar}>
    <View style={nav.brand}>
      <Text style={nav.icon}>🍴</Text>
      <Text style={nav.brandName}>BiteWise</Text>
    </View>
    <TouchableOpacity onPress={onMenuPress} style={nav.menuBtn}>
      <View style={nav.menuLine} />
      <View style={[nav.menuLine, { width:18 }]} />
      <View style={nav.menuLine} />
    </TouchableOpacity>
  </View>
);
const nav = StyleSheet.create({
  bar:      { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:20, paddingVertical:14, backgroundColor:C.white, borderBottomWidth:1, borderBottomColor:C.border },
  brand:    { flexDirection:'row', alignItems:'center', gap:6 },
  icon:     { fontSize:20 },
  brandName:{ fontSize:20, fontWeight:'800', color:C.dark, letterSpacing:-0.3 },
  menuBtn:  { padding:6, gap:4, alignItems:'flex-end' },
  menuLine: { width:22, height:2.5, backgroundColor:C.dark, borderRadius:2 },
});

const Banner = ({ message }) => {
  if (!message) return null;
  return (
    <View style={bn.wrap}>
      <Text style={bn.icon}>✅</Text>
      <Text style={bn.text}>{message}</Text>
    </View>
  );
};
const bn = StyleSheet.create({
  wrap: { flexDirection:'row', alignItems:'center', gap:10, paddingHorizontal:16, paddingVertical:12, backgroundColor:C.successBg, borderBottomWidth:1, borderBottomColor:C.successBorder },
  icon: { fontSize:16 },
  text: { flex:1, fontSize:14, fontWeight:'500', color:C.successText },
});

const ModalSheet = ({ visible, title, subtitle, onClose, children }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={ms.overlay}>
      <View style={ms.sheet}>
        <TouchableOpacity style={ms.closeBtn} onPress={onClose}><Text style={ms.closeIcon}>✕</Text></TouchableOpacity>
        <Text style={ms.title}>{title}</Text>
        {subtitle ? <Text style={ms.subtitle}>{subtitle}</Text> : null}
        {children}
      </View>
    </View>
  </Modal>
);
const ms = StyleSheet.create({
  overlay: { flex:1, backgroundColor:'rgba(0,0,0,0.45)', justifyContent:'center', paddingHorizontal:16 },
  sheet:   { backgroundColor:C.white, borderRadius:16, padding:22, paddingTop:36, maxHeight:'90%' },
  closeBtn:{ position:'absolute', top:12, right:16, padding:4 },
  closeIcon:{ fontSize:16, color:C.subtle },
  title:   { fontSize:16, fontWeight:'700', color:C.dark, textAlign:'center', marginBottom:4 },
  subtitle:{ fontSize:13, color:C.subtle, textAlign:'center', marginBottom:18 },
});

const Field = ({ label, value, onChangeText, placeholder, multiline, error }) => (
  <View style={fl.wrap}>
    <Text style={fl.label}>{label}</Text>
    <TextInput style={[fl.input, multiline && fl.multiline, error && fl.inputError]} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={C.subtle} multiline={multiline} autoCorrect={false} />
    {error ? <Text style={fl.error}>{error}</Text> : null}
  </View>
);
const fl = StyleSheet.create({
  wrap:      { marginBottom:12 },
  label:     { fontSize:13, fontWeight:'600', color:C.dark, marginBottom:4 },
  input:     { backgroundColor:C.bg, borderRadius:8, paddingHorizontal:12, paddingVertical:10, fontSize:14, color:C.dark, borderWidth:1, borderColor:C.border },
  multiline: { minHeight:70, textAlignVertical:'top' },
  inputError:{ borderColor:'#FECACA' },
  error:     { fontSize:12, color:C.errorText, marginTop:3 },
});


// UC #26, #69 — CREATE MEAL PLAN MODAL

const CreatePlanModal = ({ visible, userId, isPremium, onClose, onSuccess }) => {
  const [name,        setName]        = useState('');
  const [description, setDescription] = useState('');
  const [numDays,     setNumDays]     = useState(7);
  const [days,        setDays]        = useState([]);
  const [fieldError,  setFieldError]  = useState('');
  const [isLoading,   setIsLoading]   = useState(false);

  const updateMeal = (dayIdx, slot, value) => {
    setDays((prev) => {
      const updated = [...prev];
      updated[dayIdx] = { ...updated[dayIdx], [slot.toLowerCase()]: value };
      return updated;
    });
  };

  const resetAndClose = () => {
    setName(''); setDescription(''); setNumDays(7); setDays([]); setFieldError('');
    onClose();
  };

  const handleCreate = useCallback(async () => {
    setFieldError('');
    setIsLoading(true);
    const result = await createCtrl.createMealPlan(userId, { name, description, numDays, days });
    setIsLoading(false);
    if (result.success) { resetAndClose(); onSuccess(result.message, result.data); }
    else setFieldError(result.message);
  }, [name, description, numDays, days, userId]);

  // Build day slots when numDays changes
  useEffect(() => {
    setDays(Array.from({ length: numDays }, (_, i) => ({ day: i + 1, breakfast: '', lunch: '', dinner: '', snack: '' })));
  }, [numDays]);

  return (
    <ModalSheet visible={visible} title="Create Meal Plan" subtitle="Start a new custom meal plan for your week" onClose={resetAndClose}>
      <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 500 }}>
        <Field label="Plan Name" value={name} onChangeText={setName} placeholder="My Weekly Plan" error={fieldError} />
        <Field label="Description (Optional)" value={description} onChangeText={setDescription} placeholder="Describe your meal plan..." multiline />

        {/* Number of days picker */}
        <Text style={{ fontSize:13, fontWeight:'600', color:C.dark, marginBottom:8 }}>Number of Days</Text>
        <View style={cp.dayRow}>
          {DAY_OPTIONS.map((opt) => (
            <TouchableOpacity key={opt.value} style={[cp.dayChip, numDays === opt.value && cp.dayChipActive]} onPress={() => setNumDays(opt.value)} activeOpacity={0.8}>
              <Text style={[cp.dayChipText, numDays === opt.value && cp.dayChipTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Meal Details — optional */}
        <Text style={{ fontSize:13, color:C.subtle, marginBottom:10, marginTop:4 }}>
          Meal Details <Text style={{ color:C.purple }}>(Optional - can be filled later)</Text>
        </Text>
        {days.map((day, i) => (
          <View key={i}>
            <Text style={cp.dayHeading}>Day {day.day}</Text>
            {MEAL_SLOTS.map((slot) => (
              <View key={slot} style={cp.mealRow}>
                <Text style={cp.mealSlot}>{slot}</Text>
                <TextInput
                  style={cp.mealInput}
                  value={day[slot.toLowerCase()] || ''}
                  onChangeText={(v) => updateMeal(i, slot, v)}
                  placeholder={slot === 'Breakfast' ? 'e.g., Oatmeal with berries' : slot === 'Lunch' ? 'e.g., Grilled chicken salad' : slot === 'Dinner' ? 'e.g., Salmon with vegetables' : 'e.g., Greek yogurt'}
                  placeholderTextColor={C.subtle}
                  autoCorrect={false}
                />
              </View>
            ))}
          </View>
        ))}

        <TouchableOpacity style={[cp.createBtn, isLoading && cp.createBtnDisabled]} onPress={handleCreate} activeOpacity={0.85} disabled={isLoading}>
          <Text style={cp.createBtnText}>{isLoading ? 'Creating...' : '+ Create Plan'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </ModalSheet>
  );
};
const cp = StyleSheet.create({
  dayRow:          { flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:16 },
  dayChip:         { paddingHorizontal:12, paddingVertical:6, borderRadius:20, borderWidth:1, borderColor:C.border, backgroundColor:C.white },
  dayChipActive:   { backgroundColor:C.purple, borderColor:C.purple },
  dayChipText:     { fontSize:12, color:C.mid },
  dayChipTextActive:{ color:C.white, fontWeight:'600' },
  dayHeading:      { fontSize:14, fontWeight:'700', color:C.purple, marginBottom:8, marginTop:4 },
  mealRow:         { marginBottom:8 },
  mealSlot:        { fontSize:12, fontWeight:'600', color:C.dark, marginBottom:3 },
  mealInput:       { backgroundColor:C.bg, borderRadius:6, paddingHorizontal:10, paddingVertical:7, fontSize:13, color:C.dark, borderWidth:1, borderColor:C.border },
  createBtn:       { backgroundColor:C.purple, borderRadius:10, paddingVertical:14, alignItems:'center', marginTop:12 },
  createBtnDisabled:{ opacity:0.6 },
  createBtnText:   { fontSize:15, fontWeight:'700', color:C.white },
});


// UC #28, #71 — AUTO GENERATE MODAL

const AutoGenerateModal = ({ visible, userId, onClose, onSuccess }) => {
  const [planType,  setPlanType]  = useState('Balanced Diet');
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = useCallback(async () => {
    setIsLoading(true);
    const result = await generateCtrl.generateMealPlan(userId, { planType });
    setIsLoading(false);
    if (result.success) { onClose(); onSuccess(result.message, result.data); }
  }, [planType, userId]);

  return (
    <ModalSheet visible={visible} title="Generate Meal Plan" subtitle="Automatically create a 7-day meal plan based on your preferences" onClose={onClose}>
      <Text style={{ fontSize:13, fontWeight:'600', color:C.dark, marginBottom:8 }}>Plan Type</Text>
      <View style={ag.typeGrid}>
        {PLAN_TYPES.map((t) => (
          <TouchableOpacity key={t} style={[ag.typeChip, planType === t && ag.typeChipActive]} onPress={() => setPlanType(t)} activeOpacity={0.8}>
            <Text style={[ag.typeChipText, planType === t && ag.typeChipTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={[ag.genBtn, isLoading && ag.genBtnDisabled]} onPress={handleGenerate} activeOpacity={0.85} disabled={isLoading}>
        <Text style={ag.genBtnText}>{isLoading ? 'Generating...' : 'Generate Plan'}</Text>
      </TouchableOpacity>
    </ModalSheet>
  );
};
const ag = StyleSheet.create({
  typeGrid:         { flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:20 },
  typeChip:         { paddingHorizontal:14, paddingVertical:8, borderRadius:20, borderWidth:1, borderColor:C.border, backgroundColor:C.white },
  typeChipActive:   { backgroundColor:C.purple, borderColor:C.purple },
  typeChipText:     { fontSize:13, color:C.mid },
  typeChipTextActive:{ color:C.white, fontWeight:'600' },
  genBtn:           { backgroundColor:C.purple, borderRadius:10, paddingVertical:14, alignItems:'center' },
  genBtnDisabled:   { opacity:0.6 },
  genBtnText:       { fontSize:15, fontWeight:'700', color:C.white },
});


// Meal plan card — with View Details / Edit / Delete actions
const MealPlanCard = ({ plan, isPremium, onDelete, onViewDetails, onEdit }) => (
  <View style={mc.card}>
    <View style={mc.titleRow}>
      <Text style={mc.title}>{plan.name}</Text>
      {plan.isAutoGenerated && (
        <View style={mc.autoBadge}><Text style={mc.autoBadgeText}>✗ Auto</Text></View>
      )}
    </View>
    {plan.description ? <Text style={mc.desc}>{plan.description}</Text> : null}
    <View style={mc.metaRow}>
      <Text style={mc.meta}>📅 {plan.numDays} days</Text>
      <Text style={mc.meta}>Created: {plan.createdAt ? new Date(plan.createdAt).toLocaleDateString('en-SG') : 'N/A'}</Text>
    </View>
    {/* Sample day preview */}
    {plan.days && plan.days[0] && (
      <View style={mc.preview}>
        <Text style={mc.previewHeading}>Sample Day 1:</Text>
        {[plan.days[0].breakfast, plan.days[0].lunch, plan.days[0].dinner].filter(Boolean).map((m, i) => (
          <Text key={i} style={mc.previewMeal}>• {m}</Text>
        ))}
      </View>
    )}
    <View style={mc.actionRow}>
      <TouchableOpacity style={mc.viewBtn} onPress={() => onViewDetails(plan)} activeOpacity={0.8}>
        <Text style={mc.viewBtnText}>View Details</Text>
      </TouchableOpacity>
      {/* Edit — Premium only (#74) */}
      {isPremium && (
        <TouchableOpacity
          style={mc.editBtn}
          onPress={() => onEdit(plan)}
          activeOpacity={0.8}
        >
          <Text style={mc.editBtnText}>✏ Edit</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={mc.deleteBtn} onPress={() => onDelete(plan.planId)} activeOpacity={0.8}>
        <Text style={mc.deleteBtnText}>🗑 Delete</Text>
      </TouchableOpacity>
    </View>
  </View>
);
const mc = StyleSheet.create({
  card:         { backgroundColor:C.white, borderRadius:14, padding:16, marginBottom:12, borderWidth:1, borderColor:C.border },
  titleRow:     { flexDirection:'row', alignItems:'center', gap:8, marginBottom:4 },
  title:        { fontSize:16, fontWeight:'700', color:C.dark, flex:1 },
  autoBadge:    { backgroundColor:C.purpleLight, borderRadius:20, paddingHorizontal:8, paddingVertical:3 },
  autoBadgeText:{ fontSize:11, color:C.purple, fontWeight:'600' },
  desc:         { fontSize:13, color:C.subtle, marginBottom:6 },
  metaRow:      { flexDirection:'row', gap:16, marginBottom:10 },
  meta:         { fontSize:12, color:C.subtle },
  preview:      { marginBottom:12 },
  previewHeading:{ fontSize:13, fontWeight:'700', color:C.dark, marginBottom:4 },
  previewMeal:  { fontSize:12, color:C.purple, marginBottom:2 },
  actionRow:    { flexDirection:'row', gap:8, alignItems:'center' },
  viewBtn:      { borderWidth:1, borderColor:C.border, borderRadius:8, paddingVertical:8, paddingHorizontal:14 },
  viewBtnText:  { fontSize:13, color:C.mid, fontWeight:'500' },
  editBtn:      { borderWidth:0, borderRadius:8, paddingVertical:8, paddingHorizontal:10 },
  editBtnText:  { fontSize:13, color:C.purple, fontWeight:'600' },
  deleteBtn:    { marginLeft:'auto' },
  deleteBtnText:{ fontSize:13, color:C.dangerText, fontWeight:'600' },
});


// MAIN SCREEN
// Free: #26, #28, #29, #30
// Premium: #69, #71, #72, #73, #74, #75

const MealPlansScreen = ({ navigation, route }) => {
  const user      = route?.params?.user || null;
  const isPremium = user?.role === 'premium';

  const [plans,         setPlans]         = useState([]);
  const [isLoading,     setIsLoading]     = useState(true);
  const [banner,        setBanner]        = useState('');
  const [showCreate,    setShowCreate]    = useState(false);
  const [showGenerate,  setShowGenerate]  = useState(false);
  const [viewingPlan,   setViewingPlan]   = useState(null); // UC #73
  const [editingPlan, setEditingPlan] = useState(null);

  useEffect(() => {
    viewCtrl.fetchMealPlans(user?.userId).then((result) => {
      if (result.success) setPlans(result.data);
      setIsLoading(false);
    });
  }, []);

  const showBanner = (msg) => {
    setBanner(msg);
    setTimeout(() => setBanner(''), 4000);
  };

  const handlePlanAdded = useCallback((message, plan) => {
    setPlans((prev) => [...prev, plan]);
    showBanner(message);
  }, []);

  const EditPlanModal = ({ visible, plan, onClose, onSuccess }) => {
    const [name,        setName]        = useState('');
    const [description, setDescription] = useState('');
    const [numDays,     setNumDays]     = useState(7);
    const [days,        setDays]        = useState([]);
    const [fieldError,  setFieldError]  = useState('');
    const [isLoading,   setIsLoading]   = useState(false);

    useEffect(() => {
      if (!plan) return;

      setName(plan.name || '');
      setDescription(plan.description || '');
      setNumDays(plan.numDays || 7);

      const safeDays = Array.from({ length: plan.numDays || 7 }, (_, i) => {
        const existing = plan.days?.[i] || {};
        return {
          day: i + 1,
          breakfast: existing.breakfast || '',
          lunch: existing.lunch || '',
          dinner: existing.dinner || '',
          snack: existing.snack || '',
        };
      });

      setDays(safeDays);
    }, [plan]);

    const updateMeal = (dayIdx, slot, value) => {
      setDays((prev) => {
        const updated = [...prev];
        updated[dayIdx] = { ...updated[dayIdx], [slot.toLowerCase()]: value };
        return updated;
      });
    };

    const handleUpdate = async () => {
      setFieldError('');
      setIsLoading(true);

      const result = await updateCtrl.updateMealPlan(plan.planId, {
        name,
        description,
        numDays,
        days,
      });

      setIsLoading(false);

      if (result.success) {
        onSuccess(result.message, result.data);
        onClose();
      } else {
        setFieldError(result.message);
      }
    };

    const resetAndClose = () => {
      setName('');
      setDescription('');
      setDays([]);
      setFieldError('');
      onClose();
    };

    useEffect(() => {
      setDays(prev => {
        const updated = Array.from({ length: numDays }, (_, i) => {
          const existing = prev[i] || {};
          return {
            day: i + 1,
            breakfast: existing.breakfast || '',
            lunch: existing.lunch || '',
            dinner: existing.dinner || '',
            snack: existing.snack || '',
          };
        });
        return updated;
      });
    }, [numDays]);    

    if (!plan) return null;

    return (
      <ModalSheet
        visible={visible}
        title="Edit Meal Plan"
        subtitle="Update your existing meal plan"
        onClose={resetAndClose}
      >
        <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 500 }}>

          {/* SAME AS CREATE */}
          <Field
            label="Plan Name"
            value={name}
            onChangeText={setName}
            placeholder="My Weekly Plan"
            error={fieldError}
          />

          <Field
            label="Description (Optional)"
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your meal plan..."
            multiline
          />

          {/* SAME DAY SELECTOR */}
          <Text style={{ fontSize:13, fontWeight:'600', color:C.dark, marginBottom:8 }}>
            Number of Days
          </Text>

          <View style={cp.dayRow}>
            {DAY_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  cp.dayChip,
                  numDays === opt.value && cp.dayChipActive
                ]}
                onPress={() => setNumDays(opt.value)}
                activeOpacity={0.8}
              >
                <Text style={[
                  cp.dayChipText,
                  numDays === opt.value && cp.dayChipTextActive
                ]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* MEAL DETAILS */}
          <Text style={{ fontSize:13, color:C.subtle, marginBottom:10, marginTop:4 }}>
            Meal Details
          </Text>

          {days.map((day, i) => (
            <View key={i}>
              <Text style={cp.dayHeading}>Day {day.day}</Text>

              {MEAL_SLOTS.map((slot) => (
                <View key={slot} style={cp.mealRow}>
                  <Text style={cp.mealSlot}>{slot}</Text>

                  <TextInput
                    style={cp.mealInput}
                    value={day[slot.toLowerCase()] || ''}
                    onChangeText={(v) => updateMeal(i, slot, v)}
                    placeholder={
                      slot === 'Breakfast'
                        ? 'e.g., Oatmeal with berries'
                        : slot === 'Lunch'
                        ? 'e.g., Grilled chicken salad'
                        : slot === 'Dinner'
                        ? 'e.g., Salmon with vegetables'
                        : 'e.g., Greek yogurt'
                    }
                    placeholderTextColor={C.subtle}
                    autoCorrect={false}
                  />
                </View>
              ))}
            </View>
          ))}

          {/* SAVE BUTTON (same style as create) */}
          <TouchableOpacity
            style={[cp.createBtn, isLoading && cp.createBtnDisabled]}
            onPress={handleUpdate}
            activeOpacity={0.85}
            disabled={isLoading}
          >
            <Text style={cp.createBtnText}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </ModalSheet>
    );
  };

  // UC #30, #75 — delete
  const handleDelete = useCallback((planId) => {
    Alert.alert('Delete Meal Plan', 'This will permanently delete this meal plan.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const result = await deleteCtrl.deleteMealPlan(planId);
          if (result.success) {
            setPlans((prev) => prev.filter((p) => p.planId !== planId));
            showBanner('Meal plan deleted');
          }
        },
      },
    ]);
  }, []);

  // UC #73 — view plan details
  if (viewingPlan) {
    return (
      <SafeAreaView style={styles.safe}>
        <NavBar onMenuPress={() => navigation.navigate('AccountSettingsScreen', { user })} />
        <ScrollView contentContainerStyle={styles.list}>
          <TouchableOpacity onPress={() => setViewingPlan(null)} style={{ paddingVertical:14 }}>
            <Text style={{ fontSize:14, color:C.mid, fontWeight:'500' }}>← Back to Meal Plans</Text>
          </TouchableOpacity>
          <Text style={styles.pageTitle}>{viewingPlan.name}</Text>
          {viewingPlan.description ? <Text style={{ fontSize:13, color:C.subtle, marginBottom:14 }}>{viewingPlan.description}</Text> : null}
          {viewingPlan.days.map((day) => (
            <View key={day.day} style={{ backgroundColor:C.white, borderRadius:12, padding:14, marginBottom:10, borderWidth:1, borderColor:C.border }}>
              <Text style={{ fontSize:14, fontWeight:'700', color:C.purple, marginBottom:8 }}>Day {day.day}</Text>
              {MEAL_SLOTS.map((slot) => day[slot.toLowerCase()] ? (
                <View key={slot} style={{ marginBottom:6 }}>
                  <Text style={{ fontSize:12, fontWeight:'600', color:C.mid }}>{slot}</Text>
                  <Text style={{ fontSize:13, color:C.dark }}>{day[slot.toLowerCase()]}</Text>
                </View>
              ) : null)}
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />
      <NavBar onMenuPress={() => navigation.navigate('AccountSettingsScreen', { user })} />
      <Banner message={banner} />

      {/* UC #26, #69 */}
      <CreatePlanModal
        visible={showCreate}
        userId={user?.userId}
        isPremium={isPremium}
        onClose={() => setShowCreate(false)}
        onSuccess={handlePlanAdded}
      />

      {/* UC #28, #71 */}
      <AutoGenerateModal
        visible={showGenerate}
        userId={user?.userId}
        onClose={() => setShowGenerate(false)}
        onSuccess={handlePlanAdded}
      />

      <EditPlanModal
        visible={!!editingPlan}
        plan={editingPlan}
        onClose={() => setEditingPlan(null)}
        onSuccess={async (msg) => {
          const result = await viewCtrl.fetchMealPlans(user?.userId);
          if (result.success) setPlans(result.data);
          showBanner(msg);
        }}
      />

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>

        {/* Page title */}
        <Text style={styles.pageTitle}>Meal Plans</Text>
        <Text style={styles.pageSubtitle}>Create and manage your weekly meal plans</Text>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.autoBtn} onPress={() => setShowGenerate(true)} activeOpacity={0.85}>
            <Text style={styles.autoIcon}>✗</Text>
            <Text style={styles.autoBtnText}>Auto Generate</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreate(true)} activeOpacity={0.85}>
            <Text style={styles.createBtnText}>+ Create Plan</Text>
          </TouchableOpacity>
        </View>

        {/* Plan list */}
        {isLoading ? (
          <ActivityIndicator size="large" color={C.purple} style={{ marginTop:40 }} />
        ) : plans.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyTitle}>No Meal Plans Yet</Text>
            <Text style={styles.emptyBody}>Create your first meal plan to start organizing your weekly meals</Text>
            <View style={styles.emptyBtnRow}>
              <TouchableOpacity style={styles.autoBtn} onPress={() => setShowGenerate(true)} activeOpacity={0.85}>
                <Text style={styles.autoIcon}>✗</Text>
                <Text style={styles.autoBtnText}>Auto Generate</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreate(true)} activeOpacity={0.85}>
                <Text style={styles.createBtnText}>+ Create Plan</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          plans.map((plan) => (
            <MealPlanCard
              key={plan.planId}
              plan={plan}
              isPremium={isPremium}
              onDelete={handleDelete}
              onViewDetails={setViewingPlan}
              onEdit={setEditingPlan}
            />
          ))
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:         { flex:1, backgroundColor:C.bg },
  list:         { paddingHorizontal:16, paddingBottom:32 },
  pageTitle:    { fontSize:26, fontWeight:'800', color:C.dark, letterSpacing:-0.3, paddingTop:20, marginBottom:4 },
  pageSubtitle: { fontSize:13, color:C.subtle, marginBottom:16 },
  actionRow:    { flexDirection:'row', gap:10, marginBottom:16 },
  autoBtn:      { flexDirection:'row', alignItems:'center', gap:4, borderWidth:1, borderColor:C.border, borderRadius:8, paddingVertical:10, paddingHorizontal:14, backgroundColor:C.white },
  autoIcon:     { fontSize:14, color:C.purple },
  autoBtnText:  { fontSize:13, fontWeight:'600', color:C.dark },
  createBtn:    { flexDirection:'row', alignItems:'center', backgroundColor:C.purple, borderRadius:8, paddingVertical:10, paddingHorizontal:16 },
  createBtnText:{ fontSize:13, fontWeight:'700', color:C.white },
  emptyState:   { backgroundColor:C.white, borderRadius:14, padding:32, alignItems:'center', borderWidth:1, borderColor:C.border },
  emptyIcon:    { fontSize:48, marginBottom:12 },
  emptyTitle:   { fontSize:18, fontWeight:'700', color:C.dark, marginBottom:6 },
  emptyBody:    { fontSize:13, color:C.subtle, textAlign:'center', lineHeight:20, marginBottom:20 },
  emptyBtnRow:  { flexDirection:'row', gap:10 },
});

export default MealPlansScreen;
