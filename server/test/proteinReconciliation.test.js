/**
 * proteinReconciliation.test.js
 *
 * Tests reconciliation between client seed foods and the server's protein whitelist.
 * Ensures that client seed definitions and server-side whitelist rules return
 * 100% consistent protein values without any conflicts.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const {
  PROTEIN_FOODS,
  findProteinFood,
  calculateWhitelistedProtein,
  normalizeFoodName,
  normalizeQuery,
  generateCacheKey,
} = require('../services/aiFoodParser');

// Exact copy of client COMMON_FOODS_SEED to ensure contract parity
const CLIENT_SEED_FOODS = {
  roti: {
    name: 'roti',
    defaultQty: 1,
    defaultUnit: 'piece',
    protein: 3.1,
  },
  rice: {
    name: 'cooked rice',
    defaultQty: 100,
    defaultUnit: 'g',
    protein: 2.7,
  },
  dal: {
    name: 'cooked dal',
    defaultQty: 1,
    defaultUnit: 'cup',
    protein: 11.0,
  },
  paneer: {
    name: 'paneer',
    defaultQty: 100,
    defaultUnit: 'g',
    protein: 18.0,
  },
  egg: {
    name: 'whole egg',
    defaultQty: 1,
    defaultUnit: 'piece',
    protein: 6.5,
  },
  idli: {
    name: 'idli',
    defaultQty: 1,
    defaultUnit: 'piece',
    protein: 2.0,
  },
  dosa: {
    name: 'plain dosa',
    defaultQty: 1,
    defaultUnit: 'piece',
    protein: 3.2,
  },
  banana: {
    name: 'banana',
    defaultQty: 1,
    defaultUnit: 'piece',
    protein: 0,
  },
  curd: {
    name: 'curd',
    defaultQty: 100,
    defaultUnit: 'g',
    protein: 4.0,
  },
  milk: {
    name: 'milk',
    defaultQty: 1,
    defaultUnit: 'cup',
    protein: 7.9,
  },
  oats: {
    name: 'oats',
    defaultQty: 50,
    defaultUnit: 'g',
    protein: 6.5,
  },
};

describe('Protein Whitelist & Client Seed Reconciliation', () => {
  it('reconciles 1 whole egg protein exactly (6.5g)', () => {
    const res = calculateWhitelistedProtein('whole egg', 1, 'piece');
    assert.strictEqual(res.supported, true);
    assert.strictEqual(res.proteinG, CLIENT_SEED_FOODS.egg.protein);
    assert.strictEqual(res.proteinG, 6.5);
  });

  it('reconciles 2 whole eggs scaled protein (13.0g)', () => {
    const res = calculateWhitelistedProtein('2 boiled eggs', 2, 'piece');
    assert.strictEqual(res.supported, true);
    assert.strictEqual(res.proteinG, 13.0);
  });

  it('reconciles 100g paneer protein exactly (18.0g)', () => {
    const res = calculateWhitelistedProtein('paneer', 100, 'g');
    assert.strictEqual(res.supported, true);
    assert.strictEqual(res.proteinG, CLIENT_SEED_FOODS.paneer.protein);
    assert.strictEqual(res.proteinG, 18.0);
  });

  it('reconciles 100g curd protein exactly (4.0g)', () => {
    const res = calculateWhitelistedProtein('curd', 100, 'g');
    assert.strictEqual(res.supported, true);
    assert.strictEqual(res.proteinG, CLIENT_SEED_FOODS.curd.protein);
    assert.strictEqual(res.proteinG, 4.0);
  });

  it('reconciles 100g cooked rice protein (2.7g) without confusing with raw rice (7g)', () => {
    const res = calculateWhitelistedProtein('cooked rice', 100, 'g');
    assert.strictEqual(res.supported, true);
    assert.strictEqual(res.proteinG, CLIENT_SEED_FOODS.rice.protein);
    assert.strictEqual(res.proteinG, 2.7);
  });

  it('reconciles 1 cup cooked dal protein (11.0g)', () => {
    const res = calculateWhitelistedProtein('yellow dal', 1, 'cup');
    assert.strictEqual(res.supported, true);
    assert.strictEqual(Number(res.proteinG.toFixed(1)), CLIENT_SEED_FOODS.dal.protein);
    assert.strictEqual(Number(res.proteinG.toFixed(1)), 11.0);
  });

  it('reconciles 1 roti protein (3.1g)', () => {
    const res = calculateWhitelistedProtein('roti', 1, 'piece');
    assert.strictEqual(res.supported, true);
    assert.strictEqual(Number(res.proteinG.toFixed(1)), CLIENT_SEED_FOODS.roti.protein);
    assert.strictEqual(Number(res.proteinG.toFixed(1)), 3.1);
  });

  it('reconciles 1 idli (2.0g) and 1 dosa (3.2g) protein', () => {
    const idli = calculateWhitelistedProtein('idli', 1, 'piece');
    assert.strictEqual(idli.supported, true);
    assert.strictEqual(Number(idli.proteinG.toFixed(1)), CLIENT_SEED_FOODS.idli.protein);

    const dosa = calculateWhitelistedProtein('plain dosa', 1, 'piece');
    assert.strictEqual(dosa.supported, true);
    assert.strictEqual(Number(dosa.proteinG.toFixed(1)), CLIENT_SEED_FOODS.dosa.protein);
  });

  it('reconciles 1 cup milk (7.9g) and 50g rolled oats (6.5g)', () => {
    const milk = calculateWhitelistedProtein('toned milk', 1, 'cup');
    assert.strictEqual(milk.supported, true);
    assert.strictEqual(Number(milk.proteinG.toFixed(1)), CLIENT_SEED_FOODS.milk.protein);

    const oats = calculateWhitelistedProtein('rolled oats', 50, 'g');
    assert.strictEqual(oats.supported, true);
    assert.strictEqual(Number(oats.proteinG.toFixed(1)), CLIENT_SEED_FOODS.oats.protein);
  });

  it('verifies non-whitelisted items (e.g. banana, apple) return 0g protein with supported=false', () => {
    const banana = calculateWhitelistedProtein('banana', 1, 'piece');
    assert.strictEqual(banana.supported, false);
    assert.strictEqual(banana.proteinG, CLIENT_SEED_FOODS.banana.protein);
    assert.strictEqual(banana.proteinG, 0);

    const apple = calculateWhitelistedProtein('apple', 1, 'piece');
    assert.strictEqual(apple.supported, false);
    assert.strictEqual(apple.proteinG, 0);
  });

  it('verifies cache key generation is deterministic and normalized', () => {
    const key1 = generateCacheKey('2 eggs, 100g paneer');
    const key2 = generateCacheKey('2 eggs, 100g paneer');
    const key3 = generateCacheKey('3 eggs');

    assert.strictEqual(key1, key2);
    assert.notStrictEqual(key1, key3);
    assert.strictEqual(typeof key1, 'string');
    assert.strictEqual(key1.length, 64); // SHA-256 hex length
  });
});
