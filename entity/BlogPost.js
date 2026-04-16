// BlogPost.js — SEEDED (no axios)
// UC #117 view own, #118 create, #119 publish, #120 unpublish, #121 edit, #122 delete
// New consumer UC: Premium User – View Published Curator Blog Posts
// Curator role only for authoring; Premium/Free can read published posts

const SEED_POSTS = [
  {
    blogPostId: 'bp1', curatorUserId: 4,
    curatorName: 'Jordan Ng',
    title: 'How I Reversed Pre-Diabetes Through Nutrition',
    content: 'Three years ago, my doctor told me I was pre-diabetic. Instead of accepting medication, I spent six months overhauling my diet. I cut refined sugars, switched to low-GI carbohydrates, and added fibre-rich vegetables to every meal. The transformation was remarkable — my HbA1c dropped from 6.1% to 5.4% in six months. Key changes that worked for me:\n\n1. Replacing white rice with cauliflower rice and quinoa\n2. Eating protein first at every meal to blunt glucose spikes\n3. Adding 30 minutes of walking after dinner\n4. Cutting fruit juice entirely — eating whole fruit instead\n\nThis journey taught me that food is medicine. Every meal is a choice.',
    tags: ['diabetes', 'low-gi', 'health', 'nutrition'],
    status: 'PUBLISHED',
    publishedAt: '2026-03-10T08:00:00Z',
    createdAt:   '2026-03-08T10:00:00Z',
    updatedAt:   '2026-03-10T08:00:00Z',
  },
  {
    blogPostId: 'bp2', curatorUserId: 4,
    curatorName: 'Jordan Ng',
    title: 'Anti-Inflammatory Foods: What I Eat Every Week',
    content: 'Inflammation is the root of most chronic disease. After years of research and personal experimentation, these are the foods I make sure to eat every single week:\n\nFatty Fish (2-3x/week): Salmon and mackerel are loaded with omega-3s that directly suppress inflammatory pathways.\n\nTurmeric: I add it to oats, smoothies, and stir-fries. The curcumin compound has powerful anti-inflammatory effects — pair it with black pepper to boost absorption by 2000%.\n\nBlueberries: A daily handful. The anthocyanins are some of the most potent antioxidants found in any food.\n\nExtra Virgin Olive Oil: Used cold for salads, or at low heat for cooking. The oleocanthal compound mimics ibuprofen in its anti-inflammatory action.\n\nLeafy Greens: Spinach, kale, and rocket daily. Rich in vitamin K which helps regulate inflammatory responses.',
    tags: ['anti-inflammatory', 'superfoods', 'wellness'],
    status: 'PUBLISHED',
    publishedAt: '2026-03-22T09:00:00Z',
    createdAt:   '2026-03-20T11:00:00Z',
    updatedAt:   '2026-03-22T09:00:00Z',
  },
  {
    blogPostId: 'bp3', curatorUserId: 4,
    curatorName: 'Jordan Ng',
    title: 'Meal Prep for Beginners: My Sunday System',
    content: 'Batch cooking every Sunday changed my relationship with food. Here is the exact system I use to prepare five days of healthy meals in under two hours.\n\nStep 1 — Proteins (40 mins): Roast a tray of chicken thighs and bake 150g of salmon. Season simply with olive oil, salt, and garlic.\n\nStep 2 — Grains (25 mins): Cook a large pot of brown rice and a batch of quinoa simultaneously.\n\nStep 3 — Vegetables (30 mins): Roast two trays of mixed vegetables — broccoli, capsicum, zucchini, cherry tomatoes.\n\nStep 4 — Sauces (15 mins): Blend a tahini dressing and a simple tomato-based sauce. These transform any combination into a satisfying meal.\n\nTotal investment: ~2 hours. Return: 10 nutritious lunches and dinners that take under 3 minutes to assemble.',
    tags: ['meal-prep', 'beginner', 'batch-cooking'],
    status: 'DRAFT',
    publishedAt: null,
    createdAt:   '2026-04-01T07:00:00Z',
    updatedAt:   '2026-04-01T07:00:00Z',
  },
];

let _posts  = SEED_POSTS.map(p => ({ ...p }));
let _nextId = 10;

class BlogPost {
  constructor({
    blogPostId    = null,
    curatorUserId = null,
    curatorName   = '',
    title         = '',
    content       = '',
    tags          = [],
    status        = 'DRAFT',  // 'DRAFT' | 'PUBLISHED'
    publishedAt   = null,
    createdAt     = null,
    updatedAt     = null,
  } = {}) {
    Object.assign(this, { blogPostId, curatorUserId, curatorName, title, content, tags, status, publishedAt, createdAt, updatedAt });
  }

  isDraft()     { return this.status === 'DRAFT'; }
  isPublished() { return this.status === 'PUBLISHED'; }
  getReadTime() {
    const words = this.content.split(' ').length;
    return Math.max(1, Math.round(words / 200)) + ' min read';
  }

