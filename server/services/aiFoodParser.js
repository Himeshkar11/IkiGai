const OpenAI = require("openai");

const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

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
- Do NOT search for or match foods against an application database.
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
    const protein = Number(nutrition.protein);
    const carbs = Number(nutrition.carbs);
    const fat = Number(nutrition.fat);
    const fiber = Number(nutrition.fiber);

    const nutritionValues = [
      calories,
      protein,
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

    // IMPORTANT:
    // Return nutrition instead of throwing it away.
    return {
      name,
      quantity,
      unit,
      nutrition: {
        calories,
        protein,
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