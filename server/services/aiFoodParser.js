const OpenAI = require("openai");

const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

const PROTEIN_FOODS = [
  { name: "soy chunks", aliases: ["soy chunks", "soya chunks", "meal maker", "soy nuggets"], proteinPer100g: 52 },
  { name: "soya beans", aliases: ["soya beans", "soybeans", "dry soybeans"], proteinPer100g: 36 },
  { name: "urad dal", aliases: ["urad dal", "urad", "black gram", "split urad"], proteinPer100g: 25 },
  { name: "masoor dal", aliases: ["masoor dal", "masoor", "red lentils"], proteinPer100g: 25 },
  { name: "moong dal", aliases: ["moong dal", "moong", "mung", "mung dal", "green gram"], proteinPer100g: 24 },
  { name: "chana dal", aliases: ["chana dal", "bengal gram dal", "split bengal gram", "split chickpeas"], proteinPer100g: 22 },
  { name: "whole black chana", aliases: ["whole black chana", "black chana", "kala chana", "black chickpeas"], proteinPer100g: 21 },
  { name: "kabuli chana", aliases: ["kabuli chana", "chole", "chickpeas", "white chickpeas", "chole masala", "chana masala"], proteinPer100g: 19 },
  { name: "lobia", aliases: ["lobia", "black-eyed peas", "black eyed peas", "cowpeas"], proteinPer100g: 23 },
  { name: "rajma", aliases: ["rajma", "kidney beans", "rajma masala"], proteinPer100g: 23 },
  { name: "moth beans", aliases: ["moth beans", "matki", "moth dal"], proteinPer100g: 23 },
  { name: "dry green peas", aliases: ["dry green peas", "dried peas", "dry matar"], proteinPer100g: 22 },
  { name: "sattu", aliases: ["sattu", "roasted gram flour", "roasted chana flour", "sattu drink", "sattu paratha"], proteinPer100g: 21 },
  { name: "besan", aliases: ["besan", "gram flour", "chickpea flour", "besan chilla"], proteinPer100g: 21 },
  { name: "peanuts", aliases: ["peanuts", "groundnuts", "moongfali"], proteinPer100g: 26 },
  { name: "roasted chana", aliases: ["roasted chana", "bhuna chana", "roasted bengal gram"], proteinPer100g: 21 },
  { name: "wheat", aliases: ["wheat", "atta", "whole wheat"], proteinPer100g: 12 },
  { name: "bajra", aliases: ["bajra", "pearl millet"], proteinPer100g: 12 },
  { name: "jowar", aliases: ["jowar", "sorghum"], proteinPer100g: 11 },
  { name: "oats", aliases: ["oats", "rolled oats"], proteinPer100g: 13 },
  { name: "ragi", aliases: ["ragi", "finger millet"], proteinPer100g: 8 },
  { name: "rice", aliases: ["rice", "white rice", "brown rice"], proteinPer100g: 7 },
  { name: "paneer", aliases: ["paneer", "cottage cheese", "indian cottage cheese", "paneer tikka", "paneer butter masala", "kadai paneer", "palak paneer", "shahi paneer", "chilli paneer", "matar paneer"], proteinPer100g: 18 },
  { name: "low-fat paneer", aliases: ["low-fat paneer", "low fat paneer", "low-fat cottage cheese"], proteinPer100g: 21 },
  { name: "greek yogurt", aliases: ["greek yogurt", "greek yoghurt", "hung curd"], proteinPer100g: 10 },
  { name: "curd", aliases: ["curd", "dahi", "yogurt", "yoghurt"], proteinPer100g: 4 },
  { name: "milk", aliases: ["milk", "cow milk", "toned milk", "full-fat milk"], proteinPer100g: 3.3 },
  { name: "skim milk", aliases: ["skim milk", "low-fat milk", "skimmed milk"], proteinPer100g: 3.4 },
  { name: "whole egg", aliases: ["whole egg", "whole eggs", "egg", "eggs", "chicken egg", "boiled egg", "half-boiled egg", "omelette", "masala omelette", "egg bhurji", "scrambled eggs", "egg curry", "egg sandwich", "egg dosa", "egg roll", "egg fried rice", "egg toast"], proteinPerEgg: 6.5 },
  { name: "egg white", aliases: ["egg white", "egg whites"], proteinPerEgg: 3.6 },
  { name: "egg yolk", aliases: ["egg yolk", "egg yolks"], proteinPerEgg: 2.7 },
];

