import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { useAppStore } from '../store/useAppStore'
import { BILL_STORM_FRAGMENTS } from '../data/mockCase'

interface FragmentData {
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
  const fragmentRefs = useRef<(THREE.Group | null)[]>([])

  const fragments = useMemo<FragmentData[]>(() => {
    return BILL_STORM_FRAGMENTS.map((_, i) => {
      const angle = (i / BILL_STORM_FRAGMENTS.length) * Math.PI * 2
      // Push far from center — min radius 10, max 18
      const radius = 10 + Math.random() * 8
      // Keep Y away from center: either high up or low
      const ySign = Math.random() > 0.5 ? 1 : -1
      const yMag = 3.5 + Math.random() * 5
      return {
        orbitRadius: radius,
        orbitSpeed: (Math.random() * 0.04 + 0.01) * (Math.random() > 0.5 ? 1 : -1),
        orbitPhase: angle,
        orbitY: ySign * yMag,
        scale: 0.25 + Math.random() * 0.28,
        opacity: 0.08 + Math.random() * 0.11,
      }
    })
  }, [])

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime

    // Very slow global rotation — atmospheric drift only
    groupRef.current.rotation.y = t * 0.008

    const isLanding = scene === 'landing'
    const isIntake = scene === 'intake' || scene === 'parsing'

    fragments.forEach((f, i) => {
      const ref = fragmentRefs.current[i]
      if (!ref) return

      const phase = f.orbitPhase + t * f.orbitSpeed
      const x = Math.cos(phase) * f.orbitRadius
      const z = Math.sin(phase) * f.orbitRadius - 8
      const y = f.orbitY + Math.sin(t * 0.18 + f.orbitPhase) * 0.6

      ref.position.set(x, y, z)
      ref.rotation.y = -groupRef.current!.rotation.y

      // Fade per scene — completely invisible in analysis+
      const targetOp = isLanding
        ? f.opacity
        : isIntake
        ? f.opacity * 0.3
        : 0

      const textMesh = ref.children[0] as THREE.Mesh
      if (textMesh && (textMesh as any).material) {
        const mat = (textMesh as any).material
        if (mat.opacity !== undefined) {
          mat.opacity += (targetOp - mat.opacity) * 0.1
        }
      }
    })
  })

  const getColor = (text: string) => {
    if (/\$[0-9,]+/.test(text) && parseFloat(text.replace(/[$,]/g, '')) > 1000)
      return '#cc3344'
    if (/Due|Past|Denial|Auth/.test(text)) return '#4466aa'
    return '#2a4a70'
  }

  return (
    <group ref={groupRef}>
      {BILL_STORM_FRAGMENTS.map((text, i) => (
        <group
          key={i}
          ref={(el) => { fragmentRefs.current[i] = el }}
          scale={fragments[i].scale}
        >
          <Text
            fontSize={0.22}
            color={getColor(text)}
            anchorX="center"
            anchorY="middle"
            fillOpacity={fragments[i].opacity}
            outlineWidth={0}
          >
            {text}
          </Text>
        </group>
      ))}
    </group>
  )
}
