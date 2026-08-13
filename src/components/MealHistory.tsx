"use client";

import { formatDateTime } from "@/lib/date";
import { MEAL_TYPES, type Meal } from "@/lib/types";

const LABELS = Object.fromEntries(MEAL_TYPES.map((m) => [m.value, m.label]));

export default function MealHistory({ meals }: { meals: Meal[] }) {
  return (
    <div className="rounded-xl border border-black/10 p-4 dark:border-white/10">
      <h3 className="mb-3 font-semibold">Meal History</h3>

      {meals.length === 0 ? (
        <p className="text-sm text-neutral-500">Henüz kaydedilmiş öğün yok.</p>
      ) : (
        <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
          {meals.map((meal) => (
            <div key={meal.id} className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={meal.image_url}
                alt={meal.meal_type}
                className="h-14 w-14 shrink-0 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {LABELS[meal.meal_type] ?? meal.meal_type}
                </p>
                <p className="text-xs text-neutral-500">{formatDateTime(meal.created_at)}</p>
                <p className="text-xs text-neutral-500">
                  P {Math.round(meal.protein)}g · C {Math.round(meal.carbs)}g · F{" "}
                  {Math.round(meal.fat)}g
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold">
                {Math.round(meal.total_calories)} kcal
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
