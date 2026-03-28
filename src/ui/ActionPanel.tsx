import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'
import type { Action } from '../data/mockCase'

const ease = [0.4, 0, 0.2, 1] as const

export function ActionPanel() {
  const scene = useAppStore((s) => s.scene)
  const caseData = useAppStore((s) => s.caseData)
  const selectedAction = useAppStore((s) => s.selectedAction)
  const selectAction = useAppStore((s) => s.selectAction)
  const markActionComplete = useAppStore((s) => s.markActionComplete)
  const completedActions = useAppStore((s) => s.completedActions)

  const visible =
    scene === 'analysis' || scene === 'action' || scene === 'issue' || scene === 'resolution'

  if (!caseData) return null

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="actions"
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.5, delay: 0.15, ease }}
          style={{
            position: 'absolute',
            bottom: '80px',
            left: '28px',
            zIndex: 20,
            width: '292px',
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
                background: '#3a7fff',
                boxShadow: '0 0 8px #3a7fff',
              }}
            />
            <span
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '10px',
                color: '#3a7fff',
                letterSpacing: '0.14em',
                flex: 1,
              }}
            >
              ACTION FORGE
            </span>
            <span style={{ fontSize: '10px', color: '#2a4a6a' }}>
              {completedActions.length}/{caseData.actions.length} done
            </span>
          </div>

          {caseData.actions.map((action, i) => {
            const isCompleted = completedActions.includes(action.id)
            const isSelected = selectedAction?.id === action.id && scene === 'action'
            return (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.08, duration: 0.4, ease }}
              >
                <ActionTile
                  action={action}
                  selected={isSelected}
                  completed={isCompleted}
                  onClick={() => { if (!isCompleted) selectAction(isSelected ? null : action) }}
                  onComplete={() => markActionComplete(action.id)}
                />
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function ActionTile({ action, selected, completed, onClick, onComplete }: {
  action: Action; selected: boolean; completed: boolean; onClick: () => void; onComplete: () => void
}) {
  const [copied, setCopied] = useState(false)
  const [displayedText, setDisplayedText] = useState('')
  const typewriterRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const content = action.draft ?? action.script ?? ''

  useEffect(() => {
    if (selected) {
      setDisplayedText('')
      let i = 0
      const total = Math.min(content.length, 550)
      typewriterRef.current = setInterval(() => {
        i += 4
        setDisplayedText(content.slice(0, i))
        if (i >= total) {
          clearInterval(typewriterRef.current!)
          setDisplayedText(content.slice(0, total) + (content.length > 550 ? '…' : ''))
        }
      }, 16)
    } else {
      if (typewriterRef.current) clearInterval(typewriterRef.current)
      setDisplayedText('')
    }
    return () => { if (typewriterRef.current) clearInterval(typewriterRef.current) }
  }, [selected, content])

  const handleCopy = () => {
    navigator.clipboard.writeText(content).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      style={{
        background: '#08101a',
        border: `1px solid ${selected ? '#3a7fff60' : completed ? '#3a7fff30' : '#1a2a45'}`,
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: selected ? '0 0 20px rgba(58,127,255,0.12)' : 'none',
        transition: 'border-color 0.25s, box-shadow 0.25s',
      }}
    >
      {/* Tile header */}
      <div
        style={{
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          cursor: completed ? 'default' : 'pointer',
          opacity: completed ? 0.55 : 1,
        }}
        onClick={onClick}
      >
        <span style={{ fontSize: '16px', flexShrink: 0 }}>{action.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: completed ? '#3a7fff' : '#c8d8f0',
              textDecoration: completed ? 'line-through' : 'none',
              lineHeight: 1.3,
            }}
          >
            {action.title}
          </div>
          {!selected && !completed && (
            <div style={{ fontSize: '10px', color: '#2a4a6a', marginTop: '2px' }}>
              {action.type === 'letter' ? 'Draft letter'
                : action.type === 'call' ? 'Call script'
                : 'Dispute letter'} →
            </div>
          )}
        </div>
        {completed
          ? <span style={{ color: '#3a7fff', fontSize: '13px' }}>✓</span>
          : <span style={{ color: selected ? '#3a7fff' : '#1a3a5a', fontSize: '11px' }}>
              {selected ? '▲' : '▼'}
            </span>
        }
      </div>

      {/* Expanded area */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28 }}
          >
            <div style={{ borderTop: '1px solid #0d1e35', padding: '12px 14px 14px' }}>
              {/* Why it matters */}
              <div
                style={{
                  fontSize: '10px',
                  color: '#5a7aa0',
                  lineHeight: 1.6,
                  padding: '8px 10px',
                  background: 'rgba(58, 127, 255, 0.05)',
                  border: '1px solid rgba(58, 127, 255, 0.12)',
                  borderRadius: '7px',
                  marginBottom: '10px',
                }}
              >
                <span style={{ color: '#3a7fff', fontWeight: 600 }}>Why this matters: </span>
                {action.whyItMatters}
              </div>

              {/* Draft text with typewriter */}
              <div
                style={{
                  fontSize: '10px',
                  fontFamily: 'JetBrains Mono, monospace',
                  color: '#6a8ab0',
                  background: '#050c18',
                  border: '1px solid #0d1e35',
                  borderRadius: '7px',
                  padding: '10px',
                  lineHeight: 1.75,
                  maxHeight: '175px',
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap',
                  marginBottom: '10px',
                }}
              >
                {displayedText}
                <span
                  style={{
                    display: 'inline-block',
                    width: '2px',
                    height: '11px',
                    background: '#3a7fff',
                    marginLeft: '1px',
                    verticalAlign: 'middle',
                    animation: 'blink 1s infinite',
                  }}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleCopy}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '7px',
                    fontSize: '11px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    background: copied ? 'rgba(58,127,255,0.15)' : 'rgba(58,127,255,0.08)',
                    border: `1px solid ${copied ? 'rgba(58,127,255,0.5)' : 'rgba(58,127,255,0.2)'}`,
                    color: '#3a7fff',
                    transition: 'all 0.2s',
                  }}
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
                <button
                  onClick={onComplete}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '7px',
                    fontSize: '11px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    background: 'rgba(58, 127, 255, 0.1)',
                    border: '1px solid rgba(58, 127, 255, 0.25)',
                    color: '#3a7fff',
                    transition: 'all 0.2s',
                  }}
                >
                  Mark Done
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
