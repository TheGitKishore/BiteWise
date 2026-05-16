// GroceryListScreen.jsx — UC #94 generate, #95 add item, #96 delete item
// Premium User only

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, StatusBar, Modal,
  Keyboard, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Image} from 'react-native';
import { SafeAreaView }   from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import GenerateGroceryListController from '../controller/GenerateGroceryListController';
import AddGroceryItemController      from '../controller/AddGroceryItemController';
import DeleteGroceryItemController   from '../controller/DeleteGroceryItemController';
import ViewSavedRecipesController    from '../controller/ViewSavedRecipesController';

const generateCtrl = new GenerateGroceryListController();
const addCtrl      = new AddGroceryItemController();
const deleteCtrl   = new DeleteGroceryItemController();
const savedCtrl    = new ViewSavedRecipesController();

const C = { purple: '#7C3AED', purpleLight: '#EDE9FE', dark: '#111827', mid: '#374151', subtle: '#6B7280', white: '#FFFFFF', border: '#E5E7EB', bg: '#F9FAFB', green: '#16A34A', greenBg: '#F0FDF4', greenBorder: '#BBF7D0', errorText: '#DC2626' };

// UC #95 — Add Item Modal
const AddItemModal = ({ visible, onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [qty,  setQty]  = useState('');
  const [unit, setUnit] = useState('');
  const [err,  setErr]  = useState('');

  const reset = () => { setName(''); setQty(''); setUnit(''); setErr(''); };
  const handleClose = () => { reset(); onClose(); };
  const handleAdd   = () => {
    if (!name.trim()) { setErr('Item name is required.'); return; }
    onAdd({ name, quantity: qty, unit });
    reset(); onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', paddingHorizontal: 16 }}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={{ backgroundColor: C.white, borderRadius: 16, padding: 22, paddingTop: 40 }}>
          <TouchableOpacity style={{ position: 'absolute', top: 12, right: 16 }} onPress={handleClose}><Image source={require('../assets/icon-close.png')} style={{width:16,height:16,resizeMode:'contain'}} /></TouchableOpacity>
          <Text style={{ fontSize: 16, fontWeight: '700', color: C.dark, textAlign: 'center', marginBottom: 16 }}>Add Item</Text>
          {err ? <Text style={{ color: C.errorText, fontSize: 12, marginBottom: 6 }}>{err}</Text> : null}
          <Text style={{ fontSize: 13, fontWeight: '600', color: C.dark, marginBottom: 4 }}>Item Name *</Text>
          <TextInput style={{ backgroundColor: C.bg, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, borderWidth: 1, borderColor: C.border, marginBottom: 10 }} value={name} onChangeText={setName} placeholder="e.g. Oats" placeholderTextColor={C.subtle} />
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: C.dark, marginBottom: 4 }}>Qty</Text>
              <TextInput style={{ backgroundColor: C.bg, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, borderWidth: 1, borderColor: C.border }} value={qty} onChangeText={setQty} placeholder="1" keyboardType="numeric" placeholderTextColor={C.subtle} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: C.dark, marginBottom: 4 }}>Unit</Text>
              <TextInput style={{ backgroundColor: C.bg, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, borderWidth: 1, borderColor: C.border }} value={unit} onChangeText={setUnit} placeholder="g / cup / unit" placeholderTextColor={C.subtle} />
            </View>
          </View>
          <TouchableOpacity style={{ backgroundColor: C.purple, borderRadius: 10, paddingVertical: 13, alignItems: 'center' }} onPress={handleAdd}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: C.white }}>Add to List</Text>
          </TouchableOpacity>
        </View>
        </TouchableWithoutFeedback>
      </View>
    </Modal>
  );
};

