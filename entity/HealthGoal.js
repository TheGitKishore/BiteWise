import axios from 'axios'; //everything entity file needs this two lines of code
import API_CONFIG from './api_config.js';
const API_URL = `${API_CONFIG}/health-goals`;

export const GOAL_TYPES = Object.freeze({
  LOSE_WEIGHT:     'Lose Weight',
  GAIN_MUSCLE:     'Gain Muscle',
  MAINTAIN_WEIGHT: 'Maintain Weight',
  IMPROVE_FITNESS: 'Improve Fitness',
  EAT_HEALTHIER:   'Eat Healthier',
  CUSTOM:          'Custom',
});

export const ACTIVITY_LEVELS = Object.freeze({
  SEDENTARY:   'Sedentary',
  LIGHT:       'Light',
  MODERATE:    'Moderate',
  ACTIVE:      'Active',
  VERY_ACTIVE: 'Very Active',
});

class HealthGoal {
  constructor({
    goalId         = null,
    userId         = null,
    goalType       = '',        // from GOAL_TYPES
    customGoal     = '',        // used when goalType is CUSTOM
    targetWeight   = null,      // kg — optional
    targetCalories = null,      // kcal/day — optional
    activityLevel  = '',        // from ACTIVITY_LEVELS
    targetDate     = null,
    isActive       = true,
    createdAt      = null,
    updatedAt      = null,
  } = {}) {
    this.goalId         = goalId;
    this.userId         = userId;
    this.goalType       = goalType;
    this.customGoal     = customGoal;
    this.targetWeight   = targetWeight;
    this.targetCalories = targetCalories;
    this.activityLevel  = activityLevel;
    this.targetDate     = targetDate;
    this.isActive       = isActive;
    this.createdAt      = createdAt;
    this.updatedAt      = updatedAt;
  }

  // Returns human-readable goal label
  getDisplayGoal() {
    return this.goalType === GOAL_TYPES.CUSTOM ? this.customGoal : this.goalType;
  }


  // STATIC VALIDATION METHODS

  // UC #38, #40, #90 — validate goal fields
  // @param  {{ goalType, customGoal, activityLevel }}
  // @return {{ valid: boolean, field: string|null, message: string }}
  static validateGoal({ goalType, customGoal, activityLevel }) {
    if (!goalType || goalType.trim().length === 0) {
      return { valid: false, field: 'goalType', message: 'Please select a goal type.' };
    }
    if (goalType === GOAL_TYPES.CUSTOM && (!customGoal || customGoal.trim().length === 0)) {
      return { valid: false, field: 'customGoal', message: 'Please describe your custom goal.' };
    }
    if (!activityLevel || activityLevel.trim().length === 0) {
      return { valid: false, field: 'activityLevel', message: 'Please select your activity level.' };
    }
    return { valid: true, field: null, message: '' };
  }


  // DATA ACCESS

  // UC #39, #90 — fetch the user's active health goal
  // @param  {number} userId
  // @return {Promise<{ success, data, message }>}
  static async fetchActive(userId) {
    try {
      const res = await axios.get(`${API_URL}/active/${userId}`);
      return {
        success: true,
        data:    res.data ? new HealthGoal(res.data) : null,
        message: '',
      };
    } catch (err) {
      console.log('FETCH HEALTH GOAL ERROR:', err.response?.data || err.message);
      return {
        success: false,
        data:    null,
        message: err.response?.data?.message || 'Failed to load health goal.',
      };
    }
  }

  // UC #38, #90 — set a new health goal (creates or replaces the active one)
  // @param  {number} userId
  // @param  {{ goalType, customGoal, targetWeight, targetCalories, activityLevel, targetDate }}
  // @return {Promise<{ success, field, message, data }>}
  static async create(userId, fields) {
    const check = HealthGoal.validateGoal(fields);
    if (!check.valid) {
      return { success: false, field: check.field, message: check.message, data: null };
    }

    try {
      const res = await axios.post(API_URL, { userId, ...fields });
      return res.data;
    } catch (err) {
      console.log('SET HEALTH GOAL ERROR:', err.response?.data || err.message);
      return {
        success: false, field: null,
        message: err.response?.data?.message || 'Failed to save health goal.',
        data: null,
      };
    }
  }

  // UC #40, #90 — update an existing health goal
  // @param  {number} goalId
  // @param  {{ goalType, customGoal, targetWeight, targetCalories, activityLevel, targetDate }}
  // @return {Promise<{ success, field, message, data }>}
  static async update(goalId, fields) {
    const check = HealthGoal.validateGoal(fields);
    if (!check.valid) {
      return { success: false, field: check.field, message: check.message, data: null };
    }

    try {
      const res = await axios.put(`${API_URL}/${goalId}`, fields);
      return res.data;
    } catch (err) {
      console.log('UPDATE HEALTH GOAL ERROR:', err.response?.data || err.message);
      return {
        success: false, field: null,
        message: err.response?.data?.message || 'Failed to update health goal.',
        data: null,
      };
    }
  }
}

export default HealthGoal;
