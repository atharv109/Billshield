import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { useAppStore } from '../store/useAppStore'
import { DocumentCard } from './DocumentCard'
import { ScanBeam } from './ScanBeam'

const FILE_POSITIONS: [number, number, number][] = [
  [-3.2, 0, 0],
  [-1.0, 0, 0],
  [1.2, 0, 0],
  [3.4, 0, 0],
]

const FILE_TYPE_MAP: ('bill' | 'eob' | 'radiology' | 'estimate')[] = [
  'bill', 'eob', 'radiology', 'bill',
]

export function IntakePortal() {
  const scene = useAppStore((s) => s.scene)
  const uploadedFiles = useAppStore((s) => s.uploadedFiles)
  const parsingProgress = useAppStore((s) => s.parsingProgress)
  const platformRef = useRef<THREE.Mesh>(null)
  const ringRef = useRef<THREE.Mesh>(null)
  const [scanningFile, setScanningFile] = useState(0)
  const [scannedFiles, setScannedFiles] = useState<Set<number>>(new Set())

  const visible = scene === 'intake' || scene === 'parsing' || scene === 'reconstruction'

  useFrame((state, delta) => {
    if (!platformRef.current) return
    const t = state.clock.elapsedTime

    // Platform pulse
    platformRef.current.rotation.y = t * 0.1
    const mat = platformRef.current.material as THREE.MeshPhysicalMaterial
    const targetOp = visible ? 0.6 : 0
    mat.opacity += (targetOp - mat.opacity) * delta * 2

    // Ring rotation
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.5
      const ringMat = ringRef.current.material as THREE.MeshBasicMaterial
      const targetRingOp = scene === 'parsing' ? 0.7 : 0
      ringMat.opacity += (targetRingOp - ringMat.opacity) * delta * 2
    }
  })

  const handleScanComplete = (idx: number) => {
    setScannedFiles((prev) => new Set([...prev, idx]))
    if (idx + 1 < uploadedFiles.length) {
      setScanningFile(idx + 1)
    }
  }

  if (!visible) return null

  return (
    <group position={[0, -2.5, 0]}>
      {/* Glass platform disc */}
      <mesh ref={platformRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <circleGeometry args={[6, 64]} />
        <meshPhysicalMaterial
          color="#0d1a30"
          transmission={0.5}
          roughness={0.05}
          transparent
          opacity={0.6}
          emissive="#1a3a6a"
          emissiveIntensity={0.15}
        />
      </mesh>

      {/* Scanning ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[5.4, 5.8, 64]} />
        <meshBasicMaterial
          color="#00d4ff"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Platform edge glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[5.8, 6.2, 64]} />
        <meshBasicMaterial
          color="#4a9eff"
          transparent
          opacity={0.3}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Parsing progress ring */}
      {scene === 'parsing' && (
        <Html position={[0, 2, 0]} center style={{ pointerEvents: 'none' }}>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            color: '#00d4ff',
            fontSize: '11px',
            textAlign: 'center',
            letterSpacing: '0.1em',
          }}>
            <div style={{ marginBottom: '4px' }}>ANALYZING DOCUMENTS</div>
            <div style={{
              width: '140px',
              height: '3px',
              background: 'rgba(74,158,255,0.2)',
              borderRadius: '2px',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${parsingProgress}%`,
                background: 'linear-gradient(90deg, #00d4ff, #4a9eff)',
                transition: 'width 0.2s ease',
                borderRadius: '2px',
              }} />
            </div>
            <div style={{ marginTop: '4px', color: '#6b8ab0' }}>
              {Math.round(parsingProgress)}%
            </div>
          </div>
        </Html>
      )}

      {/* Document cards */}
      {uploadedFiles.map((file, i) => {
        const pos = FILE_POSITIONS[i] ?? [i * 3 - 4, 0, 0]
        const adjustedPos: [number, number, number] = [pos[0], pos[1] + 1.2, pos[2]]
        const isScanning = scene === 'parsing' && scanningFile === i && !scannedFiles.has(i)
        const isScanned = scannedFiles.has(i)

        return (
          <group key={file.id}>
            <DocumentCard
              position={adjustedPos}
              title={file.name.replace('.pdf', '').replace(/_/g, ' ').toUpperCase()}
              subtitle={`${(file.size / 1024).toFixed(0)} KB`}
              type={FILE_TYPE_MAP[i] ?? 'bill'}
              highlighted={isScanning}
              highlightColor="#00d4ff"
              floatAmplitude={scene === 'intake' ? 0.08 : 0}
            />
            {isScanning && (
              <ScanBeam
                position={[adjustedPos[0], adjustedPos[1], adjustedPos[2]]}
                width={2.8}
                height={1.8}
                active={isScanning}
                onComplete={() => handleScanComplete(i)}
              />
            )}
            {isScanned && (
              <Html position={[adjustedPos[0], adjustedPos[1] - 1.2, adjustedPos[2]]} center style={{ pointerEvents: 'none' }}>
                <div style={{ color: '#00cc88', fontSize: '10px', fontFamily: 'monospace' }}>✓ PARSED</div>
              </Html>
            )}
          </group>
        )
      })}
    </group>
  )
}
