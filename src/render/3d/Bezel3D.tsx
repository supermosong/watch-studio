import type { WatchDesign } from '../../model/watchDesign'
import { Metal } from './Case3D'
import { CASE_TOP, dims3d } from './dims'
import { circleShape, extrude, slopedRingGeometry, withHole } from './shapes'
import { bezelInsertTexture } from './textures'
import { useDisposable } from './useDisposable'

/** Bezel ring sitting on the case top (z 1.2 … 3.2), or a slim polished lip when there is none. */
export function Bezel3D({ design }: { design: WatchDesign }) {
  const { dialR, bezelInner, bezelOuter } = dims3d(design)
  const b = design.bezel
  const hasInsert = b.type === 'dive' || b.type === 'gmt'
  const insertInner = bezelInner + 0.9
  const insertOuter = bezelOuter - 1.0

  const ring = useDisposable(
    () =>
      hasInsert
        ? extrude(withHole(circleShape(bezelOuter - 0.4), bezelInner + 0.4), 1.0, 0.4, 0.5)
        : slopedRingGeometry(bezelInner, bezelOuter, 2.0, b.type === 'fluted' ? 72 : 0, 0.35),
    [hasInsert, b.type, bezelInner, bezelOuter],
  )
  const insert = useDisposable(
    () => (hasInsert ? bezelInsertTexture(b, insertInner / insertOuter) : null),
    [hasInsert, b.type, b.insertColor, b.insertColor2, b.markingColor, insertInner, insertOuter],
  )

  if (b.type === 'none') {
    return (
      <mesh position-z={CASE_TOP}>
        <torusGeometry args={[dialR + 1.0, 0.9, 24, 160]} />
        <Metal color={design.case.color} roughness={0.1} />
      </mesh>
    )
  }

  return (
    <group>
      {/* The insert ring is an extrusion spanning -0.5 … 1.5, the sloped rings stand on 0. */}
      <mesh geometry={ring} position-z={CASE_TOP + (hasInsert ? 0.5 : 0)} castShadow receiveShadow>
        <Metal color={b.color} roughness={hasInsert ? 0.3 : 0.12} />
      </mesh>
      {hasInsert && (
        <mesh position-z={CASE_TOP + 2.01}>
          <ringGeometry args={[insertInner, insertOuter, 256, 1]} />
          <meshPhysicalMaterial map={insert} roughness={0.3} clearcoat={1} clearcoatRoughness={0.1} />
        </mesh>
      )}
    </group>
  )
}
