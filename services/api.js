import axios from 'axios';

const API_URL = 'http://192.168.x.x:3000/api'; //change to your ip address

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