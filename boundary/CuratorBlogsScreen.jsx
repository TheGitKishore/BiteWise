// CuratorBlogsScreen.jsx - Premium user view for published curator blogs

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  TextInput,
  Image,
  Keyboard, KeyboardAvoidingView, Platform} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ViewCuratorBlogsController from '../controller/ViewCuratorBlogsController';
import BlogPost from '../entity/BlogPost';

const ctrl = new ViewCuratorBlogsController();

const C = {
  purple: '#7C3AED',
  purpleLight: '#EDE9FE',
  dark: '#111827',
  mid: '#374151',
  subtle: '#6B7280',
  white: '#FFFFFF',
  border: '#E5E7EB',
  bg: '#F9FAFB',
};

const formatCount = (count = 0) => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return String(count);
};

const LikeButton = ({ isLiked, count, onPress }) => (
  <TouchableOpacity
    style={[lb.btn, isLiked && lb.btnActive]}
    onPress={onPress}
    activeOpacity={0.85}
  >
    <Text style={lb.icon}>👍</Text>
    <Text style={[lb.label, isLiked && lb.labelActive]}>Like</Text>
    <Text style={[lb.text, isLiked && lb.textActive]}>{formatCount(count)}</Text>
  </TouchableOpacity>
);

const lb = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.white,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  btnActive: {
    backgroundColor: C.purpleLight,
    borderColor: C.purple,
  },
  icon: { fontSize: 13 },
  label: { fontSize: 12, fontWeight: '700', color: C.mid },
  labelActive: { color: C.purple },
  text: { fontSize: 12, color: C.mid, fontWeight: '600' },
  textActive: { color: C.purple },
});

const PostCard = ({ post, onPress, isLiked, likeCount, onToggleLike }) => (
  <TouchableOpacity style={pc.card} onPress={onPress} activeOpacity={0.9}>
    {post.bannerImageUrl ? (
      <Image source={{ uri: post.bannerImageUrl }} style={pc.banner} resizeMode="cover" />
    ) : null}

    <View style={pc.body}>
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

      <View style={pc.footer}>
        {post.tags && post.tags.length > 0 ? (
          <View style={pc.tagRow}>
            {post.tags.slice(0, 2).map((t) => (
              <View key={t} style={pc.tag}><Text style={pc.tagTxt}>#{t}</Text></View>
            ))}
          </View>
        ) : <View />}

        <LikeButton
          isLiked={isLiked}
          count={likeCount}
          onPress={(e) => {
            e?.stopPropagation?.();
            onToggleLike(post.blogPostId);
          }}
        />
      </View>
    </View>
  </TouchableOpacity>
);

