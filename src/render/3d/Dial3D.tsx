import { useContext } from 'react'
import { Shape, Vector2 } from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import type { WatchDesign } from '../../model/watchDesign'
import { polar } from '../2d/geometry'
import { DATE_H, DATE_W, SUBDIAL_DIST, SUBDIAL_R, dialLayout } from '../dialLayout'
import { Metal } from './Case3D'
import { dims3d } from './dims'
import { LUME, NightContext, useLumeGlow } from './night'
import { extrude } from './shapes'
import { dialAnisotropyTexture, dialLumeTexture, dialTexture } from './textures'
import { useDisposable } from './useDisposable'

const INDEX_H = 0.35

/** Surface response for each dial finish. */
const FINISH = {
  sunburst: { metalness: 0.45, roughness: 0.32, clearcoat: 0.3, bump: 0 },
  plain: { metalness: 0, roughness: 0.55, clearcoat: 0.15, bump: 0 },
  guilloche: { metalness: 0.35, roughness: 0.3, clearcoat: 0.3, bump: 2 },
  carbon: { metalness: 0.1, roughness: 0.45, clearcoat: 1, bump: 1 },
} as const

/** Converts a 2D (y-down) dial position to 3D (y-up). */
const at = (r: number, deg: number): [number, number] => {
  const p = polar(r, deg)
  return [p.x, -p.y]
}

/** Dial disc with its printed texture, raised hour markers, subdial rings and date frame. */
export function Dial3D({ design }: { design: WatchDesign }) {
  const { dialR: r } = dims3d(design)
  const { dial, indices, complications } = design
  const night = useContext(NightContext)
  const layout = dialLayout(design)
  // Only what the textures paint; other edits must not repaint them.
  const paintDeps = [dial.color, dial.finish, dial.logoText, dial.logoColor, indices.type, indices.color, indices.minuteTrack, complications.date, complications.chrono, complications.subdialColor]
  const texture = useDisposable(() => dialTexture(design), paintDeps)
  const anisotropy = useDisposable(() => dialAnisotropyTexture(design), [dial.finish, complications.chrono])
  const lumeMap = useDisposable(() => dialLumeTexture(design), [indices.type, complications.date, complications.chrono])
  const finish = FINISH[dial.finish]

  return (
    <group>
      <mesh receiveShadow>
        <circleGeometry args={[r, 160]} />
        <meshPhysicalMaterial
          map={texture}
          metalness={finish.metalness}
          roughness={finish.roughness}
          clearcoat={finish.clearcoat}
          clearcoatRoughness={0.15}
          anisotropy={0.9}
          anisotropyMap={anisotropy}
          bumpMap={finish.bump ? texture : null}
          bumpScale={finish.bump}
          emissive={LUME}
          emissiveMap={lumeMap}
          emissiveIntensity={night && lumeMap ? 1.4 : 0}
        />
      </mesh>
      {indices.type === 'baton' && <Batons r={r} ink={indices.color} hidden={layout.hiddenHours} />}
      {indices.type === 'dots' && <Dots r={r} ink={indices.color} metal={design.case.color} hidden={layout.hiddenHours} />}
      {layout.subdials.map((s) => (
        <mesh key={s.hour} position={[...at(r * SUBDIAL_DIST, s.hour * 30), 0.04]}>
          <torusGeometry args={[r * SUBDIAL_R, 0.07, 12, 96]} />
          <Metal color={design.case.color} roughness={0.12} />
        </mesh>
      ))}
      {layout.date && <DateFrame r={r} angle={layout.date.angle} dist={layout.date.dist} metal={design.case.color} />}
    </group>
  )
}

/** Polished metal surround for the date window. */
function DateFrame({ r, angle, dist, metal }: { r: number; angle: number; dist: number; metal: string }) {
  const [w, h, rim] = [r * DATE_W, r * DATE_H, 0.22]
  const frame = useDisposable(() => {
    const rect = (hw: number, hh: number) => [
      new Vector2(-hw, -hh),
      new Vector2(hw, -hh),
      new Vector2(hw, hh),
      new Vector2(-hw, hh),
    ]
    const outline = new Shape(rect(w / 2 + rim, h / 2 + rim))
    outline.holes.push(new Shape(rect(w / 2, h / 2).reverse()))
    return extrude(outline, 0.1, 0.04, 0.04, 2)
  }, [w, h])
  return (
    <mesh geometry={frame} position={[...at(r * dist, angle), 0.04]} castShadow>
      <Metal color={metal} roughness={0.12} />
    </mesh>
  )
}

function Batons({ r, ink, hidden }: { r: number; ink: string; hidden: Set<number> }) {
  const w = r * 0.045
  const bar = useDisposable(() => new RoundedBoxGeometry(w, r * 0.17, INDEX_H, 2, w * 0.25), [w, r])
  const glow = useLumeGlow()
  return (
    <>
      {Array.from({ length: 12 }, (_, i) =>
        hidden.has(i) ? null : (
          <group key={i} rotation-z={(-i * Math.PI) / 6}>
            {(i === 0 ? [-w * 0.9, w * 0.9] : [0]).map((dx) => (
              <mesh key={dx} geometry={bar} position={[dx, r * 0.815, INDEX_H / 2]} castShadow>
                <meshPhysicalMaterial color={ink} metalness={0.6} roughness={0.22} {...glow} />
              </mesh>
            ))}
          </group>
        ),
      )}
    </>
  )
}

/** Diver layout: lume dots in metal surrounds, bars at 3/6/9 and a triangle at 12. */
function Dots({ r, ink, metal, hidden }: { r: number; ink: string; metal: string; hidden: Set<number> }) {
  const s = r * 0.07
  const triangle = useDisposable(
    () =>
      extrude(
        new Shape([new Vector2(-s, r * 0.9), new Vector2(0, r * 0.72), new Vector2(s, r * 0.9)]),
        INDEX_H - 0.1,
        0.05,
      ),
    [s, r],
  )
  const bar = useDisposable(() => new RoundedBoxGeometry(r * 0.06, r * 0.18, INDEX_H, 2, r * 0.012), [r])
  const glow = useLumeGlow()
  const lume = <meshStandardMaterial color={ink} roughness={0.6} {...glow} />

  return (
    <>
      {Array.from({ length: 12 }, (_, i) =>
        hidden.has(i) ? null : (
          <group key={i} rotation-z={(-i * Math.PI) / 6}>
            {i === 0 ? (
              <mesh geometry={triangle} position-z={0.05} castShadow>
                {lume}
              </mesh>
            ) : i % 3 === 0 ? (
              <mesh geometry={bar} position={[0, r * 0.81, INDEX_H / 2]} castShadow>
                {lume}
              </mesh>
            ) : (
              <group position={[0, r * 0.82, 0]} rotation-x={Math.PI / 2}>
                <mesh position-y={0.15} castShadow>
                  <cylinderGeometry args={[r * 0.055 + 0.18, r * 0.055 + 0.18, 0.3, 40]} />
                  <Metal color={metal} roughness={0.15} />
                </mesh>
                <mesh position-y={0.32}>
                  <cylinderGeometry args={[r * 0.055, r * 0.055, 0.06, 40]} />
                  {lume}
                </mesh>
              </group>
            )}
          </group>
        ),
      )}
    </>
  )
}
