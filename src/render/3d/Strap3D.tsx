import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import type { WatchDesign } from '../../model/watchDesign'
import { Metal } from './Case3D'
import { CASE_MID, dims3d } from './dims'
import { bendAt, bentStrapGeometry, type StrapSpec } from './shapes'
import { strapTexture } from './textures'
import { useDisposable } from './useDisposable'

const THICKNESS = { leather: 3.2, rubber: 3.6, nato: 1.4, metal: 2.6 } as const
const ROUGHNESS = { leather: 0.6, rubber: 0.5, nato: 0.95 } as const
const LINK_PITCH = 5.5

/** Both strap halves: the bottom one is the top one turned 180° around the dial axis. */
export function Strap3D({ design }: { design: WatchDesign }) {
  const { R, strapW } = dims3d(design)
  const tonneau = design.case.shape === 'tonneau'
  const spec: StrapSpec = {
    width: strapW,
    endWidth: strapW * 0.8,
    length: 72,
    thickness: THICKNESS[design.strap.type],
    straight: R * (tonneau ? 0.4 : 0.6) + 2,
    radius: 30,
  }
  const y0 = R * (tonneau ? 0.85 : 0.75)

  return (
    <>
      {[0, Math.PI].map((rot) => (
        <group key={rot} rotation-z={rot}>
          <group position={[0, y0, CASE_MID - 0.6]}>
            {design.strap.type === 'metal' ? (
              <Bracelet spec={spec} strap={design.strap} />
            ) : (
              <SoftStrap spec={spec} strap={design.strap} holes={rot !== 0} />
            )}
          </group>
        </group>
      ))}
    </>
  )
}

function SoftStrap({ spec, strap, holes }: { spec: StrapSpec; strap: WatchDesign['strap']; holes: boolean }) {
  const { width, endWidth, length, thickness, straight, radius } = spec
  const geometry = useDisposable(
    () => bentStrapGeometry({ width, endWidth, length, thickness, straight, radius }),
    [width, endWidth, length, thickness, straight, radius],
  )
  const texture = useDisposable(
    () => strapTexture(strap, holes),
    [strap.type, strap.color, strap.accentColor, holes],
  )
  const type = strap.type === 'metal' ? 'leather' : strap.type

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshPhysicalMaterial
        map={texture}
        bumpMap={texture}
        bumpScale={type === 'nato' ? 0.6 : 1.5}
        roughness={ROUGHNESS[type]}
        sheen={type === 'leather' ? 0.4 : 0}
        sheenRoughness={0.6}
      />
    </mesh>
  )
}

/** Three-piece links (brushed outer, polished center) following the strap curve. */
function Bracelet({ spec, strap }: { spec: StrapSpec; strap: WatchDesign['strap'] }) {
  const { width, length, thickness, straight, radius } = spec
  const outerW = width * 0.31
  const centerW = width * 0.32
  const outer = useDisposable(
    () => new RoundedBoxGeometry(outerW, LINK_PITCH * 0.97, thickness, 4, 0.9),
    [outerW, thickness],
  )
  const center = useDisposable(
    () => new RoundedBoxGeometry(centerW, LINK_PITCH * 0.97, thickness * 1.1, 4, 0.9),
    [centerW, thickness],
  )
  const rows = Math.floor(length / LINK_PITCH)

  return (
    <>
      {Array.from({ length: rows }, (_, i) => {
        const s = i * LINK_PITCH + LINK_PITCH / 2
        const { y, z, angle } = bendAt(s, straight, radius)
        const taper = 1 - 0.2 * (s / length)
        return (
          <group key={i} position={[0, y, z]} rotation-x={-angle} scale-x={taper}>
            {[-1, 1].map((side) => (
              <mesh key={side} geometry={outer} position-x={side * (centerW + outerW) / 2} castShadow receiveShadow>
                <Metal color={strap.color} finish="brushed" />
              </mesh>
            ))}
            {/* Center links sit half a link out of step, like a real bracelet. */}
            <mesh geometry={center} position-y={i === 0 ? 0 : -LINK_PITCH / 2} castShadow receiveShadow>
              <Metal color={strap.accentColor} roughness={0.1} />
            </mesh>
          </group>
        )
      })}
    </>
  )
}
