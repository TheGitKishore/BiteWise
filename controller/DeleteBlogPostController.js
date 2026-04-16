// Normal Flow (UC #122)
//   1. Curator taps "Delete" on a post in EditBlogPostScreen → Alert confirmation
//   2. Curator confirms
//   3. Boundary calls deletePost(blogPostId, curatorUserId)
//   4. Controller delegates to BlogPost.delete()
//   5. Boundary navigates back and removes post from list
//
// Alt Flow 8a: curator cancels → no action
// Curator only (#122)

import BlogPost from '../entity/BlogPost';

class DeleteBlogPostController {
  constructor() {}

  async _safeCall(fn) {
    try { return await fn(); }
    catch (e) { console.error('[DeleteBlogPostController]', e); return { success: false, message: 'Failed to delete. Please try again.' }; }
  }

  // UC #122
  // @param  {string} blogPostId
  // @param  {number} curatorUserId
  // @return {Promise<{ success, message }>}
  async deletePost(blogPostId, curatorUserId) {
    return this._safeCall(async () => BlogPost.delete(blogPostId, curatorUserId));
  }
}

export default DeleteBlogPostController;
