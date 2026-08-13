import type { AnalysisResult, MealType } from "@/lib/types";

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 2
): number {
  const words = text.split(" ");
  let line = "";
  let lines = 0;
  let cursorY = y;

  for (let i = 0; i < words.length; i++) {
    const testLine = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, cursorY);
      line = words[i];
      cursorY += lineHeight;
      lines++;
      if (lines >= maxLines - 1) {
        const remaining = words.slice(i + 1).join(" ");
        const finalLine = remaining ? `${line}…` : line;
        ctx.fillText(finalLine.length > 40 ? `${finalLine.slice(0, 40)}…` : finalLine, x, cursorY);
        return cursorY + lineHeight;
      }
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, cursorY);
  return cursorY + lineHeight;
}

export async function generateShareImage(
  photoUrl: string,
  mealType: MealType,
  result: AnalysisResult
): Promise<Blob> {
  const width = 1080;
  const photoHeight = 720;
  const cardHeight = 620;
  const height = photoHeight + cardHeight;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas desteklenmiyor.");

  // Photo
  const img = await loadImage(photoUrl);
  const scale = Math.max(width / img.width, photoHeight / img.height);
  const drawW = img.width * scale;
  const drawH = img.height * scale;
  ctx.drawImage(img, (width - drawW) / 2, (photoHeight - drawH) / 2, drawW, drawH);

  // Meal type badge
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  const badgeText = MEAL_LABELS[mealType];
  ctx.font = "600 32px Arial";
  const badgeWidth = ctx.measureText(badgeText).width + 48;
  roundRect(ctx, 32, 32, badgeWidth, 60, 30);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.fillText(badgeText, 56, 72);

  // Card background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, photoHeight, width, cardHeight);

  let y = photoHeight + 70;
  const pad = 56;

  // Food names as title
  ctx.fillStyle = "#111111";
  ctx.font = "700 44px Arial";
  const title = result.foods.map((f) => f.name).join(", ") || "Meal";
  y = wrapText(ctx, title, pad, y, width - pad * 2, 52, 2);

  y += 20;
  ctx.strokeStyle = "#e5e5e5";
  ctx.beginPath();
  ctx.moveTo(pad, y);
  ctx.lineTo(width - pad, y);
  ctx.stroke();
  y += 60;

  // Macro stats
  const stats: [string, string][] = [
    ["Calories", `${Math.round(result.totalCalories)} kcal`],
    ["Protein", `${Math.round(result.totalProtein)} g`],
    ["Carbs", `${Math.round(result.totalCarbs)} g`],
    ["Fat", `${Math.round(result.totalFat)} g`],
  ];
  const colWidth = (width - pad * 2) / 4;
  stats.forEach(([label, value], i) => {
    const x = pad + colWidth * i;
    ctx.fillStyle = "#737373";
    ctx.font = "500 26px Arial";
    ctx.fillText(label, x, y);
    ctx.fillStyle = "#111111";
    ctx.font = "700 40px Arial";
    ctx.fillText(value, x, y + 48);
  });

  y += 130;

  // Health score
  ctx.fillStyle = "#111111";
  ctx.font = "600 32px Arial";
  ctx.fillText(`Health Score: ${result.healthScore}/10`, pad, y);

  // Footer / app name
  ctx.fillStyle = "#a3a3a3";
  ctx.font = "500 28px Arial";
  ctx.fillText("Track Your Calories · AI Meal Analysis", pad, height - 40);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Görsel oluşturulamadı."))),
      "image/png",
      0.95
    );
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function shareOrDownloadImage(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: "image/png" });

  if (
    typeof navigator !== "undefined" &&
    "canShare" in navigator &&
    navigator.canShare?.({ files: [file] })
  ) {
    try {
      await navigator.share({
        files: [file],
        title: "Track Your Calories",
        text: "My meal analysis",
      });
      return "shared" as const;
    } catch {
      // user cancelled or share failed — fall through to download
    }
  }

  downloadBlob(blob, filename);
  return "downloaded" as const;
}
