import axios from 'axios';
import API_CONFIG from './api_config.js';

const API_URL = `${API_CONFIG}/curator-profiles`;

class CuratorProfile {

  static async getProfile(userId) {
    try {
      const res = await axios.get(`${API_URL}/${userId}`);

      return {
        success: true,
        data: res.data?.data || null
      };

    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || err.message,
        data: null
      };
    }
  }

  static async updateProfile(userId, { expertise, bio }) {
    try {
      const res = await axios.put(`${API_URL}/${userId}`, {
        expertise,
        bio
      });

      return {
        success: true,
        message: res.data?.message,
        data: res.data?.data
      };

    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || err.message,
        data: null
      };
    }
  }
}

export default CuratorProfile;