const pc = StyleSheet.create({
  card: { backgroundColor: C.white, borderRadius: 14, borderWidth: 1, borderColor: C.border, marginBottom: 12, overflow: 'hidden' },
  banner: { width: '100%', height: 140 },
  body: { padding: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  authorBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.purple, alignItems: 'center', justifyContent: 'center' },
  authorInitial: { fontSize: 13, fontWeight: '800', color: C.white },
  meta: { flex: 1 },
  authorName: { fontSize: 12, fontWeight: '700', color: C.dark },
  date: { fontSize: 11, color: C.subtle },
  readTime: { fontSize: 11, color: C.purple, fontWeight: '600' },
  title: { fontSize: 16, fontWeight: '800', color: C.dark, marginBottom: 6 },
  preview: { fontSize: 13, color: C.mid, lineHeight: 19, marginBottom: 10 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tagRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  tag: { backgroundColor: C.purpleLight, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  tagTxt: { fontSize: 10, color: C.purple },
});

const PostDetail = ({ post, onBack, isLiked, likeCount, onToggleLike }) => (
  <ScrollView contentContainerStyle={pd.scroll} showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
    <TouchableOpacity style={pd.backBtn} onPress={onBack}>
      <Text style={pd.backTxt}>{'< Back to blogs'}</Text>
    </TouchableOpacity>

    {post.bannerImageUrl ? (
      <Image source={{ uri: post.bannerImageUrl }} style={pd.banner} resizeMode="cover" />
    ) : null}

    <View style={pd.header}>
      <View style={pd.authorRow}>
        <View style={pd.authorBadge}>
          <Text style={pd.authorInitial}>{(post.curatorName || 'C')[0].toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={pd.authorName}>{post.curatorName}</Text>
          <Text style={pd.date}>
            {new Date(post.publishedAt).toLocaleDateString('en-SG', { day: 'numeric', month: 'long', year: 'numeric' })}
            {'  •  '}
            {post.getReadTime ? post.getReadTime() : '2 min read'}
          </Text>
        </View>
      </View>

      <Text style={pd.title}>{post.title}</Text>

      <View style={pd.metaRow}>
        {post.tags && post.tags.length > 0 ? (
          <View style={pd.tagRow}>
            {post.tags.map((t) => (
              <View key={t} style={pd.tag}><Text style={pd.tagTxt}>#{t}</Text></View>
            ))}
          </View>
        ) : <View />}

        <LikeButton
          isLiked={isLiked}
          count={likeCount}
          onPress={() => onToggleLike(post.blogPostId)}
        />
      </View>
    </View>

    <Text style={pd.content}>{post.content}</Text>
  </ScrollView>
);

const pd = StyleSheet.create({
  scroll: { paddingHorizontal: 16, paddingBottom: 60 },
  backBtn: { paddingVertical: 16 },
  backTxt: { fontSize: 14, color: C.purple, fontWeight: '600' },
  banner: { width: '100%', height: 190, borderRadius: 12, marginBottom: 14 },
  header: { marginBottom: 18 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  authorBadge: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.purple, alignItems: 'center', justifyContent: 'center' },
  authorInitial: { fontSize: 16, fontWeight: '800', color: C.white },
  authorName: { fontSize: 14, fontWeight: '700', color: C.dark },
  date: { fontSize: 12, color: C.subtle },
  title: { fontSize: 22, fontWeight: '800', color: C.dark, lineHeight: 30, marginBottom: 10 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  tagRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', flex: 1 },
  tag: { backgroundColor: C.purpleLight, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  tagTxt: { fontSize: 11, color: C.purple },
  content: { fontSize: 15, color: C.mid, lineHeight: 24 },
});

const CuratorBlogsScreen = ({ navigation, route }) => {
  const user = route?.params?.user || null;
  const currentUserId =
    user?.userId != null
      ? String(user.userId)
      : user?.id != null
        ? String(user.id)
        : user?._id != null
          ? String(user._id)
          : '';

  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState('All');
  const [likedByPost, setLikedByPost] = useState({});
  const [likesByPost, setLikesByPost] = useState({});
  const [likingPostIds, setLikingPostIds] = useState({});

  useEffect(() => {
    ctrl.fetchPublishedPosts().then((r) => {
      if (r.success) {
        setPosts(r.data);
        const initialLikes = {};
        (r.data || []).forEach((p) => {
          initialLikes[p.blogPostId] = Number(p.likeCount || 0);
        });
        setLikesByPost(initialLikes);
        setError('');

        if (currentUserId) {
          BlogPost.fetchLikedPostIds(currentUserId).then((likedRes) => {
            if (!likedRes.success) return;
            const likedMap = {};
            (likedRes.data || []).forEach((id) => {
              likedMap[String(id)] = true;
            });
            setLikedByPost(likedMap);
          });
        }
      } else {
        setError(r.message);
      }
      setLoading(false);
    });
  }, [currentUserId]);

  const tags = useMemo(() => {
    const all = new Set();
    posts.forEach((p) => (p.tags || []).forEach((t) => all.add(t)));
    return ['All', ...Array.from(all)];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    let list = posts;

    if (activeTag !== 'All') {
      list = list.filter((p) => (p.tags || []).includes(activeTag));
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) => {
        const inTitle = (p.title || '').toLowerCase().includes(q);
        const inBody = (p.content || '').toLowerCase().includes(q);
        const inTags = (p.tags || []).some((t) => t.toLowerCase().includes(q));
        return inTitle || inBody || inTags;
      });
    }

    return list;
  }, [posts, activeTag, search]);

  const toggleLike = async (postId) => {
    if (likingPostIds[postId]) return;
    if (!currentUserId) {
      setError('Unable to identify current user for likes.');
      return;
    }

    const isCurrentlyLiked = Boolean(likedByPost[postId]);
    const nextLikeState = !isCurrentlyLiked;
    const incrementBy = isCurrentlyLiked ? -1 : 1;
    const post = posts.find((p) => p.blogPostId === postId);
    const previousCount = Number(likesByPost[postId] ?? post?.likeCount ?? 0);
    const optimisticCount = Math.max(0, previousCount + incrementBy);

    setLikingPostIds((prev) => ({ ...prev, [postId]: true }));
    setLikedByPost((prev) => ({ ...prev, [postId]: !isCurrentlyLiked }));
    setLikesByPost((prev) => ({
      ...prev,
      [postId]: optimisticCount,
    }));

    const result = await BlogPost.updateLike(postId, {
      userId: currentUserId,
      like: nextLikeState,
      incrementBy,
    });
    if (!result.success) {
      setLikedByPost((prev) => ({ ...prev, [postId]: isCurrentlyLiked }));
      setLikesByPost((prev) => ({ ...prev, [postId]: previousCount }));
      setError(result.message || 'Unable to update blog like.');
      setLikingPostIds((prev) => ({ ...prev, [postId]: false }));
      return;
    }

    const serverLikeCount = Number(result.data?.likeCount ?? optimisticCount);
    const serverIsLiked = typeof result.data?.isLiked === 'boolean' ? result.data.isLiked : nextLikeState;
    setLikedByPost((prev) => ({ ...prev, [postId]: serverIsLiked }));
    setLikesByPost((prev) => ({ ...prev, [postId]: serverLikeCount }));
    setPosts((prev) =>
      prev.map((p) => (p.blogPostId === postId ? { ...p, likeCount: serverLikeCount } : p))
    );
    setSelectedPost((prev) =>
      prev && prev.blogPostId === postId ? { ...prev, likeCount: serverLikeCount } : prev
    );
    setError('');
    setLikingPostIds((prev) => ({ ...prev, [postId]: false }));
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />

      {!selectedPost && (
        <View style={s.nav}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.back}>{'< Back'}</Text></TouchableOpacity>
          <Text style={s.navTitle}>Blogs</Text>
          <View style={{ width: 60 }} />
        </View>
      )}

      {selectedPost ? (
        <PostDetail
          post={selectedPost}
          onBack={() => setSelectedPost(null)}
          isLiked={Boolean(likedByPost[selectedPost.blogPostId])}
          likeCount={likesByPost[selectedPost.blogPostId] ?? selectedPost.likeCount ?? 0}
          onToggleLike={toggleLike}
        />
      ) : (
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={s.header}>
            <View style={s.badge}><Text style={s.badgeTxt}>Premium</Text></View>
            <Text style={s.pageTitle}>Blogs</Text>
            <Text style={s.pageSub}>Expert insights, tpis, and stories from our community of nutrition curators</Text>
          </View>

          <View style={s.searchWrap}>
            <Text style={s.searchIcon}>Search</Text>
            <TextInput
              style={s.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search blogs by title, content or tag"
              placeholderTextColor={C.subtle}
              autoCorrect={false}
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.tagRow}
          
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
            {tags.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[s.tagFilterBtn, activeTag === tag && s.tagFilterBtnActive]}
                onPress={() => setActiveTag(tag)}
                activeOpacity={0.85}
              >
                <Text style={[s.tagFilterTxt, activeTag === tag && s.tagFilterTxtActive]}>
                  {tag === 'All' ? 'All' : `#${tag}`}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={s.postPanel}>
            {loading ? (
              <Text style={s.empty}>Loading blogs...</Text>
            ) : error ? (
              <Text style={s.empty}>{error}</Text>
            ) : filteredPosts.length === 0 ? (
              <View style={s.emptyCard}>
                <Text style={s.emptyEmoji}>Posts</Text>
                <Text style={s.emptyTitle}>No Posts Found</Text>
                <Text style={s.emptyBody}>Try a different keyword or tag filter.</Text>
              </View>
            ) : (
              filteredPosts.map((p) => (
                <PostCard
                  key={p.blogPostId}
                  post={p}
                  onPress={() => setSelectedPost(p)}
                  isLiked={Boolean(likedByPost[p.blogPostId])}
                  likeCount={likesByPost[p.blogPostId] ?? p.likeCount ?? 0}
                  onToggleLike={toggleLike}
                />
              ))
            )}
          </View>
        </ScrollView>
      )}
          </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  back: { fontSize: 14, color: C.purple, fontWeight: '600' },
  navTitle: { fontSize: 17, fontWeight: '700', color: C.dark },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  header: { paddingVertical: 20 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: C.purple,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 8,
  },
  badgeTxt: { fontSize: 11, fontWeight: '700', color: C.white },
  pageTitle: { fontSize: 26, fontWeight: '800', color: C.dark, letterSpacing: -0.5, marginBottom: 6 },
  pageSub: { fontSize: 14, color: C.subtle, lineHeight: 20 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 12,
  },
  searchIcon: { fontSize: 12, color: C.subtle, fontWeight: '700' },
  searchInput: { flex: 1, fontSize: 14, color: C.dark, paddingVertical: 11 },
  tagRow: {
    gap: 8,
    paddingBottom: 12,
  },
  tagFilterBtn: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: C.white,
  },
  tagFilterBtnActive: {
    borderColor: C.purple,
    backgroundColor: C.purpleLight,
  },
  tagFilterTxt: { fontSize: 11, color: C.mid, textAlign: 'center' },
  tagFilterTxtActive: { color: C.purple, fontWeight: '700' },
  postPanel: { flex: 1 },
  empty: { textAlign: 'center', color: C.subtle, paddingTop: 40 },
  emptyCard: { alignItems: 'center', padding: 30, backgroundColor: C.white, borderRadius: 14, borderWidth: 1, borderColor: C.border },
  emptyEmoji: { fontSize: 20, fontWeight: '700', marginBottom: 12, color: C.subtle },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.dark, marginBottom: 6 },
  emptyBody: { fontSize: 13, color: C.subtle, textAlign: 'center' },
});

export default CuratorBlogsScreen;
