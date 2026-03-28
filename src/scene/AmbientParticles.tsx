import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAppStore } from '../store/useAppStore'

const COUNT = 180

export function AmbientParticles() {
  const mesh = useRef<THREE.Points>(null)
  const scene = useAppStore((s) => s.scene)

  const { positions, velocities } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3)
    const velocities = new Float32Array(COUNT * 3)
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 40
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30
      velocities[i * 3]     = (Math.random() - 0.5) * 0.002
      velocities[i * 3 + 1] = Math.random() * 0.003 + 0.001
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.002
    }
    return { positions, velocities }
  }, [])

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return g
  }, [positions])

  useFrame((_, delta) => {
    if (!mesh.current) return
    const pos = mesh.current.geometry.attributes.position.array as Float32Array

    for (let i = 0; i < COUNT; i++) {
      pos[i * 3]     += velocities[i * 3]
      pos[i * 3 + 1] += velocities[i * 3 + 1]
      pos[i * 3 + 2] += velocities[i * 3 + 2]

      // Wrap Y
      if (pos[i * 3 + 1] > 12) pos[i * 3 + 1] = -10
      // Wrap X
      if (Math.abs(pos[i * 3]) > 22) pos[i * 3] *= -0.98
    }
    mesh.current.geometry.attributes.position.needsUpdate = true

    // Fade based on scene
    const mat = mesh.current.material as THREE.PointsMaterial
    const targetOpacity =
      scene === 'landing' ? 0.55
      : scene === 'intake' || scene === 'parsing' ? 0.35
      : scene === 'analysis' || scene === 'issue' || scene === 'action' ? 0.12
      : scene === 'resolution' ? 0.05
      : 0.2
    mat.opacity += (targetOpacity - mat.opacity) * delta * 1.2
  })

  return (
    <points ref={mesh} geometry={geo}>
      <pointsMaterial
        size={0.04}
        color="#4a7ccc"
        transparent
        opacity={0.55}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}
