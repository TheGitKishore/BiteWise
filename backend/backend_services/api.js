import axios from 'axios';
import {MongoClient} from 'mongodb';
import mysql from 'mysql2/promise';

// ===================== CONFIGURATION =====================
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://zm:1234@ac-dbzb1mg-shard-00-00.hjry7gx.mongodb.net:27017,ac-dbzb1mg-shard-00-01.hjry7gx.mongodb.net:27017,ac-dbzb1mg-shard-00-02.hjry7gx.mongodb.net:27017/?ssl=true&replicaSet=atlas-rxz00p-shard-0&authSource=admin&appName=cluster1';
const MYSQL_CONFIG = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '1234',
  database: process.env.MYSQL_DB || 'fyp',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};
const OPENFOODFACTS_BASE_URL = 'https://world.openfoodfacts.org/api/v0';

// ===================== MONGODB CONNECTION =====================
let mongoClient;
let mongoDB;

export const connectMongoDB = async () => {
  try {
    if (mongoDB) {
      console.log('MongoDB already connected');
      return mongoDB;
    }
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    mongoDB = mongoClient.db('bitewise');
    console.log('MongoDB connected successfully');
    return mongoDB;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

export const getMongoDB = () => {
  if (!mongoDB) throw new Error('MongoDB not connected. Call connectMongoDB() first.');
  return mongoDB;
};

export const closeMongoDB = async () => {
  if (mongoClient) {
    await mongoClient.close();
    mongoClient = null;
    mongoDB = null;
    console.log('MongoDB connection closed');
  }
};

// ===================== MYSQL CONNECTION POOL =====================
let mysqlPool;

export const getMySQLPool = async () => {
  if (!mysqlPool) {
    mysqlPool = await mysql.createPool(MYSQL_CONFIG);
  }
  return mysqlPool;
};

export const connectMySQL = async () => {
  try {
    const pool = await getMySQLPool();
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('MySQL connected successfully');
  } catch (error) {
    console.error('MySQL connection error:', error);
    throw error;
  }
};

// Close MySQL pool
export const closeMySQL = async () => {
  if (mysqlPool) {
    await mysqlPool.end();
    mysqlPool = null;
  }
};

// ===================== MONGODB OPERATIONS =====================

export const getMongoDocument = async (collectionName, filter = {}) => {
  try {
    const db = getMongoDB();
    return await db.collection(collectionName).findOne(filter);
  } catch (error) {
    console.error(`Error fetching document from ${collectionName}:`, error);
    throw error;
  }
};

export const getMongoDocuments = async (collectionName, filter = {}, options = {}) => {
  try {
    const db = getMongoDB();
    let query = db.collection(collectionName).find(filter);
    if (options.sort)  query = query.sort(options.sort);
    if (options.limit) query = query.limit(options.limit);
    if (options.skip)  query = query.skip(options.skip);
    return await query.toArray();
  } catch (error) {
    console.error(`Error querying documents from ${collectionName}:`, error);
    throw error;
  }
};

export const createMongoDocument = async (collectionName, data) => {
  try {
    const db = getMongoDB();
    const result = await db.collection(collectionName).insertOne({
      ...data,
      created_at: new Date()
    });
    return result;
  } catch (error) {
    console.error(`Error creating document in ${collectionName}:`, error);
    throw error;
  }
};

export const updateMongoDocument = async (collectionName, filter, updateData) => {
  try {
    const db = getMongoDB();
    const result = await db.collection(collectionName).findOneAndUpdate(
      filter,
      { $set: { ...updateData, updated_at: new Date() } },
      { returnDocument: 'after' }
    );
    return result;
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    throw error;
  }
};

export const deleteMongoDocument = async (collectionName, filter) => {
  try {
    const db = getMongoDB();
    return await db.collection(collectionName).deleteOne(filter);
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    throw error;
  }
};

// ===================== MYSQL OPERATIONS =====================

// Execute raw SQL query
export const executeMySQLQuery = async (sql, values = []) => {
  const pool = await getMySQLPool();
  const connection = await pool.getConnection();

  try {
    const [results] = await connection.execute(sql, values);
    return results;
  } catch (error) {
    console.error('Error executing MySQL query:', error);
    throw error;
  } finally {
    connection.release();
  }
};

// Get single row from MySQL
export const getMySQLRow = async (table, filter = {}) => {
  let sql = `SELECT * FROM ${table}`;
  const values = [];
  const whereConditions = [];

  Object.keys(filter).forEach((key) => {
    whereConditions.push(`${key} = ?`);
    values.push(filter[key]);
  });

  if (whereConditions.length > 0) {
    sql += ` WHERE ${whereConditions.join(' AND')}`;
  }

  sql += ' LIMIT 1';
  const results = await executeMySQLQuery(sql, values);
  return results.length > 0 ? results[0] : null;
};

// Get multiple rows from MySQL
export const getMySQLRows = async (table, filter = {}, options = {}) => {
  let sql = `SELECT * FROM ${table}`;
  const values = [];
  const whereConditions = [];

  Object.keys(filter).forEach((key) => {
    whereConditions.push(`${key} = ?`);
    values.push(filter[key]);
  });

  if (whereConditions.length > 0) {
    sql += ` WHERE ${whereConditions.join(' AND')}`;
  }

  if (options.orderBy) {
    sql += ` ORDER BY ${options.orderBy}`;
  }

  if (options.limit) {
    sql += ` LIMIT ${options.limit}`;
  }

  if (options.offset) {
    sql += ` OFFSET ${options.offset}`;
  }

  return await executeMySQLQuery(sql, values);
};

// Insert into MySQL
export const insertMySQLRow = async (table, data) => {
  const columns = Object.keys(data);
  const values = Object.values(data);
  const placeholders = columns.map(() => '?').join(', ');

  const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
  return await executeMySQLQuery(sql, values);
};

// Update MySQL row
export const updateMySQLRow = async (table, data, filter) => {
  const setColumns = Object.keys(data).map((key) => `${key} = ?`);
  const setValues = Object.values(data);

  const whereConditions = Object.keys(filter).map((key) => `${key} = ?`);
  const whereValues = Object.values(filter);

  const sql = `UPDATE ${table} SET ${setColumns.join(', ')} WHERE ${whereConditions.join(' AND')}`;
  const allValues = [...setValues, ...whereValues];

  return await executeMySQLQuery(sql, allValues);
};

// Delete MySQL row
export const deleteMySQLRow = async (table, filter) => {
  const whereConditions = Object.keys(filter).map((key) => `${key} = ?`);
  const whereValues = Object.values(filter);

  const sql = `DELETE FROM ${table} WHERE ${whereConditions.join(' AND')}`;
  return await executeMySQLQuery(sql, whereValues);
};

// ===================== OPENFOODFACTS API =====================

// Search for food product by name
export const searchFoodProduct = async (productName) => {
  try {
    const response = await axios.get(`${OPENFOODFACTS_BASE_URL}/cgi/search.pl`, {
      params: {
        search_terms: productName,
        action: 'process',
        format: 'json',
        page_size: 20,
      },
      timeout: 5000,
    });

    return response.data;
  } catch (error) {
    console.error('Error searching food product:', error);
    throw error;
  }
};

// Get product by barcode
export const getProductByBarcode = async (barcode) => {
  try {
    const response = await axios.get(
      `${OPENFOODFACTS_BASE_URL}/product/${barcode}.json`,
      {
        timeout: 5000,
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error fetching product by barcode:', error);
    throw error;
  }
};


export const searchFoodProductsAdvanced = async (filters) => {
  try {
    const queryParams = {
      format: 'json',
      page_size: filters.pageSize || 20,
      page: filters.page || 1,
      ...(filters.searchTerm     && { search_terms:      filters.searchTerm }),
      ...(filters.brand          && { brands:            filters.brand }),
      ...(filters.category       && { categories:        filters.category }),
      ...(filters.country        && { countries:         filters.country }),
      ...(filters.nutriscoreGrade && { nutrition_grades: filters.nutriscoreGrade }),
    };
    const response = await axios.get(
      `${OPENFOODFACTS_BASE_URL}/cgi/search.pl`,
      { params: queryParams, timeout: 5000 }
    );
    return response.data;
  } catch (error) {
    console.error('Error searching products with advanced filters:', error);
    throw error;
  }
};

// Extract nutrition information from product
export const getNutritionInfo = async (barcode) => {
  try {
    const productData = await getProductByBarcode(barcode);

    if (!productData.product) {
      throw new Error('Product not found');
    }

    const nutrition = {
      barcode,
      productName: productData.product.product_name,
      brands: productData.product.brands,
      category: productData.product.categories,
      nutriScore: productData.product.nutriscore_grade,
      energy: productData.product.nutriments?.energy_100g,
      fat: productData.product.nutriments?.fat_100g,
      saturatedFat: productData.product.nutriments?.saturated_fat_100g,
      carbohydrates: productData.product.nutriments?.carbohydrates_100g,
      sugars: productData.product.nutriments?.sugars_100g,
      fiber: productData.product.nutriments?.fiber_100g,
      protein: productData.product.nutriments?.protein_100g,
      salt: productData.product.nutriments?.salt_100g,
      sodium: productData.product.nutriments?.sodium_100g,
    };

    return nutrition;
  } catch (error) {
    console.error('Error extracting nutrition info:', error);
    throw error;
  }
};

// ===================== HELPER FUNCTIONS =====================

// Initialize all database connections
export const initializeDatabases = async () => {
  try {
    await connectMongoDB();
    await connectMySQL();
    console.log('All databases initialized successfully');
  } catch (error) {
    console.error('Error initializing databases:', error);
    throw error;
  }
};

// Close all connections
export const closeAllConnections = async () => {
  try {
    await closeMongoDB();
    await closeMySQL();
    console.log('All connections closed');
  } catch (error) {
    console.error('Error closing connections:', error);
    throw error;
  }
};

export default {
  connectMongoDB,
  getMongoDB,
  closeMongoDB,
  getMySQLPool,
  connectMySQL,
  closeMySQL,
  getMongoDocument,
  getMongoDocuments,
  createMongoDocument,
  updateMongoDocument,
  deleteMongoDocument,
  executeMySQLQuery,
  getMySQLRow,
  getMySQLRows,
  insertMySQLRow,
  updateMySQLRow,
  deleteMySQLRow,
  searchFoodProduct,
  getProductByBarcode,
  searchFoodProductsAdvanced,
  getNutritionInfo,
  initializeDatabases,
  closeAllConnections,
};
