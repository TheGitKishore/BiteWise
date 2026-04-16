// Normal Flow (UC #117)
//   1. Curator dashboard mounts (My Blog Posts tab)
//   2. Boundary calls fetchMyPosts(userId)
//   3. Controller delegates to BlogPost.fetchByUser()
//   4. Returns all posts (drafts + published) sorted newest first
//
// Curator only (#117)

import BlogPost from '../entity/BlogPost';

class ViewBlogPostsController {
  constructor() {}

  async _safeCall(fn) {
    try { return await fn(); }
    catch (e) { console.error('[ViewBlogPostsController]', e); return { success: false, data: [], message: 'Unable to load blog posts. Please try again.' }; }
  }

  // UC #117
  // @param  {number} curatorUserId
  // @return {Promise<{ success, data, message }>}
  async fetchMyPosts(curatorUserId) {
    return this._safeCall(async () => BlogPost.fetchByUser(curatorUserId));
  }
}

export default ViewBlogPostsController;
