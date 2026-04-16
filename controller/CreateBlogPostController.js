// Normal Flow (UC #118)
//   1. Curator taps "Create Blog Post" → EditBlogPostScreen opens (create mode)
//   2. Curator fills title, content, tags → taps Save
//   3. Boundary calls createPost(userId, curatorName, fields)
//   4. Controller delegates to BlogPost.create()
//   5. Post saved as DRAFT → boundary navigates back and refreshes list
//
// Alt Flow 6a: curator cancels → no action
// Curator only (#118)

import BlogPost from '../entity/BlogPost';

class CreateBlogPostController {
  constructor() {}

  async _safeCall(fn) {
    try { return await fn(); }
    catch (e) { console.error('[CreateBlogPostController]', e); return { success: false, field: null, message: 'Something went wrong. Please try again.', data: null }; }
  }

  // UC #118
  // @param  {number} curatorUserId
  // @param  {string} curatorName
  // @param  {{ title, content, tags }}
  // @return {Promise<{ success, field, message, data }>}
  async createPost(curatorUserId, curatorName, fields) {
    return this._safeCall(async () => BlogPost.create(curatorUserId, curatorName, fields));
  }
}

export default CreateBlogPostController;
