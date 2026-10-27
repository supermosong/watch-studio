import type { WatchDesign } from '../../model/watchDesign'

/** SVG canvas size. The watch is drawn centered on (0, 0) inside it. */
export const VIEW_W = 400
export const VIEW_H = 640

/** Pixel sizes derived from a design. All radii are measured from the watch center. */
export function getGeometry(d: WatchDesign) {
  const caseR = d.case.diameter * 3.4
  return {
    caseR,
    bezelR: caseR * 0.95,
    dialR: caseR * (d.bezel.type === 'none' ? 0.86 : 0.74),
    strapW: caseR,
    /** x of the case edge at 3 o'clock, where the crown attaches. */
    edgeX: d.case.shape === 'tonneau' ? caseR * 0.97 : caseR,
  }
}

/** Point at radius r and clock angle deg (0 = 12 o'clock, clockwise). */
export function polar(r: number, deg: number) {
  const a = (deg * Math.PI) / 180
  return { x: r * Math.sin(a), y: -r * Math.cos(a) }
}
