import type { WatchDesign } from '../model/watchDesign'

/** Dial lettering shared by the 2D and 3D renderers. */
export const ROMAN = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI']
export const SANS = "'Helvetica Neue', Arial, sans-serif"
export const SERIF = "Georgia, 'Times New Roman', serif"

type DialFont = WatchDesign['dial']['font']

/** System fonts only, so canvas textures can paint them right away. */
const DIAL_FONT: Record<DialFont, { family: string; weight: number; scale: number; spacing: number }> = {
  sans: { family: SANS, weight: 600, scale: 1, spacing: 0.2 },
  serif: { family: "Didot, 'Bodoni 72', 'Bodoni MT', Georgia, serif", weight: 400, scale: 1.1, spacing: 0.15 },
  script: { family: "'Snell Roundhand', 'Apple Chancery', 'Brush Script MT', cursive", weight: 400, scale: 1.4, spacing: 0 },
  geometric: { family: "Futura, 'Century Gothic', 'Avenir Next', sans-serif", weight: 500, scale: 1, spacing: 0.3 },
}

/**
 * Logo or second-line lettering for a dial of radius r: font family and weight,
 * size and letter spacing in the same units as r.
 */
export function dialTextStyle(font: DialFont, r: number, line: 'logo' | 'sub') {
  const f = DIAL_FONT[font]
  const size = r * (line === 'logo' ? 0.095 : 0.05) * f.scale
  return { family: f.family, weight: f.weight, size, spacing: size * f.spacing }
}

/**
 * Text as printed on the dial. Script capitals are swashes that turn unreadable
 * in a row, so in script, all-caps words read as Title Case (NAUTIC → Nautic);
 * short codes like GMT stay.
 */
export function dialText(font: DialFont, text: string) {
  if (font !== 'script') return text
  return text.replace(/(?<!\p{L})\p{Lu}{4,}(?!\p{L})/gu, (w) => w[0] + w.slice(1).toLowerCase())
}
