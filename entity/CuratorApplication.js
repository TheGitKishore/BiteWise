import axios from 'axios';
import API_CONFIG from './api_config.js';

const API_URL = `${API_CONFIG}/curator-applications`;

class CuratorApplication {
  constructor({
    applicationId = null,
    userId = null,
    username = '',
    motivation = '',
    journey = '',
    expertise = '',
    social = '',
    status = 'PENDING',
    reviewedByAdminId = null,
    reviewedAt = null,
    rejectionReason = null,
    createdAt = null
  } = {}) {
    Object.assign(this, {
      applicationId,
      userId,
      username,
      motivation,
      journey,
      expertise,
      social,
      status,
      reviewedByAdminId,
      reviewedAt,
      rejectionReason,
      createdAt
    });
  }

  // ================= VALIDATION =================
  static validateApplication({ motivation, journey, expertise }) {
    const errors = {};
    if (!motivation?.trim()) errors.motivation = 'Required.';
    if (!journey?.trim()) errors.journey = 'Required.';
    if (!expertise?.trim()) errors.expertise = 'Required.';
    return { valid: Object.keys(errors).length === 0, errors };
  }

  // ================= UC #98 — SUBMIT =================
  static async create(userId, username, { motivation, journey, expertise, social }) {
    const check = this.validateApplication({ motivation, journey, expertise });
    if (!check.valid) {
      return {
        success: false,
        errors: check.errors,
        message: 'Please fill in all required fields.',
        data: null
      };
    }

    try {
      const res = await axios.post(API_URL, {
        userId,
        username,
        motivation,
        journey,
        expertise,
        social
      });

      return res.data;
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || err.message
      };
    }
  }

  // ================= UC #105 — FETCH ALL =================
  static async fetchAll() {
    try {
      const res = await axios.get(API_URL);
    
      return {
        success: true,
        data: res.data.data || res.data.applications || res.data
      };
    } catch (err) {
      return {
        success: false,
        data: [],
        message: err.response?.data?.message || err.message
      };
    }
  }

  // ================= UC #106 — APPROVE =================
  static async approve(applicationId, adminId) {
    try {
      const res = await axios.put(`${API_URL}/${applicationId}/approve`, {
        adminId
      });
      return res.data;
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || err.message
      };
    }
  }

  // ================= UC #106 — REJECT =================
  static async reject(applicationId, adminId, reason) {
    try {
      const res = await axios.put(`${API_URL}/${applicationId}/reject`, {
        adminId,
        reason
      });
      return res.data;
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || err.message
      };
    }
  }
}

export default CuratorApplication;