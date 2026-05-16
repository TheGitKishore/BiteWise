import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri);

let mongoDB;

export const connectDB = async () => {
  if (!mongoDB) {
    await client.connect();
    mongoDB = client.db('fyp');
    console.log('MongoDB connected');
  }
  return mongoDB;
};

export const getDB = () => {
  if (!mongoDB) {
    throw new Error('MongoDB not initialized. Call connectDB first.');
  }
  return mongoDB;
};

export default client;