const GroceryListScreen = ({ navigation, route }) => {
  const user = route?.params?.user || null;
  const [list,         setList]         = useState(null);
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [showAdd,      setShowAdd]      = useState(false);
  const [banner,       setBanner]       = useState('');

  const showBanner = (msg) => { setBanner(msg); setTimeout(() => setBanner(''), 4000); };

  useFocusEffect(useCallback(() => {
    if (!user?.userId) return;
    generateCtrl.fetchCurrentList(user.userId).then((r) => { if (r.success) setList(r.data); });
    savedCtrl.fetchSavedRecipes(user.userId).then((r) => { if (r.success) setSavedRecipes(r.data); });
  }, [user?.userId]));

  // UC #94 — generate from saved recipe
  const handleGenerate = useCallback(async (recipe) => {
    const r = await generateCtrl.generateFromRecipe(user.userId, recipe);
    if (r.success) { setList(r.data); showBanner(r.message); }
  }, [user?.userId]);

  // UC #95 — add custom item
  const handleAdd = useCallback(async ({ name, quantity, unit }) => {
    const r = await addCtrl.addItem(user.userId, { name, quantity, unit });
    if (r.success) { setList(r.data); showBanner('Item added.'); }
  }, [user?.userId]);

  // UC #96 — delete item
  const handleDelete = useCallback(async (itemId) => {
    const r = await deleteCtrl.deleteItem(user.userId, itemId);
    if (r.success) { setList(r.data); showBanner('Item removed.'); }
  }, [user?.userId]);

  // Toggle checkoff
  const handleToggle = useCallback(async (itemId) => {
    const r = await addCtrl.toggleItem(user.userId, itemId);
    if (r.success) setList(r.data);
  }, [user?.userId]);

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />
      <View style={s.nav}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.back}>← Back</Text></TouchableOpacity>
        <Text style={s.navTitle}>Grocery List</Text>
        <View style={{ width: 50 }} />
      </View>
      {banner ? <View style={s.bannerBar}><View style={{flexDirection:'row',alignItems:'center',gap:4}}><Image source={require('../assets/icon-success.png')} style={{width:20,height:20,resizeMode:'contain'}} /><Text style={s.bannerTxt}>{banner}</Text></View></View> : null}
      <AddItemModal visible={showAdd} onClose={() => setShowAdd(false)} onAdd={handleAdd} />
      <ScrollView contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
        <View style={s.header}>
          <View style={s.badge}><View style={{flexDirection:'row',alignItems:'center',gap:4}}><Image source={require('../assets/icon-premium-star.png')} style={{width:12,height:12,resizeMode:'contain'}} /><Text style={s.badgeTxt}>Premium</Text></View></View>
          <Text style={s.pageTitle}>Grocery List</Text>
          <Text style={s.pageSub}>Auto-generated from your saved recipes</Text>
        </View>
        {savedRecipes.length > 0 && (
          <View style={s.section}>
            <Text style={s.secTitle}>Generate from Saved Recipe</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
              {savedRecipes.map((r) => (
                <TouchableOpacity key={r.recipeId} style={s.recipeChip} onPress={() => handleGenerate(r)}>
                  <Text style={s.recipeChipTxt}>{r.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        {list ? (
          <View style={s.section}>
            <View style={s.listHead}>
              <View>
                <Text style={s.secTitle}>{list.sourceRecipeTitle || 'My Grocery List'}</Text>
                <Text style={s.listMeta}>{list.getCheckedCount ? list.getCheckedCount() : 0} / {list.items.length} items checked</Text>
              </View>
              <TouchableOpacity style={s.addItemBtn} onPress={() => setShowAdd(true)}>
                <Text style={s.addItemBtnTxt}>+ Add Item</Text>
              </TouchableOpacity>
            </View>
            {list.items.map((item) => (
              <View key={item.itemId} style={s.itemRow}>
                <TouchableOpacity style={[s.checkbox, item.checked && s.checkboxOn]} onPress={() => handleToggle(item.itemId)}>
                  {item.checked ? <Image source={require('../assets/icon-check.png')} style={[s.tick,{width:14,height:14,resizeMode:'contain'}]} /> : null}
                </TouchableOpacity>
                <View style={s.itemInfo}>
                  <Text style={[s.itemName, item.checked && s.strikethrough]}>{item.name}</Text>
                  <Text style={s.itemQty}>{item.quantity} {item.unit}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(item.itemId)} style={s.itemDel}>
                  <Image source={require('../assets/icon-close.png')} style={[s.itemDelTxt,{width:16,height:16,resizeMode:'contain'}]} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <View style={s.emptyCard}>
            <Image source={require('../assets/empty-grocery.png')} style={[s.emptyEmoji,{width:48,height:48,resizeMode:'contain'}]} />
            <Text style={s.emptyTitle}>No Grocery List Yet</Text>
            <Text style={s.emptyBody}>Select a saved recipe above to auto-generate your shopping list.</Text>
          </View>
        )}
      </ScrollView>
          </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: C.bg },
  nav:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  back:          { fontSize: 14, color: C.purple, fontWeight: '600' },
  navTitle:      { fontSize: 17, fontWeight: '700', color: C.dark },
  bannerBar:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.greenBg, borderBottomWidth: 1, borderBottomColor: C.greenBorder },
  bannerTxt:     { fontSize: 14, fontWeight: '500', color: C.green },
  scroll: { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 32 },
  header:        { paddingVertical: 20 },
  badge:         { alignSelf: 'flex-start', backgroundColor: C.purple, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 8 },
  badgeTxt:      { fontSize: 11, fontWeight: '700', color: C.white },
  pageTitle:     { fontSize: 28, fontWeight: '800', color: C.dark, letterSpacing: -0.5, marginBottom: 4 },
  pageSub:       { fontSize: 14, color: C.subtle },
  section:       { backgroundColor: C.white, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 16 },
  secTitle:      { fontSize: 15, fontWeight: '700', color: C.dark, marginBottom: 8 },
  recipeChip:    { backgroundColor: C.purpleLight, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 },
  recipeChipTxt: { fontSize: 13, color: C.purple, fontWeight: '600' },
  listHead:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  listMeta:      { fontSize: 12, color: C.subtle, marginTop: 2 },
  addItemBtn:    { backgroundColor: C.purple, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  addItemBtnTxt: { fontSize: 12, fontWeight: '700', color: C.white },
  itemRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.border },
  checkbox:      { width: 22, height: 22, borderRadius: 4, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  checkboxOn:    { backgroundColor: C.green, borderColor: C.green },
  tick:          { color: C.white, fontSize: 13, fontWeight: '700' },
  itemInfo:      { flex: 1 },
  itemName:      { fontSize: 14, color: C.dark, fontWeight: '500' },
  strikethrough: { textDecorationLine: 'line-through', color: C.subtle },
  itemQty:       { fontSize: 12, color: C.subtle, marginTop: 1 },
  itemDel:       { padding: 6 },
  itemDelTxt:    { fontSize: 14, color: C.subtle },
  emptyCard:     { backgroundColor: C.white, borderRadius: 14, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  emptyEmoji:    { fontSize: 48, marginBottom: 12 },
  emptyTitle:    { fontSize: 18, fontWeight: '700', color: C.dark, marginBottom: 6 },
  emptyBody:     { fontSize: 13, color: C.subtle, textAlign: 'center' },
});

export default GroceryListScreen;
