import { z } from 'zod'

export const CASE_SHAPES = ['round', 'cushion', 'square', 'tonneau'] as const
export const CASE_FINISHES = ['polished', 'brushed', 'matte'] as const
export const DIAL_FINISHES = ['sunburst', 'plain', 'guilloche', 'carbon'] as const
export const DIAL_TONES = ['solid', 'smoked', 'sector'] as const
export const DIAL_FONTS = ['sans', 'serif', 'script', 'geometric'] as const
export const DATE_POSITIONS = ['none', '3h', '6h'] as const
export const CHRONO_LAYOUTS = ['none', 'bicompax', 'tricompax'] as const
export const BEZEL_TYPES = ['none', 'smooth', 'fluted', 'dive', 'gmt'] as const
export const CROWN_SIZES = ['small', 'medium', 'large'] as const
export const INDEX_TYPES = ['baton', 'dots', 'arabic', 'roman', 'none'] as const
export const HAND_STYLES = ['baton', 'sword', 'dauphine', 'mercedes', 'snowflake', 'arrow', 'cathedral'] as const
export const STRAP_TYPES = ['leather', 'rubber', 'metal', 'nato'] as const

/** Named metal colors offered next to every metal color picker. */
export const METALS = {
  Steel: '#c9ccd1',
  Gold: '#d8b46a',
  'Rose gold': '#d29a7e',
  Bronze: '#a87a4c',
  Titanium: '#8f9296',
  Black: '#3a3a3c',
} as const

export const DIAMETER_MIN = 34
export const DIAMETER_MAX = 46

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Expected a #rrggbb color')

// Fields added after the first release carry .default(), so designs saved
// before them still load (they get the default instead of failing validation).
export const watchDesignSchema = z.object({
  id: z.string(),
  name: z.string().max(60),
  version: z.literal(1),
  case: z.object({
    shape: z.enum(CASE_SHAPES),
    diameter: z.number().min(DIAMETER_MIN).max(DIAMETER_MAX),
    color: hexColor,
    finish: z.enum(CASE_FINISHES).default('polished'),
  }),
  bezel: z.object({
    type: z.enum(BEZEL_TYPES),
    color: hexColor,
    insertColor: hexColor,
    /** Bottom half of a two-tone GMT insert (insertColor is the top half). */
    insertColor2: hexColor.default('#1a1a1a'),
    markingColor: hexColor,
  }),
  crown: z.object({
    size: z.enum(CROWN_SIZES),
    guards: z.boolean(),
  }),
  dial: z.object({
    color: hexColor,
    finish: z.enum(DIAL_FINISHES).default('sunburst'),
    /** How color spreads across the dial: one color, darkening to the rim, or two-color zones. */
    tone: z.enum(DIAL_TONES).default('solid'),
    /** Second color: the hour ring of a sector dial. */
    color2: hexColor.default('#d9d4c7'),
    logoText: z.string().max(16),
    logoColor: hexColor,
    /** Typeface for the logo and the second line of text. */
    font: z.enum(DIAL_FONTS).default('sans'),
    /** Second, smaller line of dial text, e.g. "AUTOMATIC" or "200m". */
    subText: z.string().max(20).default(''),
  }),
  complications: z
    .object({
      date: z.enum(DATE_POSITIONS),
      chrono: z.enum(CHRONO_LAYOUTS),
      subdialColor: hexColor,
      /** Magnifier ("cyclops") on the crystal over the date window. */
      cyclops: z.boolean().default(false),
      /** 24-hour hand for a second time zone. */
      gmt: z.boolean().default(false),
      gmtColor: hexColor.default('#d6402b'),
    })
    .default({ date: 'none', chrono: 'none', subdialColor: '#1a1a1a', cyclops: false, gmt: false, gmtColor: '#d6402b' }),
  indices: z.object({
    type: z.enum(INDEX_TYPES),
    color: hexColor,
    minuteTrack: z.boolean(),
  }),
  hands: z.object({
    style: z.enum(HAND_STYLES),
    color: hexColor,
    secondsColor: hexColor,
    /** Luminous inserts in the hour and minute hands. */
    lume: z.boolean().default(false),
  }),
  strap: z.object({
    type: z.enum(STRAP_TYPES),
    color: hexColor,
    accentColor: hexColor,
  }),
})

export type WatchDesign = z.infer<typeof watchDesignSchema>
/** The editable parts of a design, e.g. 'case' or 'dial'. */
export type WatchSection = Exclude<keyof WatchDesign, 'id' | 'name' | 'version'>

export function createDefaultDesign(): WatchDesign {
  return {
    id: crypto.randomUUID(),
    name: 'My Watch',
    version: 1,
    case: { shape: 'round', diameter: 40, color: '#c9ccd1', finish: 'polished' },
    bezel: { type: 'smooth', color: '#c9ccd1', insertColor: '#1c2a44', insertColor2: '#1a1a1a', markingColor: '#f4f4f4' },
    crown: { size: 'medium', guards: false },
    dial: {
      color: '#1f3a5f',
      finish: 'sunburst',
      tone: 'solid',
      color2: '#d9d4c7',
      logoText: 'MERIDIAN',
      logoColor: '#f4f4f4',
      font: 'sans',
      subText: 'AUTOMATIC',
    },
    complications: { date: '3h', chrono: 'none', subdialColor: '#1a1a1a', cyclops: false, gmt: false, gmtColor: '#d6402b' },
    indices: { type: 'baton', color: '#f4f4f4', minuteTrack: true },
    hands: { style: 'sword', color: '#f4f4f4', secondsColor: '#e0452b', lume: true },
    strap: { type: 'leather', color: '#6b3f24', accentColor: '#e8d9c0' },
  }
}

/** Parses untrusted data (localStorage, share links) into a design, or returns null. */
export function parseDesign(data: unknown): WatchDesign | null {
  const result = watchDesignSchema.safeParse(data)
  return result.success ? result.data : null
}
