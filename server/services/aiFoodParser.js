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

The user will describe what they ate.

Identify every food, its quantity, unit, and estimate nutrition
for the TOTAL quantity eaten.

You MUST provide nutrition for EVERY food.

For every food calculate:

- calories
- protein
- carbs
- fat
- fiber

Use reasonable typical nutritional estimates.

Important:
- Nutrition is an estimate, not an exact measurement.
- Calculate nutrition for the TOTAL amount eaten.
- Do not omit nutrition.
- Never return a food without nutrition.
- Do not return null nutrition.
- Do not return an empty nutrition object.
- Do not return nutrition per 100g when the user specified another amount.
- Consider preparation methods such as cooked, boiled, fried, grilled, etc.

Examples:

2 eggs:
approximately 150 calories,
13g protein,
1g carbs,
10g fat,
0g fiber.

200g cooked rice:
approximately 260 calories,
5g protein,
56g carbs,
1g fat,
1g fiber.

150g grilled chicken:
approximately 250 calories,
46g protein,
0g carbs,
6g fat,
0g fiber.

Supported units:

g
ml
piece
slice
cup
tbsp
tsp
oz

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