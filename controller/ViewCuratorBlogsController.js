// Normal Flow (New Consumer UC — Premium User View Curator Blog Posts)
//   1. CuratorBlogsScreen mounts → boundary calls fetchPublishedPosts()
//   2. Controller delegates to BlogPost.fetchAllPublished()
//   3. Returns all PUBLISHED posts across all curators, newest first
//
// Premium User (and Free User if accessible)

import BlogPost from '../entity/BlogPost';

class ViewCuratorBlogsController {
  constructor() {}

  async _safeCall(fn) {
    try { return await fn(); }
    catch (e) { console.error('[ViewCuratorBlogsController]', e); return { success: false, data: [], message: 'Unable to load blog posts. Please try again.' }; }
  }

  // New consumer UC
  // @return {Promise<{ success, data, message }>}
  async fetchPublishedPosts() {
    return this._safeCall(async () => BlogPost.fetchAllPublished());
  }
}

export default ViewCuratorBlogsController;
