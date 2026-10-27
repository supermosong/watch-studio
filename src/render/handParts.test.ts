import { describe, expect, it } from 'vitest'
import { HAND_STYLES } from '../model/watchDesign'
import { gmtHandParts, handParts, type HandPart, type Pt } from './handParts'

/** Twice the signed area; positive means counter-clockwise. */
const signedArea = (pts: Pt[]) => pts.reduce((sum, [x, y], i) => {
  const [nx, ny] = pts[(i + 1) % pts.length]
  return sum + x * ny - nx * y
}, 0)

const inside = ([px, py]: Pt, pts: Pt[]) => {
  let hit = false
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i]
    const [xj, yj] = pts[j]
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) hit = !hit
  }
  return hit
}

const polys = (parts: HandPart[]) => parts.flatMap((p) => (p.kind === 'poly' ? [p] : []))

describe('hand shapes', () => {
  const cases = HAND_STYLES.flatMap((style) => (['hour', 'minute'] as const).map((role) => [style, role] as const))

  it.each(cases)('%s %s hand outlines are counter-clockwise and stay within its length', (style, role) => {
    const { body } = handParts(style, role, 10, 1.2, true)
    expect(body.length).toBeGreaterThan(0)
    for (const part of polys(body)) {
      expect(signedArea(part.points)).toBeGreaterThan(0)
      for (const [, y] of part.points) expect(y).toBeLessThanOrEqual(10 + 1e-9)
    }
  })

  it.each(cases)('%s %s lume channels sit inside the metal outline', (style, role) => {
    const { body } = handParts(style, role, 10, 1.2, true)
    for (const part of polys(body)) {
      for (const hole of part.holes ?? []) {
        for (const pt of hole) {
          // Nudge toward the hole's center so points on a shared edge count as inside.
          const [cx, cy] = hole.reduce(([ax, ay], [x, y]) => [ax + x / hole.length, ay + y / hole.length], [0, 0])
          expect(inside([pt[0] + (cx - pt[0]) * 0.01, pt[1] + (cy - pt[1]) * 0.01], part.points)).toBe(true)
        }
      }
    }
  })

  it('turning lume off removes channels and fill', () => {
    for (const style of HAND_STYLES) {
      const { body, lume } = handParts(style, 'hour', 10, 1.2, false)
      expect(lume).toEqual([])
      for (const part of polys(body)) expect(part.holes ?? []).toEqual([])
    }
  })

  it('GMT hand has a lumed tip', () => {
    expect(gmtHandParts(10, 0.5).lume).toHaveLength(1)
  })
})
