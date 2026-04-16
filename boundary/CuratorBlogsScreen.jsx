// CuratorBlogsScreen.jsx — New Consumer UC: Premium User – View Published Curator Blog Posts
// Accessible from PremiumUserDashboardScreen

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ViewCuratorBlogsController from '../controller/ViewCuratorBlogsController';

const ctrl = new ViewCuratorBlogsController();

const C = {
  purple: '#7C3AED', purpleLight: '#EDE9FE', dark: '#111827', mid: '#374151',
  subtle: '#6B7280', white: '#FFFFFF', border: '#E5E7EB', bg: '#F9FAFB',
};

// ── Blog Post List Card ───────────────────────────────────────────────────────
const PostCard = ({ post, onPress }) => (
  <TouchableOpacity style={pc.card} onPress={onPress} activeOpacity={0.85}>
    <View style={pc.header}>
      <View style={pc.authorBadge}>
        <Text style={pc.authorInitial}>{(post.curatorName || 'C')[0].toUpperCase()}</Text>
      </View>
      <View style={pc.meta}>
        <Text style={pc.authorName}>{post.curatorName}</Text>
        <Text style={pc.date}>{new Date(post.publishedAt).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
      </View>
      <Text style={pc.readTime}>{post.getReadTime ? post.getReadTime() : '2 min read'}</Text>
    </View>
    <Text style={pc.title}>{post.title}</Text>
    <Text style={pc.preview} numberOfLines={2}>{post.content}</Text>
    {post.tags && post.tags.length > 0 && (
      <View style={pc.tagRow}>
        {post.tags.slice(0, 3).map(t => (
          <View key={t} style={pc.tag}><Text style={pc.tagTxt}>#{t}</Text></View>
        ))}
      </View>
    )}
  </TouchableOpacity>
);
const pc = StyleSheet.create({
  card:         { backgroundColor: C.white, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 12 },
  header:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  authorBadge:  { width: 36, height: 36, borderRadius: 18, backgroundColor: C.purple, alignItems: 'center', justifyContent: 'center' },
  authorInitial:{ fontSize: 14, fontWeight: '800', color: C.white },
  meta:         { flex: 1 },
  authorName:   { fontSize: 13, fontWeight: '700', color: C.dark },
  date:         { fontSize: 11, color: C.subtle },
  readTime:     { fontSize: 11, color: C.purple, fontWeight: '600' },
  title:        { fontSize: 17, fontWeight: '800', color: C.dark, marginBottom: 8, lineHeight: 23 },
  preview:      { fontSize: 13, color: C.mid, lineHeight: 19, marginBottom: 12 },
  tagRow:       { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  tag:          { backgroundColor: C.purpleLight, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  tagTxt:       { fontSize: 11, color: C.purple },
});

// ── Blog Post Detail View ─────────────────────────────────────────────────────
const PostDetail = ({ post, onBack }) => (
  <ScrollView contentContainerStyle={pd.scroll} showsVerticalScrollIndicator={false}>
    <TouchableOpacity style={pd.backBtn} onPress={onBack}>
      <Text style={pd.backTxt}>← Back to blogs</Text>
    </TouchableOpacity>
    <View style={pd.header}>
      <View style={pd.authorRow}>
        <View style={pd.authorBadge}>
          <Text style={pd.authorInitial}>{(post.curatorName || 'C')[0].toUpperCase()}</Text>
        </View>
        <View>
          <Text style={pd.authorName}>{post.curatorName}</Text>
          <Text style={pd.date}>{new Date(post.publishedAt).toLocaleDateString('en-SG', { day: 'numeric', month: 'long', year: 'numeric' })}  •  {post.getReadTime ? post.getReadTime() : '2 min read'}</Text>
        </View>
      </View>
      <Text style={pd.title}>{post.title}</Text>
      {post.tags && post.tags.length > 0 && (
        <View style={pd.tagRow}>
          {post.tags.map(t => <View key={t} style={pd.tag}><Text style={pd.tagTxt}>#{t}</Text></View>)}
        </View>
      )}
    </View>
    <Text style={pd.content}>{post.content}</Text>
  </ScrollView>
);
const pd = StyleSheet.create({
  scroll:       { paddingHorizontal: 16, paddingBottom: 60 },
  backBtn:      { paddingVertical: 16 },
  backTxt:      { fontSize: 14, color: C.purple, fontWeight: '600' },
  header:       { marginBottom: 20 },
  authorRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  authorBadge:  { width: 44, height: 44, borderRadius: 22, backgroundColor: C.purple, alignItems: 'center', justifyContent: 'center' },
  authorInitial:{ fontSize: 18, fontWeight: '800', color: C.white },
  authorName:   { fontSize: 14, fontWeight: '700', color: C.dark },
  date:         { fontSize: 12, color: C.subtle },
  title:        { fontSize: 22, fontWeight: '800', color: C.dark, lineHeight: 30, marginBottom: 10 },
  tagRow:       { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  tag:          { backgroundColor: C.purpleLight, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  tagTxt:       { fontSize: 11, color: C.purple },
  content:      { fontSize: 15, color: C.mid, lineHeight: 25 },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
const CuratorBlogsScreen = ({ navigation, route }) => {
  const user = route?.params?.user || null;
  const [posts,        setPosts]        = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');

  useEffect(() => {
    ctrl.fetchPublishedPosts().then(r => {
      if (r.success) setPosts(r.data);
      else           setError(r.message);
      setLoading(false);
    });
  }, []);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />
      {!selectedPost && (
        <View style={s.nav}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.back}>← Back</Text></TouchableOpacity>
          <Text style={s.navTitle}>Curator Blogs</Text>
          <View style={{ width: 60 }} />
        </View>
      )}

      {selectedPost ? (
        <PostDetail post={selectedPost} onBack={() => setSelectedPost(null)} />
      ) : (
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <View style={s.header}>
            <View style={s.badge}><Text style={s.badgeTxt}>☆ Premium</Text></View>
            <Text style={s.pageTitle}>Curator Blog Posts</Text>
            <Text style={s.pageSub}>Tips, insights and personal journeys from our verified curators</Text>
          </View>

          {loading ? (
            <Text style={s.empty}>Loading blogs...</Text>
          ) : error ? (
            <Text style={s.empty}>{error}</Text>
          ) : posts.length === 0 ? (
            <View style={s.emptyCard}>
              <Text style={s.emptyEmoji}>📝</Text>
              <Text style={s.emptyTitle}>No Posts Yet</Text>
              <Text style={s.emptyBody}>Our curators are working on fresh content. Check back soon!</Text>
            </View>
          ) : (
            posts.map(p => (
              <PostCard
                key={p.blogPostId}
                post={p}
                onPress={() => setSelectedPost(p)}
              />
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: C.bg },
  nav:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  back:       { fontSize: 14, color: C.purple, fontWeight: '600' },
  navTitle:   { fontSize: 17, fontWeight: '700', color: C.dark },
  scroll:     { paddingHorizontal: 16, paddingBottom: 40 },
  header:     { paddingVertical: 20 },
  badge:      { alignSelf: 'flex-start', backgroundColor: C.purple, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 8 },
  badgeTxt:   { fontSize: 11, fontWeight: '700', color: C.white },
  pageTitle:  { fontSize: 26, fontWeight: '800', color: C.dark, letterSpacing: -0.5, marginBottom: 6 },
  pageSub:    { fontSize: 14, color: C.subtle, lineHeight: 20 },
  empty:      { textAlign: 'center', color: C.subtle, paddingTop: 40 },
  emptyCard:  { alignItems: 'center', padding: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.dark, marginBottom: 6 },
  emptyBody:  { fontSize: 13, color: C.subtle, textAlign: 'center' },
});

export default CuratorBlogsScreen;
