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

export function DocumentCard({
  position,
  rotation = [0, 0, 0],
  width = 2.6,
  height = 1.7,
  title,
  subtitle,
  amount,
  dueDate,
  type,
  highlighted = false,
  highlightColor = '#ff3344',
  onClick,
  floatAmplitude = 0,
}: DocumentCardProps) {
  const groupRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const edgeRef = useRef<THREE.LineSegments>(null)
  const [hovered, setHovered] = useState(false)
  const floatOffset = useRef(Math.random() * Math.PI * 2)
  const pulseRef = useRef(0)

  useFrame((state, delta) => {
    if (!groupRef.current || !meshRef.current) return
    const t = state.clock.elapsedTime

    // Smooth float
    if (floatAmplitude > 0) {
      groupRef.current.position.y =
        position[1] + Math.sin(t * 0.45 + floatOffset.current) * floatAmplitude
    }

    // Smooth hover scale
    const targetScale = hovered ? 1.04 : 1.0
    const currentScale = groupRef.current.scale.x
    groupRef.current.scale.setScalar(
      currentScale + (targetScale - currentScale) * delta * 5
    )

    // Pulse for highlighted
    pulseRef.current = (Math.sin(t * 2.5) + 1) * 0.5

    const mat = meshRef.current.material as THREE.MeshPhysicalMaterial
    if (highlighted) {
      mat.emissive.set(highlightColor)
      mat.emissiveIntensity = 0.1 + pulseRef.current * 0.18
    } else {
      mat.emissive.set('#0a2040')
      mat.emissiveIntensity = hovered ? 0.08 : 0.02
    }

    // Edge color
    if (edgeRef.current) {
      const edgeMat = edgeRef.current.material as THREE.LineBasicMaterial
      edgeMat.color.set(
        highlighted ? highlightColor : hovered ? '#3a7fff' : '#1a2a45'
      )
      edgeMat.opacity = highlighted ? 0.8 : hovered ? 0.6 : 0.35
    }
  })

  const typeLabel = {
    bill: 'BILL',
    eob: 'EOB',
    radiology: 'RADIOLOGY',
    estimate: 'ESTIMATE',
  }[type]

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      onClick={onClick}
      onPointerOver={() => { setHovered(true); document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default' }}
    >
      {/* Card body */}
      <mesh ref={meshRef}>
        <boxGeometry args={[width, height, 0.05]} />
        <meshPhysicalMaterial
          color="#070e1c"
          roughness={0.1}
          metalness={0.15}
          transparent
          opacity={0.94}
          emissive="#0a2040"
          emissiveIntensity={0.02}
        />
      </mesh>

      {/* Border edges */}
      <lineSegments ref={edgeRef}>
        <edgesGeometry args={[new THREE.BoxGeometry(width + 0.015, height + 0.015, 0.055)]} />
        <lineBasicMaterial
          color="#1a2a45"
          transparent
          opacity={0.35}
        />
      </lineSegments>

      {/* Top accent line */}
      <mesh position={[0, height / 2 - 0.04, 0.028]}>
        <planeGeometry args={[width * 0.4, 0.015]} />
        <meshBasicMaterial
          color={highlighted ? highlightColor : '#3a7fff'}
          transparent
          opacity={highlighted ? 0.9 : 0.5}
          depthWrite={false}
        />
      </mesh>

      {/* HTML label */}
      <Html
        position={[0, 0, 0.03]}
        center
        style={{ pointerEvents: 'none', width: `${width * 88}px` }}
        zIndexRange={[0, 0]}
      >
        <div
          style={{
            fontFamily: 'Inter, ui-sans-serif, sans-serif',
            userSelect: 'none',
            textAlign: 'center',
            padding: '6px 8px',
          }}
        >
          {/* Type badge */}
          <div
            style={{
              display: 'inline-block',
              fontSize: '8px',
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: highlighted ? highlightColor : '#3a7fff',
              padding: '2px 6px',
              border: `1px solid ${highlighted ? highlightColor + '60' : '#3a7fff40'}`,
              borderRadius: '3px',
              marginBottom: '6px',
            }}
          >
            {typeLabel}
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: '10px',
              fontWeight: 600,
              color: '#c8d8f0',
              lineHeight: 1.3,
              marginBottom: '4px',
            }}
          >
            {title}
          </div>

          {/* Subtitle */}
          {subtitle && (
            <div style={{ fontSize: '8px', color: '#4a6280', marginBottom: '4px' }}>
              {subtitle}
            </div>
          )}

          {/* Amount */}
          {amount && (
            <div
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: highlighted ? highlightColor : '#e8f0ff',
                marginTop: '2px',
                letterSpacing: '-0.01em',
              }}
            >
              {amount}
            </div>
          )}

          {/* Due date */}
          {dueDate && (
            <div
              style={{
                fontSize: '8px',
                color: '#3a5a7a',
                marginTop: '3px',
                letterSpacing: '0.04em',
              }}
            >
              DUE {dueDate.toUpperCase()}
            </div>
          )}
        </div>
      </Html>
    </group>
  )
}
