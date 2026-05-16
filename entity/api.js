import axios from 'axios';
import API_CONFIG from './api_config.js';
const API_URL = `${API_CONFIG}/food-api`;


// Example API calls
export const getUserProfileFeatures = async () => {
  const res = await axios.get(`${API_URL}/features`);
  return res.data;
};

export const createUser = async (userData) => {
  const res = await axios.post(`${API_URL}/users`, userData);
  return res.data;
};

export default {
  getUserProfileFeatures,
  createUser,
};