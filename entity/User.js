import axios from 'axios'; //everything entity file needs this two lines of code
const API_URL = 'http://192.168.x.x:3000/api/users'; // ⚠️ change IP to your wifi ip 192.168.x.x (best to not show your ip address to anyone)

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
  static async updateAccountDetails(user, { username, email }) {

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
          email
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
  
}

export default User;
