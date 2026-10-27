import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import type { Group } from 'three'
import type { WatchDesign } from '../../model/watchDesign'
import { polar } from '../2d/geometry'
import { SUBDIAL_DIST, SUBDIAL_R, dialLayout } from '../dialLayout'
import { contrastInk } from '../dialPrint'
import { gmtHandParts, handParts } from '../handParts'
import { dims3d } from './dims'
import { useLumeGlow } from './night'
import { dauphineGeometry, partsGeometry } from './shapes'
import { useDisposable } from './useDisposable'

interface HandSpec {
  kind: 'hour' | 'minute' | 'gmt'
  style: WatchDesign['hands']['style']
  length: number
  width: number
  lume: boolean
}

/** Metal hand with its lume recessed into the channels cut through it. */
function HandMesh({ spec, color, lumeColor }: { spec: HandSpec; color: string; lumeColor: string }) {
  const { kind, style, length: l, width: w, lume } = spec
  const parts = useMemo(
    () => (kind === 'gmt' ? gmtHandParts(l, w) : handParts(style, kind, l, w, lume)),
    [kind, style, l, w, lume],
  )
  // Dauphine hands are faceted solids rather than flat extrusions.
  const faceted = kind !== 'gmt' && style === 'dauphine'
  const body = useDisposable(() => (faceted ? dauphineGeometry(l, w) : partsGeometry(parts.body, 0.08, 0.05)), [parts, faceted])
  const fill = useDisposable(() => partsGeometry(parts.lume, 0.06, 0), [parts])
  const glow = useLumeGlow(1.4)
  return (
    <>
      {body && (
        <mesh geometry={body} castShadow>
          <meshPhysicalMaterial color={color} metalness={0.85} roughness={0.16} />
        </mesh>
      )}
      {fill && (
        <mesh geometry={fill}>
          <meshStandardMaterial color={lumeColor} roughness={0.6} {...glow} />
        </mesh>
      )}
    </>
  )
}

/**
 * Hour, minute, GMT and seconds hands, stacked above the dial and driven by the
 * clock every frame. On a chronograph the center seconds hand is the stopwatch
 * hand, so it rests at 12 and the small seconds subdial runs instead.
 */
export function Hands3D({ design }: { design: WatchDesign }) {
  const { dialR: r } = dims3d(design)
  const { style, color, secondsColor, lume } = design.hands
  const { gmt, gmtColor, subdialColor } = design.complications
  const layout = dialLayout(design)
  const chrono = layout.subdials.length > 0
  const hour = useRef<Group>(null)
  const minute = useRef<Group>(null)
  const gmtHand = useRef<Group>(null)
  const second = useRef<Group>(null)
  const smallSecond = useRef<Group>(null)
  const lumeColor = design.indices.color

  useFrame(() => {
    const now = new Date()
    // Mechanical sweep: 8 small steps per second.
    const s = now.getSeconds() + Math.floor(now.getMilliseconds() / 125) / 8
    const m = now.getMinutes() + s / 60
    const h24 = now.getHours() + m / 60
    const secondsAngle = (-s * Math.PI) / 30
    if (hour.current) hour.current.rotation.z = (-(h24 % 12) * Math.PI) / 6
    if (minute.current) minute.current.rotation.z = (-m * Math.PI) / 30
    if (gmtHand.current) gmtHand.current.rotation.z = (-h24 * Math.PI) / 12
    if (second.current) second.current.rotation.z = chrono ? 0 : secondsAngle
    if (smallSecond.current) smallSecond.current.rotation.z = secondsAngle
  })

  const sr = r * SUBDIAL_R
  const subInk = contrastInk(subdialColor)
  const hub = (radius: number, c: string) => (
    <mesh rotation-x={Math.PI / 2} position-z={0.05}>
      <cylinderGeometry args={[radius, radius, 0.2, 32]} />
      <meshPhysicalMaterial color={c} metalness={0.85} roughness={0.16} />
    </mesh>
  )

  return (
    <group>
      {layout.subdials.map((sub) => {
        const p = polar(r * SUBDIAL_DIST, sub.hour * 30)
        return (
          <group key={sub.hour} position={[p.x, -p.y, 0.2]} ref={sub.kind === 'seconds' ? smallSecond : undefined}>
            <mesh position-y={sr * 0.32} castShadow>
              <boxGeometry args={[0.16, sr * 0.88, 0.06]} />
              <meshPhysicalMaterial color={subInk} metalness={0.5} roughness={0.3} />
            </mesh>
            <mesh rotation-x={Math.PI / 2} position-z={0.05}>
              <cylinderGeometry args={[0.28, 0.28, 0.15, 24]} />
              <meshPhysicalMaterial color={subInk} metalness={0.7} roughness={0.2} />
            </mesh>
          </group>
        )
      })}
      <group ref={hour} position-z={0.45}>
        <HandMesh spec={{ kind: 'hour', style, length: r * 0.52, width: r * 0.085, lume }} color={color} lumeColor={lumeColor} />
        {hub(r * 0.06, color)}
      </group>
      {gmt && (
        <group ref={gmtHand} position-z={0.62}>
          <HandMesh spec={{ kind: 'gmt', style, length: r * 0.93, width: r * 0.05, lume: true }} color={gmtColor} lumeColor={lumeColor} />
        </group>
      )}
      <group ref={minute} position-z={0.8}>
        <HandMesh spec={{ kind: 'minute', style, length: r * 0.82, width: r * 0.065, lume }} color={color} lumeColor={lumeColor} />
        {hub(r * 0.05, color)}
      </group>
      <group ref={second} position-z={1.05}>
        <mesh position-y={r * 0.35} castShadow>
          <boxGeometry args={[0.2, r * 1.1, 0.08]} />
          <meshPhysicalMaterial color={secondsColor} metalness={0.5} roughness={0.3} />
        </mesh>
        <mesh position-y={-r * 0.15} rotation-x={Math.PI / 2} castShadow>
          <cylinderGeometry args={[r * 0.035, r * 0.035, 0.1, 24]} />
          <meshPhysicalMaterial color={secondsColor} metalness={0.5} roughness={0.3} />
        </mesh>
        <mesh rotation-x={Math.PI / 2} position-z={0.1}>
          <cylinderGeometry args={[r * 0.04, r * 0.04, 0.3, 32]} />
          <meshPhysicalMaterial color={secondsColor} metalness={0.7} roughness={0.2} />
        </mesh>
      </group>
    </group>
  )
}
