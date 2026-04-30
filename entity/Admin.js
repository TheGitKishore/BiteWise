import axios from 'axios';
import API_CONFIG from './api_config.js';

const API_URL = `${API_CONFIG}/admin`;

class Admin {

  // ── AUTH ─────────────────────────────────────────────────────

  static async login({ username, password }) {
    try {
      const res = await axios.post(`${API_URL}/login`, { username, password });
      return res.data;
    } catch (err) {
      return err.response?.data || {
        success: false,
        message: 'Admin login failed',
        user: null
      };
    }
  }

  // ── USERS ────────────────────────────────────────────────────

  static async fetchAllUsers() {
    try {
      const res = await axios.get(`${API_URL}/users`);
      return res.data;
    } catch (err) {
      return {
        success: false,
        data: null,
        message: err.response?.data?.message || 'Failed to fetch users'
      };
    }
  }

  static async deactivateUser(userId) {
    try {
      const res = await axios.put(`${API_URL}/deactivate`, { userId });
      return res.data;
    } catch (err) {
      return { success: false, message: 'Deactivate failed' };
    }
  }

  static async reactivateUser(userId) {
    try {
      const res = await axios.put(`${API_URL}/reactivate`, { userId });
      return res.data;
    } catch (err) {
      return { success: false, message: 'Reactivate failed' };
    }
  }

  static async banUser(userId) {
    return this.deactivateUser(userId);
  }

  static async unbanUser(userId) {
    return this.reactivateUser(userId);
  }

  static async terminateUser(userId) {
    try {
      const res = await axios.delete(`${API_URL}/users/${userId}`);
      return res.data;
    } catch (err) {
      return { success: false, message: 'Terminate failed' };
    }
  }

  // ── ADMINS ───────────────────────────────────────────────────

//  static async createAdmin({ username, password }) {
//    try {
//      const res = await axios.post(`${API_URL}/create`, { username, password });
//      return res.data;
//    } catch (err) {
//      return { success: false, message: 'Create admin failed' };
//    }
//  }

  // ── CURATOR APPLICATIONS ─────────────────────────────────────

  static async fetchApplications() {
    try {
      const res = await axios.get(`${API_URL}/applications`);
      return res.data;
    } catch (err) {
      return { success: false, data: [], message: 'Failed to fetch applications' };
    }
  }

  static async approveApplication(applicationId, adminId) {
    try {
      const res = await axios.put(`${API_URL}/${applicationId}/approve`, { adminId });
      return res.data;
    } catch (err) {
      return { success: false, message: 'Approval failed' };
    }
  }

  static async rejectApplication(applicationId, adminId, reason) {
    try {
      const res = await axios.put(`${API_URL}/${applicationId}/reject`, {
        adminId,
        reason
      });
      return res.data;
    } catch (err) {
      return { success: false, message: 'Rejection failed' };
    }
  }

  static async promoteToCurator(userId, applicationId) {
    try {
      const res = await axios.put(`${API_URL}/promote-to-curator`, {
        userId,
        applicationId
      });
      return res.data;
    } catch (err) {
      return { success: false, message: 'Promotion failed' };
    }
  }

  // ── REVIEWS ──────────────────────────────────────────────────

  static async fetchReviews() {
    try {
      const res = await axios.get(`${API_CONFIG}/reviews`);
      return res.data;
    } catch (err) {
      return { success: false, data: [], message: 'Failed to fetch reviews' };
    }
  }

  static async removeReview(reviewId) {
    try {
      const res = await axios.delete(`${API_URL}/reviews/${reviewId}`);
      return res.data;
    } catch (err) {
      return { success: false, message: 'Remove review failed' };
    }
  }

  // ── DASHBOARD / SYSTEM ───────────────────────────────────────

  static async fetchOverviewStats() {
    try {
      console.log("HITTING:", `${API_URL}/overview`);

      const res = await axios.get(`${API_URL}/overview`);
      console.log("RAW OVERVIEW RESPONSE:", res.data);

      return res.data;
    } catch (err) {
      console.log("❌ OVERVIEW ERROR:");
      console.log(err?.message);
      console.log(err?.response?.data);
      console.log(err?.config?.url);

      return {
        success: false,
        data: null,
        message: err.response?.data?.message || err.message
      };
    }
  }

  static async fetchSystemInfo() {
    try {
      const res = await axios.get(`${API_URL}/system`);
      return res.data;
    } catch (err) {
      return { success: false, data: null, message: 'Failed to fetch system info' };
    }
  }
}

export default Admin;