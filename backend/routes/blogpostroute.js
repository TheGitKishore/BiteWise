import express from 'express';
import { getDB } from '../db_mongodb/db.js';

const router = express.Router();
const COLLECTION = 'blog_posts';

const toISO = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

const sanitizeTags = (tags) => {
  if (!Array.isArray(tags)) return [];
  return tags
    .map((t) => String(t || '').trim().toLowerCase())
    .filter(Boolean);
};

const mapBlogPost = (doc = {}) => ({
  blogPostId: String(doc.blogPostId || doc._id || ''),
  curatorUserId: Number(doc.curatorUserId || 0),
  curatorName: String(doc.curatorName || ''),
  title: String(doc.title || ''),
  bannerImageUrl: String(doc.bannerImageUrl || ''),
  content: String(doc.content || ''),
  tags: sanitizeTags(doc.tags),
  likeCount: Number(doc.likeCount || 0),
  status: String(doc.status || 'DRAFT').toUpperCase(),
  publishedAt: toISO(doc.publishedAt),
  createdAt: toISO(doc.createdAt),
  updatedAt: toISO(doc.updatedAt),
});

const validatePost = ({ title, content }) => {
  if (!title || !String(title).trim()) {
    return { valid: false, field: 'title', message: 'Title is required.' };
  }

  if (!content || String(content).trim().length < 20) {
    return { valid: false, field: 'content', message: 'Content must be at least 20 characters.' };
  }

  return { valid: true, field: null, message: '' };
};

router.get('/published', async (_req, res) => {
  try {
    const db = getDB();
    const rows = await db.collection(COLLECTION)
      .find({ status: 'PUBLISHED' })
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json({
      success: true,
      data: rows.map(mapBlogPost),
      message: '',
    });
  } catch (err) {
    console.error('[GET /blog-posts/published]', err);
    return res.status(500).json({
      success: false,
      data: [],
      message: 'Unable to load blog posts. Please try again.',
    });
  }
});

