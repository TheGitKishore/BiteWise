import axios from 'axios';
import { connectDB, getDB } from '../db_mongodb/db.js';
import db from '../db_sql/db.js';

// ===================== CONFIGURATION =====================
const OPENFOODFACTS_BASE_URL = 'https://world.openfoodfacts.org';

// ===================== MONGODB OPERATIONS =====================

export const getMongoDocument = async (collectionName, filter = {}) => {
  try {
    const db = await getDB();
    return await db.collection(collectionName).findOne(filter);
  } catch (error) {
    console.error(`Error fetching document from ${collectionName}:`, error);
    throw error;
  }
};

export const getMongoDocuments = async (collectionName, filter = {}, options = {}) => {
  try {
    const db = await getDB();
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

// ===================== FOOD SEARCH IN MONGO =====================

export const searchMongoFoodProducts = async (productName) => {
  try {
    const db = await getDB();

    return await db.collection('foodItems').find({
      name: { $regex: productName, $options: 'i' }
    }).toArray();

  } catch (error) {
    console.error('Mongo food search error:', error);
    return [];
  }
};

export const createMongoDocument = async (collectionName, data) => {
  try {
    const db = await getDB();
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
    const db = await getDB();
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
    const db = await getDB();
    return await db.collection(collectionName).deleteOne(filter);
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    throw error;
  }
};

// ===================== MYSQL OPERATIONS =====================

// Execute raw SQL query
export const executeMySQLQuery = async (sql, values = []) => {
  try {
    const [results] = await db.execute(sql, values);
    return results;
  } catch (error) {
    console.error('Error executing MySQL query:', error);
    throw error;
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

// ===================== OPENFOODFACTS MAPPER =====================

export const mapProduct = (p) => {
  if (!p) return null;

  return {
    barcode: p.code || null,
    name: p.product_name || p.generic_name || "Unknown product",
    brand: p.brands || "Unknown brand",
    image: p.image_front_url || null,

    nutrition: {
      energy: p.nutriments?.energy_100g || null,
      protein: p.nutriments?.proteins_100g || null,
      fat: p.nutriments?.fat_100g || null,
      carbs: p.nutriments?.carbohydrates_100g || null,
      sugar: p.nutriments?.sugars_100g || null,
    },

    nutriscore: p.nutriscore_grade || null,
  };
};

// ===================== OPENFOODFACTS API =====================

// Search for food product by name
export const searchFoodProduct = async (productName) => {
  try {
    const response = await axios.get(`${OPENFOODFACTS_BASE_URL}/cgi/search.pl`, {
      params: {
        search_terms: productName,
        action: 'process',
        json: 1,
        page_size: 20,
      },
      headers: {
        'User-Agent': 'food-app/1.0',
      },
      timeout: 8000,
    });

    return response.data;

  } catch (error) {
    console.error('OFF ERROR STATUS:', error.response?.status);

    // Retry once for transient OpenFoodFacts failures.
    if (!error.response || [429, 500, 502, 503, 504].includes(error.response.status)) {
      console.log("Retrying OpenFoodFacts...");

      try {
        const retry = await axios.get(`${OPENFOODFACTS_BASE_URL}/cgi/search.pl`, {
          params: {
            search_terms: productName,
            action: 'process',
            json: 1,
            page_size: 20,
          },
          timeout: 8000,
        });

        return retry.data;
      } catch (retryErr) {
        console.error("Retry failed:", retryErr.message);
      }
    }

    return {
      products: [],
      apiError: true,
      status: error.response?.status || null,
      message: error.message || 'OpenFoodFacts search failed',
    };
  }
};

// Get product by barcode
export const getProductByBarcode = async (barcode) => {
  try {
    const response = await axios.get(
      `${OPENFOODFACTS_BASE_URL}/api/v0/product/${barcode}.json`,
      { timeout: 5000 }
    );

    const product = response.data.product;

    if (!product) {
      throw new Error('Barcode not found in OpenFoodFacts');
    }

return mapProduct(product);

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
      
    if (!productData) {
      throw new Error('Product not found');
    }
    
    const nutrition = {
      barcode,
      productName: productData.name,
      brands: productData.brand,
      energy: productData.nutrition?.energy,
      fat: productData.nutrition?.fat,
      protein: productData.nutrition?.protein,
    };
    
        return nutrition;
      } catch (error) {
        console.error('Error extracting nutrition info:', error);
        throw error;
      }
    };

// ===================== UNIFIED FOOD SEARCH =====================

export const searchFoodUnified = async (productName) => {
  try {
    const [mongoResults, offResults] = await Promise.all([
      searchMongoFoodProducts(productName),
      searchFoodProduct(productName),
    ]);

    // Map MongoDB results
    const dbMapped = mongoResults.map(item => ({
      source: 'database',
      barcode: item.barcode || null,
      name: item.name,
      brand: item.brand || null,
      image: item.image || null,
      nutrition: item.nutrition || null,
    }));

    // Map OpenFoodFacts results
    const offMapped = (offResults.products || [])
      .map(mapProduct)
      .filter(Boolean)
      .map(item => ({
        ...item,
        source: 'openfoodfacts'
      }));

    // Merge
    const merged = [...dbMapped, ...offMapped];

    return {
      query: productName,
      total: merged.length,
      results: merged,
    };

  } catch (error) {
    console.error('Unified search error:', error);
    return { query: productName, total: 0, results: [] };
  }
};

// ===================== HELPER FUNCTIONS =====================

// Initialize all database connections
export const initializeDatabases = async () => {
  try {
    await connectDB(); // MongoDB
    console.log('All databases initialized successfully');
  } catch (error) {
    console.error('Error initializing databases:', error);
    throw error;
  }
};

// Close all connections
export const closeAllConnections = async () => {
  try {
    await closeMySQL();
    console.log('All connections closed');
  } catch (error) {
    console.error('Error closing connections:', error);
    throw error;
  }
};

export default {
  connectDB,
  getDB,
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
