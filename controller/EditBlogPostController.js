// Normal Flow (UC #121)
//   1. Curator taps "Edit" on a post → EditBlogPostScreen (edit mode, pre-filled)
//   2. Curator edits fields → taps Save
//   3. Boundary calls updatePost(blogPostId, curatorUserId, fields)
//   4. Controller delegates to BlogPost.update()
//
// Alt Flow 6a: curator cancels → no action
// Curator only (#121)

import BlogPost from '../entity/BlogPost';

class EditBlogPostController {
  constructor() {}

  async _safeCall(fn) {
    try { return await fn(); }
    catch (e) { console.error('[EditBlogPostController]', e); return { success: false, field: null, message: 'Something went wrong. Please try again.', data: null }; }
  }

  // UC #121
  // @param  {string} blogPostId
  // @param  {number} curatorUserId
  // @param  {{ title, content, tags }}
  // @return {Promise<{ success, field, message, data }>}
  async updatePost(blogPostId, curatorUserId, fields) {
    return this._safeCall(async () => BlogPost.update(blogPostId, curatorUserId, fields));
  }
}

export default EditBlogPostController;
