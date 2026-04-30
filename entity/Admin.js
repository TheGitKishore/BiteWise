import axios from 'axios';
import API_CONFIG from './api_config.js';

const API_URL = `${API_CONFIG}/admin`;

// ── Sprint 11 Seed Data ───────────────────────────────────────────────────────

const SEEDED_USERS = [
  { userId: 1, firstName: 'John',  lastName: 'Doe',      username: 'johndoe',    email: 'john@example.com',   role: 'premium', status: 'active',     plan: 'yearly',  joinedAt: '2024-01-15', lastActive: '2025-02-24' },
  { userId: 2, firstName: 'Jane',  lastName: 'Smith',    username: 'janesmith',  email: 'jane@example.com',   role: 'premium', status: 'active',     plan: 'monthly', joinedAt: '2024-03-20', lastActive: '2025-02-23' },
  { userId: 3, firstName: 'Mike',  lastName: 'Johnson',  username: 'mikejohnson',email: 'mike@example.com',   role: 'free',    status: 'active',     plan: 'free',    joinedAt: '2024-06-10', lastActive: '2025-02-22' },
  { userId: 4, firstName: 'Sarah', lastName: 'Williams', username: 'sarahw',     email: 'sarah@example.com',  role: 'premium', status: 'banned',     plan: 'monthly', joinedAt: '2024-07-05', lastActive: '2025-01-15' },
  { userId: 5, firstName: 'David', lastName: 'Brown',    username: 'davidb',     email: 'david@example.com',  role: 'free',    status: 'active',     plan: 'free',    joinedAt: '2024-08-12', lastActive: '2025-02-20' },
];

const SEEDED_REVIEWS = [
  { reviewId: 1, reviewerName: 'John Doe',    rating: 5, status: 'approved', flagged: false, createdAt: '2025-02-20', content: 'Amazing app! Helped me lose 10 pounds in 2 months.' },
  { reviewId: 2, reviewerName: 'Jane Smith',  rating: 4, status: 'approved', flagged: false, createdAt: '2025-02-18', content: 'Great features but could use more recipe variety.' },
  { reviewId: 3, reviewerName: 'Mike Johnson',rating: 1, status: 'flagged',  flagged: true,  createdAt: '2025-02-15', content: 'This app is terrible and a scam! Do not download!' },
  { reviewId: 4, reviewerName: 'David Brown', rating: 5, status: 'approved', flagged: false, createdAt: '2025-02-10', content: 'Love the nutrition tracking and meal planning features.' },
];

const SEEDED_APPLICATIONS = [
  { applicationId: 1, userId: 2, username: 'Jane Smith',  email: 'jane@example.com',  expertise: 'Certified Nutritionist, Meal Planning Expert',  motivation: 'I have been a nutritionist for 5 years and want to share my knowledge with the community.', status: 'pending',  createdAt: '2025-02-15T10:30:00.000Z' },
  { applicationId: 2, userId: 5, username: 'David Brown', email: 'david@example.com', expertise: 'Weight Loss Journey, Personal Experience',          motivation: 'Lost 50 pounds using BiteWise and want to help others achieve their goals.',               status: 'pending',  createdAt: '2025-02-10T14:20:00.000Z' },
  { applicationId: 3, userId: 1, username: 'John Doe',    email: 'john@example.com',  expertise: 'Culinary Arts, Healthy Recipe Development',          motivation: 'Professional chef with 10 years experience in healthy cooking.',                           status: 'approved', createdAt: '2025-01-20T09:15:00.000Z' },
];

const SEEDED_OVERVIEW = {
  totalUsers:          5,
  activeUsers:         4,
  premiumUsers:        3,
  bannedUsers:         1,
  totalReviews:        4,
  flaggedReviews:      1,
  pendingApplications: 2,
  systemStatus:        'All Systems Operational',
};

const SEEDED_SYSTEM_INFO = {
  currentVersion:  'v2.5.0',
  lastUpdated:     'February 20, 2025',
  pendingUpdates:  [
    'Bug fixes for recipe search functionality',
    'Performance improvements for food tracking',
    'New meal planning templates',
    'Enhanced security patches',
  ],
  importantNotes: [
    'Deployment will cause 2-3 minutes of downtime',
    'All users will be logged out automatically',
    'Backup has been created automatically',
    'Rollback is available if issues occur',
  ],
  health: {
    apiResponseTime: '45ms',
    apiStatus:       'Excellent',
    serverUptime:    '99.98%',
    uptimeLabel:     'Last 30 days',
    dbStatus:        'Healthy',
    dbLabel:         'All connections active',
  },
};

// ─────────────────────────────────────────────────────────────────────────────

