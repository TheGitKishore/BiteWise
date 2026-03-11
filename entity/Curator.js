// entities/user/Curator.js
// An approved Elite User who can publish recipes and blog posts.
// Curator status is granted by a System Admin after reviewing an application.

import User from './User';

class Curator extends User {
  constructor(data = {}) {
    super({ ...data, role: 'CURATOR' });
    this.curatorApplicationId = data.curatorApplicationId ?? null;
    this.blogPostIds          = data.blogPostIds          ?? [];
    this.customRecipeIds      = data.customRecipeIds      ?? [];
    this.bio                  = data.bio                  ?? '';
    this.specialization       = data.specialization       ?? ''; // 'nutrition' | 'fitness' | 'wellness'
    this.approvedAt           = data.approvedAt           ?? null;
    this.approvedByAdminId    = data.approvedByAdminId    ?? null;
  }
}

export default Curator;
