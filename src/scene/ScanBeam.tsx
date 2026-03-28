import { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface ScanBeamProps {
  position: [number, number, number]
  width: number
  height: number
  onComplete?: () => void
  active?: boolean
}

export function ScanBeam({ position, width, height, onComplete, active = true }: ScanBeamProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const startY = position[1] + height / 2
  const endY = position[1] - height / 2
  const progressRef = useRef(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (active) {
      progressRef.current = 0
      setDone(false)
    }
  }, [active])

  useFrame((_, delta) => {
    if (!meshRef.current || done || !active) return

    progressRef.current += delta * 0.6
    if (progressRef.current >= 1) {
      progressRef.current = 1
      setDone(true)
      onComplete?.()
    }

    const y = startY + (endY - startY) * progressRef.current
    meshRef.current.position.y = y

    const mat = meshRef.current.material as THREE.MeshBasicMaterial
    const pulse = (Math.sin(Date.now() * 0.01) + 1) * 0.5
    mat.opacity = (0.6 + pulse * 0.3) * (1 - progressRef.current * 0.3)
  })

  if (done) return null

  return (
    <mesh
      ref={meshRef}
      position={[position[0], startY, position[2] + 0.08]}
    >
      <planeGeometry args={[width - 0.1, 0.04]} />
      <meshBasicMaterial
        color="#00d4ff"
        transparent
        opacity={0.8}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}
