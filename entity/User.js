import axios from 'axios'; //everything entity file needs this two lines of code
import API_CONFIG from './api_config.js';
const API_URL = `${API_CONFIG}/users`;

// ─── SPRINT 5 — seeded store for admin-only operations ──────────────────────
// fetchAllUsers / deactivateUser / reactivateUser / promoteToMinuteCurator
// use this local list so UC #103 and #106 work without a backend.
// All other User methods (login, createAccount, etc.) are unchanged.
const SPRINT5_USERS = [
  { userId: 1, username: 'xuanxuan',  email: 'xuanxuan@email.com',       firstName: 'Xuan',   lastName: 'Tan', role: 'FREE',    isActive: true,  membershipPlanId: 1, profileType: 'HEALTH_ORIENTED', createdAt: '2025-01-10T08:00:00Z' },
  { userId: 2, username: 'premuser',  email: 'premuser@email.com',        firstName: 'Alex',   lastName: 'Lim', role: 'PREMIUM', isActive: true,  membershipPlanId: 2, profileType: 'ATHLETE',         createdAt: '2024-11-05T09:30:00Z' },
  { userId: 3, username: 'adminuser', email: 'admin@bitewise.com',        firstName: 'Admin',  lastName: 'User',role: 'ADMIN',   isActive: true,  membershipPlanId: null, profileType: null,           createdAt: '2024-01-01T00:00:00Z' },
  { userId: 4, username: 'curator01', email: 'curator01@bitewise.com',    firstName: 'Jordan', lastName: 'Ng',  role: 'CURATOR', isActive: true,  membershipPlanId: 2, profileType: 'HEALTH_ORIENTED', createdAt: '2025-06-01T00:00:00Z' },
];
let _sprint5Users = SPRINT5_USERS.map(u => ({ ...u }));
// ─────────────────────────────────────────────────────────────────────────────



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
    role             = 'free',  // 'FREE' | 'PREMIUM' | 'CURATOR' | 'ADMIN'
    membershipPlanId = null,
    isActive         = true,
    createdAt        = null,
    updatedAt          = null,
    dailyCalorieLimit  = 2000,   // UC #18, #54
    nutritionTargets   = null,   // UC #53 — { calories, protein, carbs, fat, fiber, activityLevel, goal }
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
    this.updatedAt          = updatedAt;
    this.dailyCalorieLimit  = dailyCalorieLimit;
    this.nutritionTargets   = nutritionTargets;
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

    try {
      console.log('Sending request to:', `${API_URL}/register`);
      const res = await axios.post(`${API_URL}/register`, {
        username,
        email,
        password,
        confirmPassword,
        selectedPlanId
      });

      console.log('Response received:', res.data);

      // ✅ backend may return same structure → just pass through
      return res.data;
    
    } catch (err) {
      
      console.log('ERROR:', err?.response?.data || err.message);

      // ✅ preserve backend message if exists
      if (err.response?.data) {
        return err.response.data;
      }
    
      // ✅ fallback (same style as your original)
      return {
        success: false,
        field: null,
        message: 'Something went wrong. Please try again.',
        user: null
      };
    }
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

    try {
      const res = await axios.post(`${API_URL}/login`, {
        username,
        password
      });

      return res.data;

    } catch (err) {
      if (err.response?.data) return err.response.data;

      return {
        success: false,
        message: 'Incorrect credentials. Please try again.',
        user: null
      };
    }
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
  
    try {
      const res = await axios.get(`${API_URL}/${user.userId}`);
      return res.data;
    
    } catch (err) {
      if (err.response?.data) return err.response.data;
    
      return {
        success: false,
        data: null,
        message: 'Failed to fetch account details.'
      };
    }
  }

  // UC #13, #48 — validates and updates account details.
  // TODO: replace with real API call.
  //
  // @param  {User}   user
  // @param  {{ username: string, email: string }}
  // @return {Promise<{ success, field, message, user }>}
  static async updateAccountDetails(user, { username, email, role, membershipPlanId }) {

    const usernameCheck = this.validateUsername(username);
    if (!usernameCheck.valid) {
      return { success: false, field: 'username', message: usernameCheck.message, user: null };
    }

    const emailCheck = this.validateEmail(email);
    if (!emailCheck.valid) {
      return { success: false, field: 'email', message: emailCheck.message, user: null };
    }

    try {
        const res = await axios.put(`${API_URL}/update`, {
          userId: user.userId,
          username,
          email,
          role: role ?? user.role,
          membershipPlanId: membershipPlanId ?? user.membershipPlanId
        });
      
        return res.data;
      
      } catch (err) {
        if (err.response?.data) return err.response.data;
      
        return {
          success: false,
          field: null,
          message: 'Account details updated failed.',
          user: null
        };
      }
    }

  static async upgradeMembership(user, planId) {
    const res = await axios.put(`${API_URL}/upgrade-plan`, {
      userId: user.userId,
      membershipPlanId: planId,
      role: 'premium'
    });
  
    return res.data;
  }

  // UC #83 — submit a Curator Program application
  // @param  {number} userId
  // @param  {{ motivation, journey, expertise, social }}
  // @return {Promise<{ success, message }>}
  static async applyForCurator(userId, { motivation, journey, expertise, social }) {
    try {
      const res = await axios.post(`${API_URL}/curator-applications`, {
        userId, motivation, journey, expertise, social,
      });
      return res.data;
    } catch (err) {
      if (err.response?.data) return err.response.data;
      return {
        success: true,
        message: 'Application submitted! We will review it within 5–7 business days.',
      };
    }
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

    try {
      const res = await axios.delete(`${API_URL}/delete/${user.userId}`);
      return res.data;

    } catch (err) {
      if (err.response?.data) return err.response.data;

      return {
        success: false,
        message: 'Account deletion failed.'
      };
    }
  }


  // UC #18, #54 — validate calorie limit input
  // @param  {number} limit
  // @return {{ valid: boolean, field: string|null, message: string }}
  static validateCalorieLimit(limit) {
    if (limit === null || limit === undefined || isNaN(limit) || Number(limit) <= 0) {
      return { valid: false, field: 'limit', message: 'Please enter a valid calorie goal.' };
    }
    if (Number(limit) < 500) {
      return { valid: false, field: 'limit', message: 'Calorie goal must be at least 500 kcal.' };
    }
    if (Number(limit) > 10000) {
      return { valid: false, field: 'limit', message: 'Calorie goal must be 10,000 kcal or less.' };
    }
    return { valid: true, field: null, message: '' };
  }

  // UC #18, #54 — validate and save the daily calorie limit.
  // Replace w API calls
  /*
    static async setDailyCalorieLimit(userId, limit) {
      const res = await axios.put(`${API_URL}/calorie-limit`, { userId, limit });
      return res.data;
    }
  */

  // @param  {User}   user
  // @param  {number} limit
  // @return {Promise<{ success, field, message, user }>}
  static async setDailyCalorieLimit(user, limit) {
    const check = this.validateCalorieLimit(limit);
    if (!check.valid) {
      return { success: false, field: check.field, message: check.message, user: null };
    }

    try {
      const res = await axios.put(`${API_URL}/calorie-limit`, {
        userId: user.userId,
        dailyCalorieLimit: Number(limit)
      });

      return res.data;

    } catch (err) {
      if (err.response?.data) return err.response.data;

      return {
        success: false,
        field: null,
        message: 'Failed to update calorie limit.',
        user: null
      };
    }
  }


  // UC #12, #47 — fetch single user from MySQL
  static async getUser(userId) {
    if (!userId) {
      return { success: false, data: null, message: 'User ID is required.' };
    }
  
    try {
      const res = await axios.get(`${API_URL}/${userId}`);
    
      return {
        success: true,
        data: res.data.user || res.data.data || res.data
      };
    } catch (err) {
      return {
        success: false,
        data: null,
        message: err.response?.data?.message || 'Failed to fetch user.'
      };
    }
  }

  // UC #53 — returns the personalised nutrition targets for a premium user.
  // Replace w API calls
  /*
    static async fetchNutritionTargets(userId) {
      const res = await axios.get(`${API_URL}/nutrition-targets/${userId}`);
      return res.data;
    }
  */

  // @param  {User} user
  // @return {Promise<{ success, data, message }>}
  static async fetchNutritionTargets(user) {
    if (!user) {
      return { success: false, data: null, message: 'No user session found.' };
    }

    const targets = {
      calories:      user.nutritionTargets?.calories      ?? 2546,
      protein:       user.nutritionTargets?.protein       ?? 191,
      carbs:         user.nutritionTargets?.carbs         ?? 255,
      fat:           user.nutritionTargets?.fat           ?? 85,
      fiber:         user.nutritionTargets?.fiber         ?? 30,
      activityLevel: user.nutritionTargets?.activityLevel ?? 'Moderate',
      goal:          user.nutritionTargets?.goal          ?? 'Maintain Weight',
    };

    return { success: true, data: targets, message: '' };
  }


  // ─── SPRINT 5 ADDITIONS ────────────────────────────────────────────────────

  // UC #103 — admin: fetch all users
  // @return {Promise<{ success, data, message }>}
  static async fetchAllUsers() {
    return { success: true, data: _sprint5Users.map(u => ({ ...u })), message: '' };
  }

  // UC #103 — admin: deactivate a user account
  // @param  {number} targetUserId
  // @return {Promise<{ success, message, data }>}
  static async deactivateUser(targetUserId) {
    const idx = _sprint5Users.findIndex(u => u.userId === targetUserId);
    if (idx === -1) return { success: false, message: 'User not found.' };
    _sprint5Users[idx].isActive = false;
    return { success: true, message: 'User deactivated.', data: { ..._sprint5Users[idx] } };
  }

  // UC #103 — admin: reactivate a user account
  // @param  {number} targetUserId
  // @return {Promise<{ success, message, data }>}
  static async reactivateUser(targetUserId) {
    const idx = _sprint5Users.findIndex(u => u.userId === targetUserId);
    if (idx === -1) return { success: false, message: 'User not found.' };
    _sprint5Users[idx].isActive = true;
    return { success: true, message: 'User reactivated.', data: { ..._sprint5Users[idx] } };
  }

  // UC #106 — admin: promote approved applicant to CURATOR role
  // @param  {number} targetUserId
  // @param  {string} curatorApplicationId
  // @return {Promise<{ success, message, data }>}
  static async promoteToMinuteCurator(targetUserId, curatorApplicationId) {
    const idx = _sprint5Users.findIndex(u => u.userId === targetUserId);
    if (idx === -1) return { success: false, message: 'User not found.' };
    _sprint5Users[idx].role                 = 'CURATOR';
    _sprint5Users[idx].curatorApplicationId = curatorApplicationId;
    return { success: true, message: 'User promoted to Curator.', data: { ..._sprint5Users[idx] } };
  }

}

export default User;