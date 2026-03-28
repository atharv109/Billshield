import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'
import { UploadZone } from './UploadZone'

const ease = [0.4, 0, 0.2, 1] as const

export function LandingOverlay() {
  const scene = useAppStore((s) => s.scene)
  const loadDemoCase = useAppStore((s) => s.loadDemoCase)
  const analysisError = useAppStore((s) => s.analysisError)
  const resetCase = useAppStore((s) => s.resetCase)

  return (
    <AnimatePresence>
      {scene === 'landing' && (
        <motion.div
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.0 }}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5, ease }}
            style={{
              marginBottom: '28px',
              padding: '5px 14px',
              borderRadius: '20px',
              background: '#08101a',
              border: '1px solid #1a2a45',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '9px',
              color: '#3a7fff',
              letterSpacing: '0.18em',
              pointerEvents: 'none',
            }}
          >
            MEDICAL BILL INTELLIGENCE
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6, ease }}
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 300,
              fontSize: 'clamp(30px, 4vw, 52px)',
              color: '#c8d8f0',
              lineHeight: 1.15,
              letterSpacing: '-0.025em',
              textAlign: 'center',
              maxWidth: '620px',
              margin: 0,
              pointerEvents: 'none',
            }}
          >
            Medical bills shouldn't
            <br />
            <span style={{ color: '#3a7fff', fontWeight: 500 }}>feel like a trap.</span>
          </motion.h1>

          {/* Sub */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.5, ease }}
            style={{
              fontFamily: 'Inter, sans-serif',
              marginTop: '18px',
              color: '#2a4a6a',
              fontSize: '14px',
              maxWidth: '420px',
              textAlign: 'center',
              lineHeight: 1.65,
              pointerEvents: 'none',
            }}
          >
            Upload your bill. We'll explain what it means,
            flag what may be wrong, and help you respond.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.5, ease }}
            style={{
              marginTop: '36px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              pointerEvents: 'auto',
            }}
          >
            <UploadZone />

            <div style={{ width: '1px', height: '28px', background: '#1a2a45' }} />

            <button
              onClick={loadDemoCase}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '11px 22px',
                borderRadius: '9px',
                background: '#08101a',
                border: '1px solid #1a2a45',
                color: '#6a8ab0',
                fontSize: '13px',
                fontWeight: 500,
                fontFamily: 'Inter, sans-serif',
                cursor: 'pointer',
                letterSpacing: '0.01em',
                transition: 'border-color 0.2s, color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#2a4a7a'
                e.currentTarget.style.color = '#3a7fff'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#1a2a45'
                e.currentTarget.style.color = '#6a8ab0'
              }}
            >
              <span style={{ fontSize: '11px' }}>▶</span>
              Try Demo Case
            </button>
          </motion.div>

          {/* Error banner */}
          {analysisError && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginTop: '16px',
                padding: '10px 18px',
                borderRadius: '9px',
                background: 'rgba(255, 51, 68, 0.08)',
                border: '1px solid rgba(255, 51, 68, 0.3)',
                color: '#ff5566',
                fontSize: '12px',
                fontFamily: 'Inter, sans-serif',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                pointerEvents: 'auto',
                maxWidth: '420px',
                textAlign: 'center',
              }}
            >
              <span>⚠ {analysisError}</span>
              <button
                onClick={resetCase}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,51,68,0.4)',
                  color: '#ff5566',
                  borderRadius: '5px',
                  padding: '2px 8px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  whiteSpace: 'nowrap',
                }}
              >
                Dismiss
              </button>
            </motion.div>
          )}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.2, duration: 0.6 }}
            style={{
              position: 'absolute',
              bottom: '32px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '9px',
                color: '#1a2a3a',
                letterSpacing: '0.14em',
              }}
            >
              SCROLL TO EXPLORE
            </div>
            <motion.div
              animate={{ y: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              style={{ color: '#1a2a3a', fontSize: '12px' }}
            >
              ↓
            </motion.div>
          </motion.div>
        </motion.div>
      )}

      {/* Intake / parsing top hint */}
      {(scene === 'intake' || scene === 'parsing') && (
        <motion.div
          key="intake-hint"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            position: 'absolute',
            top: '68px',
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            zIndex: 10,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              padding: '6px 16px',
              borderRadius: '20px',
              background: '#08101a',
              border: '1px solid #1a2a45',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '9px',
              color: '#3a7fff',
              letterSpacing: '0.14em',
            }}
          >
            {scene === 'intake' ? '✦ SECURING YOUR DOCUMENTS' : '⟳ ANALYZING BILL STRUCTURE'}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
