"use client";

import { emptyFoodItem, recalcTotals, type AnalysisResult, type FoodItem } from "@/lib/types";

function NumberField({
  value,
  onChange,
  className = "",
}: {
  value: number;
  onChange: (v: number) => void;
  className?: string;
}) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={`w-full rounded-md border border-black/10 bg-white px-2 py-1 text-sm outline-none focus:border-blue-500 dark:border-white/10 dark:bg-neutral-800 ${className}`}
    />
  );
}

export default function ResultsPanel({
  result,
  isEditing,
  onChange,
  onToggleEdit,
}: {
  result: AnalysisResult;
  isEditing: boolean;
  onChange: (result: AnalysisResult) => void;
  onToggleEdit: () => void;
}) {
  function updateFood(index: number, patch: Partial<FoodItem>) {
    const foods = result.foods.map((f, i) => (i === index ? { ...f, ...patch } : f));
    const totals = recalcTotals(foods);
    onChange({
      ...result,
      foods,
      totalCalories: totals.totalCalories,
      totalProtein: totals.totalProtein,
      totalCarbs: totals.totalCarbs,
      totalFat: totals.totalFat,
    });
  }

  function removeFood(index: number) {
    const foods = result.foods.filter((_, i) => i !== index);
    const totals = recalcTotals(foods);
    onChange({
      ...result,
      foods,
      totalCalories: totals.totalCalories,
      totalProtein: totals.totalProtein,
      totalCarbs: totals.totalCarbs,
      totalFat: totals.totalFat,
    });
  }

  function addFood() {
    onChange({ ...result, foods: [...result.foods, emptyFoodItem()] });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Detected foods</h3>
        <button
          onClick={onToggleEdit}
          className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
        >
          {isEditing ? "Done Editing" : "✎ Fix Results"}
        </button>
      </div>

      <div className="space-y-2">
        {result.foods.length === 0 && (
          <p className="text-sm text-neutral-500">Herhangi bir yiyecek tespit edilmedi.</p>
        )}

        {result.foods.map((food, i) =>
          isEditing ? (
            <div
              key={i}
              className="grid grid-cols-2 gap-2 rounded-lg border border-black/10 p-3 sm:grid-cols-6 dark:border-white/10"
            >
              <input
                value={food.name}
                onChange={(e) => updateFood(i, { name: e.target.value })}
                placeholder="Name"
                className="col-span-2 rounded-md border border-black/10 bg-white px-2 py-1 text-sm outline-none focus:border-blue-500 sm:col-span-2 dark:border-white/10 dark:bg-neutral-800"
              />
              <input
                value={food.quantity}
                onChange={(e) => updateFood(i, { quantity: e.target.value })}
                placeholder="Quantity"
                className="rounded-md border border-black/10 bg-white px-2 py-1 text-sm outline-none focus:border-blue-500 dark:border-white/10 dark:bg-neutral-800"
              />
              <NumberField
                value={food.calories}
                onChange={(v) => updateFood(i, { calories: v })}
              />
              <NumberField value={food.protein} onChange={(v) => updateFood(i, { protein: v })} />
              <div className="flex items-center gap-1">
                <NumberField value={food.carbs} onChange={(v) => updateFood(i, { carbs: v })} />
                <button
                  onClick={() => removeFood(i)}
                  aria-label="Remove food"
                  className="shrink-0 rounded-md px-2 py-1 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                  🗑
                </button>
              </div>
            </div>
          ) : (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border border-black/10 px-3 py-2 dark:border-white/10"
            >
              <div>
                <p className="text-sm font-medium">{food.name}</p>
                <p className="text-xs text-neutral-500">{food.quantity}</p>
              </div>
              <p className="text-sm font-semibold">{Math.round(food.calories)} kcal</p>
            </div>
          )
        )}

        {isEditing && (
          <button
            onClick={addFood}
            className="w-full rounded-lg border border-dashed border-black/20 py-2 text-sm font-medium text-neutral-600 hover:bg-black/5 dark:border-white/20 dark:text-neutral-300 dark:hover:bg-white/10"
          >
            + Add food
          </button>
        )}
      </div>

      <div className="rounded-xl border border-black/10 p-4 dark:border-white/10">
        <h3 className="mb-3 font-semibold">Nutrition summary</h3>
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Stat icon="🔥" label="Calories" value={`${Math.round(result.totalCalories)} kcal`} />
          <Stat icon="🍗" label="Protein" value={`${Math.round(result.totalProtein)} g`} />
          <Stat icon="🌾" label="Carbs" value={`${Math.round(result.totalCarbs)} g`} />
          <Stat icon="🥑" label="Fat" value={`${Math.round(result.totalFat)} g`} />
        </div>

        <div className="mt-3 flex items-center gap-2">
          <span className="text-sm">Health Score</span>
          {isEditing ? (
            <input
              type="number"
              min={1}
              max={10}
              value={result.healthScore}
              onChange={(e) => onChange({ ...result, healthScore: Number(e.target.value) })}
              className="w-16 rounded-md border border-black/10 bg-white px-2 py-1 text-sm dark:border-white/10 dark:bg-neutral-800"
            />
          ) : (
            <span className="font-semibold">{result.healthScore}/10</span>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-black/10 p-4 dark:border-white/10">
        <h3 className="mb-2 font-semibold">AI summary</h3>
        {isEditing ? (
          <textarea
            value={result.summary}
            onChange={(e) => onChange({ ...result, summary: e.target.value })}
            rows={3}
            className="w-full rounded-md border border-black/10 bg-white px-2 py-1 text-sm outline-none focus:border-blue-500 dark:border-white/10 dark:bg-neutral-800"
          />
        ) : (
          <p className="text-sm text-neutral-600 dark:text-neutral-300">{result.summary}</p>
        )}
      </div>

      <p className="flex items-start gap-1.5 text-xs text-neutral-500">
        <span>ⓘ</span>
        <span>
          Nutrition values are AI estimates and not medical advice. Hidden oils, sauces, or
          ingredients may not be accounted for.
        </span>
      </p>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div>
      <p className="text-neutral-500">
        {icon} {label}
      </p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}
