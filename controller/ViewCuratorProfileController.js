// ViewCuratorProfileController.js — UC #115 Curator – View Profile / Dashboard
//
// Normal Flow (UC #115 Sprint 9):
//   1. CuratorDashboardScreen mounts → boundary calls fetchProfile(userId)
//   2. Controller returns full curator profile object including stats, expertise, bio,
//      recipe counts, and blog post counts from seeded data
//   3. Boundary renders single-page Curator Dashboard
//
// Sprint 9: fetchProfile() now returns { user, expertise, bio, curatorStats,
//           recipes: { published, draft }, blogPosts: { published, draft } }
// Curator role only (#115)

import User   from '../entity/User';
import Recipe from '../entity/Recipe';
import BlogPost from '../entity/BlogPost';
import RecipeDraft from '../entity/RecipeDraft';

// ── Sprint 9 Seeded Data ──────────────────────────────────────────────────────

const CURATOR_STATS = {
  4: { views: 1250, likes: 340, comments: 89, followers: 0 },
};

const CURATOR_PROFILES = {
  4: {
    expertise: 'I ran 2 marathons before',
    bio: 'check me out at @lee.xuanxuan ;D',
  },
};

// ─────────────────────────────────────────────────────────────────────────────

class ViewCuratorProfileController {
  constructor() {}

  async _safeCall(fn) {
    try {
      return await fn();
    } catch (e) {
      console.error('[ViewCuratorProfileController]', e);
      return { success: false, data: null, message: 'Unable to load profile.' };
    }
  }

  // UC #115 Sprint 9
  // @param  {number|string} userId
  // @return {Promise<{ success, data: {
  //           user, expertise, bio, curatorStats,
  //           recipes: { published, draft },
  //           blogPosts: { published, draft }
  //         }, message }>}
  async fetchProfile(userId) {
    return this._safeCall(async () => {
      const uid = Number(userId);

      const userResult = await User.getUser(userId);
      if (!userResult.success) {
        return { success: false, data: null, message: userResult.message };
      }

      // Fetch recipes to count published / draft
      const recipeResult = await Recipe.fetchAll();
      const draftResult  = await RecipeDraft.fetchByUser(userId);

      let publishedRecipes = 0;
      let draftRecipes = 0;

      if (recipeResult.success) {
        const userPublished = Recipe.filterByUser(recipeResult.data, userId);
        publishedRecipes = userPublished.length;
      }

      if (draftResult.success) {
        draftRecipes = draftResult.data.length;
      }

      // Seeded curator stats (fall back to zeros for unknown userId)
      const curatorStats = CURATOR_STATS[uid] || { views: 0, likes: 0, comments: 0, followers: 0 };

      // Seeded expertise / bio (fall back to empty strings)
      const profileExtra = CURATOR_PROFILES[uid] || { expertise: '', bio: '' };

      const blogResult = await BlogPost.fetchByUser(userId);

      let publishedPosts = 0;
      let draftPosts = 0;

      if (blogResult.success) {
        const posts = blogResult.data;
      
        publishedPosts = posts.filter(p => p.isPublished()).length;
        draftPosts     = posts.filter(p => p.isDraft()).length;
      }

      return {
        success: true,
        data: {
          user:          userResult.data,
          expertise:     profileExtra.expertise,
          bio:           profileExtra.bio,
          curatorStats,
          recipes:       { published: publishedRecipes, draft: draftRecipes },
          blogPosts: { published: publishedPosts, draft: draftPosts },   // seeded stub — no blog post entity yet
        },
        message: '',
      };
    });
  }
}

export default ViewCuratorProfileController;
