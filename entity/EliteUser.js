// entities/user/EliteUser.js
// Highest-tier registered user. Has all Premium features and
// is eligible to apply for / hold the Curator role.

import PremiumUser from './PremiumUser';

class EliteUser extends PremiumUser {
  constructor(data = {}) {
    super({ ...data, role: 'ELITE' });
    this.isCurator             = data.isCurator             ?? false;
    this.curatorApplicationId  = data.curatorApplicationId  ?? null;
  }
}

export default EliteUser;
