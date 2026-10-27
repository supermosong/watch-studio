import { Environment, Lightformer, OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import type { Ref } from 'react'
import type { WatchDesign } from '../../model/watchDesign'
import { Bezel3D } from './Bezel3D'
import { Case3D } from './Case3D'
import { Crystal3D } from './Crystal3D'
import { Dial3D } from './Dial3D'
import { Hands3D } from './Hands3D'
import { NightContext } from './night'
import { Strap3D } from './Strap3D'

/**
 * Studio lighting. Metal is mostly reflection, so the light panels in the
 * environment map matter more than the lights themselves. No downloads needed.
 */
function Studio({ night }: { night: boolean }) {
  return (
    <>
      <ambientLight intensity={night ? 0 : 0.15} />
      <directionalLight
        position={[-30, 50, 90]}
        intensity={night ? 0.04 : 1.6}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-radius={4}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      >
        <orthographicCamera attach="shadow-camera" args={[-60, 60, 60, -60, 1, 300]} />
      </directionalLight>
      <Environment resolution={512} environmentIntensity={night ? 0.05 : 1}>
        <color attach="background" args={['#151517']} />
        {/* Rim lights so case sides and the caseback hold an edge when the watch is rotated. */}
        <Lightformer form="rect" intensity={1.5} position={[-9, 2, -4]} scale={[1.5, 10, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1.2} position={[9, -2, -4]} scale={[1.5, 10, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={2.5} position={[0, 6, 6]} scale={[12, 4, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={3} position={[-7, 0, 4]} scale={[1.5, 10, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1.5} position={[7, 1, 3]} scale={[1.5, 10, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={0.8} position={[0, -6, 6]} scale={[10, 2, 1]} target={[0, 0, 0]} />
        {/* Broad, dim panel behind the camera so polished faces toward the viewer don't turn black. */}
        <Lightformer form="rect" intensity={0.35} position={[0, 0, 10]} scale={[24, 24, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1} position={[0, 4, -8]} scale={[10, 4, 1]} target={[0, 0, 0]} />
      </Environment>
    </>
  )
}

interface Props {
  design: WatchDesign
  /** Lights off: only the lume glows. */
  night?: boolean
  /** The WebGL canvas, for PNG export. */
  ref?: Ref<HTMLCanvasElement>
}

export default function Watch3D({ design, night = false, ref }: Props) {
  return (
    <Canvas
      ref={ref}
      shadows="percentage"
      dpr={[1, 2]}
      gl={{ preserveDrawingBuffer: true }}
      camera={{ position: [40, -28, 175], fov: 26, near: 1, far: 1000 }}
    >
      <Studio night={night} />
      <NightContext value={night}>
        <Strap3D design={design} />
        <Case3D design={design} />
        <Bezel3D design={design} />
        <Dial3D design={design} />
        <Hands3D design={design} />
        <Crystal3D design={design} />
      </NightContext>
      <OrbitControls makeDefault enablePan={false} enableDamping minDistance={45} maxDistance={300} target={[0, 0, -4]} />
    </Canvas>
  )
}
