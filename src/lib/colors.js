/* 실제 로또 공 색상 규칙을 따른다. */
const RANGES = [
  { max: 10, color: '#fbc400', label: '1–10' },
  { max: 20, color: '#69c8f2', label: '11–20' },
  { max: 30, color: '#ff7272', label: '21–30' },
  { max: 40, color: '#aaaaaa', label: '31–40' },
  { max: 45, color: '#b0d840', label: '41–45' },
];

export function ballColor(n) {
  return (RANGES.find((r) => n <= r.max) ?? RANGES[RANGES.length - 1]).color;
}

export const COLOR_LEGEND = RANGES.map(({ label, color }) => ({ label, color }));

/** hex -> "r, g, b" (rgba() 안에 넣어 쓰기 위함) */
export function rgbChannels(hex) {
  const clean = hex.replace('#', '');
  const int = parseInt(clean, 16);
  return `${(int >> 16) & 255}, ${(int >> 8) & 255}, ${int & 255}`;
}
