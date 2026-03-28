import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Fog } from 'three'
import * as THREE from 'three'
import { useAppStore } from '../store/useAppStore'

export function SceneEnvironment() {
  const scene = useAppStore((s) => s.scene)
  const fogRef = useRef<Fog>(null)
  const ambientRef = useRef<THREE.AmbientLight>(null)
  const pointRef = useRef<THREE.PointLight>(null)
  const warmRef = useRef<THREE.PointLight>(null)

  useFrame((_, delta) => {
    const isResolution = scene === 'resolution'
    const isAnalysis = scene === 'analysis' || scene === 'issue' || scene === 'action'
    const isLanding = scene === 'landing'

    // Fog density
    if (fogRef.current) {
      const targetNear = isLanding ? 8 : isAnalysis ? 20 : 12
      const targetFar = isLanding ? 30 : isAnalysis ? 60 : 40
      fogRef.current.near += (targetNear - fogRef.current.near) * delta * 0.8
      fogRef.current.far += (targetFar - fogRef.current.far) * delta * 0.8
    }

    // Ambient intensity
    if (ambientRef.current) {
      const targetInt = isResolution ? 0.35 : isAnalysis ? 0.2 : 0.08
      ambientRef.current.intensity += (targetInt - ambientRef.current.intensity) * delta * 1.2
      const targetColor = isResolution
        ? new THREE.Color('#1a2a3a')
        : new THREE.Color('#0d1520')
      ambientRef.current.color.lerp(targetColor, delta * 0.5)
    }

    // Main point light
    if (pointRef.current) {
      const targetInt = isAnalysis ? 1.5 : isLanding ? 0.4 : 0.8
      pointRef.current.intensity += (targetInt - pointRef.current.intensity) * delta * 1.2
    }

    // Warm resolution light
    if (warmRef.current) {
      const targetInt = isResolution ? 0.8 : 0
      warmRef.current.intensity += (targetInt - warmRef.current.intensity) * delta * 0.8
    }
  })

  return (
    <>
      <color attach="background" args={['#0a0d14']} />
      <fog ref={fogRef} attach="fog" args={['#08101a', 8, 30]} />
      <ambientLight ref={ambientRef} intensity={0.08} color="#0d1520" />
      <pointLight
        ref={pointRef}
        position={[0, 8, 0]}
        intensity={0.4}
        color="#4a7ccc"
        distance={40}
        decay={2}
      />
      <pointLight
        position={[0, -5, -10]}
        intensity={0.2}
        color="#1a3a6a"
        distance={30}
        decay={2}
      />
      {/* Warm resolution light */}
      <pointLight
        ref={warmRef}
        position={[0, 10, 5]}
        intensity={0}
        color="#ffaa44"
        distance={50}
        decay={1.5}
      />
    </>
  )
}
