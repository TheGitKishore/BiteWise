import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

const env = process.env.NODE_ENV || 'development';
dotenv.config({ path: `.env.${env}` });

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error(`MONGODB_URI is missing in .env.${env}`);
}

const client = new MongoClient(uri);

let db;

export const connectDB = async () => {
  if (!db) {
    await client.connect();
    db = client.db(process.env.DB_NAME || 'fyp');
    console.log(`MongoDB connected (${env})`);
  }
  return db;
};

export const getDB = () => {
  if (!db) {
    throw new Error('MongoDB not initialized. Call connectDB first.');
  }
  return db;
};

export default client;