class Admin {

  // ── Existing axios methods (pre-Sprint 11) ─────────────────────────────────

  static async login({ username, password }) {
    try {
      const res = await axios.post(`${API_URL}/login`, { username, password });
      return res.data;
    } catch (err) {
      return err.response?.data || { success: false, message: 'Admin login failed', user: null };
    }
  }

  static async fetchAllUsers() {
    try {
      const res = await axios.get(`${API_URL}/users`);
      return res.data;
    } catch (err) {
      return { success: false, data: null, message: err.response?.data?.message || 'Failed to fetch users' };
    }
  }

  static async deactivateUser(userId) {
    const res = await axios.put(`${API_URL}/deactivate`, { userId });
    return res.data;
  }

  static async reactivateUser(userId) {
    const res = await axios.put(`${API_URL}/reactivate`, { userId });
    return res.data;
  }

  static async createAdmin({ username, password }) {
    const res = await axios.post(`${API_URL}/create`, { username, password });
    return res.data;
  }

  static async promoteToCurator(userId, applicationId) {
    try {
      const res = await axios.put(`${API_URL}/promote-to-curator`, { userId, applicationId });
      return res.data;
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Promotion failed' };
    }
  }

  static async approve(applicationId, adminId) {
    try {
      const res = await axios.put(`${API_URL}/${applicationId}/approve`, { adminId });
      return res.data;
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  }

  static async reject(applicationId, adminId, reason) {
    try {
      const res = await axios.put(`${API_URL}/${applicationId}/reject`, { adminId, reason });
      return res.data;
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  }

  // ── SPRINT 11 ADDITIONS — seeded stubs (no axios) ──────────────────────────

  // UC NEW-A — fetch dashboard overview statistics
  // @return {Promise<{ success, data: object, message }>}
  static async fetchOverviewStats() {
    return { success: true, data: SEEDED_OVERVIEW, message: '' };
  }

  // UC #100 — fetch all users for admin view (seeded fallback)
  // Used when live API is unavailable; mirrors fetchAllUsers() return shape.
  // @return {Promise<{ success, data: Array, message }>}
  static async fetchUsersSeeded() {
    return { success: true, data: SEEDED_USERS, message: '' };
  }

  // UC #101 — permanently terminate a user account (seeded stub)
  // @param  {number|string} userId
  // @return {Promise<{ success, message }>}
  static async terminateUser(userId) {
    return { success: true, message: 'User account has been terminated' };
  }

  // UC #102 — temporarily ban a user account (seeded stub)
  // @param  {number|string} userId
  // @return {Promise<{ success, message }>}
  static async banUser(userId) {
    return { success: true, message: 'User account has been banned' };
  }

  // UC #102 — lift a temporary ban on a user account (seeded stub)
  // @param  {number|string} userId
  // @return {Promise<{ success, message }>}
  static async unbanUser(userId) {
    return { success: true, message: 'User account has been unbanned' };
  }

  // UC #103 / #104 — fetch all reviews for moderation (seeded fallback)
  // @return {Promise<{ success, data: Array, message }>}
  static async fetchReviewsSeeded() {
    return { success: true, data: SEEDED_REVIEWS, message: '' };
  }

  // UC #104 — remove a single review (seeded stub)
  // @param  {number|string} reviewId
  // @return {Promise<{ success, message }>}
  static async removeReviewSeeded(reviewId) {
    return { success: true, message: 'Review has been removed' };
  }

  // UC #105 / #106 / #107 — fetch all curator applications (seeded fallback)
  // @return {Promise<{ success, data: Array, message }>}
  static async fetchApplicationsSeeded() {
    return { success: true, data: SEEDED_APPLICATIONS, message: '' };
  }

  // UC #106 — approve a curator application (seeded stub)
  // @param  {number|string} applicationId
  // @param  {number|string} adminId
  // @return {Promise<{ success, message }>}
  static async approveApplicationSeeded(applicationId, adminId) {
    return { success: true, message: 'Curator application approved!' };
  }

  // UC #107 — reject a curator application (seeded stub)
  // @param  {number|string} applicationId
  // @param  {number|string} adminId
  // @return {Promise<{ success, message }>}
  static async rejectApplicationSeeded(applicationId, adminId) {
    return { success: true, message: 'Curator application rejected.' };
  }

  // UC #108 — fetch system info and health (seeded stub)
  // @return {Promise<{ success, data: object, message }>}
  static async fetchSystemInfo() {
    return { success: true, data: SEEDED_SYSTEM_INFO, message: '' };
  }

  // ─────────────────────────────────────────────────────────────────────────────
}

export default Admin;
