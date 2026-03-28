import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'

const SCENE_LABELS: Record<string, string> = {
  landing:        '',
  intake:         'SECURING DOCUMENTS',
  parsing:        'ANALYZING STRUCTURE',
  reconstruction: 'BUILDING CASE MAP',
  analysis:       'CASE READY FOR REVIEW',
  issue:          'EXAMINING ISSUE',
  action:         'GENERATING ACTION',
  resolution:     'CASE UNDER CONTROL',
}

const ease = [0.4, 0, 0.2, 1] as const

export function TopBar() {
  const scene = useAppStore((s) => s.scene)
  const resetCase = useAppStore((s) => s.resetCase)
  const label = SCENE_LABELS[scene] ?? ''

  return (
    <div
      style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '18px 28px',
        zIndex: 30,
        pointerEvents: 'none',
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', pointerEvents: 'auto' }}>
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '7px',
            background: '#0d1826',
            border: '1px solid #1a2a45',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
          }}
        >
          🛡
        </div>
        <span
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
            fontWeight: 600,
            color: '#8ab0d0',
            letterSpacing: '0.02em',
          }}
        >
          BillShield
        </span>
      </div>

      {/* Scene label */}
      <AnimatePresence mode="wait">
        {label && (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.3, ease }}
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '10px',
              color: '#1a3a5a',
              letterSpacing: '0.15em',
            }}
          >
            {label}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset button */}
      <div style={{ minWidth: '90px', textAlign: 'right', pointerEvents: 'auto' }}>
        {scene !== 'landing' && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={resetCase}
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '10px',
              padding: '6px 12px',
              borderRadius: '7px',
              background: '#08101a',
              border: '1px solid #1a2a45',
              color: '#2a4a6a',
              cursor: 'pointer',
              letterSpacing: '0.05em',
              transition: 'color 0.2s, border-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#6a8ab0'
              e.currentTarget.style.borderColor = '#2a4a7a'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#2a4a6a'
              e.currentTarget.style.borderColor = '#1a2a45'
            }}
          >
            ← New Case
          </motion.button>
        )}
      </div>
    </div>
  )
}
