import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface ConnectionBeamProps {
  start: [number, number, number]
  end: [number, number, number]
  color?: string
  broken?: boolean
  animated?: boolean
  thickness?: number
}

export function ConnectionBeam({
  start,
  end,
  color = '#4a9eff',
  broken = false,
  animated = true,
  thickness = 0.025,
}: ConnectionBeamProps) {
  const lineRef = useRef<THREE.Mesh>(null)
  const progressRef = useRef(0)

  const { midpoint, length, rotation } = useMemo(() => {
    const s = new THREE.Vector3(...start)
    const e = new THREE.Vector3(...end)
    const midpoint = new THREE.Vector3().addVectors(s, e).multiplyScalar(0.5)
    const length = s.distanceTo(e)
    const direction = new THREE.Vector3().subVectors(e, s).normalize()
    const quaternion = new THREE.Quaternion()
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction)
    const euler = new THREE.Euler().setFromQuaternion(quaternion)
    return { midpoint, length, rotation: euler }
  }, [start, end])

  useFrame((state, delta) => {
    if (!lineRef.current) return
    const t = state.clock.elapsedTime

    if (animated && progressRef.current < 1) {
      progressRef.current += delta * 0.8
    }

    const mat = lineRef.current.material as THREE.MeshBasicMaterial

    if (broken) {
      const flicker = Math.sin(t * 12) * 0.5 + 0.5
      mat.opacity = 0.2 + flicker * 0.3
      mat.color.set('#ff4444')
    } else {
      const pulse = (Math.sin(t * 2) + 1) * 0.5
      mat.opacity = (0.4 + pulse * 0.2) * progressRef.current
      mat.color.set(color)
    }

    // Animate draw-in
    lineRef.current.scale.y = progressRef.current
  })

  return (
    <mesh
      ref={lineRef}
      position={midpoint.toArray()}
      rotation={rotation}
    >
      <cylinderGeometry args={[thickness, thickness, length, 6, 1]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}
