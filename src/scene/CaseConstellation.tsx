import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAppStore } from '../store/useAppStore'
import { DocumentCard } from './DocumentCard'
import { ConnectionBeam } from './ConnectionBeam'

const DOC_CONNECTIONS: Array<[string, string, boolean]> = [
  ['bill-1', 'eob-1', false],
  ['bill-1', 'bill-2', true],   // broken = duplicate issue
  ['bill-3', 'eob-1', true],   // broken = out-of-network concern
  ['bill-1', 'bill-3', false],
]

export function CaseConstellation() {
  const scene = useAppStore((s) => s.scene)
  const caseData = useAppStore((s) => s.caseData)
  const selectedIssue = useAppStore((s) => s.selectedIssue)
  const selectIssue = useAppStore((s) => s.selectIssue)
  const groupRef = useRef<THREE.Group>(null)
  const entryProgress = useRef(0)

  const visible =
    scene === 'reconstruction' ||
    scene === 'analysis' ||
    scene === 'issue' ||
    scene === 'action' ||
    scene === 'resolution'

  useFrame((_, delta) => {
    if (!groupRef.current) return

    if (visible) {
      entryProgress.current += delta * 0.5
    } else {
      entryProgress.current -= delta * 1
    }
    entryProgress.current = Math.max(0, Math.min(1, entryProgress.current))

    // Scale in
    const s = entryProgress.current
    groupRef.current.scale.setScalar(s)

    // Slow gentle rotation when idle
    if (scene === 'analysis' || scene === 'resolution') {
      groupRef.current.rotation.y += delta * 0.04
    }
  })

  if (!caseData) return null

  const docById = Object.fromEntries(caseData.documents.map((d) => [d.id, d]))

  const isHighlighted = (docId: string) => {
    if (!selectedIssue) return false
    return selectedIssue.relatedDocIds.includes(docId)
  }

  return (
    <group ref={groupRef} scale={0}>
      {/* Document nodes */}
      {caseData.documents.map((doc) => (
        <DocumentCard
          key={doc.id}
          position={doc.position}
          title={doc.provider ?? doc.insurer ?? 'Document'}
          subtitle={doc.type.toUpperCase()}
          amount={
            doc.amount ? `$${doc.amount.toLocaleString()}`
            : doc.paidAmount ? `Paid: $${doc.paidAmount.toLocaleString()}`
            : undefined
          }
          dueDate={doc.dueDate}
          type={doc.type}
          highlighted={isHighlighted(doc.id)}
          highlightColor="#ff4444"
          floatAmplitude={scene === 'analysis' ? 0.05 : 0}
        />
      ))}

      {/* Connection beams */}
      {DOC_CONNECTIONS.map(([fromId, toId, broken], i) => {
        const from = docById[fromId]
        const to = docById[toId]
        if (!from || !to) return null

        const isRelated = selectedIssue
          ? selectedIssue.relatedDocIds.includes(fromId) &&
            selectedIssue.relatedDocIds.includes(toId)
          : true

        return (
          <ConnectionBeam
            key={i}
            start={from.position}
            end={to.position}
            broken={broken}
            color={broken ? '#ff8844' : '#4a9eff'}
            animated={scene === 'reconstruction' || scene === 'analysis'}
            thickness={isRelated && selectedIssue ? 0.04 : 0.02}
          />
        )
      })}

      {/* Issue indicator nodes */}
      {caseData.issues.map((issue) => {
        const relatedDocs = issue.relatedDocIds.map((id) => docById[id]).filter(Boolean)
        if (relatedDocs.length < 2) return null

        const center = relatedDocs.reduce(
          (acc, doc) => [
            acc[0] + doc.position[0] / relatedDocs.length,
            acc[1] + doc.position[1] / relatedDocs.length,
            acc[2] + doc.position[2] / relatedDocs.length,
          ],
          [0, 0, 0]
        )

        const color =
          issue.severity === 'high' ? '#ff4444'
          : issue.severity === 'medium' ? '#ffaa00'
          : '#4a9eff'

        return (
          <IssueNode
            key={issue.id}
            position={center as [number, number, number]}
            color={color}
            selected={selectedIssue?.id === issue.id}
            onClick={() => selectIssue(issue)}
          />
        )
      })}
    </group>
  )
}

function IssueNode({
  position,
  color,
  selected,
  onClick,
}: {
  position: [number, number, number]
  color: string
  selected: boolean
  onClick: () => void
}) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.elapsedTime
    const pulse = (Math.sin(t * 3) + 1) * 0.5
    const mat = meshRef.current.material as THREE.MeshBasicMaterial
    mat.opacity = selected ? 0.9 : 0.5 + pulse * 0.4
    meshRef.current.scale.setScalar(selected ? 1.4 : 1.0 + pulse * 0.2)
  })

  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={onClick}
      onPointerOver={() => { document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { document.body.style.cursor = 'default' }}
    >
      <sphereGeometry args={[0.18, 16, 16]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.5}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}
