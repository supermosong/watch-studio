import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'
import type { WatchDesign } from '../../model/watchDesign'
import { polar } from '../2d/geometry'
import { SUBDIAL_DIST, SUBDIAL_R, dialLayout } from '../dialLayout'
import { contrastInk } from '../dialPrint'
import { dims3d } from './dims'
import { useLumeGlow } from './night'
import { dauphineGeometry, extrude, handShape } from './shapes'
import { useDisposable } from './useDisposable'

function useHandGeometry(style: WatchDesign['hands']['style'], l: number, w: number) {
  return useDisposable(
    () => (style === 'dauphine' ? dauphineGeometry(l, w) : extrude(handShape(style, l, w), 0.08, 0.05, 0.05, 2)),
    [style, l, w],
  )
}

/**
 * Hour, minute and seconds hands, stacked above the dial and driven by the clock
 * every frame. On a chronograph the center seconds hand is the stopwatch hand,
 * so it rests at 12 and the small seconds subdial runs instead.
 */
export function Hands3D({ design }: { design: WatchDesign }) {
  const { dialR: r } = dims3d(design)
  const { style, color, secondsColor } = design.hands
  const layout = dialLayout(design)
  const chrono = layout.subdials.length > 0
  const hour = useRef<Group>(null)
  const minute = useRef<Group>(null)
  const second = useRef<Group>(null)
  const smallSecond = useRef<Group>(null)
  const hourGeo = useHandGeometry(style, r * 0.52, r * 0.085)
  const minuteGeo = useHandGeometry(style, r * 0.82, r * 0.065)
  const glow = useLumeGlow(1.2)

  useFrame(() => {
    const now = new Date()
    // Mechanical sweep: 8 small steps per second.
    const s = now.getSeconds() + Math.floor(now.getMilliseconds() / 125) / 8
    const m = now.getMinutes() + s / 60
    const h = (now.getHours() % 12) + m / 60
    const secondsAngle = (-s * Math.PI) / 30
    if (hour.current) hour.current.rotation.z = (-h * Math.PI) / 6
    if (minute.current) minute.current.rotation.z = (-m * Math.PI) / 30
    if (second.current) second.current.rotation.z = chrono ? 0 : secondsAngle
    if (smallSecond.current) smallSecond.current.rotation.z = secondsAngle
  })

  const handMaterial = <meshPhysicalMaterial color={color} metalness={0.85} roughness={0.16} {...glow} />
  const hub = (radius: number) => (
    <mesh rotation-x={Math.PI / 2} position-z={0.05}>
      <cylinderGeometry args={[radius, radius, 0.2, 32]} />
      {handMaterial}
    </mesh>
  )
  const sr = r * SUBDIAL_R
  const subInk = contrastInk(design.complications.subdialColor)

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
        <mesh geometry={hourGeo} castShadow>
          {handMaterial}
        </mesh>
        {hub(r * 0.06)}
      </group>
      <group ref={minute} position-z={0.75}>
        <mesh geometry={minuteGeo} castShadow>
          {handMaterial}
        </mesh>
        {hub(r * 0.05)}
      </group>
      <group ref={second} position-z={1.0}>
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
