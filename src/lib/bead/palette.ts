import { rgbToLab } from "@/lib/bead/color";
import type { PaletteColor } from "@/types/bead";

const basePalette = [
  { id: 1, code: "W01", name: "奶白", hex: "#f5f2ea" },
  { id: 2, code: "C02", name: "米棕", hex: "#e8d5b7" },
  { id: 3, code: "Y03", name: "亮黄", hex: "#f4d64e" },
  { id: 4, code: "O04", name: "橙色", hex: "#f29a38" },
  { id: 5, code: "R05", name: "正红", hex: "#d75452" },
  { id: 6, code: "P06", name: "粉红", hex: "#f3a5b7" },
  { id: 7, code: "M07", name: "玫红", hex: "#b95a84" },
  { id: 8, code: "V08", name: "紫色", hex: "#7f67b8" },
  { id: 9, code: "B09", name: "湖蓝", hex: "#4b8ed8" },
  { id: 10, code: "B10", name: "天蓝", hex: "#7cc7f2" },
  { id: 11, code: "G11", name: "薄荷绿", hex: "#8fd0be" },
  { id: 12, code: "G12", name: "草绿", hex: "#6bb36a" },
  { id: 13, code: "G13", name: "深绿", hex: "#3f7c4f" },
  { id: 14, code: "N14", name: "浅灰", hex: "#d6d7db" },
  { id: 15, code: "N15", name: "中灰", hex: "#9da3ad" },
  { id: 16, code: "N16", name: "深灰", hex: "#5d6470" },
  { id: 17, code: "K17", name: "黑色", hex: "#24272b" },
  { id: 18, code: "B18", name: "棕色", hex: "#8a5e3f" },
  { id: 19, code: "B19", name: "深棕", hex: "#5f4131" },
  { id: 20, code: "S20", name: "肤色", hex: "#dca88a" },
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
