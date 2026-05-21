import { rgbToLab } from "@/lib/bead/color";
import type { PaletteColor } from "@/types/bead";

const basePalette = [
  { id: 1, code: "W01", name: "??", hex: "#f5f2ea" },
  { id: 2, code: "C02", name: "??", hex: "#e8d5b7" },
  { id: 3, code: "Y03", name: "??", hex: "#f4d64e" },
  { id: 4, code: "O04", name: "??", hex: "#f29a38" },
  { id: 5, code: "R05", name: "??", hex: "#d75452" },
  { id: 6, code: "P06", name: "??", hex: "#f3a5b7" },
  { id: 7, code: "M07", name: "??", hex: "#b95a84" },
  { id: 8, code: "V08", name: "??", hex: "#7f67b8" },
  { id: 9, code: "B09", name: "??", hex: "#4b8ed8" },
  { id: 10, code: "B10", name: "??", hex: "#7cc7f2" },
  { id: 11, code: "G11", name: "???", hex: "#8fd0be" },
  { id: 12, code: "G12", name: "??", hex: "#6bb36a" },
  { id: 13, code: "G13", name: "??", hex: "#3f7c4f" },
  { id: 14, code: "N14", name: "??", hex: "#d6d7db" },
  { id: 15, code: "N15", name: "??", hex: "#9da3ad" },
  { id: 16, code: "N16", name: "??", hex: "#5d6470" },
  { id: 17, code: "K17", name: "??", hex: "#24272b" },
  { id: 18, code: "B18", name: "??", hex: "#8a5e3f" },
  { id: 19, code: "B19", name: "??", hex: "#5f4131" },
  { id: 20, code: "S20", name: "??", hex: "#dca88a" },
];

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ];
}

export const defaultPalette: PaletteColor[] = basePalette.map((item) => {
  const rgb = hexToRgb(item.hex);

  return {
    ...item,
    rgb,
    lab: rgbToLab(rgb),
  };
});
