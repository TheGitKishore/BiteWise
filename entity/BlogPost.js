import axios from 'axios';
import API_CONFIG from './api_config.js';

const API_URL = `${API_CONFIG}/blog-posts`;

class BlogPost {
  constructor({
    blogPostId = null,
    curatorUserId = null,
    curatorName = '',
    title = '',
    content = '',
    tags = [],
    bannerImageUrl = '',
    likeCount = 0,
    viewCount = 0,
    status = 'DRAFT',
    publishedAt = null,
    createdAt = null,
    updatedAt = null,
  } = {}) {
    Object.assign(this, {
      blogPostId,
      curatorUserId,
      curatorName,
      title,
      content,
      tags,
      bannerImageUrl,
      likeCount,
      viewCount,
      status,
      publishedAt,
      createdAt,
      updatedAt,
    });
  }

  isDraft() { return this.status === 'DRAFT'; }
  isPublished() { return this.status === 'PUBLISHED'; }

  getReadTime() {
    const words = String(this.content || '').split(' ').length;
    return `${Math.max(1, Math.round(words / 200))} min read`;
  }

  static validatePost({ title, content }) {
    if (!title || !String(title).trim()) {
      return { valid: false, field: 'title', message: 'Title is required.' };
    }

    if (!content || String(content).trim().length < 20) {
      return { valid: false, field: 'content', message: 'Content must be at least 20 characters.' };
    }

    return { valid: true, field: null, message: '' };
  }

  static fromApi(raw = {}) {
    return new BlogPost({
      blogPostId: raw.blogPostId ?? raw._id?.toString?.() ?? null,
      curatorUserId: Number(raw.curatorUserId ?? 0),
      curatorName: String(raw.curatorName ?? ''),
      title: String(raw.title ?? ''),
      bannerImageUrl: String(raw.bannerImageUrl ?? ''),
      content: String(raw.content ?? ''),
      tags: Array.isArray(raw.tags) ? raw.tags : [],
      likeCount: Number(raw.likeCount ?? 0),
      viewCount: Number(raw.viewCount ?? 0),
      status: String(raw.status ?? 'DRAFT').toUpperCase(),
      publishedAt: raw.publishedAt ?? null,
      createdAt: raw.createdAt ?? null,
      updatedAt: raw.updatedAt ?? null,
    });
  }

  static sortByDate(posts) {
    return [...posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  static async fetchByUser(curatorUserId) {
    try {
      const res = await axios.get(`${API_URL}/user/${curatorUserId}`);
      return {
        success: Boolean(res.data?.success),
        data: Array.isArray(res.data?.data) ? res.data.data.map(BlogPost.fromApi) : [],
        message: res.data?.message || '',
      };
    } catch (err) {
      return {
        success: false,
        data: [],
        message: err.response?.data?.message || 'Unable to load blog posts. Please try again.',
      };
    }
  }

  static async fetchAllPublished() {
    try {
      const res = await axios.get(`${API_URL}/published`);
      return {
        success: Boolean(res.data?.success),
        data: Array.isArray(res.data?.data) ? res.data.data.map(BlogPost.fromApi) : [],
        message: res.data?.message || '',
      };
    } catch (err) {
      return {
        success: false,
        data: [],
        message: err.response?.data?.message || 'Unable to load blog posts. Please try again.',
      };
    }
  }

  static async fetchLikedPostIds(userId) {
    try {
      const res = await axios.get(`${API_URL}/likes/${userId}`);
      return {
        success: Boolean(res.data?.success),
        data: Array.isArray(res.data?.data) ? res.data.data.map((id) => String(id)) : [],
        message: res.data?.message || '',
      };
    } catch (err) {
      return {
        success: false,
        data: [],
        message: err.response?.data?.message || 'Unable to load blog likes.',
      };
    }
  }

  static async create(curatorUserId, curatorName, { title, content, tags, bannerImageUrl }) {
    const check = BlogPost.validatePost({ title, content });
    if (!check.valid) {
      return { success: false, field: check.field, message: check.message, data: null };
    }

    try {
      const res = await axios.post(`${API_URL}`, {
        curatorUserId,
        curatorName,
        title,
        content,
        tags,
        bannerImageUrl,
      });

      return {
        success: Boolean(res.data?.success),
        field: res.data?.field ?? null,
        message: res.data?.message || 'Blog post saved as draft!',
        data: res.data?.data ? BlogPost.fromApi(res.data.data) : null,
      };
    } catch (err) {
      if (err.response?.data) return err.response.data;
      return {
        success: false,
        field: null,
        message: 'Something went wrong. Please try again.',
        data: null,
      };
    }
  }

  static async publish(blogPostId, curatorUserId) {
    try {
      const res = await axios.put(`${API_URL}/${blogPostId}/publish`, { curatorUserId });
      return {
        success: Boolean(res.data?.success),
        message: res.data?.message || 'Blog post published!',
        data: res.data?.data ? BlogPost.fromApi(res.data.data) : null,
      };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to publish. Please try again.',
      };
    }
  }

  static async unpublish(blogPostId, curatorUserId) {
    try {
      const res = await axios.put(`${API_URL}/${blogPostId}/unpublish`, { curatorUserId });
      return {
        success: Boolean(res.data?.success),
        message: res.data?.message || 'Blog post unpublished and returned to drafts.',
        data: res.data?.data ? BlogPost.fromApi(res.data.data) : null,
      };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to unpublish. Please try again.',
      };
    }
  }

