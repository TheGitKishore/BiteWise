// Normal Flow (UC #119)
//   1. Curator taps "Publish" on a DRAFT post → Alert prompt for confirmation
//   2. Curator confirms
//   3. Boundary calls publishPost(blogPostId, curatorUserId)
//   4. Controller delegates to BlogPost.publish()
//   5. Post status → PUBLISHED; boundary updates card badge
//
// Alt Flow 6a: curator cancels → no action
// Curator only (#119)

import BlogPost from '../entity/BlogPost';

class PublishBlogPostController {
  constructor() {}

  async _safeCall(fn) {
    try { return await fn(); }
    catch (e) { console.error('[PublishBlogPostController]', e); return { success: false, message: 'Failed to publish. Please try again.' }; }
  }

  // UC #119
  // @param  {string} blogPostId
  // @param  {number} curatorUserId
  // @return {Promise<{ success, message, data }>}
  async publishPost(blogPostId, curatorUserId) {
    return this._safeCall(async () => BlogPost.publish(blogPostId, curatorUserId));
  }
}

export default PublishBlogPostController;
