import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { useAppStore } from '../store/useAppStore'
import { BILL_STORM_FRAGMENTS } from '../data/mockCase'

interface FragmentData {
  text: string
  position: THREE.Vector3
  rotation: THREE.Euler
  orbitRadius: number
  orbitSpeed: number
  orbitPhase: number
  orbitY: number
  scale: number
  opacity: number
}

export function BillStorm() {
  const scene = useAppStore((s) => s.scene)
  const groupRef = useRef<THREE.Group>(null)

  const fragments = useMemo<FragmentData[]>(() => {
    return BILL_STORM_FRAGMENTS.map((text, i) => {
      const angle = (i / BILL_STORM_FRAGMENTS.length) * Math.PI * 2
      const radius = 4 + Math.random() * 8
      return {
        text,
        position: new THREE.Vector3(
          Math.cos(angle) * radius,
          (Math.random() - 0.5) * 10,
          Math.sin(angle) * radius - 5
        ),
        rotation: new THREE.Euler(
          (Math.random() - 0.5) * 0.6,
          (Math.random() - 0.5) * Math.PI,
          (Math.random() - 0.5) * 0.4
        ),
        orbitRadius: radius,
        orbitSpeed: (Math.random() * 0.08 + 0.03) * (Math.random() > 0.5 ? 1 : -1),
        orbitPhase: angle,
        orbitY: (Math.random() - 0.5) * 10,
        scale: 0.7 + Math.random() * 0.8,
        opacity: 0.3 + Math.random() * 0.5,
      }
    })
  }, [])

  const fragmentRefs = useRef<(THREE.Group | null)[]>([])

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime

    const isVisible = scene === 'landing' || scene === 'intake' || scene === 'parsing'
    const slowdown =
      scene === 'intake' ? 0.3
      : scene === 'parsing' ? 0.15
      : scene === 'reconstruction' ? 0.05
      : 1.0

    // Rotate whole group slowly
    groupRef.current.rotation.y = t * 0.015

    fragments.forEach((f, i) => {
      const ref = fragmentRefs.current[i]
      if (!ref) return

      const phase = f.orbitPhase + t * f.orbitSpeed * slowdown
      const x = Math.cos(phase) * f.orbitRadius
      const z = Math.sin(phase) * f.orbitRadius - 5
      const y = f.orbitY + Math.sin(t * 0.3 + f.orbitPhase) * 0.5

      ref.position.set(x, y, z)
      ref.rotation.y = -groupRef.current!.rotation.y + Math.sin(t * 0.2 + i) * 0.3
      ref.rotation.x = Math.sin(t * 0.15 + i * 0.7) * 0.1

      // Fade out when not landing
      const mat = ref.children[0] as any
      if (mat && mat.material) {
        const targetOp = isVisible ? f.opacity : 0
        mat.material.opacity += (targetOp - mat.material.opacity) * 0.05
      }
    })
  })

  // Color based on content
  const getColor = (text: string) => {
    if (text.includes('$') && parseFloat(text.replace('$', '').replace(',', '')) > 1000)
      return '#ff5555'
    if (text.includes('Due') || text.includes('Past') || text.includes('Denial'))
      return '#ffaa00'
    if (text.includes('EOB') || text.includes('In-Network'))
      return '#4a9eff'
    return '#7a9cc0'
  }

  return (
    <group ref={groupRef}>
      {fragments.map((f, i) => (
        <group
          key={i}
          ref={(el) => { fragmentRefs.current[i] = el }}
          position={f.position.toArray()}
          rotation={[f.rotation.x, f.rotation.y, f.rotation.z]}
          scale={f.scale}
        >
          <Text
            fontSize={0.3}
            color={getColor(f.text)}
            anchorX="center"
            anchorY="middle"
            font={undefined}
            fillOpacity={f.opacity}
            outlineWidth={0.008}
            outlineColor="#0a1020"
          >
            {f.text}
          </Text>
          {/* Card background */}
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[f.text.length * 0.2 + 0.3, 0.45]} />
            <meshBasicMaterial
              color="#0d1a2e"
              transparent
              opacity={0.25}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}
