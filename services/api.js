import axios from 'axios';
import mongoose from 'mongoose';
import mysql from 'mysql2/promise';

// ===================== CONFIGURATION =====================
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bitewise'; // testing
const MYSQL_CONFIG = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'password',
  database: process.env.MYSQL_DB || 'bitewise',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};
const OPENFOODFACTS_BASE_URL = 'https://world.openfoodfacts.org/api/v0';

// ===================== MONGODB CONNECTION =====================
export const connectMongoDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      console.log('MongoDB already connected');
      return;
    }

    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
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

// Get document from MongoDB
export const getMongoDBDocument = async (model, filter = {}) => {
  try {
    await connectMongoDB();
    const document = await model.findOne(filter);
    return document;
  } catch (error) {
    console.error('Error fetching MongoDB document:', error);
    throw error;
  }
};

// Create document in MongoDB
export const createMongoDBDocument = async (model, data) => {
  try {
    await connectMongoDB();
    const newDocument = new model(data);
    const savedDocument = await newDocument.save();
    return savedDocument;
  } catch (error) {
    console.error('Error creating MongoDB document:', error);
    throw error;
  }
};

// Update document in MongoDB
export const updateMongoDBDocument = async (model, filter, updateData) => {
  try {
    await connectMongoDB();
    const updatedDocument = await model.findOneAndUpdate(filter, updateData, {
      new: true,
    });
    return updatedDocument;
  } catch (error) {
    console.error('Error updating MongoDB document:', error);
    throw error;
  }
};

// Delete document from MongoDB
export const deleteMongoDBDocument = async (model, filter) => {
  try {
    await connectMongoDB();
    const result = await model.deleteOne(filter);
    return result;
  } catch (error) {
    console.error('Error deleting MongoDB document:', error);
    throw error;
  }
};

// Query multiple documents from MongoDB
export const queryMongoDBDocuments = async (model, filter = {}, options = {}) => {
  try {
    await connectMongoDB();
    const query = model.find(filter);

    if (options.select) query.select(options.select);
    if (options.sort) query.sort(options.sort);
    if (options.limit) query.limit(options.limit);
    if (options.skip) query.skip(options.skip);

    const documents = await query.exec();
    return documents;
  } catch (error) {
    console.error('Error querying MongoDB documents:', error);
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

// Search products with filters (brand, category, etc.)
export const searchFoodProductsAdvanced = async (filters) => {
  try {
    const queryParams = {
      format: 'json',
      page_size: filters.pageSize || 20,
      page: filters.page || 1,
    };

    if (filters.searchTerm) {
      queryParams.search_terms = filters.searchTerm;
    }

    if (filters.brand) {
      queryParams.brands = filters.brand;
    }

    if (filters.category) {
      queryParams.categories = filters.category;
    }

    if (filters.country) {
      queryParams.countries = filters.country;
    }

    if (filters.nutriscoreGrade) {
      queryParams.nutrition_grades = filters.nutriscoreGrade;
    }

    const response = await axios.get(`${OPENFOODFACTS_BASE_URL}/cgi/search.pl`, {
      params: queryParams,
      timeout: 5000,
    });

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
    await mongoose.disconnect();
    await closeMySQL();
    console.log('All connections closed');
  } catch (error) {
    console.error('Error closing connections:', error);
    throw error;
  }
};

export default {
  connectMongoDB,
  getMySQLPool,
  connectMySQL,
  closeMySQL,
  getMongoDBDocument,
  createMongoDBDocument,
  updateMongoDBDocument,
  deleteMongoDBDocument,
  queryMongoDBDocuments,
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
