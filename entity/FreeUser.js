
import User from './User';

class FreeUser extends User {
  constructor(data = {}) {
    super({ ...data, role: 'FREE' });
  }
}

export default FreeUser;
