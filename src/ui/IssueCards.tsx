import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'
import type { Issue } from '../data/mockCase'

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
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 40 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="absolute top-8 right-8 flex flex-col gap-3"
          style={{ zIndex: 20, width: '280px' }}
        >
          {/* Header */}
          <div className="flex items-center gap-2 px-1">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: '#ff4444', boxShadow: '0 0 8px #ff4444' }}
            />
            <span
              className="font-mono text-xs tracking-widest"
              style={{ color: '#ff4444' }}
            >
              ISSUE SCANNER
            </span>
            <span
              className="ml-auto font-mono text-xs px-1.5 py-0.5 rounded"
              style={{
                background: 'rgba(255, 68, 68, 0.1)',
                color: '#ff6666',
                border: '1px solid rgba(255, 68, 68, 0.3)',
              }}
            >
              {caseData.issues.length}
            </span>
          </div>

          {/* Issue cards */}
          {caseData.issues.map((issue, i) => (
            <motion.div
              key={issue.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.12, duration: 0.4 }}
            >
              <IssueCard
                issue={issue}
                selected={selectedIssue?.id === issue.id}
                onClick={() => {
                  if (selectedIssue?.id === issue.id) {
                    selectIssue(null)
                  } else {
                    selectIssue(issue)
                  }
                }}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function IssueCard({ issue, selected, onClick }: {
  issue: Issue
  selected: boolean
  onClick: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  const colors = {
    high:   { border: 'rgba(255, 68, 68, 0.5)',  bg: 'rgba(255, 68, 68, 0.06)',  tag: '#ff4444', label: 'HIGH' },
    medium: { border: 'rgba(255, 170, 0, 0.5)',  bg: 'rgba(255, 170, 0, 0.06)',  tag: '#ffaa00', label: 'MEDIUM' },
    low:    { border: 'rgba(74, 158, 255, 0.4)', bg: 'rgba(74, 158, 255, 0.06)', tag: '#4a9eff', label: 'LOW' },
  }
  const c = colors[issue.severity]

  return (
    <div
      className="glass rounded-xl overflow-hidden cursor-pointer transition-all duration-200"
      style={{
        border: selected ? c.border : `1px solid ${c.border}`,
        background: selected ? c.bg : 'rgba(10, 13, 20, 0.7)',
        boxShadow: selected ? `0 0 20px ${c.tag}30` : 'none',
      }}
      onClick={() => { onClick(); setExpanded(!expanded) }}
    >
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2">
            <span
              className="px-1.5 py-0.5 rounded text-xs font-mono font-bold"
              style={{
                background: `${c.tag}20`,
                color: c.tag,
                fontSize: '9px',
                letterSpacing: '0.08em',
              }}
            >
              {c.label}
            </span>
          </div>
          <span
            className="text-xs font-mono"
            style={{ color: '#6b8ab0' }}
          >
            {Math.round(issue.confidence * 100)}%
          </span>
        </div>

        <div className="text-sm font-medium mb-1" style={{ color: '#e0eaff' }}>
          {issue.title}
        </div>
        <div className="text-xs" style={{ color: '#6b8ab0', lineHeight: 1.5 }}>
          {issue.description}
        </div>
      </div>

      {/* Expanded explanation */}
      <AnimatePresence>
        {expanded && selected && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div
              className="px-3 pb-3"
              style={{
                borderTop: `1px solid ${c.border}`,
                paddingTop: '10px',
              }}
            >
              <div
                className="text-xs leading-relaxed"
                style={{ color: '#8a9ab8', lineHeight: 1.6 }}
              >
                {issue.explanation}
              </div>
              <div
                className="mt-2 text-xs"
                style={{ color: c.tag, cursor: 'pointer', fontWeight: 500 }}
                onClick={(e) => {
                  e.stopPropagation()
                  // Scroll to related documents — handled via store scene change
                }}
              >
                ↗ View related documents
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
