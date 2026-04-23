// Normal Flow (UC #115)
//   1. CuratorDashboardScreen mounts → boundary calls fetchProfile(userId)
//   2. Controller fetches user data, recipe counts, blog post counts, curator stats
//   3. Returns combined profile data to boundary
//
// Sprint 9: Updated to return expertise, bio, curatorStats (views/likes/comments/
//           followers), recipe published/draft counts, blog published/draft counts.
//           Used by the new single-scroll CuratorDashboardScreen (no tabs).
// Curator only (#115)

import User     from '../entity/User';
import Recipe   from '../entity/Recipe';
import BlogPost from '../entity/BlogPost';

// Seeded curator stats (Sprint 9 — production: GET /curator-stats/:userId)
const CURATOR_STATS = {
  4: { totalViews: 1250, totalLikes: 340, comments: 89, followers: 0 },
};

// Seeded expertise + bio (Sprint 9 — production: GET /curator-profile/:userId)
const CURATOR_PROFILES = {
  4: { expertise: 'I ran 2 marathons before', bio: 'check me out at @lee.xuanxuan ;D' },
};

class ViewCuratorProfileController {
  constructor() {}

  async _safeCall(fn) {
    try { return await fn(); }
    catch (e) { console.error('[ViewCuratorProfileController]', e); return { success: false, data: null, message: 'Unable to load profile.' }; }
  }

  // UC #115 — fetch full curator dashboard data
  // @return { user, expertise, bio, curatorStats, recipes, blogPosts, recipeCount, publishedRecipes }
  async fetchProfile(userId) {
    return this._safeCall(async () => {
      const [userResult, recipeResult, blogResult] = await Promise.all([
        User.getUser(userId),
        Recipe.fetchAll(),
        BlogPost.fetchByUser(userId).catch(() => ({ success: true, data: [] })),
      ]);

      if (!userResult.success) return { success: false, data: null, message: userResult.message };

      const allMyRecipes   = recipeResult.success ? Recipe.filterByUser(recipeResult.data, userId) : [];
      const publishedRecipes = allMyRecipes.filter(r => r.isPublished);
      const draftRecipes     = allMyRecipes.filter(r => !r.isPublished);

      const allMyPosts   = blogResult.success ? (blogResult.data || []) : [];
      const publishedPosts = allMyPosts.filter(p => p.isPublished);
      const draftPosts     = allMyPosts.filter(p => !p.isPublished);

      const stats   = CURATOR_STATS[userId]    || { totalViews: 0, totalLikes: 0, comments: 0, followers: 0 };
      const profile = CURATOR_PROFILES[userId] || { expertise: '', bio: '' };

      return {
        success: true,
        data: {
          user:             userResult.data,
          expertise:        profile.expertise,
          bio:              profile.bio,
          curatorStats:     stats,
          recipes:          { published: publishedRecipes, draft: draftRecipes },
          blogPosts:        { published: publishedPosts,   draft: draftPosts   },
          recipeCount:      publishedRecipes.length,
          publishedRecipes,
        },
        message: '',
      };
    });
  }
}

export default ViewCuratorProfileController;
