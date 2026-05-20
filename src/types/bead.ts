export type RatioPreset = "original" | "1:1" | "4:5" | "3:4" | "16:9" | "9:16";

export type SizeMode = "preset" | "custom";

export type PaletteColor = {
  id: number;
  code: string;
  name: string;
  hex: string;
  rgb: [number, number, number];
  lab: [number, number, number];
};

export type PatternCount = {
  color: PaletteColor;
  count: number;
};

export type GeneratedPattern = {
  width: number;
  height: number;
  ratioLabel: string;
  palette: PaletteColor[];
  matrix: number[][];
  counts: PatternCount[];
  totalBeads: number;
  sourceName: string;
};
