// EditBlogPostScreen.jsx
// UC #118 Curator – Create Blog Post     (route.params.post === null)
// UC #121 Curator – Edit Blog Post       (route.params.post populated)
// UC #122 Curator – Delete Blog Post     (Delete nav button → Alert)
// Curator role only

import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, StatusBar, Alert,
  Keyboard, KeyboardAvoidingView, Platform, Image} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import CreateBlogPostController from '../controller/CreateBlogPostController';
import EditBlogPostController   from '../controller/EditBlogPostController';
import DeleteBlogPostController from '../controller/DeleteBlogPostController';

const createCtrl = new CreateBlogPostController();
const editCtrl   = new EditBlogPostController();
const deleteCtrl = new DeleteBlogPostController();

const C = {
  purple: '#7C3AED', dark: '#111827', mid: '#374151', subtle: '#6B7280',
  white: '#FFFFFF', border: '#E5E7EB', bg: '#F9FAFB',
  errorText: '#DC2626', errorBorder: '#FECACA',
  green: '#16A34A', greenBg: '#F0FDF4', greenBorder: '#BBF7D0',
};

const EditBlogPostScreen = ({ navigation, route }) => {
  const user = route?.params?.user || null;
  const post = route?.params?.post || null;  // null = create mode
  const isEdit = post !== null;

  const [title,   setTitle]   = useState(post?.title   || '');
  const [content, setContent] = useState(post?.content || '');
  const [tags,    setTags]    = useState((post?.tags || []).join(', '));
  const [bannerImageUrl, setBannerImageUrl] = useState(post?.bannerImageUrl || '');
  const [errors,  setErrors]  = useState({});
  const [saving,  setSaving]  = useState(false);
  const [banner,  setBanner]  = useState('');

  const showBanner = msg => { setBanner(msg); setTimeout(() => setBanner(''), 2000); };

  const buildTags = () =>
    tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);

  // UC #118 create / UC #121 edit
  const handleSave = useCallback(async () => {
    setErrors({});
    setSaving(true);
    let result;
    if (isEdit) {
      result = await editCtrl.updatePost(post.blogPostId, user.userId, {
        title,
        content,
        tags: buildTags(),
        bannerImageUrl,
      });
    } else {
      const curatorName = user?.firstName ? `${user.firstName} ${user.lastName}`.trim() : user?.username || 'Curator';
      result = await createCtrl.createPost(user.userId, curatorName, {
        title,
        content,
        tags: buildTags(),
        bannerImageUrl,
      });
    }
    setSaving(false);
    if (result.success) {
      showBanner(result.message);
      setTimeout(() => navigation.goBack(), 1200);
    } else if (result.field) {
      setErrors({ [result.field]: result.message });
    }
  }, [title, content, tags, bannerImageUrl, user, isEdit]);

  // UC #122 delete
  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Blog Post',
      'This will permanently delete the post. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            const r = await deleteCtrl.deletePost(post.blogPostId, user.userId);
            if (r.success) navigation.goBack();
            else Alert.alert('Error', r.message);
          },
        },
      ]
    );
  }, [post?.blogPostId, user?.userId]);

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />
      <View style={s.nav}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.navTitle}>{isEdit ? 'Edit Post' : 'New Post'}</Text>
        {isEdit ? (
          <TouchableOpacity onPress={handleDelete}>
            <Text style={s.deleteNav}>Delete</Text>
          </TouchableOpacity>
        ) : <View style={{ width: 60 }} />}
      </View>

      {banner ? (
        <View style={s.bannerBar}><View style={{flexDirection:'row',alignItems:'center',gap:4}}><Image source={require('../assets/icon-success.png')} style={{width:20,height:20,resizeMode:'contain'}} /><Text style={s.bannerTxt}>{banner}</Text></View></View>
      ) : null}

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag">

        {/* Title */}
        <Text style={s.label}>Title *</Text>
        {errors.title ? <Text style={s.err}>{errors.title}</Text> : null}
        <TextInput
          style={[s.input, errors.title && s.inputErr]}
          value={title}
          onChangeText={setTitle}
          placeholder="Your post title..."
          placeholderTextColor={C.subtle}
          autoCorrect={false}
        />

        {/* Content */}
        <Text style={[s.label, { marginTop: 14 }]}>Content *</Text>
        {errors.content ? <Text style={s.err}>{errors.content}</Text> : null}
        <TextInput
          style={[s.input, s.contentInput, errors.content && s.inputErr]}
          value={content}
          onChangeText={setContent}
          placeholder="Share your insights, tips and personal experience..."
          placeholderTextColor={C.subtle}
          multiline
          textAlignVertical="top"
        />

        {/* Tags */}
        <Text style={[s.label, { marginTop: 14 }]}>Tags (comma separated)</Text>
        <TextInput
          style={s.input}
          value={tags}
          onChangeText={setTags}
          placeholder="e.g. nutrition, meal-prep, health"
          placeholderTextColor={C.subtle}
          autoCapitalize="none"
        />

        {/* Banner image */}        
        <Text style={[s.label, { marginTop: 14 }]}>Banner Image URL</Text>
        <TextInput
          style={s.input}
          value={bannerImageUrl}
          onChangeText={setBannerImageUrl}
          placeholder="https://example.com/banner.jpg"
          placeholderTextColor={C.subtle}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {isEdit && (
          <View style={s.statusNote}>
            <Text style={s.statusNoteText}>
              Status: {post.status}  •  Saving keeps the current publish state.
              Use Publish / Unpublish on the blog posts list to change visibility.
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[s.saveBtn, saving && s.disabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={s.saveBtnTxt}>{saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Save as Draft'}</Text>
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
  deleteNav:   { fontSize: 14, color: C.errorText, fontWeight: '600' },
  bannerBar:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.greenBg, borderBottomWidth: 1, borderBottomColor: C.greenBorder },
  bannerTxt:   { fontSize: 14, fontWeight: '500', color: C.green },
  scroll: { flexGrow: 1, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 48 },
  label:       { fontSize: 13, fontWeight: '600', color: C.dark, marginBottom: 6 },
  err:         { fontSize: 12, color: C.errorText, marginBottom: 4 },
  input:       { backgroundColor: C.white, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: C.dark, borderWidth: 1, borderColor: C.border },
  inputErr:    { borderColor: C.errorBorder },
  contentInput:{ minHeight: 220 },
  statusNote:  { backgroundColor: C.bg, borderRadius: 8, borderWidth: 1, borderColor: C.border, padding: 12, marginTop: 14 },
  statusNoteText:{ fontSize: 12, color: C.subtle },
  saveBtn:     { backgroundColor: C.purple, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  saveBtnTxt:  { fontSize: 16, fontWeight: '700', color: C.white },
  disabled:    { opacity: 0.6 },
  errorText: { color: C.errorText },
});

export default EditBlogPostScreen;
