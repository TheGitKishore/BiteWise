// BlogPostsScreen.jsx
// UC #117 Curator – View Own Blog Posts
// UC #119 Curator – Publish Blog Post     (inline action on card)
// UC #120 Curator – Unpublish Blog Post   (inline action on card)
// Also navigates to EditBlogPostScreen for #118 create, #121 edit, #122 delete
// Curator role only

import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, Alert, Image} from 'react-native';
import { SafeAreaView }   from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import ViewBlogPostsController     from '../controller/ViewBlogPostsController';
import PublishBlogPostController   from '../controller/PublishBlogPostController';
import UnpublishBlogPostController from '../controller/UnpublishBlogPostController';

const viewCtrl      = new ViewBlogPostsController();
const publishCtrl   = new PublishBlogPostController();
const unpublishCtrl = new UnpublishBlogPostController();

const C = {
  purple: '#7C3AED', purpleLight: '#EDE9FE', dark: '#111827', mid: '#374151',
  subtle: '#6B7280', white: '#FFFFFF', border: '#E5E7EB', bg: '#F9FAFB',
  green: '#16A34A', greenBg: '#F0FDF4', greenBorder: '#BBF7D0',
  amber: '#D97706', amberBg: '#FFFBEB', amberBorder: '#FDE68A',
};

