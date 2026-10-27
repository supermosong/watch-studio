import { CanvasTexture, SRGBColorSpace } from 'three'
import type { WatchDesign } from '../../model/watchDesign'
import { polar } from '../2d/geometry'
import { DATE_H, DATE_W, dialLayout } from '../dialLayout'
import { paintMagnifiedDate } from '../dialPrint'
import { CASE_TOP, dims3d } from './dims'
import { extrude, roundedRect } from './shapes'
import { useDisposable } from './useDisposable'

const DOME_H = 0.9
const glass = { transmission: 1, ior: 1.5, roughness: 0, metalness: 0 }

/** Domed sapphire crystal (a shallow spherical cap), plus the date cyclops if chosen. */
export function Crystal3D({ design }: { design: WatchDesign }) {
  const { hasBezel, bezelInner, dialR } = dims3d(design)
  const a = hasBezel ? bezelInner + 0.5 : dialR + 1.2
  const baseZ = hasBezel ? CASE_TOP + 1.8 : CASE_TOP + 0.7
  const sphereR = (a * a + DOME_H * DOME_H) / (2 * DOME_H)
  const apexZ = baseZ + DOME_H
  const date = dialLayout(design).date

  return (
    <>
      <mesh position-z={apexZ - sphereR} rotation-x={Math.PI / 2}>
        <sphereGeometry args={[sphereR, 160, 24, 0, Math.PI * 2, 0, Math.asin(a / sphereR)]} />
        <meshPhysicalMaterial {...glass} thickness={0.6} />
      </mesh>
      {design.complications.cyclops && date && (
        <Cyclops
          design={design}
          center={polar(dialR * date.dist, date.angle)}
          // Height of the dome's surface above the date window.
          surfaceZ={apexZ - (sphereR - Math.sqrt(sphereR ** 2 - (dialR * date.dist) ** 2))}
        />
      )}
    </>
  )
}

const MAGNIFY = 2.3
const LENS_BEVEL = 0.5

/**
 * A pillow-shaped lens glued to the crystal. Inside it floats the magnified
 * image of the date window, which is what a real cyclops shows you.
 */
function Cyclops({ design, center, surfaceZ }: { design: WatchDesign; center: { x: number; y: number }; surfaceZ: number }) {
  const { dialR: r } = dims3d(design)
  const [w, h] = [r * DATE_W * MAGNIFY, r * DATE_H * MAGNIFY]
  const lens = useDisposable(
    () => extrude(roundedRect(w / 2 - LENS_BEVEL, h / 2 - LENS_BEVEL, h * 0.15), 0.25, LENS_BEVEL, 0.55, 8),
    [w, h],
  )
  const image = useDisposable(() => {
    const t = new CanvasTexture(paintMagnifiedDate(512, Math.round((512 * h) / w), design.dial.color, design.case.color))
    t.colorSpace = SRGBColorSpace
    return t
  }, [w, h, design.dial.color, design.case.color])

  return (
    <group position={[center.x, -center.y, 0]}>
      <mesh position-z={surfaceZ + 0.02}>
        <planeGeometry args={[w * 0.86, h * 0.86]} />
        <meshStandardMaterial map={image} roughness={0.5} />
      </mesh>
      {/* The extrusion spans -0.55 … 0.8; sink its base just into the crystal. */}
      <mesh geometry={lens} position-z={surfaceZ + 0.5}>
        <meshPhysicalMaterial {...glass} thickness={1.4} />
      </mesh>
    </group>
  )
}