  // ─── VALIDATION ────────────────────────────────────────────────────────────

  static validatePost({ title, content }) {
    if (!title || title.trim().length === 0)
      return { valid: false, field: 'title', message: 'Title is required.' };
    if (!content || content.trim().length < 20)
      return { valid: false, field: 'content', message: 'Content must be at least 20 characters.' };
    return { valid: true, field: null, message: '' };
  }

  // ─── COLLECTION HELPERS ────────────────────────────────────────────────────

  static sortByDate(posts) {
    return [...posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  static getPublished(posts) { return posts.filter(p => p.status === 'PUBLISHED'); }
  static getDrafts(posts)    { return posts.filter(p => p.status === 'DRAFT'); }
  static hasPosts(posts)     { return Array.isArray(posts) && posts.length > 0; }

  // ─── DATA ACCESS — SEEDED ──────────────────────────────────────────────────

  // UC #117 — curator: fetch all their own posts (drafts + published)
  static async fetchByUser(curatorUserId) {
    const rows = _posts
      .filter(p => String(p.curatorUserId) === String(curatorUserId))
      .map(p => new BlogPost(p));
    return { success: true, data: BlogPost.sortByDate(rows), message: '' };
  }

  // New consumer UC — premium/free: fetch all PUBLISHED posts across all curators
  static async fetchAllPublished() {
    const rows = _posts
      .filter(p => p.status === 'PUBLISHED')
      .map(p => new BlogPost(p));
    return { success: true, data: BlogPost.sortByDate(rows), message: '' };
  }

  // UC #118 — curator: create a new draft blog post
  static async create(curatorUserId, curatorName, { title, content, tags }) {
    const check = BlogPost.validatePost({ title, content });
    if (!check.valid) return { success: false, field: check.field, message: check.message, data: null };
    const now  = new Date().toISOString();
    const post = new BlogPost({
      blogPostId:    'bp_' + _nextId++,
      curatorUserId, curatorName,
      title:         title.trim(),
      content:       content.trim(),
      tags:          tags || [],
      status:        'DRAFT',
      publishedAt:   null,
      createdAt:     now,
      updatedAt:     now,
    });
    _posts.push({ ...post });
    return { success: true, field: null, message: 'Blog post saved as draft!', data: post };
  }

  // UC #119 — curator: publish a draft post
  static async publish(blogPostId, curatorUserId) {
    const idx = _posts.findIndex(p => p.blogPostId === blogPostId && String(p.curatorUserId) === String(curatorUserId));
    if (idx === -1) return { success: false, message: 'Blog post not found or you do not have permission.' };
    const now = new Date().toISOString();
    _posts[idx].status      = 'PUBLISHED';
    _posts[idx].publishedAt = now;
    _posts[idx].updatedAt   = now;
    return { success: true, message: 'Blog post published!', data: new BlogPost(_posts[idx]) };
  }

  // UC #120 — curator: unpublish a published post (back to draft)
  static async unpublish(blogPostId, curatorUserId) {
    const idx = _posts.findIndex(p => p.blogPostId === blogPostId && String(p.curatorUserId) === String(curatorUserId));
    if (idx === -1) return { success: false, message: 'Blog post not found or you do not have permission.' };
    _posts[idx].status      = 'DRAFT';
    _posts[idx].publishedAt = null;
    _posts[idx].updatedAt   = new Date().toISOString();
    return { success: true, message: 'Blog post unpublished and returned to drafts.', data: new BlogPost(_posts[idx]) };
  }

  // UC #121 — curator: edit an existing post
  static async update(blogPostId, curatorUserId, { title, content, tags }) {
    const check = BlogPost.validatePost({ title, content });
    if (!check.valid) return { success: false, field: check.field, message: check.message, data: null };
    const idx = _posts.findIndex(p => p.blogPostId === blogPostId && String(p.curatorUserId) === String(curatorUserId));
    if (idx === -1) return { success: false, field: null, message: 'Blog post not found or you do not have permission.', data: null };
    _posts[idx].title     = title.trim();
    _posts[idx].content   = content.trim();
    _posts[idx].tags      = tags || _posts[idx].tags;
    _posts[idx].updatedAt = new Date().toISOString();
    return { success: true, field: null, message: 'Blog post updated!', data: new BlogPost(_posts[idx]) };
  }

  // UC #122 — curator: delete a blog post
  static async delete(blogPostId, curatorUserId) {
    const before = _posts.length;
    _posts = _posts.filter(p => !(p.blogPostId === blogPostId && String(p.curatorUserId) === String(curatorUserId)));
    if (_posts.length === before) return { success: false, message: 'Blog post not found or you do not have permission.' };
    return { success: true, message: 'Blog post deleted.' };
  }
}

export default BlogPost;
