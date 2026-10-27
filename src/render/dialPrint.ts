import { luminance, shade } from '../lib/color'
import type { WatchDesign } from '../model/watchDesign'
import { polar } from './2d/geometry'
import {
  DATE_H,
  DATE_W,
  SECTOR_RING,
  SMOKE_EDGE,
  SMOKE_START,
  SUBDIAL_DIST,
  SUBDIAL_R,
  dialLayout,
  type SubdialKind,
} from './dialLayout'
import { ROMAN, SANS, SERIF, dialText, dialTextStyle } from './typography'

type Ctx = CanvasRenderingContext2D

/** A square canvas with the origin moved to its center. */
export function centeredCanvas(size: number) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')
  if (!ctx) throw new Error('2D canvas is not available')
  ctx.translate(size / 2, size / 2)
  return { c, ctx, r: size / 2 }
}

/** Ink that reads on top of `bg`. */
export function contrastInk(bg: string) {
  return luminance(bg) > 0.35 ? '#1a1a1a' : '#f2f2f2'
}

function paintFinish(ctx: Ctx, r: number, color: string, finish: WatchDesign['dial']['finish']) {
  const [hi, lo] = finish === 'sunburst' ? [0.12, -0.25] : finish === 'plain' ? [0.04, -0.12] : [0.06, -0.18]
  const base = ctx.createRadialGradient(0, 0, 0, 0, 0, r)
  base.addColorStop(0, shade(color, hi))
  base.addColorStop(1, shade(color, lo))
  ctx.fillStyle = base
  ctx.fillRect(-r, -r, 2 * r, 2 * r)

  if (finish === 'sunburst') {
    const rays = ctx.createConicGradient(0, 0, 0)
    for (let i = 0; i <= 180; i++) rays.addColorStop(i / 180, i % 2 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)')
    ctx.fillStyle = rays
    ctx.fillRect(-r, -r, 2 * r, 2 * r)
  }

  if (finish === 'guilloche') {
    // Clous de Paris: a grid of tiny pyramids, each lit from the top left.
    const cell = r * 0.045
    const n = Math.ceil((r * 1.5) / cell)
    const faces: [number, number, number, number, string][] = [
      [0, 0, 1, 0, 'rgba(255,255,255,0.12)'],
      [1, 0, 1, 1, 'rgba(0,0,0,0.08)'],
      [1, 1, 0, 1, 'rgba(0,0,0,0.18)'],
      [0, 1, 0, 0, 'rgba(255,255,255,0.04)'],
    ]
    ctx.save()
    ctx.rotate(Math.PI / 4)
    for (let i = -n; i < n; i++) {
      for (let j = -n; j < n; j++) {
        const [x, y] = [i * cell, j * cell]
        for (const [ax, ay, bx, by, fill] of faces) {
          ctx.fillStyle = fill
          ctx.beginPath()
          ctx.moveTo(x + ax * cell, y + ay * cell)
          ctx.lineTo(x + bx * cell, y + by * cell)
          ctx.lineTo(x + cell / 2, y + cell / 2)
          ctx.fill()
        }
      }
    }
    ctx.restore()
  }

  if (finish === 'carbon') {
    // Woven fibre: alternating tiles shaded across or along the weave.
    const cell = r * 0.035
    const n = Math.ceil(r / cell) + 1
    for (let i = -n; i < n; i++) {
      for (let j = -n; j < n; j++) {
        const [x, y] = [i * cell, j * cell]
        const across = (i + j) % 2 === 0
        const g = across ? ctx.createLinearGradient(x, y, x, y + cell) : ctx.createLinearGradient(x, y, x + cell, y)
        g.addColorStop(0, shade(color, -0.3))
        g.addColorStop(0.5, shade(color, 0.12))
        g.addColorStop(1, shade(color, -0.3))
        ctx.fillStyle = g
        ctx.fillRect(x, y, cell, cell)
      }
    }
  }
}

/** The dial's finish in its color style: one color, smoked toward the rim, or a two-color sector ring. */
function paintSurface(ctx: Ctx, r: number, dial: WatchDesign['dial']) {
  paintFinish(ctx, r, dial.color, dial.finish)
  if (dial.tone === 'sector') {
    ctx.save()
    ctx.beginPath()
    ctx.arc(0, 0, r * SECTOR_RING[1], 0, Math.PI * 2)
    ctx.arc(0, 0, r * SECTOR_RING[0], 0, Math.PI * 2, true)
    ctx.clip()
    paintFinish(ctx, r, dial.color2, dial.finish)
    ctx.restore()
  }
  if (dial.tone === 'smoked') {
    const smoke = ctx.createRadialGradient(0, 0, r * SMOKE_START, 0, 0, r)
    smoke.addColorStop(0, 'rgba(0,0,0,0)')
    smoke.addColorStop(1, `rgba(0,0,0,${SMOKE_EDGE})`)
    ctx.fillStyle = smoke
    ctx.fillRect(-r, -r, 2 * r, 2 * r)
  }
}

