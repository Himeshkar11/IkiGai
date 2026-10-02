import api from './api.js';

const PROMPT_VERSION = 'v1.0';
const MODEL_NAME = 'openai/gpt-oss-20b';
const CACHE_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 days in milliseconds
const MAX_LRU_ENTRIES = 2000;

// Local Indian staples & common foods seed (per standard serving/unit)
export const COMMON_FOODS_SEED = {
  roti: {
    name: 'roti',
    defaultQty: 1,
    defaultUnit: 'piece',
    nutritionPerUnit: {
      calories: 104,
      protein: 3.1,
      carbs: 22,
      fat: 0.5,
      fiber: 2.3,
    },
    aliases: ['roti', 'rotis', 'chapati', 'chapatis', 'phulka', 'phulkas', 'wheat roti'],
  },
  rice: {
    name: 'cooked rice',
    defaultQty: 100,
    defaultUnit: 'g',
    nutritionPerUnit: {
      calories: 130,
      protein: 2.7,
      carbs: 28,
      fat: 0.3,
      fiber: 0.4,
    },
    aliases: ['rice', 'cooked rice', 'white rice', 'boiled rice', 'steamed rice', 'chawal'],
  },
  dal: {
    name: 'yellow dal',
    defaultQty: 1,
    defaultUnit: 'cup',
    nutritionPerUnit: {
      calories: 180,
      protein: 11,
      carbs: 28,
      fat: 2.5,
      fiber: 6,
    },
    aliases: ['dal', 'daal', 'yellow dal', 'moong dal', 'toor dal', 'arhar dal', 'dal tadka'],
  },
  paneer: {
    name: 'paneer',
    defaultQty: 100,
    defaultUnit: 'g',
    nutritionPerUnit: {
      calories: 265,
      protein: 18,
      carbs: 3.5,
      fat: 20,
      fiber: 0,
    },
    aliases: ['paneer', 'cottage cheese', 'raw paneer'],
  },
  egg: {
    name: 'whole egg',
    defaultQty: 1,
    defaultUnit: 'piece',
    nutritionPerUnit: {
      calories: 74,
      protein: 6.5,
      carbs: 0.4,
      fat: 5,
      fiber: 0,
    },
    aliases: ['egg', 'eggs', 'whole egg', 'whole eggs', 'boiled egg', 'boiled eggs', 'ande'],
  },
  idli: {
    name: 'idli',
    defaultQty: 1,
    defaultUnit: 'piece',
    nutritionPerUnit: {
      calories: 58,
      protein: 2,
      carbs: 12,
      fat: 0.4,
      fiber: 0.8,
    },
    aliases: ['idli', 'idlis', 'steamed idli'],
  },
  dosa: {
    name: 'plain dosa',
    defaultQty: 1,
    defaultUnit: 'piece',
    nutritionPerUnit: {
      calories: 133,
      protein: 3.2,
      carbs: 22,
      fat: 3.7,
      fiber: 1.1,
    },
    aliases: ['dosa', 'dosas', 'plain dosa', 'sada dosa'],
  },
  banana: {
    name: 'banana',
    defaultQty: 1,
    defaultUnit: 'piece',
    nutritionPerUnit: {
      calories: 105,
      protein: 0,
      carbs: 27,
      fat: 0.3,
      fiber: 3.1,
    },
    aliases: ['banana', 'bananas', 'kela'],
  },
  curd: {
    name: 'curd (dahi)',
    defaultQty: 100,
    defaultUnit: 'g',
    nutritionPerUnit: {
      calories: 61,
      protein: 4,
      carbs: 4.7,
      fat: 3.3,
      fiber: 0,
    },
    aliases: ['curd', 'dahi', 'plain curd', 'plain yogurt', 'yogurt', 'yoghurt'],
  },
  milk: {
    name: 'toned milk',
    defaultQty: 1,
    defaultUnit: 'cup',
    nutritionPerUnit: {
      calories: 148,
      protein: 7.9,
      carbs: 11.5,
      fat: 7.9,
      fiber: 0,
    },
    aliases: ['milk', 'cow milk', 'toned milk', 'glass of milk', 'cup of milk', 'doodh'],
  },
  oats: {
    name: 'rolled oats',
    defaultQty: 50,
    defaultUnit: 'g',
    nutritionPerUnit: {
      calories: 195,
      protein: 6.5,
      carbs: 33,
      fat: 3.5,
      fiber: 5.3,
    },
    aliases: ['oats', 'oatmeal', 'rolled oats'],
  },
};

// Word to number lookup table
const WORD_NUMBERS = {
  a: 1,
  an: 1,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  half: 0.5,
  quarter: 0.25,
};