router.get('/user/:curatorUserId', async (req, res) => {
  try {
    const curatorUserId = Number(req.params.curatorUserId);
    if (!curatorUserId) {
      return res.status(400).json({ success: false, data: [], message: 'Invalid curator user id.' });
    }

    const db = getDB();
    const rows = await db.collection(COLLECTION)
      .find({ curatorUserId })
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json({
      success: true,
      data: rows.map(mapBlogPost),
      message: '',
    });
  } catch (err) {
    console.error('[GET /blog-posts/user/:curatorUserId]', err);
    return res.status(500).json({
      success: false,
      data: [],
      message: 'Unable to load blog posts. Please try again.',
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const { curatorUserId, curatorName, title, content, tags, bannerImageUrl } = req.body;

    const check = validatePost({ title, content });
    if (!check.valid) {
      return res.status(400).json({ success: false, field: check.field, message: check.message, data: null });
    }

    const now = new Date().toISOString();
    const doc = {
      blogPostId: `bp_${Date.now()}`,
      curatorUserId: Number(curatorUserId),
      curatorName: String(curatorName || ''),
      title: String(title || '').trim(),
      bannerImageUrl: String(bannerImageUrl || '').trim(),
      content: String(content || '').trim(),
      tags: sanitizeTags(tags),
      likeCount: 0,
      status: 'DRAFT',
      publishedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    const db = getDB();
    await db.collection(COLLECTION).insertOne(doc);

    return res.status(201).json({
      success: true,
      field: null,
      message: 'Blog post saved as draft!',
      data: mapBlogPost(doc),
    });
  } catch (err) {
    console.error('[POST /blog-posts]', err);
    return res.status(500).json({
      success: false,
      field: null,
      message: 'Something went wrong. Please try again.',
      data: null,
    });
  }
});

router.put('/:blogPostId/publish', async (req, res) => {
  try {
    const { blogPostId } = req.params;
    const curatorUserId = Number(req.body?.curatorUserId);

    const db = getDB();
    const existing = await db.collection(COLLECTION).findOne({ blogPostId });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Blog post not found or you do not have permission.' });
    }

    if (Number(existing.curatorUserId) !== curatorUserId) {
      return res.status(403).json({ success: false, message: 'Blog post not found or you do not have permission.' });
    }

    const now = new Date().toISOString();

    await db.collection(COLLECTION).updateOne(
      { blogPostId },
      {
        $set: {
          status: 'PUBLISHED',
          publishedAt: now,
          updatedAt: now,
        },
      }
    );

    const updated = await db.collection(COLLECTION).findOne({ blogPostId });

    return res.status(200).json({
      success: true,
      message: 'Blog post published!',
      data: mapBlogPost(updated),
    });
  } catch (err) {
    console.error('[PUT /blog-posts/:blogPostId/publish]', err);
    return res.status(500).json({ success: false, message: 'Failed to publish. Please try again.' });
  }
});

router.put('/:blogPostId/unpublish', async (req, res) => {
  try {
    const { blogPostId } = req.params;
    const curatorUserId = Number(req.body?.curatorUserId);

    const db = getDB();
    const existing = await db.collection(COLLECTION).findOne({ blogPostId });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Blog post not found or you do not have permission.' });
    }

    if (Number(existing.curatorUserId) !== curatorUserId) {
      return res.status(403).json({ success: false, message: 'Blog post not found or you do not have permission.' });
    }

    const now = new Date().toISOString();

    await db.collection(COLLECTION).updateOne(
      { blogPostId },
      {
        $set: {
          status: 'DRAFT',
          publishedAt: null,
          updatedAt: now,
        },
      }
    );

    const updated = await db.collection(COLLECTION).findOne({ blogPostId });

    return res.status(200).json({
      success: true,
      message: 'Blog post unpublished and returned to drafts.',
      data: mapBlogPost(updated),
    });
  } catch (err) {
    console.error('[PUT /blog-posts/:blogPostId/unpublish]', err);
    return res.status(500).json({ success: false, message: 'Failed to unpublish. Please try again.' });
  }
});

router.put('/:blogPostId', async (req, res) => {
  try {
    const { blogPostId } = req.params;
    const { curatorUserId, title, content, tags, bannerImageUrl } = req.body;

    const check = validatePost({ title, content });
    if (!check.valid) {
      return res.status(400).json({ success: false, field: check.field, message: check.message, data: null });
    }

    const db = getDB();
    const existing = await db.collection(COLLECTION).findOne({ blogPostId });

    if (!existing) {
      return res.status(404).json({ success: false, field: null, message: 'Blog post not found or you do not have permission.', data: null });
    }

    if (Number(existing.curatorUserId) !== Number(curatorUserId)) {
      return res.status(403).json({ success: false, field: null, message: 'Blog post not found or you do not have permission.', data: null });
    }

    await db.collection(COLLECTION).updateOne(
      { blogPostId },
      {
        $set: {
          title: String(title || '').trim(),
          content: String(content || '').trim(),
          tags: sanitizeTags(tags),
          bannerImageUrl: String(bannerImageUrl || '').trim(),
          updatedAt: new Date().toISOString(),
        },
      }
    );

    const updated = await db.collection(COLLECTION).findOne({ blogPostId });

    return res.status(200).json({
      success: true,
      field: null,
      message: 'Blog post updated!',
      data: mapBlogPost(updated),
    });
  } catch (err) {
    console.error('[PUT /blog-posts/:blogPostId]', err);
    return res.status(500).json({
      success: false,
      field: null,
      message: 'Something went wrong. Please try again.',
      data: null,
    });
  }
});

router.delete('/:blogPostId', async (req, res) => {
  try {
    const { blogPostId } = req.params;
    const curatorUserId = Number(req.body?.curatorUserId);

    const db = getDB();
    const result = await db.collection(COLLECTION).deleteOne({
      blogPostId,
      curatorUserId,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Blog post not found or you do not have permission.' });
    }

    return res.status(200).json({ success: true, message: 'Blog post deleted.' });
  } catch (err) {
    console.error('[DELETE /blog-posts/:blogPostId]', err);
    return res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

export default router;
