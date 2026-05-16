import axios from 'axios';
import API_CONFIG from './api_config.js';

const API_URL = `${API_CONFIG}/dine-out`;

let cachedRestaurants = [];

const asArray = (value) => (Array.isArray(value) ? value : []);

class DineOut {
  constructor({
    restaurantId = null,
    _id          = null,
    name         = '',
    cuisine      = '',
    priceRange   = '$$',
    rating       = 0,
    address      = '',
    emoji        = '🍽️',
    description  = '',
    menuItems    = [],
    matchingItems = [],
  } = {}) {
    this._id           = _id;
    this.restaurantId  = restaurantId || (_id ? String(_id) : null);
    this.name          = name;
    this.cuisine       = cuisine;
    this.priceRange    = priceRange;
    this.rating        = Number(rating || 0);
    this.address       = address;
    this.emoji         = emoji;
    this.description   = description;
    this.menuItems     = asArray(menuItems);
    this.matchingItems = asArray(matchingItems);
  }

  static _fromApi(data) {
    return new DineOut({
      ...data,
      restaurantId: data?.restaurantId || (data?._id ? String(data._id) : null),
      _id: data?._id,
      menuItems: asArray(data?.menuItems),
      matchingItems: asArray(data?.matchingItems),
    });
  }

  static _cache(restaurants) {
    cachedRestaurants = asArray(restaurants);
  }

  // UC T6 - Fetch all restaurants from MongoDB.
  // @return {Promise<{ success, data: DineOut[], message }>}
  static async fetchAll() {
    try {
      const res = await axios.get(API_URL);
      const data = asArray(res.data?.data).map((r) => DineOut._fromApi(r));

      DineOut._cache(data);

      return {
        success: Boolean(res.data?.success),
        data,
        message: res.data?.message || '',
      };
    } catch (err) {
      return {
        success: false,
        data: [],
        message: err.response?.data?.message || 'Unable to load dine out options. Please try again.',
      };
    }
  }

  // UC T6 - Fetch restaurants with menu items fitting the user's remaining calories.
  // @param  {number} remainingCalories
  // @return {Promise<{ success, data: Array<DineOut & { matchingItems }>, message }>}
  static async fetchMatchingRestaurants(remainingCalories) {
    try {
      const res = await axios.get(`${API_URL}/matching`, {
        params: { remainingCalories },
      });
      const data = asArray(res.data?.data).map((r) => DineOut._fromApi(r));

      DineOut._cache(data);

      return {
        success: Boolean(res.data?.success),
        data,
        message: res.data?.message || '',
      };
    } catch (err) {
      return {
        success: false,
        data: [],
        message: err.response?.data?.message || 'Unable to load dine out options. Please try again.',
      };
    }
  }

  // Kept synchronous because the current controller/boundary call this during render.
  // The cache is filled by fetchAll() / fetchMatchingRestaurants().
  static getCuisines() {
    const unique = [
      ...new Set(
        cachedRestaurants
          .map((r) => r.cuisine)
          .filter((c) => String(c || '').trim().length > 0)
      ),
    ];
    return ['All', ...unique];
  }

  static filterByCuisine(restaurants, cuisine) {
    const list = asArray(restaurants);
    if (!cuisine || cuisine === 'All') return list;
    return list.filter((r) => r.cuisine === cuisine);
  }

  static search(restaurants, query) {
    const list = asArray(restaurants);
    if (!query || query.trim() === '') return list;

    const q = query.trim().toLowerCase();
    return list.filter((r) =>
      String(r.name || '').toLowerCase().includes(q) ||
      String(r.cuisine || '').toLowerCase().includes(q) ||
      asArray(r.matchingItems || r.menuItems).some((item) =>
        String(item.name || '').toLowerCase().includes(q) ||
        asArray(item.tags).some((t) => String(t || '').toLowerCase().includes(q))
      )
    );
  }
}

export default DineOut;
