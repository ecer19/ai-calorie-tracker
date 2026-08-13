"use client";

import { isToday } from "@/lib/date";
import type { Meal } from "@/lib/types";
import { useMemo } from "react";

export default function DailyTotals({ meals }: { meals: Meal[] }) {
  const totals = useMemo(() => {
    const todayMeals = meals.filter((m) => isToday(m.created_at));
    return todayMeals.reduce(
      (acc, m) => ({
        calories: acc.calories + Number(m.total_calories),
        protein: acc.protein + Number(m.protein),
        carbs: acc.carbs + Number(m.carbs),
        fat: acc.fat + Number(m.fat),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [meals]);

  return (
    <div className="rounded-xl border border-black/10 p-4 dark:border-white/10">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">Daily Totals</h3>
        <span className="text-xs text-neutral-500">
          {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date())}
        </span>
      </div>

      <div className="space-y-3 text-sm">
        <Row icon="🔥" label="Total Calories" value={`${Math.round(totals.calories)} kcal`} />
        <Row icon="🍗" label="Total Protein" value={`${Math.round(totals.protein)} g protein`} />
        <Row icon="🌾" label="Total Carbs" value={`${Math.round(totals.carbs)} g carbs`} />
        <Row icon="🥑" label="Total Fat" value={`${Math.round(totals.fat)} g fat`} />
      </div>
    </div>
  );
}

function Row({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-neutral-500">
        {icon} {label}
      </span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