const StatusBadge = ({ status }) => {
  const isPub = status === 'PUBLISHED';
  return (
    <View style={[sb.badge, isPub ? sb.pubBadge : sb.draftBadge]}>
      <Text style={[sb.text, isPub ? sb.pubText : sb.draftText]}>{isPub ? <><Image source={require('../assets/icon-dot-published.png')} style={{width:10,height:10,resizeMode:'contain'}} /> Published</> : <><Image source={require('../assets/icon-dot-draft.png')} style={{width:10,height:10,resizeMode:'contain'}} /> Draft</>}</Text>
    </View>
  );
};
const sb = StyleSheet.create({
  badge:     { alignSelf: 'flex-start', borderRadius: 20, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  pubBadge:  { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  draftBadge:{ backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  text:      { fontSize: 11, fontWeight: '600' },
  pubText:   { color: '#15803D' },
  draftText: { color: '#B45309' },
});

const PostCard = ({ post, onPublish, onUnpublish, onEdit, userId }) => {
  const isPub = post.status === 'PUBLISHED';

  const handleToggle = () => {
    const action = isPub ? 'Unpublish' : 'Publish';
    const msg    = isPub
      ? 'This will remove the post from public view and return it to drafts.'
      : 'This will make the post visible to all Premium users.';
    Alert.alert(action + ' Post', msg, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: action,
        onPress: () => isPub ? onUnpublish(post.blogPostId) : onPublish(post.blogPostId),
      },
    ]);
  };

  return (
    <View style={pc.card}>
      <View style={pc.top}>
        <StatusBadge status={post.status} />
        <Text style={pc.date}>{new Date(post.createdAt).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
      </View>
      <Text style={pc.title}>{post.title}</Text>
      <Text style={pc.preview} numberOfLines={2}>{post.content}</Text>
      {post.tags && post.tags.length > 0 && (
        <View style={pc.tagRow}>
          {post.tags.slice(0, 3).map(t => <View key={t} style={pc.tag}><Text style={pc.tagTxt}>#{t}</Text></View>)}
        </View>
      )}
      <View style={pc.actions}>
        <TouchableOpacity
          style={[pc.actionBtn, isPub ? pc.unpubBtn : pc.pubBtn]}
          onPress={handleToggle}
        >
          <Text style={[pc.actionBtnTxt, isPub ? pc.unpubTxt : pc.pubTxt]}>
            {isPub ? 'Unpublish' : 'Publish'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={pc.editBtn} onPress={() => onEdit(post)}>
          <Text style={pc.editBtnTxt}>Edit / Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
const pc = StyleSheet.create({
  card:        { backgroundColor: C.white, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 12 },
  top:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  date:        { fontSize: 11, color: C.subtle },
  title:       { fontSize: 16, fontWeight: '700', color: C.dark, marginBottom: 6 },
  preview:     { fontSize: 13, color: C.mid, lineHeight: 19, marginBottom: 10 },
  tagRow:      { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 12 },
  tag:         { backgroundColor: C.purpleLight, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  tagTxt:      { fontSize: 10, color: C.purple },
  actions:     { flexDirection: 'row', gap: 8 },
  actionBtn:   { flex: 1, borderRadius: 8, paddingVertical: 8, alignItems: 'center', borderWidth: 1 },
  pubBtn:      { backgroundColor: C.greenBg, borderColor: C.greenBorder },
  unpubBtn:    { backgroundColor: C.amberBg, borderColor: C.amberBorder },
  actionBtnTxt:{ fontSize: 13, fontWeight: '600' },
  pubTxt:      { color: C.green },
  unpubTxt:    { color: C.amber },
  editBtn:     { flex: 1, borderRadius: 8, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  editBtnTxt:  { fontSize: 13, fontWeight: '600', color: C.mid },
});

const BlogPostsScreen = ({ navigation, route }) => {
  const user = route?.params?.user || null;
  const [posts,   setPosts]   = useState([]);
  const [banner,  setBanner]  = useState('');
  const [loading, setLoading] = useState(true);

  const showBanner = useCallback((msg) => {
    setBanner(msg);
    setTimeout(() => setBanner(''), 4000);
  }, []);

  // UC #117 — load on every focus so edits / creates / deletes reflect immediately
  // Also consume successMessage passed back from EditBlogPostScreen
  useFocusEffect(
    useCallback(() => {
      if (!user?.userId) { setLoading(false); return; }
      setLoading(true);
      viewCtrl.fetchMyPosts(user.userId).then(r => {
        if (r.success) setPosts(r.data);
        setLoading(false);
      });

      const msg = route?.params?.successMessage;
      if (msg && typeof msg === 'string') {
        showBanner(msg);
        navigation.setParams({ successMessage: null });
      }
    }, [user?.userId, route?.params?.successMessage, showBanner])
  );

  // UC #119
  const handlePublish = useCallback(async postId => {
    const r = await publishCtrl.publishPost(postId, user.userId);
    if (r.success) {
      setPosts(prev => prev.map(p => p.blogPostId === postId ? { ...p, status: 'PUBLISHED', publishedAt: new Date().toISOString() } : p));
      showBanner(r.message);
    }
  }, [user?.userId, showBanner]);

  // UC #120
  const handleUnpublish = useCallback(async postId => {
    const r = await unpublishCtrl.unpublishPost(postId, user.userId);
    if (r.success) {
      setPosts(prev => prev.map(p => p.blogPostId === postId ? { ...p, status: 'DRAFT', publishedAt: null } : p));
      showBanner(r.message);
    }
  }, [user?.userId, showBanner]);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />
      <View style={s.nav}>
        <TouchableOpacity onPress={() => navigation.navigate('CuratorDashboardScreen', { user })}><Text style={s.back}>Back</Text></TouchableOpacity>
        <Text style={s.navTitle}>My Blog Posts</Text>
        <View style={{ width: 60 }} />
      </View>

      {banner ? (
        <View style={s.bannerBar}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Image source={require('../assets/icon-success.png')} style={{ width: 20, height: 20, resizeMode: 'contain' }} />
            <Text style={s.bannerTxt}>{banner}</Text>
          </View>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          style={s.createBtn}
          onPress={() => navigation.navigate('EditBlogPostScreen', { user, post: null })}
          activeOpacity={0.85}
        >
          <Text style={s.createBtnTxt}>+ Create Blog Post</Text>
        </TouchableOpacity>

        {loading ? (
          <Text style={s.empty}>Loading...</Text>
        ) : posts.length === 0 ? (
          <View style={s.emptyCard}>
            <Image source={require('../assets/empty-blog-posts.png')} style={[s.emptyEmoji, { width: 48, height: 48, resizeMode: 'contain' }]} />
            <Text style={s.emptyTitle}>No Blog Posts Yet</Text>
            <Text style={s.emptyBody}>Share your health journey, tips and insights with the community.</Text>
          </View>
        ) : (
          posts.map(p => (
            <PostCard
              key={p.blogPostId}
              post={p}
              userId={user?.userId}
              onPublish={handlePublish}
              onUnpublish={handleUnpublish}
              onEdit={post => navigation.navigate('EditBlogPostScreen', { user, post })}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: C.bg },
  nav:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  back:        { fontSize: 14, color: C.purple, fontWeight: '600' },
  navTitle:    { fontSize: 17, fontWeight: '700', color: C.dark },
  bannerBar:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.greenBg, borderBottomWidth: 1, borderBottomColor: C.greenBorder },
  bannerTxt:   { fontSize: 14, fontWeight: '500', color: C.green },
  scroll:      { paddingHorizontal: 16, paddingBottom: 40 },
  createBtn:   { backgroundColor: C.purple, borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginVertical: 16 },
  createBtnTxt:{ fontSize: 15, fontWeight: '700', color: C.white },
  empty:       { textAlign: 'center', color: C.subtle, paddingTop: 40 },
  emptyCard:   { alignItems: 'center', padding: 40 },
  emptyEmoji:  { fontSize: 48, marginBottom: 12 },
  emptyTitle:  { fontSize: 18, fontWeight: '700', color: C.dark, marginBottom: 6 },
  emptyBody:   { fontSize: 13, color: C.subtle, textAlign: 'center' },
});

export default BlogPostsScreen;
