import { MongoClient } from 'mongodb';

const client = new MongoClient('mongodb://zm:1234@ac-dbzb1mg-shard-00-00.hjry7gx.mongodb.net:27017,ac-dbzb1mg-shard-00-01.hjry7gx.mongodb.net:27017,ac-dbzb1mg-shard-00-02.hjry7gx.mongodb.net:27017/?ssl=true&replicaSet=atlas-rxz00p-shard-0&authSource=admin&appName=cluster1');
await client.connect();

const db = client.db('fyp');

export default db;