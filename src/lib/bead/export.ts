import type { GeneratedPattern } from "@/types/bead";

export type PreviewRenderOptions = {
  showGrid: boolean;
  showCodes: boolean;
};

function getTextColor(hex: string): string {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 150 ? "#1f2937" : "#ffffff";
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function drawPreviewCanvas(
  canvas: HTMLCanvasElement,
  pattern: GeneratedPattern,
  options: PreviewRenderOptions,
): void {
  const maxCells = Math.max(pattern.width, pattern.height);
  const cellSize = clamp(Math.floor(720 / maxCells), 14, 28);
  const width = pattern.width * cellSize;
  const height = pattern.height * cellSize;
  const context = canvas.getContext("2d");

  if (!context) {
    return;
  }

  canvas.width = width;
  canvas.height = height;
  context.clearRect(0, 0, width, height);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = `${Math.max(9, Math.floor(cellSize * 0.34))}px sans-serif`;

  for (let y = 0; y < pattern.height; y += 1) {
    for (let x = 0; x < pattern.width; x += 1) {
      const color = pattern.palette[pattern.matrix[y][x]];
      const left = x * cellSize;
      const top = y * cellSize;
      context.fillStyle = color.hex;
      context.fillRect(left, top, cellSize, cellSize);

      if (options.showGrid) {
        context.strokeStyle = "rgba(15, 23, 42, 0.16)";
        context.lineWidth = 1;
        context.strokeRect(left, top, cellSize, cellSize);
      }

      if (options.showCodes) {
        context.fillStyle = getTextColor(color.hex);
        context.fillText(color.code, left + cellSize / 2, top + cellSize / 2);
      }
    }
  }
}

export async function exportPatternImage(pattern: GeneratedPattern): Promise<Blob> {
  const padding = 48;
  const titleHeight = 120;
  const footerGap = 36;
  const legendItemHeight = 44;
  const legendColumns = pattern.counts.length > 10 ? 2 : 1;
  const legendRows = Math.ceil(pattern.counts.length / legendColumns);
  const cellSize = clamp(Math.floor(1400 / Math.max(pattern.width, pattern.height)), 20, 40);
  const gridWidth = pattern.width * cellSize;
  const gridHeight = pattern.height * cellSize;
  const legendWidth = legendColumns === 1 ? 360 : 720;
  const canvasWidth = Math.max(gridWidth + padding * 2, legendWidth + padding * 2);
  const canvasHeight =
    titleHeight +
    gridHeight +
    footerGap +
    legendRows * legendItemHeight +
    padding * 2 +
    80;

  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("浏览器不支持导出 PNG。");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvasWidth, canvasHeight);

  context.fillStyle = "#0f172a";
  context.font = "700 36px sans-serif";
  context.fillText("拼豆配色网格图", padding, 56);

  context.fillStyle = "#475569";
  context.font = "20px sans-serif";
  context.fillText(
    `来源：${pattern.sourceName}    尺寸：${pattern.width} × ${pattern.height}    比例：${pattern.ratioLabel}    总颗数：${pattern.totalBeads}`,
    padding,
    92,
  );

  const gridLeft = Math.round((canvasWidth - gridWidth) / 2);
  const gridTop = titleHeight;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = `${Math.max(11, Math.floor(cellSize * 0.3))}px sans-serif`;

  for (let y = 0; y < pattern.height; y += 1) {
    for (let x = 0; x < pattern.width; x += 1) {
      const color = pattern.palette[pattern.matrix[y][x]];
      const left = gridLeft + x * cellSize;
      const top = gridTop + y * cellSize;
      context.fillStyle = color.hex;
      context.fillRect(left, top, cellSize, cellSize);
      context.strokeStyle = "rgba(15, 23, 42, 0.18)";
      context.lineWidth = 1;
      context.strokeRect(left, top, cellSize, cellSize);
      context.fillStyle = getTextColor(color.hex);
      context.fillText(color.code, left + cellSize / 2, top + cellSize / 2);
    }
  }

  const legendTop = gridTop + gridHeight + footerGap;
  context.textAlign = "left";
  context.textBaseline = "alphabetic";
  context.fillStyle = "#0f172a";
  context.font = "700 24px sans-serif";
  context.fillText(`颜色统计（共 ${pattern.counts.length} 种）`, padding, legendTop);

  context.font = "18px sans-serif";
  pattern.counts.forEach((item, index) => {
    const column = index % legendColumns;
    const row = Math.floor(index / legendColumns);
    const left = padding + column * 360;
    const top = legendTop + 24 + row * legendItemHeight;

    context.fillStyle = item.color.hex;
    context.fillRect(left, top, 26, 26);
    context.strokeStyle = "rgba(15, 23, 42, 0.12)";
    context.strokeRect(left, top, 26, 26);

    context.fillStyle = "#0f172a";
    context.fillText(`${item.color.code} ? ${item.color.name} ? ${item.count} ?`, left + 40, top + 19);
  });

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("导出失败，请稍后重试。"));
      }
    }, "image/png");
  });
}
