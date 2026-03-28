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

export function TopBar() {
  const scene = useAppStore((s) => s.scene)
  const resetCase = useAppStore((s) => s.resetCase)
  const label = SCENE_LABELS[scene] ?? ''

  return (
    <div
      className="absolute top-0 left-0 right-0 flex items-center justify-between px-8 py-4"
      style={{ zIndex: 30, pointerEvents: 'none' }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3"
        style={{ pointerEvents: 'auto' }}
      >
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, #1a3a6a, #2a5aaa)',
            border: '1px solid rgba(74, 158, 255, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
          }}
        >
          🛡
        </div>
        <span
          className="font-sans font-semibold text-sm tracking-wide"
          style={{ color: '#c0d0e8', letterSpacing: '0.04em' }}
        >
          BillShield
        </span>
      </div>

      {/* Scene label */}
      <AnimatePresence mode="wait">
        {label && (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.35 }}
            className="font-mono text-xs tracking-widest"
            style={{ color: '#3a6a9a', letterSpacing: '0.15em' }}
          >
            {label}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset button (non-landing scenes) */}
      <div style={{ pointerEvents: 'auto', minWidth: '80px', textAlign: 'right' }}>
        {scene !== 'landing' && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={resetCase}
            className="font-mono text-xs px-3 py-1.5 rounded-lg transition-all"
            style={{
              background: 'rgba(42, 58, 92, 0.4)',
              border: '1px solid rgba(42, 58, 92, 0.6)',
              color: '#4a6a8a',
              cursor: 'pointer',
              letterSpacing: '0.05em',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#8ab0d0'
              e.currentTarget.style.borderColor = 'rgba(74, 158, 255, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#4a6a8a'
              e.currentTarget.style.borderColor = 'rgba(42, 58, 92, 0.6)'
            }}
          >
            ← New Case
          </motion.button>
        )}
      </div>
    </div>
  )
}
