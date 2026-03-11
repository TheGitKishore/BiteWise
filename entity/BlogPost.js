// entities/curator/BlogPost.js
// A health/nutrition article authored by a Curator.
// Can be drafted, published, or unpublished. Admin can moderate.

class BlogPost {
  constructor({
    postId        = null,
    curatorId     = null,
    title         = '',
    content       = '',           // rich text / markdown body
    coverImageUrl = null,
    tags          = [],
    dietaryTags   = [],
    isPublished   = false,
    publishedAt   = null,
    createdAt     = null,
    updatedAt     = null,
  } = {}) {
    this.postId        = postId;
    this.curatorId     = curatorId;
    this.title         = title;
    this.content       = content;
    this.coverImageUrl = coverImageUrl;
    this.tags          = tags;
    this.dietaryTags   = dietaryTags;
    this.isPublished   = isPublished;
    this.publishedAt   = publishedAt;
    this.createdAt     = createdAt;
    this.updatedAt     = updatedAt;
  }
}

export default BlogPost;