// Unit aliases to canonical unit
const CANONICAL_UNITS = {
  g: 'g',
  gram: 'g',
  grams: 'g',
  gm: 'g',
  gms: 'g',
  ml: 'ml',
  milliliter: 'ml',
  milliliters: 'ml',
  piece: 'piece',
  pieces: 'piece',
  pc: 'piece',
  pcs: 'piece',
  slice: 'slice',
  slices: 'slice',
  cup: 'cup',
  cups: 'cup',
  tbsp: 'tbsp',
  tablespoon: 'tbsp',
  tablespoons: 'tbsp',
  tbs: 'tbsp',
  tsp: 'tsp',
  teaspoon: 'tsp',
  teaspoons: 'tsp',
  oz: 'oz',
  ounce: 'oz',
  ounces: 'oz',
};

/**
 * Normalizes input text into a clean canonical query string.
 */
export const normalizeQuery = (text) => {
  if (!text || typeof text !== 'string') return '';

  let normalized = text
    .toLowerCase()
    .trim()
    // Replace non-alphanumeric except decimal dots and hyphens
    .replace(/[‐‑‒–—]/g, '-')
    .replace(/[^a-z0-9.\s-]/g, ' ')
    .replace(/\s+/g, ' ');

  // Split into words and convert quantity/unit variations
  const tokens = normalized.split(' ');
  const processedTokens = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    // Check number words
    if (WORD_NUMBERS[token] !== undefined) {
      processedTokens.push(String(WORD_NUMBERS[token]));
      continue;
    }

    // Check unit attached to number, e.g. "100g", "200ml"
    const numUnitMatch = token.match(/^(\d+(?:\.\d+)?)([a-z]+)$/);
    if (numUnitMatch) {
      const [, num, u] = numUnitMatch;
      const canonical = CANONICAL_UNITS[u] || u;
      processedTokens.push(num);
      processedTokens.push(canonical);
      continue;
    }

    // Check standalone unit
    if (CANONICAL_UNITS[token]) {
      processedTokens.push(CANONICAL_UNITS[token]);
      continue;
    }

    // Simple singularization for common food plurals (e.g. eggs, rotis, apples)
    if (token.length >= 4 && token.endsWith('s') && !token.endsWith('ss') && !token.endsWith('oats')) {
      const singular = token.slice(0, -1);
      processedTokens.push(singular);
      continue;
    }

    processedTokens.push(token);
  }

  return processedTokens.join(' ').trim();
};

/**
 * Parses simple single item expressions like:
 * "2 roti", "100 g paneer", "1 cup rice", "3 egg"
 */
export const parseSingleFoodExpression = (normalizedText) => {
  const tokens = normalizedText.split(' ');
  let quantity = 1;
  let unit = 'piece';
  let foodWords = [];

  let idx = 0;
  if (tokens.length > 0 && /^\d+(?:\.\d+)?$/.test(tokens[0])) {
    quantity = parseFloat(tokens[0]);
    idx++;
  }

  if (idx < tokens.length && CANONICAL_UNITS[tokens[idx]]) {
    unit = CANONICAL_UNITS[tokens[idx]];
    idx++;
  }

  foodWords = tokens.slice(idx);
  const foodName = foodWords.join(' ').trim();

  return { quantity, unit, foodName };
};

/**
 * Searches the local common foods seed.
 */
export const findCommonFoodSeed = (foodName, quantity, unit) => {
  if (!foodName) return null;

  for (const key of Object.keys(COMMON_FOODS_SEED)) {
    const seed = COMMON_FOODS_SEED[key];
    const matches = seed.aliases.some((alias) => {
      const cleanAlias = alias.toLowerCase().trim();
      return (
        foodName === cleanAlias ||
        foodName.startsWith(cleanAlias + ' ') ||
        foodName.endsWith(' ' + cleanAlias)
      );
    });

    if (matches) {
      // Scale nutrition proportionally
      const targetUnit = unit || seed.defaultUnit;
      const targetQty = quantity || seed.defaultQty;

      let scaleFactor = 1;
      if (targetUnit === seed.defaultUnit) {
        scaleFactor = targetQty / seed.defaultQty;
      } else if (seed.defaultUnit === 'g' && targetUnit === 'piece') {
        // Assume 1 piece ~ defaultQty if not specified
        scaleFactor = targetQty;
      } else {
        scaleFactor = targetQty / (seed.defaultQty || 1);
      }

      const scaledNutrition = {
        calories: Math.round(seed.nutritionPerUnit.calories * scaleFactor),
        protein: Number((seed.nutritionPerUnit.protein * scaleFactor).toFixed(1)),
        carbs: Number((seed.nutritionPerUnit.carbs * scaleFactor).toFixed(1)),
        fat: Number((seed.nutritionPerUnit.fat * scaleFactor).toFixed(1)),
        fiber: Number((seed.nutritionPerUnit.fiber * scaleFactor).toFixed(1)),
      };

      return {
        items: [
          {
            name: seed.name,
            quantity: targetQty,
            unit: targetUnit,
            nutrition: scaledNutrition,
            source: 'common_seed',
          },
        ],
        source: 'seed',
        isCached: true,
      };
    }
  }

  return null;
};

