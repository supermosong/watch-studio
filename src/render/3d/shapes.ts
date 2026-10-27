import { BoxGeometry, BufferGeometry, ExtrudeGeometry, Float32BufferAttribute, Path, Shape, Vector2 } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { WatchDesign } from '../../model/watchDesign'
import type { HandPart } from '../handParts'

const TAU = Math.PI * 2

export function circleShape(r: number) {
  const s = new Shape()
  s.absarc(0, 0, r, 0, TAU, false)
  return s
}

export function withHole(shape: Shape, r: number) {
  const hole = new Path()
  hole.absarc(0, 0, r, 0, TAU, true)
  shape.holes.push(hole)
  return shape
}

export function roundedRect(halfW: number, halfH: number, radius: number) {
  const [w, h, r] = [halfW, halfH, radius]
  const s = new Shape()
  s.moveTo(-w + r, -h)
  s.lineTo(w - r, -h)
  s.absarc(w - r, -h + r, r, -Math.PI / 2, 0, false)
  s.lineTo(w, h - r)
  s.absarc(w - r, h - r, r, 0, Math.PI / 2, false)
  s.lineTo(-w + r, h)
  s.absarc(-w + r, h - r, r, Math.PI / 2, Math.PI, false)
  s.lineTo(-w, -h + r)
  s.absarc(-w + r, -h + r, r, Math.PI, Math.PI * 1.5, false)
  return s
}

const roundedSquare = (half: number, radius: number) => roundedRect(half, half, radius)

/** Case outline whose 3 o'clock edge is `extent` from the center. */
export function caseOutline(shape: WatchDesign['case']['shape'], extent: number): Shape {
  switch (shape) {
    case 'round':
      return circleShape(extent)
    case 'cushion':
      return roundedSquare(extent, extent * 0.45)
    case 'square':
      return roundedSquare(extent, extent * 0.18)
    case 'tonneau': {
      // Same barrel as the 2D renderer, scaled so its widest point equals `extent`.
      const [w, h, bulge, dome] = [0.82, 1.08, 1.12, 1.18].map((k) => (k * extent) / 0.97)
      const s = new Shape()
      s.moveTo(-w, -h)
      s.quadraticCurveTo(0, -dome, w, -h)
      s.quadraticCurveTo(bulge, 0, w, h)
      s.quadraticCurveTo(0, dome, -w, h)
      s.quadraticCurveTo(-bulge, 0, -w, -h)
      return s
    }
  }
}

/** Circle with `teeth` rounded grooves cut `depth` deep: fluted bezels and knurled crowns. */
export function gearShape(r: number, teeth: number, depth: number, pointsPerTooth = 8) {
  const n = teeth * pointsPerTooth
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * TAU
    const rr = r - depth * (0.5 - 0.5 * Math.cos(teeth * a))
    return new Vector2(rr * Math.cos(a), rr * Math.sin(a))
  })
  return new Shape(pts)
}

export function extrude(shape: Shape, depth: number, bevelSize: number, bevelThickness = bevelSize, bevelSegments = 4) {
  return new ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSize,
    bevelThickness,
    bevelSegments,
    curveSegments: 96,
  })
}

/**
 * Bezel ring standing on z = 0 with a top that slopes down toward the outer edge.
 * `teeth` radial grooves `depth` deep are cut across the top (0 = smooth bezel).
 */
