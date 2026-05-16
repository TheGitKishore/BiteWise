import User from './User';

class PremiumUser extends User {
  constructor(data = {}) {
    super({ ...data, role: 'PREMIUM' });
    this.isCurator            = data.isCurator            ?? false;
    this.curatorApplicationId = data.curatorApplicationId ?? null;
  }
}

export default PremiumUser;