const SUBDIAL_SCALE: Record<SubdialKind, { ticks: number; labels: number[] }> = {
  seconds: { ticks: 60, labels: [60, 20, 40] },
  minutes: { ticks: 30, labels: [30, 10, 20] },
  hours: { ticks: 12, labels: [12, 4, 8] },
}

function paintSubdial(ctx: Ctx, r: number, hour: number, kind: SubdialKind, color: string) {
  const c = polar(r * SUBDIAL_DIST, hour * 30)
  const sr = r * SUBDIAL_R
  const ink = contrastInk(color)
  ctx.save()
  ctx.translate(c.x, c.y)

  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(0, 0, sr, 0, Math.PI * 2)
  ctx.fill()
  // Azurage: fine concentric grooves.
  ctx.lineWidth = sr * 0.012
  for (let k = 1; k < 40; k++) {
    ctx.strokeStyle = k % 2 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)'
    ctx.beginPath()
    ctx.arc(0, 0, (sr * k) / 40, 0, Math.PI * 2)
    ctx.stroke()
  }

  const { ticks, labels } = SUBDIAL_SCALE[kind]
  ctx.strokeStyle = ctx.fillStyle = ink
  for (let i = 0; i < ticks; i++) {
    const major = i % (ticks === 12 ? 3 : 5) === 0
    ctx.save()
    ctx.rotate((i / ticks) * Math.PI * 2)
    ctx.lineWidth = sr * (major ? 0.035 : 0.018)
    ctx.beginPath()
    ctx.moveTo(0, -sr * (major ? 0.78 : 0.86))
    ctx.lineTo(0, -sr * 0.96)
    ctx.stroke()
    ctx.restore()
  }
  ctx.font = `600 ${sr * 0.24}px ${SANS}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  labels.forEach((label, i) => {
    const p = polar(sr * 0.55, i * 120)
    ctx.fillText(String(label), p.x, p.y)
  })
  ctx.restore()
}

function paintDateWindow(ctx: Ctx, r: number, angle: number, dist: number) {
  const c = polar(r * dist, angle)
  const [w, h] = [r * DATE_W, r * DATE_H]
  ctx.save()
  ctx.translate(c.x, c.y)
  ctx.fillStyle = 'rgba(0,0,0,0.55)'
  ctx.fillRect(-w / 2 - r * 0.008, -h / 2 - r * 0.008, w + r * 0.016, h + r * 0.016)
  // The date wheel sits below the dial, so its top edge is in shadow.
  const wheel = ctx.createLinearGradient(0, -h / 2, 0, h / 2)
  wheel.addColorStop(0, '#c9c6bf')
  wheel.addColorStop(0.25, '#f4f2ec')
  wheel.addColorStop(1, '#f4f2ec')
  ctx.fillStyle = wheel
  ctx.fillRect(-w / 2, -h / 2, w, h)
  ctx.fillStyle = '#151515'
  ctx.font = `700 ${h * 0.78}px ${SANS}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(String(new Date().getDate()), 0, h * 0.04)
  ctx.restore()
}

function paintNumerals(ctx: Ctx, r: number, d: WatchDesign, hidden: Set<number>, ink: string) {
  const { type } = d.indices
  if (type !== 'arabic' && type !== 'roman') return
  ctx.fillStyle = ink
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = type === 'arabic' ? `600 ${r * 0.17}px ${SANS}` : `400 ${r * 0.12}px ${SERIF}`
  for (let i = 0; i < 12; i++) {
    if (hidden.has(i)) continue
    const p = polar(r * (type === 'arabic' ? 0.72 : 0.76), i * 30)
    ctx.fillText(type === 'arabic' ? String(i === 0 ? 12 : i) : ROMAN[i], p.x, p.y)
  }
}

/**
 * Paints the dial face. The background layer (finish, subdials, date window) is
 * always painted; `print` adds the minute track, numerals and lettering, which the
 * 2D renderer draws as vectors instead. Fractions of the radius match both renderers.
 */
