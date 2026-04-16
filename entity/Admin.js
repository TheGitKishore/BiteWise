import axios from 'axios';
import API_CONFIG from './api_config.js';

const API_URL = `${API_CONFIG}/admin`;

class Admin {
  static async login({ username, password }) {
    try {
      const res = await axios.post(`${API_URL}/login`, {
        username,
        password
      });
      return res.data;
    } catch (err) {
      return err.response?.data || {
        success: false,
        message: 'Admin login failed',
        user: null
      };
    }
  }
  
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
    const res = await axios.put(`${API_URL}/deactivate`, { userId });
    return res.data;
  }

  static async reactivateUser(userId) {
    const res = await axios.put(`${API_URL}/reactivate`, { userId });
    return res.data;
  }

  static async createAdmin({ username, password }) {
    const res = await axios.post(`${API_URL}/create`, {
      username,
      password
    });
    return res.data;
  }

  static async promoteToCurator(userId, applicationId) {
    try {
      const res = await axios.put(`${API_URL}/promote-to-curator`, {
        userId,
        applicationId
      });
      return res.data;
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Promotion failed'
      };
    }
 }

}

export default Admin;