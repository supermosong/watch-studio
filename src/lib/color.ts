/** Lightens (amount > 0) or darkens (amount < 0) a #rrggbb color. amount is in [-1, 1]. */
export function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16)
  const channels = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const target = amount > 0 ? 255 : 0
    return Math.round(c + (target - c) * Math.abs(amount))
  })
  return '#' + channels.map((c) => c.toString(16).padStart(2, '0')).join('')
}

/** Relative luminance (0 = black, 1 = white), used to pick readable contrast colors. */
export function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
