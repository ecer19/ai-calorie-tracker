import { analyzeMealImage } from "@/lib/fal";
import { createClient } from "@/lib/supabase/server";
import type { MealType } from "@/lib/types";
import { NextResponse } from "next/server";

const VALID_MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
  }

  let body: { imageUrl?: string; mealType?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  const { imageUrl, mealType } = body;

  if (!imageUrl || typeof imageUrl !== "string") {
    return NextResponse.json({ error: "Fotoğraf URL'si eksik." }, { status: 400 });
  }
  if (!mealType || !VALID_MEAL_TYPES.includes(mealType as MealType)) {
    return NextResponse.json({ error: "Geçerli bir öğün türü seçin." }, { status: 400 });
  }

  try {
    const result = await analyzeMealImage(imageUrl, mealType as MealType);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Meal analysis failed", error);
    const message = error instanceof Error ? error.message : "Analiz sırasında hata oluştu.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
