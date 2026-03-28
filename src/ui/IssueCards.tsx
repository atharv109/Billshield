import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'
import type { Issue } from '../data/mockCase'

const ease = [0.4, 0, 0.2, 1] as const

export function IssueCards() {
  const scene = useAppStore((s) => s.scene)
  const caseData = useAppStore((s) => s.caseData)
  const selectedIssue = useAppStore((s) => s.selectedIssue)
  const selectIssue = useAppStore((s) => s.selectIssue)

  const visible =
    scene === 'analysis' || scene === 'issue' || scene === 'action' || scene === 'resolution'

  if (!caseData) return null

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="issues"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 24 }}
          transition={{ duration: 0.5, delay: 0.1, ease }}
          style={{
            position: 'absolute',
            top: '72px',
            right: '28px',
            zIndex: 20,
            width: '272px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 2px' }}>
            <div
              style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: '#ff3344',
                boxShadow: '0 0 8px #ff3344',
              }}
            />
            <span
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '10px',
                color: '#ff3344',
                letterSpacing: '0.14em',
                flex: 1,
              }}
            >
              ISSUE SCANNER
            </span>
            <span
              style={{
                fontSize: '10px',
                fontFamily: 'JetBrains Mono, monospace',
                padding: '1px 7px',
                borderRadius: '4px',
                background: 'rgba(255, 51, 68, 0.1)',
                border: '1px solid rgba(255, 51, 68, 0.25)',
                color: '#ff5566',
              }}
            >
              {caseData.issues.length}
            </span>
          </div>

          {caseData.issues.map((issue, i) => (
            <motion.div
              key={issue.id}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.08, duration: 0.4, ease }}
            >
              <IssueCard
                issue={issue}
                selected={selectedIssue?.id === issue.id}
                onClick={() => selectIssue(selectedIssue?.id === issue.id ? null : issue)}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function IssueCard({ issue, selected, onClick }: {
  issue: Issue; selected: boolean; onClick: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  const severityStyle = {
    high:   { border: 'rgba(255, 51, 68, 0.45)',  bg: 'rgba(255, 51, 68, 0.05)',  tag: '#ff3344', label: 'HIGH' },
    medium: { border: 'rgba(58, 127, 255, 0.4)',  bg: 'rgba(58, 127, 255, 0.05)', tag: '#3a7fff', label: 'MED' },
    low:    { border: 'rgba(58, 127, 255, 0.2)',  bg: 'rgba(58, 127, 255, 0.03)', tag: '#2a5aaa', label: 'LOW' },
  }
  const s = severityStyle[issue.severity]

  return (
    <div
      style={{
        background: selected ? s.bg : '#08101a',
        border: `1px solid ${selected ? s.border : '#1a2a45'}`,
        borderRadius: '12px',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        boxShadow: selected ? `0 0 20px ${s.tag}22` : 'none',
      }}
      onClick={() => { onClick(); setExpanded(!expanded) }}
    >
      <div style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span
            style={{
              fontSize: '9px',
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: 700,
              letterSpacing: '0.1em',
              padding: '2px 6px',
              borderRadius: '3px',
              background: `${s.tag}18`,
              border: `1px solid ${s.tag}40`,
              color: s.tag,
            }}
          >
            {s.label}
          </span>
          <span style={{ fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', color: '#2a4a6a' }}>
            {Math.round(issue.confidence * 100)}%
          </span>
        </div>
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#c8d8f0', marginBottom: '4px', lineHeight: 1.35 }}>
          {issue.title}
        </div>
        <div style={{ fontSize: '10px', color: '#4a6280', lineHeight: 1.5 }}>
          {issue.description}
        </div>
      </div>

      <AnimatePresence>
        {expanded && selected && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <div
              style={{
                padding: '10px 14px 12px',
                borderTop: `1px solid ${s.border}`,
              }}
            >
              <div style={{ fontSize: '10px', color: '#6a8ab0', lineHeight: 1.65 }}>
                {issue.explanation}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
