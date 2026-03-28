import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'
import type { Action } from '../data/mockCase'

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
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="absolute bottom-8 left-8 flex flex-col gap-3"
          style={{ zIndex: 20, width: '300px' }}
        >
          {/* Header */}
          <div className="flex items-center gap-2 px-1">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: '#00cc88', boxShadow: '0 0 8px #00cc88' }}
            />
            <span
              className="font-mono text-xs tracking-widest"
              style={{ color: '#00cc88' }}
            >
              ACTION FORGE
            </span>
            <span
              className="ml-auto text-xs"
              style={{ color: '#6b8ab0' }}
            >
              {completedActions.length}/{caseData.actions.length} done
            </span>
          </div>

          {/* Action tiles */}
          {caseData.actions.map((action, i) => {
            const isCompleted = completedActions.includes(action.id)
            const isSelected = selectedAction?.id === action.id && scene === 'action'

            return (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1, duration: 0.4 }}
              >
                <ActionTile
                  action={action}
                  selected={isSelected}
                  completed={isCompleted}
                  onClick={() => {
                    if (!isCompleted) {
                      selectAction(isSelected ? null : action)
                    }
                  }}
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

function ActionTile({
  action,
  selected,
  completed,
  onClick,
  onComplete,
}: {
  action: Action
  selected: boolean
  completed: boolean
  onClick: () => void
  onComplete: () => void
}) {
  const [copied, setCopied] = useState(false)
  const [displayedText, setDisplayedText] = useState('')
  const typewriterRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const content = action.draft ?? action.script ?? ''

  // Start typewriter when selected
  useEffect(() => {
    if (selected) {
      setDisplayedText('')
      let i = 0
      const total = Math.min(content.length, 600)
      typewriterRef.current = setInterval(() => {
        i += 3
        setDisplayedText(content.slice(0, i))
        if (i >= total) {
          clearInterval(typewriterRef.current!)
          setDisplayedText(content.slice(0, total) + (content.length > 600 ? '…' : ''))
        }
      }, 18)
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
      className="glass rounded-xl overflow-hidden"
      style={{
        border: completed
          ? '1px solid rgba(0, 204, 136, 0.3)'
          : selected
          ? '1px solid rgba(0, 204, 136, 0.5)'
          : '1px solid rgba(42, 58, 92, 0.6)',
        background: completed
          ? 'rgba(0, 204, 136, 0.05)'
          : selected
          ? 'rgba(0, 204, 136, 0.06)'
          : 'rgba(10, 13, 20, 0.7)',
        boxShadow: selected ? '0 0 20px rgba(0, 204, 136, 0.15)' : 'none',
      }}
    >
      {/* Tile header */}
      <div
        className="px-4 py-3 flex items-center gap-3 cursor-pointer"
        onClick={onClick}
        style={{ opacity: completed ? 0.6 : 1 }}
      >
        <span style={{ fontSize: '18px' }}>{action.icon}</span>
        <div className="flex-1 min-w-0">
          <div
            className="text-sm font-medium"
            style={{
              color: completed ? '#00cc88' : '#e0eaff',
              textDecoration: completed ? 'line-through' : 'none',
            }}
          >
            {action.title}
          </div>
          {!selected && !completed && (
            <div className="text-xs mt-0.5" style={{ color: '#6b8ab0' }}>
              {action.type === 'letter' ? 'Draft letter →'
              : action.type === 'call' ? 'Call script →'
              : 'Dispute letter →'}
            </div>
          )}
        </div>
        {completed && (
          <span className="text-sm" style={{ color: '#00cc88' }}>✓</span>
        )}
        {!completed && (
          <span
            className="text-xs"
            style={{ color: selected ? '#00cc88' : '#3a5a7a' }}
          >
            {selected ? '↑' : '↓'}
          </span>
        )}
      </div>

      {/* Expanded draft area */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div
              style={{
                borderTop: '1px solid rgba(0, 204, 136, 0.15)',
                padding: '12px 16px',
              }}
            >
              {/* Why it matters */}
              <div
                className="text-xs mb-3 p-2 rounded-lg"
                style={{
                  background: 'rgba(0, 204, 136, 0.06)',
                  border: '1px solid rgba(0, 204, 136, 0.15)',
                  color: '#6bcca8',
                  lineHeight: 1.5,
                }}
              >
                <span style={{ color: '#00cc88', fontWeight: 600 }}>Why this matters: </span>
                {action.whyItMatters}
              </div>

              {/* Draft text */}
              <div
                className="text-xs font-mono rounded-lg p-3 mb-3"
                style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(42, 58, 92, 0.5)',
                  color: '#8ab0d0',
                  lineHeight: 1.7,
                  maxHeight: '180px',
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap',
                  fontSize: '10px',
                }}
              >
                {displayedText}
                <span
                  className="cursor"
                  style={{
                    display: 'inline-block',
                    width: '2px',
                    height: '12px',
                    background: '#00d4ff',
                    marginLeft: '1px',
                    verticalAlign: 'middle',
                  }}
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: copied
                      ? 'rgba(0, 204, 136, 0.2)'
                      : 'rgba(74, 158, 255, 0.1)',
                    border: `1px solid ${copied ? 'rgba(0, 204, 136, 0.4)' : 'rgba(74, 158, 255, 0.3)'}`,
                    color: copied ? '#00cc88' : '#4a9eff',
                    cursor: 'pointer',
                  }}
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
                <button
                  onClick={onComplete}
                  className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: 'rgba(0, 204, 136, 0.1)',
                    border: '1px solid rgba(0, 204, 136, 0.3)',
                    color: '#00cc88',
                    cursor: 'pointer',
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
