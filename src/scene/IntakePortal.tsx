import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { useAppStore } from '../store/useAppStore'
import { DocumentCard } from './DocumentCard'
import { ScanBeam } from './ScanBeam'

const FILE_POSITIONS: [number, number, number][] = [
  [-2.1, 0, 0],
  [-0.7, 0, 0],
  [0.7, 0, 0],
  [2.1, 0, 0],
]

const FILE_TYPE_MAP: ('bill' | 'eob' | 'radiology' | 'bill')[] = [
  'bill', 'eob', 'radiology', 'bill',
]

const INTAKE_LABELS = [
  { title: 'Hospital Bill', sub: 'St. Vincent' },
  { title: 'Explanation of Benefits', sub: 'BlueCross' },
  { title: 'Radiology Bill', sub: 'Valley Radiology' },
  { title: 'Physician Invoice', sub: 'ER Physicians Group' },
]

export function IntakePortal() {
  const scene = useAppStore((s) => s.scene)
  const uploadedFiles = useAppStore((s) => s.uploadedFiles)
  const parsingProgress = useAppStore((s) => s.parsingProgress)
  const platformRef = useRef<THREE.Mesh>(null)
  const ringRef = useRef<THREE.Mesh>(null)
  const opacityRef = useRef(0)
  const [scanningFile, setScanningFile] = useState(0)
  const [scannedFiles, setScannedFiles] = useState<Set<number>>(new Set())

  const visible = scene === 'intake' || scene === 'parsing' || scene === 'reconstruction'

  useFrame((_, delta) => {
    const targetOp = visible ? 1 : 0
    opacityRef.current += (targetOp - opacityRef.current) * delta * 1.5

    if (platformRef.current) {
      const mat = platformRef.current.material as THREE.MeshPhysicalMaterial
      mat.opacity = opacityRef.current * 0.5
    }
    if (ringRef.current) {
      const ringMat = ringRef.current.material as THREE.MeshBasicMaterial
      const targetRingOp = scene === 'parsing' ? opacityRef.current * 0.6 : 0
      ringMat.opacity += (targetRingOp - ringMat.opacity) * delta * 2
    }
  })

  const handleScanComplete = (idx: number) => {
    setScannedFiles((prev) => new Set([...prev, idx]))
    if (idx + 1 < uploadedFiles.length) {
      setScanningFile(idx + 1)
    }
  }

  if (!visible && opacityRef.current < 0.01) return null

  return (
    <group position={[0, -2.2, 0]}>
      {/* Glass platform disc — smaller radius */}
      <mesh ref={platformRef} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[4, 64]} />
        <meshPhysicalMaterial
          color="#050c18"
          roughness={0.05}
          transparent
          opacity={0}
          emissive="#0a1e40"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Scan ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[3.6, 3.9, 64]} />
        <meshBasicMaterial
          color="#3a7fff"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Platform edge glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[3.9, 4.1, 64]} />
        <meshBasicMaterial
          color="#1a3a7a"
          transparent
          opacity={0.25}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Parsing progress */}
      {scene === 'parsing' && (
        <Html position={[0, 2.2, 0]} center style={{ pointerEvents: 'none' }}>
          <div
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              color: '#3a7fff',
              fontSize: '10px',
              textAlign: 'center',
              letterSpacing: '0.12em',
            }}
          >
            <div style={{ marginBottom: '6px' }}>ANALYZING DOCUMENTS</div>
            <div
              style={{
                width: '130px',
                height: '2px',
                background: 'rgba(58, 127, 255, 0.15)',
                borderRadius: '1px',
                overflow: 'hidden',
                margin: '0 auto',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${parsingProgress}%`,
                  background: '#3a7fff',
                  transition: 'width 0.25s ease',
                  borderRadius: '1px',
                }}
              />
            </div>
            <div style={{ marginTop: '5px', color: '#2a4a7a' }}>
              {Math.round(parsingProgress)}%
            </div>
          </div>
        </Html>
      )}

      {/* Document cards */}
      {uploadedFiles.map((file, i) => {
        const pos = FILE_POSITIONS[i] ?? [i * 2 - 3, 0, 0]
        const cardPos: [number, number, number] = [pos[0], pos[1] + 1.15, pos[2]]
        const isScanning = scene === 'parsing' && scanningFile === i && !scannedFiles.has(i)
        const isScanned = scannedFiles.has(i)
        const label = INTAKE_LABELS[i] ?? { title: 'Document', sub: '' }

        return (
          <group key={file.id}>
            <DocumentCard
              position={cardPos}
              width={2.2}
              height={1.45}
              title={label.title}
              subtitle={isScanned ? '✓ Parsed' : label.sub}
              type={FILE_TYPE_MAP[i] ?? 'bill'}
              highlighted={isScanning}
              highlightColor="#3a7fff"
              floatAmplitude={scene === 'intake' ? 0.06 : 0}
            />
            {isScanning && (
              <ScanBeam
                position={[cardPos[0], cardPos[1], cardPos[2]]}
                width={2.2}
                height={1.45}
                active={isScanning}
                onComplete={() => handleScanComplete(i)}
              />
            )}
          </group>
        )
      })}
    </group>
  )
}
