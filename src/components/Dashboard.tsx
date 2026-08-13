"use client";

import DailyTotals from "@/components/DailyTotals";
import Header from "@/components/Header";
import MealHistory from "@/components/MealHistory";
import MealTypeSelect from "@/components/MealTypeSelect";
import PhotoCapture from "@/components/PhotoCapture";
import ResultsPanel from "@/components/ResultsPanel";
import { createClient } from "@/lib/supabase/client";
import { downloadBlob, generateShareImage, shareOrDownloadImage } from "@/lib/shareImage";
import type { AnalysisResult, Meal, MealType } from "@/lib/types";
import { useEffect, useRef, useState } from "react";

type Stage = "idle" | "uploading" | "analyzing";

export default function Dashboard({
  userId,
  userEmail,
  initialMeals,
}: {
  userId: string;
  userEmail: string | null;
  initialMeals: Meal[];
}) {
  const [mealType, setMealType] = useState<MealType>("breakfast");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isExporting, setIsExporting] = useState<"download" | "share" | null>(null);
  const [meals, setMeals] = useState<Meal[]>(initialMeals);
  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  function handleSelectPhoto(file: File) {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const url = URL.createObjectURL(file);
    previewUrlRef.current = url;

    setPhotoFile(file);
    setPreviewUrl(url);
    setUploadedImageUrl(null);
    setResult(null);
    setIsEditing(false);
    setIsSaved(false);
    setError(null);
  }

  function handleScanAgain() {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setPhotoFile(null);
    setPreviewUrl(null);
    setUploadedImageUrl(null);
    setResult(null);
    setIsEditing(false);
    setIsSaved(false);
    setError(null);
    setStage("idle");
  }

  async function handleAnalyze() {
    if (!photoFile) {
      setError("Önce bir yemek fotoğrafı seçin.");
      return;
    }

    setError(null);
    setResult(null);
    setIsSaved(false);

    try {
      setStage("uploading");
      const supabase = createClient();
      const path = `${userId}/${Date.now()}-${photoFile.name.replace(/\s+/g, "_")}`;
      const { error: uploadError } = await supabase.storage
        .from("meal-photos")
        .upload(path, photoFile, { contentType: photoFile.type });

      if (uploadError) throw new Error(`Fotoğraf yüklenemedi: ${uploadError.message}`);

      const { data: publicUrlData } = supabase.storage.from("meal-photos").getPublicUrl(path);
      const imageUrl = publicUrlData.publicUrl;
      setUploadedImageUrl(imageUrl);

      setStage("analyzing");
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl, mealType }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analiz başarısız oldu.");

      setResult(data as AnalysisResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Beklenmeyen bir hata oluştu.");
    } finally {
      setStage("idle");
    }
  }

  async function handleSaveMeal() {
    if (!result || !uploadedImageUrl) return;

    setIsSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: insertError } = await supabase
        .from("meals")
        .insert({
          user_id: userId,
          meal_type: mealType,
          image_url: uploadedImageUrl,
          foods: result.foods,
          total_calories: result.totalCalories,
          protein: result.totalProtein,
          carbs: result.totalCarbs,
          fat: result.totalFat,
          health_score: result.healthScore,
          summary: result.summary,
        })
        .select()
        .single();

      if (insertError) throw new Error(insertError.message);

      setMeals((prev) => [data as Meal, ...prev]);
      setIsSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Öğün kaydedilemedi.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleExport(mode: "download" | "share") {
    if (!result || !uploadedImageUrl) return;
    setIsExporting(mode);
    setError(null);
    try {
      const blob = await generateShareImage(uploadedImageUrl, mealType, result);
      const filename = `meal-${mealType}-${Date.now()}.png`;
      if (mode === "download") {
        downloadBlob(blob, filename);
      } else {
        await shareOrDownloadImage(blob, filename);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Görsel oluşturulamadı.");
    } finally {
      setIsExporting(null);
    }
  }

  const isBusy = stage !== "idle";

  return (
    <div className="min-h-screen">
      <Header email={userEmail} />

      <main className="mx-auto max-w-6xl px-4 py-6">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[340px_1fr_320px]">
          {/* Left column: capture */}
          <div className="space-y-4">
            <MealTypeSelect value={mealType} onChange={setMealType} />

            <div>
              <p className="mb-2 text-sm font-medium">Upload Meal Photo</p>
              <PhotoCapture previewUrl={previewUrl} onSelect={handleSelectPhoto} />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={!photoFile || isBusy}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {stage === "uploading"
                ? "Uploading photo..."
                : stage === "analyzing"
                  ? "Analyzing meal..."
                  : "⚡ Analyze Meal"}
            </button>

            <div className="space-y-2 border-t border-black/10 pt-4 text-xs text-neutral-500 dark:border-white/10">
              <p>🔗 Magic Link login — Secure passwordless authentication</p>
              <p>🤖 AI meal analysis — Advanced computer vision & nutrition AI</p>
              <p>🕑 Saved meal history — View and track your past meals</p>
            </div>
          </div>

          {/* Middle column: results */}
          <div className="space-y-4">
            {!result && !isBusy && (
              <div className="flex h-full min-h-[300px] items-center justify-center rounded-xl border border-dashed border-black/15 p-8 text-center text-sm text-neutral-500 dark:border-white/15">
                Fotoğrafını yükle, öğün türünü seç ve &quot;Analyze Meal&quot; butonuna bas.
              </div>
            )}

            {isBusy && (
              <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-3 rounded-xl border border-black/10 p-8 text-center dark:border-white/10">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                <p className="text-sm text-neutral-500">
                  {stage === "uploading" ? "Fotoğraf yükleniyor..." : "Yapay zekâ analiz ediyor..."}
                </p>
              </div>
            )}

            {result && !isBusy && (
              <>
                <ResultsPanel
                  result={result}
                  isEditing={isEditing}
                  onChange={(r) => {
                    setResult(r);
                    setIsSaved(false);
                  }}
                  onToggleEdit={() => setIsEditing((v) => !v)}
                />

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleSaveMeal}
                    disabled={isSaving || isSaved}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
                  >
                    {isSaved ? "✓ Saved" : isSaving ? "Saving..." : "💾 Save Meal"}
                  </button>
                  <button
                    onClick={handleScanAgain}
                    className="rounded-lg border border-black/10 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
                  >
                    ↻ Scan Again
                  </button>
                  <button
                    onClick={() => handleExport("download")}
                    disabled={isExporting !== null}
                    className="rounded-lg border border-black/10 px-4 py-2 text-sm font-medium hover:bg-black/5 disabled:opacity-60 dark:border-white/10 dark:hover:bg-white/10"
                  >
                    {isExporting === "download" ? "Preparing..." : "⬇ Download"}
                  </button>
                  <button
                    onClick={() => handleExport("share")}
                    disabled={isExporting !== null}
                    className="rounded-lg border border-black/10 px-4 py-2 text-sm font-medium hover:bg-black/5 disabled:opacity-60 dark:border-white/10 dark:hover:bg-white/10"
                  >
                    {isExporting === "share" ? "Preparing..." : "⇧ Share"}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Right column: totals + history */}
          <div className="space-y-4">
            <DailyTotals meals={meals} />
            <MealHistory meals={meals} />
          </div>
        </div>
      </main>
    </div>
  );
}
