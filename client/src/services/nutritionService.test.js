import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import nutritionService, {
  normalizeQuery,
  parseSingleFoodExpression,
  findCommonFoodSeed,
  hashCacheKey,
  validateNutritionResponse,
} from './nutritionService.js';

describe('Nutrition AI Cache & Normalization', () => {
  beforeEach(async () => {
    await nutritionService.clearCache();
  });

  describe('1. Normalization', () => {
    it('normalizes lowercase, whitespace, and punctuation', () => {
      const q1 = normalizeQuery('  2   Rotis!  ');
      assert.equal(q1, '2 roti');
    });

    it('converts word numbers to digits', () => {
      const q1 = normalizeQuery('two rotis');
      assert.equal(q1, '2 roti');

      const q2 = normalizeQuery('one cup cooked rice');
      assert.equal(q2, '1 cup cooked rice');
    });

    it('normalizes attached units like 100g, 200ml', () => {
      const q1 = normalizeQuery('100g paneer');
      assert.equal(q1, '100 g paneer');

      const q2 = normalizeQuery('200ml milk');
      assert.equal(q2, '200 ml milk');
    });

    it('normalizes unit variations to canonical units', () => {
      const q1 = normalizeQuery('2 tablespoons peanut butter');
      assert.equal(q1, '2 tbsp peanut butter');

      const q2 = normalizeQuery('100 grams oats');
      assert.equal(q2, '100 g oats');
    });

    it('singularizes common food plurals', () => {
      const q1 = normalizeQuery('3 boiled eggs');
      assert.equal(q1, '3 boiled egg');

      const q2 = normalizeQuery('2 bananas');
      assert.equal(q2, '2 banana');
    });
  });

  describe('2. Common Indian Staples Seed & Local Scaling', () => {
    it('instantly matches 1 roti from local seed with accurate macros', async () => {
      const res = await nutritionService.estimateNutrition('1 roti');
      assert.equal(res.source, 'seed');
      assert.equal(res.isCached, true);
      assert.equal(res.items.length, 1);
      assert.equal(res.items[0].name, 'roti');
      assert.equal(res.items[0].nutrition.calories, 104);
      assert.equal(res.items[0].nutrition.protein, 3.1);
    });

    it('scales locally for multi-quantity food (e.g. 3 rotis = 3x macros)', async () => {
      const res = await nutritionService.estimateNutrition('3 rotis');
      assert.equal(res.source, 'seed');
      assert.equal(res.items[0].nutrition.calories, 312); // 104 * 3
      assert.equal(res.items[0].nutrition.protein, 9.3); // 3.1 * 3
    });

    it('matches Indian staples aliases like chapati, phulka, dahi, ande', async () => {
      const chapati = await nutritionService.estimateNutrition('2 chapatis');
      assert.equal(chapati.source, 'seed');
      assert.equal(chapati.items[0].nutrition.calories, 208);

      const egg = await nutritionService.estimateNutrition('2 boiled eggs');
      assert.equal(egg.source, 'seed');
      assert.equal(egg.items[0].nutrition.protein, 13);
    });
  });

  describe('3. Validation of AI Responses', () => {
    it('validates correct nutrition schema', () => {
      const valid = {
        items: [
          {
            name: 'avocado toast',
            quantity: 1,
            unit: 'slice',
            nutrition: {
              calories: 220,
              protein: 4,
              carbs: 22,
              fat: 13,
              fiber: 6,
            },
          },
        ],
      };
      assert.equal(validateNutritionResponse(valid), true);
    });

    it('rejects invalid or empty schemas', () => {
      assert.equal(validateNutritionResponse(null), false);
      assert.equal(validateNutritionResponse({ items: [] }), false);
      assert.equal(validateNutritionResponse({ items: [{ name: 'x' }] }), false);
      assert.equal(
        validateNutritionResponse({
          items: [
            {
              name: 'x',
              quantity: 1,
              nutrition: { calories: 'two hundred' },
            },
          ],
        }),
        false
      );
    });
  });

  describe('4. In-Flight Request De-duplication', () => {
    it('reuses in-flight promises for simultaneous identical queries', async () => {
      let callCount = 0;
      // Mock fetchFromApiWithBackoff
      const originalFetch = nutritionService.fetchFromApiWithBackoff;
      nutritionService.fetchFromApiWithBackoff = async (_raw, _norm, _key) => {
        callCount++;
        await new Promise((r) => setTimeout(r, 60));
        return {
          items: [
            {
              name: 'salmon bowl',
              quantity: 1,
              unit: 'bowl',
              nutrition: { calories: 450, protein: 35, carbs: 40, fat: 12, fiber: 4 },
            },
          ],
          source: 'ai',
          isCached: false,
        };
      };

      try {
        const [res1, res2, res3] = await Promise.all([
          nutritionService.estimateNutrition('salmon bowl', { bypassCache: true }),
          nutritionService.estimateNutrition('salmon bowl', { bypassCache: true }),
          nutritionService.estimateNutrition('salmon bowl', { bypassCache: true }),
        ]);

        assert.equal(callCount, 1, 'API should only be called once for simultaneous queries');
        assert.equal(res1.items[0].name, 'salmon bowl');
        assert.equal(res2.items[0].name, 'salmon bowl');
        assert.equal(res3.items[0].name, 'salmon bowl');
      } finally {
        nutritionService.fetchFromApiWithBackoff = originalFetch;
      }
    });
  });

  describe('5. Cache Hit / Miss and TTL Expiry', () => {
    it('caches response on first call and serves from cache on second call', async () => {
      let apiCalls = 0;
      const originalFetch = nutritionService.fetchFromApiWithBackoff;
      nutritionService.fetchFromApiWithBackoff = async (_raw, norm, key) => {
        apiCalls++;
        const data = {
          items: [
            {
              name: 'quinoa salad',
              quantity: 1,
              unit: 'bowl',
              nutrition: { calories: 320, protein: 9, carbs: 45, fat: 8, fiber: 6 },
            },
          ],
        };
        await nutritionService.storage.set(key, {
          key,
          normalized_query: norm,
          response: data,
          created_at: Date.now(),
          last_used_at: Date.now(),
          hit_count: 1,
          prompt_version: 'v1.0',
        });
        return { ...data, source: 'ai', isCached: false };
      };

      try {
        const first = await nutritionService.estimateNutrition('quinoa salad');
        assert.equal(first.isCached, false);
        assert.equal(apiCalls, 1);

        const second = await nutritionService.estimateNutrition('quinoa salad');
        assert.equal(second.isCached, true);
        assert.equal(second.source, 'client-cache');
        assert.equal(apiCalls, 1, 'Should NOT call API again on cache hit');
      } finally {
        nutritionService.fetchFromApiWithBackoff = originalFetch;
      }
    });

    it('bypasses cache when bypassCache option is true', async () => {
      let apiCalls = 0;
      const originalFetch = nutritionService.fetchFromApiWithBackoff;
      nutritionService.fetchFromApiWithBackoff = async () => {
        apiCalls++;
        return {
          items: [
            {
              name: 'apple pie',
              quantity: 1,
              unit: 'slice',
              nutrition: { calories: 290, protein: 2, carbs: 42, fat: 12, fiber: 2 },
            },
          ],
          source: 'api',
          isCached: false,
        };
      };

      try {
        await nutritionService.estimateNutrition('apple pie');
        assert.equal(apiCalls, 1);

        await nutritionService.estimateNutrition('apple pie', { bypassCache: true });
        assert.equal(apiCalls, 2, 'API should be called again when bypassCache is specified');
      } finally {
        nutritionService.fetchFromApiWithBackoff = originalFetch;
      }
    });

    it('expires cached entry when older than TTL', async () => {
      const key = hashCacheKey({
        query: 'protein smoothie',
        promptVersion: 'v1.0',
        modelName: 'openai/gpt-oss-20b',
      });

      // Insert entry with timestamp older than 90 days
      const expiredTime = Date.now() - (95 * 24 * 60 * 60 * 1000);
      await nutritionService.storage.set(key, {
        key,
        normalized_query: 'protein smoothie',
        response: {
          items: [
            {
              name: 'protein smoothie',
              quantity: 1,
              unit: 'cup',
              nutrition: { calories: 250, protein: 25, carbs: 20, fat: 4, fiber: 3 },
            },
          ],
        },
        created_at: expiredTime,
        last_used_at: expiredTime,
      });

      const retrieved = await nutritionService.storage.get(key);
      assert.equal(retrieved, null, 'Expired entry should return null');
    });
  });
});