export function paintDial(d: WatchDesign, size: number, { print }: { print: boolean }) {
  const { c, ctx, r } = centeredCanvas(size)
  const layout = dialLayout(d)
  paintSurface(ctx, r, d.dial)
  for (const s of layout.subdials) paintSubdial(ctx, r, s.hour, s.kind, d.complications.subdialColor)
  if (layout.date) paintDateWindow(ctx, r, layout.date.angle, layout.date.dist)
  if (!print) return c

  const ink = d.indices.color
  if (d.indices.minuteTrack) {
    ctx.strokeStyle = ink
    ctx.globalAlpha = 0.8
    for (let i = 0; i < 60; i++) {
      ctx.save()
      ctx.rotate((i * Math.PI) / 30)
      ctx.lineWidth = r * (i % 5 === 0 ? 0.013 : 0.006)
      ctx.beginPath()
      ctx.moveTo(0, -r * (i % 5 === 0 ? 0.92 : 0.94))
      ctx.lineTo(0, -r * 0.975)
      ctx.stroke()
      ctx.restore()
    }
    ctx.globalAlpha = 1
  }
  if (d.dial.tone === 'sector') {
    // Fine printed rings where the color zones meet.
    ctx.strokeStyle = ink
    ctx.globalAlpha = 0.75
    ctx.lineWidth = r * 0.005
    for (const t of SECTOR_RING) {
      ctx.beginPath()
      ctx.arc(0, 0, r * t, 0, Math.PI * 2)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  }
  paintNumerals(ctx, r, d, layout.hiddenHours, ink)

  const { logoText, subText, logoColor, font } = d.dial
  const lines = [
    { text: logoText, line: 'logo', y: -0.4 },
    { text: subText, line: 'sub', y: layout.subTextY },
  ] as const
  ctx.fillStyle = logoColor
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  for (const { text, line, y } of lines) {
    if (!text) continue
    const f = dialTextStyle(font, r, line)
    ctx.font = `${f.weight} ${f.size}px ${f.family}`
    ctx.letterSpacing = `${f.spacing}px`
    ctx.fillText(dialText(font, text), 0, r * y)
  }
  return c
}

/**
 * What the cyclops shows: the date window and its frame, magnified to fill a
 * w × h px canvas, with a little dial around it.
 */
export function paintMagnifiedDate(w: number, h: number, dialColor: string, frameColor: string) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')
  if (!ctx) throw new Error('2D canvas is not available')
  ctx.fillStyle = shade(dialColor, -0.1)
  ctx.fillRect(0, 0, w, h)
  const frame = ctx.createLinearGradient(0, 0, w, h)
  frame.addColorStop(0, shade(frameColor, 0.4))
  frame.addColorStop(1, shade(frameColor, -0.3))
  ctx.fillStyle = frame
  ctx.fillRect(w * 0.04, h * 0.04, w * 0.92, h * 0.92)
  const [ww, wh] = [w * 0.8, h * 0.78]
  const wheel = ctx.createLinearGradient(0, (h - wh) / 2, 0, (h + wh) / 2)
  wheel.addColorStop(0, '#c9c6bf')
  wheel.addColorStop(0.25, '#f4f2ec')
  wheel.addColorStop(1, '#f4f2ec')
  ctx.fillStyle = wheel
  ctx.fillRect((w - ww) / 2, (h - wh) / 2, ww, wh)
  ctx.fillStyle = '#151515'
  ctx.font = `700 ${wh * 0.78}px ${SANS}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(String(new Date().getDate()), w / 2, h / 2 + wh * 0.04)
  return c
}

/** Glow mask for printed numerals (white on black), or null when nothing printed glows. */
export function paintLumeMask(d: WatchDesign, size: number) {
  if (d.indices.type !== 'arabic' && d.indices.type !== 'roman') return null
  const { c, ctx, r } = centeredCanvas(size)
  ctx.fillStyle = '#000000'
  ctx.fillRect(-r, -r, size, size)
  paintNumerals(ctx, r, d, dialLayout(d).hiddenHours, '#ffffff')
  return c
}

/**
 * Brushing direction for MeshPhysicalMaterial.anisotropyMap: radial grain for a
 * sunburst dial, circular grain inside subdials. RG = direction, B = strength.
 */
export function paintAnisotropy(d: WatchDesign, size: number) {
  const { c, ctx, r } = centeredCanvas(size)
  const img = ctx.createImageData(size, size)
  const subdials = dialLayout(d).subdials.map((s) => ({ ...polar(r * SUBDIAL_DIST, s.hour * 30), sr: r * SUBDIAL_R }))
  const sunburst = d.dial.finish === 'sunburst'
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const [x, y] = [px - r, py - r]
      const sub = subdials.find((s) => (x - s.x) ** 2 + (y - s.y) ** 2 < s.sr ** 2)
      // Canvas y points down, texture v points up.
      let [u, v, strength] = [0, 0, 0]
      if (sub) {
        const len = Math.hypot(x - sub.x, y - sub.y) || 1
        ;[u, v, strength] = [-(y - sub.y) / len, -(x - sub.x) / len, 1]
      } else if (sunburst) {
        const len = Math.hypot(x, y) || 1
        ;[u, v, strength] = [x / len, -y / len, 1]
      }
      const i = (py * size + px) * 4
      img.data[i] = (u * 0.5 + 0.5) * 255
      img.data[i + 1] = (v * 0.5 + 0.5) * 255
      img.data[i + 2] = strength * 255
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  return c
}
