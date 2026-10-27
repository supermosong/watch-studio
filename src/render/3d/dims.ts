import type { WatchDesign } from '../../model/watchDesign'

/**
 * Real-world sizes in millimetres. The dial faces +Z, 12 o'clock is +Y,
 * and the dial surface sits at z = 0.
 */
export const CASE_TOP = 1.2
export const CASE_MID = -3

export function dims3d(d: WatchDesign) {
  const R = d.case.diameter / 2
  const hasBezel = d.bezel.type !== 'none'
  const dialR = R * (hasBezel ? 0.7 : 0.82)
  return {
    R,
    hasBezel,
    dialR,
    bezelInner: dialR + 0.8,
    bezelOuter: R * 0.95,
    /** Lug width: strap width between the lugs. */
    strapW: d.case.diameter * 0.5,
  }
}
