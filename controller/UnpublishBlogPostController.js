// Normal Flow (UC #120)
//   1. Curator taps "Unpublish" on a PUBLISHED post → Alert prompt
//   2. Curator confirms
//   3. Boundary calls unpublishPost(blogPostId, curatorUserId)
//   4. Controller delegates to BlogPost.unpublish()
//   5. Post status → DRAFT; boundary updates card badge
//
// Alt Flow 6a: curator cancels → no action
// Curator only (#120)

import BlogPost from '../entity/BlogPost';

class UnpublishBlogPostController {
  constructor() {}

  async _safeCall(fn) {
    try { return await fn(); }
    catch (e) { console.error('[UnpublishBlogPostController]', e); return { success: false, message: 'Failed to unpublish. Please try again.' }; }
  }

  // UC #120
  // @param  {string} blogPostId
  // @param  {number} curatorUserId
  // @return {Promise<{ success, message, data }>}
  async unpublishPost(blogPostId, curatorUserId) {
    return this._safeCall(async () => BlogPost.unpublish(blogPostId, curatorUserId));
  }
}

export default UnpublishBlogPostController;
