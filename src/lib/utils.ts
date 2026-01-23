export const hexToRgb = (hex: string) => {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return "255, 255, 255";
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return "255, 255, 255";
    return `${r}, ${g}, ${b}`;
  } catch {
    return "255, 255, 255";
  }
};
