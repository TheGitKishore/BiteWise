import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://zm:FYP-26-S1-17 BiteWise@ac-dbzb1mg-shard-00-00.hjry7gx.mongodb.net:27017,ac-dbzb1mg-shard-00-01.hjry7gx.mongodb.net:27017,ac-dbzb1mg-shard-00-02.hjry7gx.mongodb.net:27017/?ssl=true&replicaSet=atlas-rxz00p-shard-0&authSource=admin&appName=cluster1';

//Leonards IP Mongo
//const uri = process.env.MONGODB_URI || 'mongodb://leonardpoonkokwei_db_user:leonardpoonkokwei_db_user@ac-dbzb1mg-shard-00-00.hjry7gx.mongodb.net:27017,ac-dbzb1mg-shard-00-01.hjry7gx.mongodb.net:27017,ac-dbzb1mg-shard-00-02.hjry7gx.mongodb.net:27017/?ssl=true&replicaSet=atlas-rxz00p-shard-0&authSource=admin&appName=cluster1';

//const client = new MongoClient(uri);

//Leonard
const client = new MongoClient(uri);

let db;

export const connectDB = async () => {
  if (!db) {
    await client.connect();
    db = client.db('fyp');
    console.log('MongoDB connected');
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