export function slopedRingGeometry(inner: number, outer: number, height: number, teeth: number, depth: number) {
  // Cross-section from the inner foot, over the top, to the outer foot: [radius, z, grooved].
  const profile: [number, number, number][] = [[inner, 0, 0], [inner, height * 0.8, 0]]
  for (let j = 0; j <= 6; j++) {
    const t = j / 6
    profile.push([inner + 0.4 + t * (outer - inner - 0.8), height * (1 - 0.35 * t), 1])
  }
  profile.push([outer, height * 0.4, 0.5], [outer, 0, 0])

  const P = profile.length
  const segments = Math.max(teeth, 30) * 8
  const positions: number[] = []
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * TAU
    const groove = teeth ? 0.5 - 0.5 * Math.cos(teeth * a) : 0
    for (const [r, z, grooved] of profile) {
      positions.push(r * Math.cos(a), r * Math.sin(a), z - depth * grooved * groove)
    }
  }
  const index: number[] = []
  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments
    for (let k = 0; k < P - 1; k++) {
      const [a, b, c, d] = [i * P + k, next * P + k, next * P + k + 1, i * P + k + 1]
      index.push(a, d, c, a, c, b)
    }
  }
  const geo = new BufferGeometry()
  geo.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geo.setIndex(index)
  geo.computeVertexNormals()
  return geo
}

function partShape(part: HandPart): Shape {
  if (part.kind === 'poly') {
    const s = new Shape(part.points.map(([x, y]) => new Vector2(x, y)))
    for (const hole of part.holes ?? []) s.holes.push(new Path(hole.map(([x, y]) => new Vector2(x, y))))
    return s
  }
  const s = new Shape()
  s.absarc(part.cx, part.cy, part.r, 0, TAU, false)
  if (part.hole) {
    const hole = new Path()
    hole.absarc(part.cx, part.cy, part.hole, 0, TAU, true)
    s.holes.push(hole)
  }
  return s
}

/** Extrudes hand outlines (see handParts) into one geometry, or null when there are none. */
export function partsGeometry(parts: HandPart[], depth: number, bevel: number) {
  if (!parts.length) return null
  const pieces = parts.map((p) =>
    bevel > 0
      ? extrude(partShape(p), depth, bevel, bevel, 2)
      : new ExtrudeGeometry(partShape(p), { depth, bevelEnabled: false, curveSegments: 48 }),
  )
  const merged = mergeGeometries(pieces)
  for (const piece of pieces) piece.dispose()
  return merged
}

/** Dauphine hand: four flat facets meeting at a raised center ridge, so it catches light two-tone. */
export function dauphineGeometry(l: number, w: number) {
  const tip = [0, l, 0]
  const tail = [0, -0.1 * l, 0]
  const left = [-0.6 * w, 0, 0]
  const right = [0.6 * w, 0, 0]
  const ridge = [0, 0, w * 0.35]
  const faces = [
    [left, ridge, tip],
    [ridge, right, tip],
    [left, tail, ridge],
    [tail, right, ridge],
    [left, tip, right],
    [left, right, tail],
  ]
  const geo = new BufferGeometry()
  geo.setAttribute('position', new Float32BufferAttribute(faces.flat(2), 3))
  geo.computeVertexNormals()
  return geo
}

/**
 * Where a strap is at distance `s` along its length: straight for `straight` mm,
 * then curving back away from the viewer like a strap around a wrist.
 */
export function bendAt(s: number, straight: number, radius: number) {
  if (s <= straight) return { y: s, z: 0, angle: 0 }
  const angle = (s - straight) / radius
  return { y: straight + radius * Math.sin(angle), z: -radius * (1 - Math.cos(angle)), angle }
}

export interface StrapSpec {
  width: number
  endWidth: number
  length: number
  thickness: number
  straight: number
  radius: number
}

/** A tapered box bent along `bendAt`, starting at the origin and running toward +Y. */
export function bentStrapGeometry(o: StrapSpec) {
  const geo = new BoxGeometry(1, o.length, o.thickness, 1, 96, 1)
  geo.translate(0, o.length / 2, 0)
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const s = pos.getY(i)
    const t = pos.getZ(i)
    const { y, z, angle } = bendAt(s, o.straight, o.radius)
    const w = o.width + (o.endWidth - o.width) * (s / o.length)
    pos.setXYZ(i, pos.getX(i) * w, y + Math.sin(angle) * t, z + Math.cos(angle) * t)
  }
  geo.computeVertexNormals()
  return geo
}
