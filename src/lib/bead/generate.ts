import { deltaE, rgbToLab } from "@/lib/bead/color";
import { defaultPalette } from "@/lib/bead/palette";
import type { GeneratedPattern, PaletteColor, RatioPreset, SizeMode } from "@/types/bead";

export type SourceImage = {
  element: CanvasImageSource;
  width: number;
  height: number;
  name: string;
};

export type GeneratePatternOptions = {
  source: SourceImage;
  ratio: RatioPreset;
  sizeMode: SizeMode;
  presetLongEdge: number;
  customWidth: number;
  customHeight: number;
};

function parseRatio(ratio: RatioPreset, sourceWidth: number, sourceHeight: number): number {
  if (ratio === "original") {
    return sourceWidth / sourceHeight;
  }

  const [width, height] = ratio.split(":").map(Number);
  return width / height;
}

function computeDimensions(
  ratio: RatioPreset,
  sizeMode: SizeMode,
  presetLongEdge: number,
  customWidth: number,
  customHeight: number,
  sourceWidth: number,
  sourceHeight: number,
): { width: number; height: number; ratioLabel: string } {
  const aspect = parseRatio(ratio, sourceWidth, sourceHeight);

  if (sizeMode === "custom") {
    const width = Math.max(8, Math.min(128, Math.round(customWidth)));
    const height = Math.max(8, Math.min(128, Math.round(customHeight)));
    return {
      width,
      height,
      ratioLabel: `${width}:${height}`,
    };
  }

  if (aspect >= 1) {
    return {
      width: presetLongEdge,
      height: Math.max(1, Math.round(presetLongEdge / aspect)),
      ratioLabel: ratio === "original" ? "????" : ratio,
    };
  }

  return {
    width: Math.max(1, Math.round(presetLongEdge * aspect)),
    height: presetLongEdge,
    ratioLabel: ratio === "original" ? "????" : ratio,
  };
}

function computeCrop(
  sourceWidth: number,
  sourceHeight: number,
  targetAspect: number,
): { sx: number; sy: number; sw: number; sh: number } {
  const sourceAspect = sourceWidth / sourceHeight;

  if (sourceAspect > targetAspect) {
    const sw = sourceHeight * targetAspect;
    return {
      sx: (sourceWidth - sw) / 2,
      sy: 0,
      sw,
      sh: sourceHeight,
    };
  }

  const sh = sourceWidth / targetAspect;
  return {
    sx: 0,
    sy: (sourceHeight - sh) / 2,
    sw: sourceWidth,
    sh,
  };
}

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function findNearestColor(palette: PaletteColor[], rgb: [number, number, number]): number {
  const lab = rgbToLab(rgb);
  let minDistance = Number.POSITIVE_INFINITY;
  let nearestIndex = 0;

  for (let index = 0; index < palette.length; index += 1) {
    const distance = deltaE(lab, palette[index].lab);
    if (distance < minDistance) {
      minDistance = distance;
      nearestIndex = index;
    }
  }

  return nearestIndex;
}

export function generatePattern(options: GeneratePatternOptions): GeneratedPattern {
  const { source, ratio, sizeMode, presetLongEdge, customWidth, customHeight } = options;

  const targetAspect = parseRatio(ratio, source.width, source.height);
  const dimensions = computeDimensions(
    ratio,
    sizeMode,
    presetLongEdge,
    customWidth,
    customHeight,
    source.width,
    source.height,
  );
  const crop = computeCrop(source.width, source.height, targetAspect);

  const canvas = createCanvas(dimensions.width, dimensions.height);
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    throw new Error("?????? Canvas ???");
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.clearRect(0, 0, dimensions.width, dimensions.height);
  context.drawImage(
    source.element,
    crop.sx,
    crop.sy,
    crop.sw,
    crop.sh,
    0,
    0,
    dimensions.width,
    dimensions.height,
  );

  const imageData = context.getImageData(0, 0, dimensions.width, dimensions.height);
  const { data } = imageData;
  const matrix: number[][] = [];
  const countMap = new Map<number, number>();

  for (let y = 0; y < dimensions.height; y += 1) {
    const row: number[] = [];

    for (let x = 0; x < dimensions.width; x += 1) {
      const offset = (y * dimensions.width + x) * 4;
      const rgb: [number, number, number] = [data[offset], data[offset + 1], data[offset + 2]];
      const paletteIndex = findNearestColor(defaultPalette, rgb);
      row.push(paletteIndex);
      countMap.set(paletteIndex, (countMap.get(paletteIndex) ?? 0) + 1);
    }

    matrix.push(row);
  }

  const counts = Array.from(countMap.entries())
    .map(([paletteIndex, count]) => ({
      color: defaultPalette[paletteIndex],
      count,
    }))
    .sort((left, right) => right.count - left.count);

  return {
    width: dimensions.width,
    height: dimensions.height,
    ratioLabel: dimensions.ratioLabel,
    palette: defaultPalette,
    matrix,
    counts,
    totalBeads: dimensions.width * dimensions.height,
    sourceName: source.name,
  };
}