/**
 * Simple DJB2-style 32-bit hash for cache keys.
 */
export const hashCacheKey = (obj) => {
  const str = JSON.stringify(obj);
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
};

/**
 * Validates that an AI response has the correct nutritional schema and positive numbers.
 */
export const validateNutritionResponse = (data) => {
  if (!data || !Array.isArray(data.items) || data.items.length === 0) {
    return false;
  }

  for (const item of data.items) {
    if (!item.name || typeof item.name !== 'string') return false;
    if (typeof item.quantity !== 'number' || !Number.isFinite(item.quantity) || item.quantity <= 0) {
      return false;
    }

    const n = item.nutrition;
    if (!n || typeof n !== 'object') return false;

    const values = [n.calories, n.protein, n.carbs, n.fat, n.fiber];
    for (const v of values) {
      if (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > 10000) {
        return false;
      }
    }
  }

  return true;
};

// -------------------------------------------------------------
// Storage Layer: In-memory Map + IndexedDB Persistence
// -------------------------------------------------------------
class NutritionStorage {
  constructor() {
    this.memoryCache = new Map();
    this.dbPromise = null;
    this.initIndexedDB();
  }

  initIndexedDB() {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return;
    }

    this.dbPromise = new Promise((resolve) => {
      try {
        const req = window.indexedDB.open('ikigai_nutrition_db', 1);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains('food_cache')) {
            const store = db.createObjectStore('food_cache', { keyPath: 'key' });
            store.createIndex('last_used_at', 'last_used_at');
          }
        };
        req.onsuccess = (e) => resolve(e.target.result);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  async get(key) {
    // 1. Check in-memory layer
    if (this.memoryCache.has(key)) {
      const entry = this.memoryCache.get(key);
      if (Date.now() - entry.created_at < CACHE_TTL_MS) {
        entry.last_used_at = Date.now();
        entry.hit_count = (entry.hit_count || 0) + 1;
        return entry;
      } else {
        this.memoryCache.delete(key);
      }
    }

    // 2. Check IndexedDB
    if (!this.dbPromise) return null;
    try {
      const db = await this.dbPromise;
      if (!db) return null;

      return new Promise((resolve) => {
        const tx = db.transaction('food_cache', 'readonly');
        const store = tx.objectStore('food_cache');
        const req = store.get(key);
        req.onsuccess = () => {
          const result = req.result;
          if (result && Date.now() - result.created_at < CACHE_TTL_MS) {
            // Restore to memory
            result.last_used_at = Date.now();
            result.hit_count = (result.hit_count || 0) + 1;
            this.memoryCache.set(key, result);
            resolve(result);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  async set(key, value) {
    // Manage LRU size in memory
    if (this.memoryCache.size >= MAX_LRU_ENTRIES) {
      const oldestKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(oldestKey);
    }
    this.memoryCache.set(key, value);

    // Save to IndexedDB
    if (!this.dbPromise) return;
    try {
      const db = await this.dbPromise;
      if (!db) return;
      const tx = db.transaction('food_cache', 'readwrite');
      const store = tx.objectStore('food_cache');
      store.put(value);
    } catch {
      // ignore IndexedDB write errors
    }
  }

  async clear() {
    this.memoryCache.clear();
    if (!this.dbPromise) return;
    try {
      const db = await this.dbPromise;
      if (!db) return;
      const tx = db.transaction('food_cache', 'readwrite');
      const store = tx.objectStore('food_cache');
      store.clear();
    } catch {
      // ignore
    }
  }

  async findClosest(normalizedQuery) {
    // Search memory cache for fuzzy match
    for (const [_, entry] of this.memoryCache.entries()) {
      if (
        entry.normalized_query &&
        (normalizedQuery.includes(entry.normalized_query) ||
          entry.normalized_query.includes(normalizedQuery))
      ) {
        return entry;
      }
    }
    return null;
  }
}

// -------------------------------------------------------------
// NutritionService Main Class
// -------------------------------------------------------------
class NutritionService {
  constructor() {
    this.storage = new NutritionStorage();
    this.inFlightRequests = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      savedApiCalls: 0,
    };
  }

  getStats() {
    return { ...this.stats };
  }

  async clearCache() {
    await this.storage.clear();
    this.inFlightRequests.clear();
    console.info('[NutritionService] Cache cleared.');
  }

  /**
   * Main method to estimate nutrition for natural food text.
   * Options:
   *  - bypassCache: boolean (forces fresh API call)
   */
  async estimateNutrition(text, options = {}) {
    const rawText = String(text || '').trim();
    if (!rawText) {
      throw new Error('Food description is required');
    }

    const normalized = normalizeQuery(rawText);
    const { foodName, quantity, unit } = parseSingleFoodExpression(normalized);

    // 1. Check local Indian common foods seed first (unless bypassing cache)
    if (!options.bypassCache && foodName) {
      const seedMatch = findCommonFoodSeed(foodName, quantity, unit);
      if (seedMatch) {
        this.stats.hits++;
        this.stats.savedApiCalls++;
        console.debug(
          `[NutritionService] Cache HIT (Indian Staples Seed): "${foodName}" -> ${seedMatch.items[0].nutrition.calories} kcal`
        );
        return {
          ...seedMatch,
          source: 'seed',
          isCached: true,
          query: rawText,
        };
      }
    }

    // 2. Build cache key
    const cacheKey = hashCacheKey({
      query: normalized,
      promptVersion: PROMPT_VERSION,
      modelName: MODEL_NAME,
    });

    // 3. Check storage cache
    if (!options.bypassCache) {
      const cached = await this.storage.get(cacheKey);
      if (cached && validateNutritionResponse(cached.response)) {
        this.stats.hits++;
        this.stats.savedApiCalls++;
        console.debug(
          `[NutritionService] Cache HIT: "${normalized}" (key: ${cacheKey}, hits: ${cached.hit_count})`
        );
        return {
          ...cached.response,
          source: 'client-cache',
          isCached: true,
          cachedAt: cached.created_at,
          query: rawText,
        };
      }
    }

    // 4. In-flight request de-duplication: reuse active promise
    if (this.inFlightRequests.has(cacheKey)) {
      console.debug(`[NutritionService] Reusing in-flight request for: "${normalized}"`);
      return await this.inFlightRequests.get(cacheKey);
    }

    // 5. Cache miss: trigger API call with exponential backoff & fallback
    this.stats.misses++;
    console.debug(`[NutritionService] Cache MISS: Fetching from API for "${normalized}"`);

    const fetchPromise = this.fetchFromApiWithBackoff(rawText, normalized, cacheKey);
    this.inFlightRequests.set(cacheKey, fetchPromise);

    try {
      const result = await fetchPromise;
      return result;
    } finally {
      this.inFlightRequests.delete(cacheKey);
    }
  }

  /**
   * Calls API with exponential backoff and closest-match fallback.
   */
  async fetchFromApiWithBackoff(rawText, normalizedQuery, cacheKey) {
    const maxRetries = 2;
    const delays = [800, 1600];

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const res = await api.post(
          '/ai/food-parser',
          { text: rawText },
          { timeout: 35000 }
        );

        const data = res.data;
        if (!validateNutritionResponse(data)) {
          throw new Error('AI returned an invalid nutrition structure');
        }

        const source = data.source || 'ai';

        // Save valid response to client cache
        const cacheEntry = {
          key: cacheKey,
          normalized_query: normalizedQuery,
          response: data,
          created_at: Date.now(),
          last_used_at: Date.now(),
          hit_count: 1,
          prompt_version: PROMPT_VERSION,
        };
        await this.storage.set(cacheKey, cacheEntry);

        return {
          ...data,
          source,
          isCached: source === 'server-cache',
          query: rawText,
        };
      } catch (err) {
        console.warn(
          `[NutritionService] Attempt ${attempt + 1} failed: ${err.message}`
        );

        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, delays[attempt]));
        } else {
          // If all retries failed, attempt fallback to closest cached match
          const closest = await this.storage.findClosest(normalizedQuery);
          if (closest && validateNutritionResponse(closest.response)) {
            console.warn(
              `[NutritionService] Falling back to closest cached match: "${closest.normalized_query}"`
            );
            return {
              ...closest.response,
              source: 'fallback_cache',
              isCached: true,
              isFallback: true,
              fallbackNote: `Offline or server unavailable. Estimated from cached "${closest.normalized_query}".`,
              query: rawText,
            };
          }

          throw err;
        }
      }
    }
  }
}

const nutritionService = new NutritionService();
export default nutritionService;
