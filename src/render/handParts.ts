import type { WatchDesign } from '../model/watchDesign'

export type Pt = [number, number]

/** A filled outline in hand space: y points to 12 o'clock, the pivot is (0, 0). */
export type HandPart =
  | { kind: 'poly'; points: Pt[]; holes?: Pt[][] }
  | { kind: 'circle'; cx: number; cy: number; r: number; hole?: number }

export interface HandParts {
  /** Metal outline. Lume channels are cut out of it as holes. */
  body: HandPart[]
  /** Luminous fill sitting in those channels. Empty when lume is off. */
  lume: HandPart[]
}

type Style = WatchDesign['hands']['style']

const rect = (x0: number, y0: number, x1: number, y1: number): Pt[] => [
  [x0, y0],
  [x1, y0],
  [x1, y1],
  [x0, y1],
]

/** Thin bar from the center at `deg` (counter-clockwise from +x), used for Mercedes spokes. */
function spoke(cx: number, cy: number, deg: number, length: number, width: number): Pt[] {
  const a = (deg * Math.PI) / 180
  const p = (t: number, s: number): Pt => [cx + t * Math.cos(a) - s * Math.sin(a), cy + t * Math.sin(a) + s * Math.cos(a)]
  return [p(0, -width / 2), p(length, -width / 2), p(length, width / 2), p(0, width / 2)]
}

/** Plain pointed minute hand that pairs with the Mercedes, snowflake and arrow hour hands. */
function pencil(l: number, w: number): [Pt[], Pt[]] {
  return [
    [
      [-0.4 * w, -0.12 * l],
      [0.4 * w, -0.12 * l],
      [0.4 * w, 0.88 * l],
      [0, l],
      [-0.4 * w, 0.88 * l],
    ],
    rect(-0.2 * w, 0.2 * l, 0.2 * w, 0.85 * l),
  ]
}

/**
 * Outline of a hand of length `l` and nominal width `w`. Hour and minute hands
 * differ for styles whose character is in the hour hand (Mercedes, snowflake, arrow).
 * All outlines are counter-clockwise.
 */
