export const themes = [
  { id: "cyber", name: "Cyber Violet", color: "#8b5cf6", desc: "Cool & Pretty", tag: "멋지고 예쁜" },
  { id: "blossom", name: "Cherry Blossom", color: "#ec4899", desc: "Cute & Lovely", tag: "귀엽고 사랑스러운" },
  { id: "polar", name: "Nordic Polar", color: "#06b6d4", desc: "Ethereal & Mystic", tag: "황홀하고 신비로운" },
  { id: "minimal", name: "Slate Minimal", color: "#cbd5e1", desc: "Clean & Bright", tag: "화사하고 깔끔한" },
  { id: "nova", name: "Crimson Nova", color: "#f43f5e", desc: "Intense & Powerful", tag: "강렬하고 파워풀한" },
  { id: "matrix", name: "Zion Matrix", color: "#22c55e", desc: "Digital & Hacky", tag: "영화 메트릭스 느낌" },
];

export const fonts = [
  { id: "menlo", name: "Menlo Classic", font: "Menlo, Monaco, 'Courier New', monospace", desc: "Standard terminal look" },
  { id: "jetbrains", name: "JetBrains Mono", font: "'JetBrains Mono', monospace", desc: "Balanced & Developer focused" },
  { id: "fira", name: "Fira Code", font: "'Fira Code', monospace", desc: "Modern with programming ligatures" },
];

export const themeFonts = [
  { id: "system", name: "System Default", font: "ui-sans-serif, system-ui, sans-serif", desc: "Classic & Clean" },
  { id: "outfit", name: "Modern Outfit", font: "var(--font-outfit), sans-serif", desc: "Geometric & Stylish" },
  { id: "inter", name: "Clear Inter", font: "var(--font-inter), sans-serif", desc: "Professional & Readable" },
  { id: "noto", name: "Soft Noto Sans", font: "var(--font-noto), sans-serif", desc: "Warm & Friendly (KR support)" },
  { id: "roboto", name: "Solid Roboto", font: "var(--font-roboto), sans-serif", desc: "Universal & Neutral" },
];

export const terminalThemes = ["bright", "beige", "matrix"];

export const themeDetails: Record<string, { primary: string; accent: string; bg: string; card: string }> = {
  "#8b5cf6": {
    primary: "#a78bfa",
    accent: "#60a5fa",
    bg: "#0c051a",
    card: "rgba(167, 139, 250, 0.05)"
  },
  "#ec4899": {
    primary: "#f472b6",
    accent: "#fb7185",
    bg: "#1a050f",
    card: "rgba(244, 114, 182, 0.05)"
  },
  "#06b6d4": {
    primary: "#22d3ee",
    accent: "#38bdf8",
    bg: "#05131a",
    card: "rgba(34, 211, 238, 0.05)"
  },
  "#cbd5e1": {
    primary: "#94a3b8",
    accent: "#64748b",
    bg: "#0a0a0c",
    card: "rgba(148, 163, 184, 0.05)"
  },
  "#f43f5e": {
    primary: "#fb7185",
    accent: "#fda4af",
    bg: "#1a0505",
    card: "rgba(251, 113, 133, 0.05)"
  },
  "#22c55e": {
    primary: "#4ade80",
    accent: "#2dd4bf",
    bg: "#051a0a",
    card: "rgba(74, 222, 128, 0.05)"
  },
};
