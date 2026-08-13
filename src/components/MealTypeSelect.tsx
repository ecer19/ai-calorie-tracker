"use client";

import { MEAL_TYPES, type MealType } from "@/lib/types";

const ICONS: Record<MealType, string> = {
  breakfast: "🍳",
  lunch: "🍱",
  dinner: "🍽",
  snack: "🍎",
};

export default function MealTypeSelect({
  value,
  onChange,
}: {
  value: MealType;
  onChange: (value: MealType) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium">Meal Type</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {MEAL_TYPES.map((mt) => (
          <button
            key={mt.value}
            type="button"
            onClick={() => onChange(mt.value)}
            className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
              value === mt.value
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-black/10 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
            }`}
          >
            <span className="mr-1">{ICONS[mt.value]}</span>
            {mt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