  static async update(blogPostId, curatorUserId, { title, content, tags, bannerImageUrl }) {
    const check = BlogPost.validatePost({ title, content });
    if (!check.valid) {
      return { success: false, field: check.field, message: check.message, data: null };
    }

    try {
      const res = await axios.put(`${API_URL}/${blogPostId}`, {
        curatorUserId,
        title,
        content,
        tags,
        bannerImageUrl,
      });

      return {
        success: Boolean(res.data?.success),
        field: res.data?.field ?? null,
        message: res.data?.message || 'Blog post updated!',
        data: res.data?.data ? BlogPost.fromApi(res.data.data) : null,
      };
    } catch (err) {
      if (err.response?.data) return err.response.data;
      return {
        success: false,
        field: null,
        message: 'Something went wrong. Please try again.',
        data: null,
      };
    }
  }

  static async delete(blogPostId, curatorUserId) {
    try {
      const res = await axios.delete(`${API_URL}/${blogPostId}`, {
        data: { curatorUserId },
      });

      return {
        success: Boolean(res.data?.success),
        message: res.data?.message || 'Blog post deleted.',
      };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Something went wrong. Please try again.',
      };
    }
  }

  static async updateLike(blogPostId, { userId, like, incrementBy }) {
    try {
      const payload = {};
      if (userId) payload.userId = userId;
      if (typeof like === 'boolean') payload.like = like;
      if (typeof incrementBy === 'number') payload.incrementBy = incrementBy;

      const res = await axios.put(`${API_URL}/${blogPostId}/like`, payload);
      return {
        success: Boolean(res.data?.success),
        message: res.data?.message || 'Blog post like updated.',
        data: {
          blogPostId: res.data?.data?.blogPostId || blogPostId,
          likeCount: Number(res.data?.data?.likeCount ?? 0),
          isLiked: Boolean(res.data?.data?.isLiked),
        },
      };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to update blog post like.',
        data: null,
      };
    }
  }

  static async recordView(blogPostId, userId) {
    try {
      const res = await axios.put(`${API_URL}/${blogPostId}/view`, { userId });
      return {
        success: Boolean(res.data?.success),
        message: res.data?.message || 'Blog post view updated.',
        data: {
          blogPostId: res.data?.data?.blogPostId || blogPostId,
          viewCount: Number(res.data?.data?.viewCount ?? 0),
          counted: Boolean(res.data?.data?.counted),
        },
      };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to update blog post views.',
        data: null,
      };
    }
  }
}

export default BlogPost;
