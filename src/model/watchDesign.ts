import { z } from 'zod'

export const CASE_SHAPES = ['round', 'cushion', 'square', 'tonneau'] as const
export const CASE_FINISHES = ['polished', 'brushed', 'matte'] as const
export const DIAL_FINISHES = ['sunburst', 'plain', 'guilloche', 'carbon'] as const
export const DATE_POSITIONS = ['none', '3h', '6h'] as const
export const CHRONO_LAYOUTS = ['none', 'bicompax', 'tricompax'] as const
export const BEZEL_TYPES = ['none', 'smooth', 'fluted', 'dive'] as const
export const CROWN_SIZES = ['small', 'medium', 'large'] as const
export const INDEX_TYPES = ['baton', 'dots', 'arabic', 'roman', 'none'] as const
export const HAND_STYLES = ['baton', 'sword', 'dauphine'] as const
export const STRAP_TYPES = ['leather', 'rubber', 'metal', 'nato'] as const

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
    markingColor: hexColor,
  }),
  crown: z.object({
    size: z.enum(CROWN_SIZES),
    guards: z.boolean(),
  }),
  dial: z.object({
    color: hexColor,
    finish: z.enum(DIAL_FINISHES).default('sunburst'),
    logoText: z.string().max(16),
    logoColor: hexColor,
  }),
  complications: z
    .object({
      date: z.enum(DATE_POSITIONS),
      chrono: z.enum(CHRONO_LAYOUTS),
      subdialColor: hexColor,
    })
    .default({ date: 'none', chrono: 'none', subdialColor: '#1a1a1a' }),
  indices: z.object({
    type: z.enum(INDEX_TYPES),
    color: hexColor,
    minuteTrack: z.boolean(),
  }),
  hands: z.object({
    style: z.enum(HAND_STYLES),
    color: hexColor,
    secondsColor: hexColor,
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
    bezel: { type: 'smooth', color: '#c9ccd1', insertColor: '#1c2a44', markingColor: '#f4f4f4' },
    crown: { size: 'medium', guards: false },
    dial: { color: '#1f3a5f', finish: 'sunburst', logoText: 'MERIDIAN', logoColor: '#f4f4f4' },
    complications: { date: '3h', chrono: 'none', subdialColor: '#1a1a1a' },
    indices: { type: 'baton', color: '#f4f4f4', minuteTrack: true },
    hands: { style: 'sword', color: '#f4f4f4', secondsColor: '#e0452b' },
    strap: { type: 'leather', color: '#6b3f24', accentColor: '#e8d9c0' },
  }
}

/** Parses untrusted data (localStorage, share links) into a design, or returns null. */
export function parseDesign(data: unknown): WatchDesign | null {
  const result = watchDesignSchema.safeParse(data)
  return result.success ? result.data : null
}
