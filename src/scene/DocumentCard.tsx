import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

interface DocumentCardProps {
  position: [number, number, number]
  rotation?: [number, number, number]
  width?: number
  height?: number
  title: string
  subtitle?: string
  amount?: string
  dueDate?: string
  type: 'bill' | 'eob' | 'radiology' | 'estimate'
  highlighted?: boolean
  highlightColor?: string
  onClick?: () => void
  floatAmplitude?: number
}

const TYPE_COLORS = {
  bill:      { border: '#2a4a7a', accent: '#4a9eff', icon: '🏥' },
  eob:       { border: '#2a5a4a', accent: '#00cc88', icon: '📋' },
  radiology: { border: '#4a3a2a', accent: '#ffaa00', icon: '🩻' },
  estimate:  { border: '#4a2a4a', accent: '#cc66ff', icon: '📊' },
}

export function DocumentCard({
  position,
  rotation = [0, 0, 0],
  width = 2.8,
  height = 1.8,
  title,
  subtitle,
  amount,
  dueDate,
  type,
  highlighted = false,
  highlightColor = '#ff4444',
  onClick,
  floatAmplitude = 0,
}: DocumentCardProps) {
  const groupRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const floatOffset = useRef(Math.random() * Math.PI * 2)
  const colors = TYPE_COLORS[type]

  useFrame((state, delta) => {
    if (!groupRef.current || !meshRef.current) return
    const t = state.clock.elapsedTime

    // Float animation
    if (floatAmplitude > 0) {
      groupRef.current.position.y =
        position[1] + Math.sin(t * 0.5 + floatOffset.current) * floatAmplitude
    }

    // Scale on hover
    const targetScale = hovered ? 1.06 : 1.0
    groupRef.current.scale.setScalar(
      groupRef.current.scale.x + (targetScale - groupRef.current.scale.x) * delta * 6
    )

    // Highlight pulse
    if (meshRef.current && highlighted) {
      const mat = meshRef.current.material as THREE.MeshPhysicalMaterial
      const pulse = (Math.sin(t * 3) + 1) * 0.5
      mat.emissiveIntensity = 0.15 + pulse * 0.25
    } else if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshPhysicalMaterial
      const targetEm = hovered ? 0.12 : 0.04
      mat.emissiveIntensity += (targetEm - mat.emissiveIntensity) * delta * 4
    }
  })

  const borderColor = highlighted ? highlightColor : hovered ? colors.accent : colors.border

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      onClick={onClick}
      onPointerOver={() => { setHovered(true); document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default' }}
    >
      {/* Glass card body */}
      <mesh ref={meshRef} castShadow>
        <boxGeometry args={[width, height, 0.06]} />
        <meshPhysicalMaterial
          color="#0d1a30"
          transmission={0.3}
          roughness={0.05}
          metalness={0.1}
          transparent
          opacity={0.85}
          emissive={highlighted ? highlightColor : colors.accent}
          emissiveIntensity={0.04}
        />
      </mesh>

      {/* Border frame */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(width + 0.02, height + 0.02, 0.07)]} />
        <lineBasicMaterial
          color={borderColor}
          transparent
          opacity={highlighted ? 0.9 : 0.5}
        />
      </lineSegments>

      {/* HTML label */}
      <Html
        position={[0, 0, 0.04]}
        center
        style={{ pointerEvents: 'none', width: `${width * 90}px` }}
      >
        <div
          style={{
            fontFamily: 'Inter, sans-serif',
            color: '#c8d8f0',
            userSelect: 'none',
            textAlign: 'center',
            padding: '4px',
          }}
        >
          <div style={{ fontSize: '16px', marginBottom: '2px' }}>{colors.icon}</div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: colors.accent, letterSpacing: '0.05em' }}>
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: '9px', color: '#6b8ab0', marginTop: '2px' }}>{subtitle}</div>
          )}
          {amount && (
            <div style={{
              fontSize: '14px',
              fontWeight: 700,
              color: highlighted ? '#ff6666' : '#e0eaff',
              marginTop: '4px',
            }}>
              {amount}
            </div>
          )}
          {dueDate && (
            <div style={{ fontSize: '8px', color: '#ffaa44', marginTop: '2px' }}>
              Due {dueDate}
            </div>
          )}
        </div>
      </Html>
    </group>
  )
}
