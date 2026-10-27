import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import type { WatchDesign } from '../../model/watchDesign'
import { CASE_MID, dims3d } from './dims'
import { caseOutline, extrude, gearShape, withHole } from './shapes'
import { useDisposable } from './useDisposable'

const BEVEL = 1
const CROWN = { small: [1.8, 2.2], medium: [2.4, 2.8], large: [3.0, 3.4] } as const

type Finish = WatchDesign['case']['finish']
const FINISH: Record<Finish, { roughness: number; anisotropy: number }> = {
  polished: { roughness: 0.14, anisotropy: 0 },
  // Brushing streaks the highlight along one direction.
  brushed: { roughness: 0.3, anisotropy: 0.8 },
  matte: { roughness: 0.5, anisotropy: 0 },
}

/**
 * Metal; reflections come from the studio environment map. A `finish` sets the
 * surface for case parts, otherwise `roughness` does.
 */
export function Metal({ color, roughness = 0.18, finish }: { color: string; roughness?: number; finish?: Finish }) {
  const surface = finish ? FINISH[finish] : { roughness, anisotropy: 0 }
  return <meshPhysicalMaterial color={color} metalness={1} {...surface} />
}

/** Chronograph pushers at 2 and 4 o'clock, pointing out from the case side. */
function Pushers({ design }: { design: WatchDesign }) {
  const { R } = dims3d(design)
  const round = design.case.shape === 'round'
  const { color, finish } = design.case
  return (
    <>
      {[1, -1].map((sy) => {
        // Round cases get radial pushers on the rim; flat-sided cases get horizontal ones.
        const angle = round ? (sy * Math.PI) / 6 : 0
        const base = round ? [R * Math.cos(angle), R * Math.sin(angle)] : [design.case.shape === 'tonneau' ? R * 0.94 : R, sy * R * 0.5]
        const out = (d: number): [number, number, number] => [base[0] + Math.cos(angle) * d, base[1] + Math.sin(angle) * d, CASE_MID]
        return (
          <group key={sy}>
            <mesh position={out(1)} rotation-z={angle - Math.PI / 2} castShadow>
              <cylinderGeometry args={[0.9, 0.9, 3, 24]} />
              <Metal color={color} finish={finish} />
            </mesh>
            <mesh position={out(3)} rotation-z={angle - Math.PI / 2} castShadow>
              <cylinderGeometry args={[1.5, 1.5, 1.6, 32]} />
              <Metal color={color} roughness={0.14} />
            </mesh>
          </group>
        )
      })}
    </>
  )
}

/** Case body (with the dial opening), caseback, lugs, crown and crown guards. */
export function Case3D({ design }: { design: WatchDesign }) {
  const { R, dialR, strapW } = dims3d(design)
  const { shape, color, finish } = design.case
  const [crownR, crownLen] = CROWN[design.crown.size]

  // Spans z = -7.2 … 1.2 once positioned at z = -6.
  const body = useDisposable(
    () => extrude(withHole(caseOutline(shape, R - BEVEL), dialR + 1.4), 6, BEVEL, 1.2, 6),
    [shape, R, dialR],
  )
  const lugLen = R * 0.5
  const lug = useDisposable(() => new RoundedBoxGeometry(3.2, lugLen, 4.6, 5, 1.3), [lugLen])
  const crown = useDisposable(() => extrude(gearShape(crownR, 24, 0.25), crownLen, 0.2), [crownR, crownLen])
  const guardW = crownLen * 0.9 + 2
  const guard = useDisposable(() => new RoundedBoxGeometry(guardW, crownR * 0.9, 4, 4, 0.6), [guardW, crownR])

  return (
    <group>
      <mesh geometry={body} position-z={-6} castShadow receiveShadow>
        <Metal color={color} finish={finish} />
      </mesh>
      <mesh position-z={-7.6} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[R * 0.8, R * 0.82, 1.6, 96]} />
        <Metal color={color} roughness={0.35} />
      </mesh>

      {shape !== 'tonneau' &&
        [-1, 1].flatMap((sx) =>
          [-1, 1].map((sy) => (
            <mesh
              key={`${sx}${sy}`}
              geometry={lug}
              position={[sx * (strapW / 2 + 1.8), sy * (R * 0.72 + lugLen / 2), CASE_MID + 0.2]}
              rotation-x={-sy * 0.25}
              castShadow
              receiveShadow
            >
              <Metal color={color} finish={finish} />
            </mesh>
          )),
        )}

      {design.complications.chrono !== 'none' && <Pushers design={design} />}

      <mesh position={[R, 0, CASE_MID]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.9, 0.9, 2.4, 24]} />
        <Metal color={color} />
      </mesh>
      <mesh geometry={crown} position={[R + 0.6, 0, CASE_MID]} rotation-y={Math.PI / 2} castShadow>
        <Metal color={color} roughness={0.25} />
      </mesh>

      {design.crown.guards &&
        [-1, 1].map((sy) => (
          <mesh key={sy} geometry={guard} position={[R + guardW / 2 - 1.5, sy * crownR * 1.5, CASE_MID]} castShadow>
            <Metal color={color} roughness={0.22} />
          </mesh>
        ))}
    </group>
  )
}
