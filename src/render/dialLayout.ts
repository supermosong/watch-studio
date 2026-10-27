import type { WatchDesign } from '../model/watchDesign'

/** Subdial center distance and radius, as fractions of the dial radius. */
export const SUBDIAL_DIST = 0.48
export const SUBDIAL_R = 0.22
/** Date window size, as fractions of the dial radius. */
export const DATE_W = 0.17
export const DATE_H = 0.13

export type SubdialKind = 'seconds' | 'minutes' | 'hours'

export interface DialLayout {
  /** Subdials by hour position (3, 6, 9). */
  subdials: { hour: number; kind: SubdialKind }[]
  /** Date window center: clock angle in degrees and distance as a fraction of the dial radius. */
  date: { angle: number; dist: number } | null
  /** Hour positions (0 = 12) whose index or numeral is left off to make room. */
  hiddenHours: Set<number>
}

/**
 * Where complications go on the dial. Shared by the 2D and 3D renderers so
 * both always agree. A date that would collide with a subdial moves to 4:30,
 * as on many real chronographs.
 */
export function dialLayout(d: WatchDesign): DialLayout {
  const { chrono, date } = d.complications
  const subdials: DialLayout['subdials'] =
    chrono === 'bicompax'
      ? [
          { hour: 3, kind: 'minutes' },
          { hour: 9, kind: 'seconds' },
        ]
      : chrono === 'tricompax'
        ? [
            { hour: 3, kind: 'minutes' },
            { hour: 6, kind: 'hours' },
            { hour: 9, kind: 'seconds' },
          ]
        : []
  const hiddenHours = new Set(subdials.map((s) => s.hour))

  let window: DialLayout['date'] = null
  if (date !== 'none') {
    const hour = date === '3h' ? 3 : 6
    if (hiddenHours.has(hour)) {
      window = { angle: 135, dist: 0.6 }
    } else {
      window = { angle: hour * 30, dist: 0.66 }
      hiddenHours.add(hour)
    }
  }
  return { subdials, date: window, hiddenHours }
}
