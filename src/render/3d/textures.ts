import { CanvasTexture, NoColorSpace, SRGBColorSpace } from 'three'
import { shade } from '../../lib/color'
import type { WatchDesign } from '../../model/watchDesign'
import { paintAnisotropy, paintDial, paintLumeMask } from '../dialPrint'
import { SANS } from '../typography'

function canvas2d(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')
  if (!ctx) throw new Error('2D canvas is not available')
  return { c, ctx }
}

function toTexture(c: HTMLCanvasElement, color = true) {
  const t = new CanvasTexture(c)
  t.colorSpace = color ? SRGBColorSpace : NoColorSpace
  t.anisotropy = 8
  return t
}

/** Everything printed on the dial. Applied (3D) indices are separate meshes. */
export function dialTexture(d: WatchDesign) {
  return toTexture(paintDial(d, 2048, { print: true }))
}

/** Emissive mask for printed numerals in night mode, or null when there are none. */
export function dialLumeTexture(d: WatchDesign) {
  const c = paintLumeMask(d, 1024)
  return c && toTexture(c)
}

/** Direction data for the sunburst / azurage sheen (linear, not a color). */
export function dialAnisotropyTexture(d: WatchDesign) {
  return toTexture(paintAnisotropy(d, 512), false)
}

/** 60-minute dive scale for a RingGeometry whose inner radius is `innerFrac` of its outer radius. */
export function diveInsertTexture(b: WatchDesign['bezel'], innerFrac: number, size = 2048) {
  const { c, ctx } = canvas2d(size, size)
  const r = size / 2
  ctx.translate(r, r)
  const inner = r * innerFrac
  const band = r - inner
  const mid = (r + inner) / 2

  ctx.fillStyle = b.insertColor
  ctx.fillRect(-r, -r, size, size)
  ctx.fillStyle = b.markingColor
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `700 ${band * 0.55}px ${SANS}`
  for (let i = 0; i < 60; i++) {
    ctx.save()
    ctx.rotate((i * Math.PI) / 30)
    if (i === 0) {
      ctx.beginPath()
      ctx.moveTo(-band * 0.38, -r * 0.97)
      ctx.lineTo(band * 0.38, -r * 0.97)
      ctx.lineTo(0, -inner * 1.04)
      ctx.fill()
    } else if (i % 10 === 0) {
      ctx.fillText(String(i), 0, -mid)
    } else if (i % 5 === 0) {
      ctx.fillRect(-band * 0.06, -(mid + band * 0.3), band * 0.12, band * 0.6)
    } else if (i < 15) {
      ctx.fillRect(-band * 0.025, -r * 0.97, band * 0.05, band * 0.32)
    }
    ctx.restore()
  }
  return toTexture(c)
}

/**
 * Surface of a strap half. u runs across the width, v along the length
 * (canvas top = the free end). `holes` adds buckle holes for the bottom half.
 */
export function strapTexture(s: WatchDesign['strap'], holes: boolean, w = 512, h = 2048) {
  const { c, ctx } = canvas2d(w, h)
  ctx.fillStyle = s.color
  ctx.fillRect(0, 0, w, h)

  if (s.type === 'leather') {
    for (let i = 0; i < 40000; i++) {
      ctx.fillStyle = Math.random() < 0.5 ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.05)'
      ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2)
    }
    ctx.strokeStyle = s.accentColor
    ctx.lineWidth = w * 0.014
    ctx.setLineDash([h * 0.011, h * 0.007])
    for (const x of [w * 0.09, w * 0.91]) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, h)
      ctx.stroke()
    }
    ctx.setLineDash([])
  }

  if (s.type === 'rubber') {
    for (let y = 0; y < h; y += h * 0.03) {
      ctx.fillStyle = shade(s.color, -0.35)
      ctx.fillRect(0, y, w, h * 0.008)
      ctx.fillStyle = shade(s.color, 0.12)
      ctx.fillRect(0, y + h * 0.008, w, h * 0.003)
    }
  }

  if (s.type === 'nato') {
    ctx.fillStyle = s.accentColor
    for (const x of [0.28, 0.72]) ctx.fillRect(w * (x - 0.045), 0, w * 0.09, h)
    // Woven fabric: fine lines both ways.
    ctx.fillStyle = 'rgba(0,0,0,0.12)'
    for (let x = 0; x < w; x += 4) ctx.fillRect(x, 0, 1.5, h)
    ctx.fillStyle = 'rgba(255,255,255,0.05)'
    for (let y = 0; y < h; y += 6) ctx.fillRect(0, y, w, 2)
  }

  if (holes && s.type !== 'nato') {
    ctx.fillStyle = shade(s.color, -0.75)
    for (let i = 0; i < 5; i++) {
      ctx.beginPath()
      ctx.ellipse(w / 2, h * (0.2 + i * 0.06), w * 0.04, w * 0.04, 0, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  return toTexture(c)
}