const normalizeFoodName = (name) => String(name || "")
  .toLowerCase()
  .replace(/[‐‑‒–—]/g, "-")
  .replace(/[^a-z0-9\s-]/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const findProteinFood = (name) => {
  const normalized = normalizeFoodName(name);
  return PROTEIN_FOODS
    .flatMap((food) => food.aliases.map((alias) => ({ food, alias })))
    .filter(({ alias }) => {
      const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp(`(?:^|\\s)${escapedAlias}(?=$|\\s)`).test(normalized);
    })
    .sort((a, b) => b.alias.length - a.alias.length)[0]?.food;
};

const quantityInGrams = (quantity, unit) => {
  const conversions = { g: 1, ml: 1, cup: 240, tbsp: 15, tsp: 5, oz: 28.3495 };
  return conversions[unit] ? quantity * conversions[unit] : null;
};

const calculateWhitelistedProtein = (name, quantity, unit) => {
  const food = findProteinFood(name);

  if (!food) {
    return { supported: false, matchedFood: null, proteinG: 0 };
  }

  if (food.proteinPerEgg) {
    const grams = quantityInGrams(quantity, unit);
    const eggCount = unit === "piece" ? quantity : grams === null ? 0 : grams / 50;
    return {
      supported: true,
      matchedFood: food.name,
      proteinPerEgg: food.proteinPerEgg,
      proteinG: Number((eggCount * food.proteinPerEgg).toFixed(2)),
    };
  }

  const grams = quantityInGrams(quantity, unit);
  if (grams === null) {
    return { supported: true, matchedFood: food.name, proteinPer100g: food.proteinPer100g, proteinG: 0 };
  }

  return {
    supported: true,
    matchedFood: food.name,
    proteinPer100g: food.proteinPer100g,
    proteinG: Number((grams * food.proteinPer100g / 100).toFixed(2)),
  };
};

const resolveItemProtein = (item, name, quantity, unit, allowedUnits) => {
  const sourceIngredients = Array.isArray(item.ingredients) && item.ingredients.length
    ? item.ingredients
    : [{ name, quantity, unit }];

  const ingredients = sourceIngredients.map((ingredient) => {
    const ingredientName = String(ingredient?.name || "").trim();
    const ingredientQuantity = Number(ingredient?.quantity);
    const ingredientUnit = String(ingredient?.unit || "").trim().toLowerCase();

    if (!ingredientName || !Number.isFinite(ingredientQuantity) || ingredientQuantity <= 0 || !allowedUnits.includes(ingredientUnit)) {
      return null;
    }

    const result = calculateWhitelistedProtein(ingredientName, ingredientQuantity, ingredientUnit);
    return {
      food: ingredientName,
      matchedFood: result.matchedFood,
      quantity: ingredientQuantity,
      unit: ingredientUnit,
      proteinPer100g: result.proteinPer100g,
      proteinPerEgg: result.proteinPerEgg,
      proteinG: result.proteinG,
      protein_g: result.proteinG,
      supported: result.supported,
    };
  }).filter(Boolean);

  const proteinG = ingredients.reduce((total, ingredient) => total + ingredient.proteinG, 0);
  const supportedIngredients = ingredients.filter((ingredient) => ingredient.supported);
  const firstSupported = supportedIngredients.length === 1 ? supportedIngredients[0] : null;

  return {
    ingredients,
    supported: supportedIngredients.length > 0,
    matchedFood: firstSupported?.matchedFood || null,
    proteinPer100g: firstSupported?.proteinPer100g,
    proteinPerEgg: firstSupported?.proteinPerEgg,
    proteinG: Number(proteinG.toFixed(2)),
  };
};

const parseFoodText = async (text) => {
  if (!text || typeof text !== "string" || !text.trim()) {
    throw new Error("Food description is required");
  }

  const response = await openrouter.chat.completions.create({
    model: "openai/gpt-oss-20b",

    messages: [
      {
        role: "system",
        content: `
You are an AI food and nutrition estimation assistant.

The user will provide ONE natural-language string describing exactly what they ate.

IMPORTANT:
- Treat the user's entire string as the source of truth for what they ate.
- Identify EVERY food mentioned in the string.
- Identify the quantity and unit for EVERY food.
- Estimate nutrition for the TOTAL quantity actually eaten.
- Do NOT calculate nutrition only per 100g unless the user explicitly says they ate 100g.
- Identify the underlying approved protein ingredient for each food or dish.
- Protein is strictly whitelist-based: unsupported foods must have protein 0.
- Do NOT omit foods because they are uncommon or not in a database.
- If a food is recognizable, provide a reasonable typical nutritional estimate.
- Nutrition values are estimates and do not need to be exact.
- Consider preparation methods such as cooked, boiled, fried, grilled, roasted, raw, etc.
- Never return a food without nutrition values.

For EVERY food, provide:

- calories
- protein
- carbs
- fat
- fiber

For a dish containing multiple identifiable ingredients, also return an optional
ingredients array. Each ingredient must have name, quantity, and unit. Do not
invent protein values; the application applies its own whitelist.

All nutrition values must represent the TOTAL amount specified by the user.

Examples:

User:
"2 eggs"

Return approximately:
2 eggs:
150 calories,
13g protein,
1g carbs,
10g fat,
0g fiber.

User:
"200g cooked rice"

Return approximately:
200g cooked rice:
260 calories,
5g protein,
56g carbs,
1g fat,
1g fiber.

User:
"150g grilled chicken"

Return approximately:
150g grilled chicken:
250 calories,
46g protein,
0g carbs,
6g fat,
0g fiber.

User:
"I ate 2 eggs, 200g cooked rice and 150g grilled chicken"

You must identify all three foods and estimate nutrition for those exact quantities.

Supported units:

g
ml
piece
slice
cup
tbsp
tsp
oz

If the user does not provide a quantity, use a reasonable typical serving quantity and clearly represent that quantity in the response.

Return ONLY valid JSON.

The response MUST have exactly this structure:

{
  "items": [
    {
      "name": "eggs",
      "quantity": 2,
      "unit": "piece",
      "nutrition": {
        "calories": 150,
        "protein": 13,
        "carbs": 1,
        "fat": 10,
        "fiber": 0
      },
      "ingredients": [
        { "name": "egg", "quantity": 2, "unit": "piece" }
      }
    }
  ]
}
`,
      },
      {
        role: "user",
        content: text.trim(),
      },
    ],

    response_format: {
      type: "json_object",
    },
  });

  const content = response.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("AI returned an empty response");
  }

  let parsed;

  try {
    parsed = JSON.parse(content);
  } catch (error) {
    throw new Error("AI returned invalid JSON");
  }

  if (!parsed || !Array.isArray(parsed.items)) {
    throw new Error("AI response does not contain a valid items array");
  }

  const allowedUnits = [
    "g",
    "ml",
    "piece",
    "slice",
    "cup",
    "tbsp",
    "tsp",
    "oz",
  ];

  const items = parsed.items.map((item) => {
    if (!item || typeof item !== "object") {
      throw new Error("Invalid food item returned by AI");
    }

    const name = String(item.name || "").trim();

    const quantity = Number(item.quantity);

    const unit = String(item.unit || "")
      .trim()
      .toLowerCase();

    if (!name) {
      throw new Error("AI returned a food without a name");
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error(`Invalid quantity for ${name}`);
    }

    if (!allowedUnits.includes(unit)) {
      throw new Error(`Invalid unit for ${name}: ${unit}`);
    }

    // -----------------------------
    // Nutrition validation
    // -----------------------------

    const nutrition = item.nutrition;

    if (!nutrition || typeof nutrition !== "object") {
      throw new Error(`Missing nutrition for ${name}`);
    }

    const calories = Number(nutrition.calories);
    const carbs = Number(nutrition.carbs);
    const fat = Number(nutrition.fat);
    const fiber = Number(nutrition.fiber);

    const nutritionValues = [
      calories,
      carbs,
      fat,
      fiber,
    ];

    if (
      nutritionValues.some(
        (value) => !Number.isFinite(value) || value < 0
      )
    ) {
      throw new Error(`Invalid nutrition values for ${name}`);
    }

    const proteinResult = resolveItemProtein(item, name, quantity, unit, allowedUnits);

    return {
      name,
      quantity,
      unit,
      matchedFood: proteinResult.matchedFood,
      supported: proteinResult.supported,
      proteinPer100g: proteinResult.proteinPer100g,
      proteinPerEgg: proteinResult.proteinPerEgg,
      protein_g: proteinResult.proteinG,
      ingredients: proteinResult.ingredients,
      nutrition: {
        calories,
        protein: proteinResult.proteinG,
        carbs,
        fat,
        fiber,
      },
    };
  });

  return items;
};

module.exports = {
  parseFoodText,
};