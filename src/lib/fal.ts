import type { AnalysisResult, FoodItem, MealType } from "@/lib/types";

const FAL_VISION_ENDPOINT = process.env.FAL_VISION_ENDPOINT || "openrouter/router/vision";
const FAL_VISION_MODEL = process.env.FAL_VISION_MODEL || "openai/gpt-5.6-sol-pro";

const SYSTEM_PROMPT = `You are a nutrition estimation assistant inside a calorie tracking app.
Analyze the uploaded meal image. Identify every visible food item and estimate its portion size.

Return:
- food name
- estimated quantity
- estimated calories
- protein
- carbohydrates
- fat
- total nutrition values
- a health score from 1 to 10
- a short explanation

Return only valid JSON, matching exactly this shape and nothing else (no markdown, no code fences):
{
  "foods": [
    { "name": string, "quantity": string, "calories": number, "protein": number, "carbs": number, "fat": number }
  ],
  "totalCalories": number,
  "totalProtein": number,
  "totalCarbs": number,
  "totalFat": number,
  "healthScore": number,
  "summary": string
}

Be clear that every value is an estimate based on the visible image.
Do not claim medical certainty.
You cannot know for certain about hidden oil, sauce, sugar or ingredients that are not visible on the plate — account for that uncertainty in your estimate rather than refusing to answer.`;

function buildUserPrompt(mealType: MealType) {
  return `This photo was tagged by the user as a "${mealType}" meal. Estimate the nutrition content of everything visible in the image.`;
}

function extractJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    // fall through to brace extraction below
  }
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    return JSON.parse(match[0]);
  }
  throw new Error("AI yanıtından geçerli JSON çıkarılamadı.");
}

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeResult(raw: unknown): AnalysisResult {
  const obj = (raw ?? {}) as Record<string, unknown>;
  const rawFoods = Array.isArray(obj.foods) ? obj.foods : [];

  const foods: FoodItem[] = rawFoods.map((f) => {
    const food = (f ?? {}) as Record<string, unknown>;
    return {
      name: String(food.name ?? "Unknown food"),
      quantity: String(food.quantity ?? ""),
      calories: toNumber(food.calories),
      protein: toNumber(food.protein),
      carbs: toNumber(food.carbs),
      fat: toNumber(food.fat),
    };
  });

  const fallbackTotals = foods.reduce(
    (acc, f) => ({
      calories: acc.calories + f.calories,
      protein: acc.protein + f.protein,
      carbs: acc.carbs + f.carbs,
      fat: acc.fat + f.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return {
    foods,
    totalCalories: toNumber(obj.totalCalories, fallbackTotals.calories),
    totalProtein: toNumber(obj.totalProtein, fallbackTotals.protein),
    totalCarbs: toNumber(obj.totalCarbs, fallbackTotals.carbs),
    totalFat: toNumber(obj.totalFat, fallbackTotals.fat),
    healthScore: Math.max(1, Math.min(10, toNumber(obj.healthScore, 5))),
    summary: String(obj.summary ?? ""),
  };
}

export async function analyzeMealImage(
  imageUrl: string,
  mealType: MealType
): Promise<AnalysisResult> {
  const falKey = process.env.FAL_KEY;
  if (!falKey) {
    throw new Error("FAL_KEY tanımlı değil. Sunucu .env dosyasını kontrol edin.");
  }

  const response = await fetch(`https://fal.run/${FAL_VISION_ENDPOINT}`, {
    method: "POST",
    headers: {
      Authorization: `Key ${falKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: FAL_VISION_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: buildUserPrompt(mealType) },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(
      `Vision modeli isteği başarısız oldu (${response.status}): ${errText.slice(0, 300)}`
    );
  }

  const data = await response.json();

  const content =
    data?.choices?.[0]?.message?.content ??
    data?.output?.choices?.[0]?.message?.content ??
    data?.output ??
    data;

  const parsed = typeof content === "string" ? extractJson(content) : content;
  return normalizeResult(parsed);
}