export function handParts(style: Style, role: 'hour' | 'minute', l: number, w: number, lume: boolean): HandParts {
  const out: HandParts = { body: [], lume: [] }
  const add = (points: Pt[], channel?: Pt[]) => {
    if (lume && channel) {
      out.body.push({ kind: 'poly', points, holes: [channel] })
      out.lume.push({ kind: 'poly', points: channel })
    } else {
      out.body.push({ kind: 'poly', points })
    }
  }
  const plainMinute = role === 'minute' && (style === 'mercedes' || style === 'snowflake' || style === 'arrow')
  if (plainMinute) {
    add(...pencil(l, w))
    return out
  }

  switch (style) {
    case 'baton':
      add(rect(-w / 2, -0.12 * l, w / 2, l), rect(-0.28 * w, 0.22 * l, 0.28 * w, 0.94 * l))
      break
    case 'sword':
      add(
        [
          [-0.3 * w, -0.1 * l],
          [0.3 * w, -0.1 * l],
          [0.55 * w, 0.72 * l],
          [0, l],
          [-0.55 * w, 0.72 * l],
        ],
        [
          [-0.16 * w, 0.18 * l],
          [0.16 * w, 0.18 * l],
          [0.32 * w, 0.7 * l],
          [0, 0.88 * l],
          [-0.32 * w, 0.7 * l],
        ],
      )
      break
    case 'dauphine':
      // Faceted, never lumed; the 3D view builds its own ridged geometry.
      out.body.push({
        kind: 'poly',
        points: [
          [0, -0.1 * l],
          [0.6 * w, 0],
          [0, l],
          [-0.6 * w, 0],
        ],
      })
      break
    case 'mercedes': {
      // Shaft, a ring with three spokes near the tip, then a short point.
      const outer = w * 1.05
      const inner = w * 0.78
      const cy = 0.5 * l + outer * 0.9
      add(rect(-0.35 * w, -0.12 * l, 0.35 * w, cy - inner), rect(-0.17 * w, 0.15 * l, 0.17 * w, cy - outer - 0.1 * w))
      out.body.push({ kind: 'circle', cx: 0, cy, r: outer, hole: inner })
      for (const deg of [90, 210, 330]) add(spoke(0, cy, deg, inner + 0.05 * w, 0.18 * w))
      add([
        [-0.35 * w, cy + inner],
        [0.35 * w, cy + inner],
        [0, l],
      ])
      if (lume) out.lume.push({ kind: 'circle', cx: 0, cy, r: inner })
      break
    }
    case 'snowflake': {
      // Shaft into a big square lume plot with a pointed top.
      const s = 1.8 * w
      const y0 = 0.5 * l
      const y1 = y0 + s
      add(rect(-0.35 * w, -0.12 * l, 0.35 * w, y0 + 0.05 * w), rect(-0.17 * w, 0.15 * l, 0.17 * w, y0 - 0.1 * w))
      add(
        [
          [-s / 2, y0],
          [s / 2, y0],
          [s / 2, y1],
          [0, l],
          [-s / 2, y1],
        ],
        rect(-s / 2 + 0.2 * w, y0 + 0.2 * w, s / 2 - 0.2 * w, y1 - 0.05 * w),
      )
      break
    }
    case 'arrow':
      add(
        [
          [-0.3 * w, -0.12 * l],
          [0.3 * w, -0.12 * l],
          [0.3 * w, 0.62 * l],
          [1.1 * w, 0.62 * l],
          [0, l],
          [-1.1 * w, 0.62 * l],
          [-0.3 * w, 0.62 * l],
        ],
        [
          [-0.65 * w, 0.66 * l],
          [0.65 * w, 0.66 * l],
          [0, 0.9 * l],
        ],
      )
      if (lume) {
        // Second channel along the shaft.
        const shaft = rect(-0.14 * w, 0.15 * l, 0.14 * w, 0.58 * l)
        const body = out.body[0]
        if (body.kind === 'poly') body.holes = [...(body.holes ?? []), shaft]
        out.lume.push({ kind: 'poly', points: shaft })
      }
      break
    case 'cathedral': {
      // Ornate outline: a wide lobe with a window, a waist, then a small pointed lobe.
      const right: Pt[] = [
        [0.3 * w, -0.1 * l],
        [0.3 * w, 0.18 * l],
        [0.8 * w, 0.3 * l],
        [0.8 * w, 0.55 * l],
        [0.35 * w, 0.68 * l],
        [0.55 * w, 0.78 * l],
      ]
      const outline: Pt[] = [...right, [0, l], ...right.map(([x, y]): Pt => [-x, y]).reverse()]
      const windows: Pt[][] = [
        rect(-0.5 * w, 0.32 * l, 0.5 * w, 0.53 * l),
        [
          [-0.22 * w, 0.73 * l],
          [0.22 * w, 0.73 * l],
          [0, 0.88 * l],
        ],
      ]
      if (lume) {
        out.body.push({ kind: 'poly', points: outline, holes: windows })
        for (const points of windows) out.lume.push({ kind: 'poly', points })
      } else {
        out.body.push({ kind: 'poly', points: outline })
      }
      break
    }
  }
  return out
}

/** GMT hand: a thin shaft ending in a lumed arrow tip, reaching out toward the bezel. */
export function gmtHandParts(l: number, w: number): HandParts {
  const tip: Pt[] = [
    [-1.1 * w, 0.82 * l],
    [1.1 * w, 0.82 * l],
    [0, l],
  ]
  const channel: Pt[] = [
    [-0.55 * w, 0.85 * l],
    [0.55 * w, 0.85 * l],
    [0, 0.95 * l],
  ]
  return {
    body: [
      { kind: 'poly', points: rect(-0.25 * w, -0.1 * l, 0.25 * w, 0.83 * l) },
      { kind: 'poly', points: tip, holes: [channel] },
    ],
    lume: [{ kind: 'poly', points: channel }],
  }
}

/** SVG path for a part, flipped to SVG's y-down space. Use with fill-rule evenodd. */
export function partToSvgPath(part: HandPart): string {
  const poly = (pts: Pt[]) => `M ${pts.map(([x, y]) => `${x} ${-y}`).join(' L ')} Z`
  const circle = (cx: number, cy: number, r: number) =>
    `M ${cx + r} ${-cy} A ${r} ${r} 0 1 0 ${cx - r} ${-cy} A ${r} ${r} 0 1 0 ${cx + r} ${-cy} Z`
  if (part.kind === 'poly') return [poly(part.points), ...(part.holes ?? []).map(poly)].join(' ')
  return part.hole ? `${circle(part.cx, part.cy, part.r)} ${circle(part.cx, part.cy, part.hole)}` : circle(part.cx, part.cy, part.r)
}
