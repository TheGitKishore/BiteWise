class User {
  constructor({
    userId           = null,
    username         = '',
    email            = '',
    passwordHash     = '',
    firstName        = '',
    lastName         = '',
    dateOfBirth      = null,
    gender           = '',      // 'male' | 'female' | 'other'
    profileType      = null,    // 'MEAL_PLANNER' | 'ATHLETE' | 'HEALTH_ORIENTED'
    role             = 'FREE',  // 'FREE' | 'PREMIUM' | 'CURATOR' | 'ADMIN'
    membershipPlanId = null,
    isActive         = true,
    createdAt        = null,
    updatedAt        = null,
  } = {}) {
    this.userId           = userId;
    this.username         = username;
    this.email            = email;
    this.passwordHash     = passwordHash;
    this.firstName        = firstName;
    this.lastName         = lastName;
    this.dateOfBirth      = dateOfBirth;
    this.gender           = gender;
    this.profileType      = profileType;
    this.role             = role;
    this.membershipPlanId = membershipPlanId;
    this.isActive         = isActive;
    this.createdAt        = createdAt;
    this.updatedAt        = updatedAt;
  }


  // STATIC VALIDATION METHODS
  // Each returns { valid: boolean, message: string }

  // @param  {string} username
  // @return {{ valid: boolean, message: string }}
  static validateUsername(username) {
    if (!username || username.trim().length === 0) {
      return { valid: false, message: 'Username is required.' };
    }
    if (username.trim().length < 3) {
      return { valid: false, message: 'Username must be at least 3 characters.' };
    }
    if (username.trim().length > 20) {
      return { valid: false, message: 'Username must be 20 characters or fewer.' };
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      return { valid: false, message: 'Username can only contain letters, numbers and underscores.' };
    }
    return { valid: true, message: '' };
  }

  // @param  {string} email
  // @return {{ valid: boolean, message: string }}
  static validateEmail(email) {
    if (!email || email.trim().length === 0) {
      return { valid: false, message: 'Email is required.' };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return { valid: false, message: 'Please enter a valid email address.' };
    }
    return { valid: true, message: '' };
  }

  // @param  {string} password
  // @return {{ valid: boolean, message: string }}
  static validatePassword(password) {
    if (!password || password.length === 0) {
      return { valid: false, message: 'Password is required.' };
    }
    if (password.length < 6) {
      return { valid: false, message: 'Password must be at least 6 characters.' };
    }
    return { valid: true, message: '' };
  }


  // STATIC DATA ACCESS METHODS

  // UC #08 Alt Flow 1a
  // TODO: replace with real API call
  // @param  {string} username
  // @return {Promise<boolean>}
  static async isUsernameAvailable(username) {
    const takenUsernames = ['admin', 'bitewise', 'xuanxuan'];
    return !takenUsernames.includes(username.trim().toLowerCase());
  }

  // UC #08 / #09 — validates inputs, sets role & plan, creates the account.
  // Uses this.* so subclasses can override validators without breaking this flow.
  // TODO: replace create block with real API call once backend is ready.
  //
  // @param  {{ username, email, password, confirmPassword, selectedPlanId }}
  // @return {Promise<{ success, field, message, user }>}
  static async createAccount({ username, email, password, confirmPassword, selectedPlanId }) {

    const usernameCheck = this.validateUsername(username);
    if (!usernameCheck.valid) {
      return { success: false, field: 'username', message: usernameCheck.message, user: null };
    }

    const emailCheck = this.validateEmail(email);
    if (!emailCheck.valid) {
      return { success: false, field: 'email', message: emailCheck.message, user: null };
    }

    const passwordCheck = this.validatePassword(password);
    if (!passwordCheck.valid) {
      return { success: false, field: 'password', message: passwordCheck.message, user: null };
    }

    if (password !== confirmPassword) {
      return { success: false, field: 'confirm', message: 'Passwords do not match.', user: null };
    }

    const available = await this.isUsernameAvailable(username);
    if (!available) {
      return { success: false, field: 'username', message: 'Username already exists', user: null };
    }

    // UC #09: planId 2 = Premium, anything else = Free
    const planId = selectedPlanId === 2 ? 2 : 1;
    const role   = planId === 2 ? 'PREMIUM' : 'FREE';

    const newUser = new this({
      userId:           Date.now(),
      username:         username.trim(),
      email:            email.trim(),
      role,
      membershipPlanId: planId,
      isActive:         true,
      createdAt:        new Date().toISOString(),
    });

    return {
      success: true,
      field:   null,
      message: 'Account created successfully! Please log in.',
      user:    newUser,
    };
  }

  // UC #10, #45 — verifies credentials and returns the user session.
  // Uses this.* for subclass compatibility.
  // TODO: replace with real API call once backend is ready.
  //
  // @param  {{ username: string, password: string }}
  // @return {Promise<{ success, message, user }>}
  static async login({ username, password }) {

    if (!username || username.trim().length === 0) {
      return { success: false, message: 'Username is required.', user: null };
    }
    if (!password || password.length === 0) {
      return { success: false, message: 'Password is required.', user: null };
    }

    // Seed users for testing — replace with API call
    const seedUsers = [
      { username: 'xuanxuan', password: 'password123', role: 'FREE',    membershipPlanId: 1, email: 'xuanxuan@gmail.com' },
      { username: 'premuser', password: 'password123', role: 'PREMIUM', membershipPlanId: 2, email: 'prem@gmail.com' },
    ];

    const match = seedUsers.find(
      (u) => u.username === username.trim() && u.password === password
    );

    if (!match) {
      return { success: false, message: 'Incorrect credentials. Please try again.', user: null };
    }

    const user = new this({
      userId:           1,
      username:         match.username,
      email:            match.email,
      role:             match.role,
      membershipPlanId: match.membershipPlanId,
      isActive:         true,
    });

    return { success: true, message: 'Logged in successfully!', user };
  }

  // UC #11, #46 — ends the user session.
  // Shared by Free and Premium — same action, same entity function.
  // TODO: call API to invalidate token when backend is ready.
  //
  // @return {Promise<{ success, message }>}
  static async logout() {
    return { success: true, message: 'Logged out successfully' };
  }

  // UC #12, #47 — returns the current user's account details.
  // TODO: replace with real API call.
  //
  // @param  {User} user
  // @return {Promise<{ success, data, message }>}
  static async getAccountDetails(user) {
    if (!user) {
      return { success: false, data: null, message: 'No user session found.' };
    }
    return {
      success: true,
      data: {
        username:         user.username,
        email:            user.email,
        role:             user.role,
        membershipPlanId: user.membershipPlanId,
      },
      message: '',
    };
  }

  // UC #13, #48 — validates and updates account details.
  // TODO: replace with real API call.
  //
  // @param  {User}   user
  // @param  {{ username: string, email: string }}
  // @return {Promise<{ success, field, message, user }>}
  static async updateAccountDetails(user, { username, email }) {

    const usernameCheck = this.validateUsername(username);
    if (!usernameCheck.valid) {
      return { success: false, field: 'username', message: usernameCheck.message, user: null };
    }

    const emailCheck = this.validateEmail(email);
    if (!emailCheck.valid) {
      return { success: false, field: 'email', message: emailCheck.message, user: null };
    }

    // If username changed, check availability
    if (username.trim() !== user.username) {
      const available = await this.isUsernameAvailable(username);
      if (!available) {
        return { success: false, field: 'username', message: 'Username already exists', user: null };
      }
    }

    const updatedUser = new this({
      ...user,
      username:  username.trim(),
      email:     email.trim(),
      updatedAt: new Date().toISOString(),
    });

    return {
      success: true,
      field:   null,
      message: 'Account details updated successfully!',
      user:    updatedUser,
    };
  }

  // UC #14, #49 — permanently removes the user account.
  // TODO: replace with real API call.
  //
  // @param  {User} user
  // @return {Promise<{ success, message }>}
  static async terminateAccount(user) {
    if (!user) {
      return { success: false, message: 'No user session found.' };
    }
    return { success: true, message: 'Account has been deleted.' };
  }
}

export default User;
