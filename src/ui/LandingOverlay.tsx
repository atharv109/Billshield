import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'
import { UploadZone } from './UploadZone'

export function LandingOverlay() {
  const scene = useAppStore((s) => s.scene)
  const loadDemoCase = useAppStore((s) => s.loadDemoCase)

  return (
    <AnimatePresence>
      {scene === 'landing' && (
        <motion.div
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
          style={{ zIndex: 10 }}
        >
          {/* Top badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mb-8 px-4 py-1.5 rounded-full text-xs tracking-widest font-mono pointer-events-none"
            style={{
              background: 'rgba(74, 158, 255, 0.1)',
              border: '1px solid rgba(74, 158, 255, 0.3)',
              color: '#4a9eff',
              letterSpacing: '0.15em',
            }}
          >
            MEDICAL BILL INTELLIGENCE
          </motion.div>

          {/* Main headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.8 }}
            className="text-center font-sans font-light pointer-events-none"
            style={{
              fontSize: 'clamp(28px, 4vw, 52px)',
              color: '#e0eaff',
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              maxWidth: '680px',
              textShadow: '0 0 60px rgba(74, 158, 255, 0.2)',
            }}
          >
            Medical bills shouldn't
            <br />
            <span style={{ color: '#4a9eff' }}>feel like a trap.</span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.6 }}
            className="mt-5 text-center pointer-events-none"
            style={{
              color: '#6b8ab0',
              fontSize: '15px',
              maxWidth: '460px',
              lineHeight: 1.6,
            }}
          >
            Upload your bill. We'll explain what it means,
            flag what may be wrong, and help you respond.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8, duration: 0.6 }}
            className="mt-10 flex flex-col sm:flex-row items-center gap-3 pointer-events-auto"
          >
            <UploadZone />

            <div
              style={{
                width: '1px',
                height: '32px',
                background: 'rgba(74, 158, 255, 0.2)',
              }}
              className="hidden sm:block"
            />

            <button
              onClick={loadDemoCase}
              className="group relative px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200"
              style={{
                background: 'rgba(74, 158, 255, 0.08)',
                border: '1px solid rgba(74, 158, 255, 0.25)',
                color: '#4a9eff',
                letterSpacing: '0.02em',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(74, 158, 255, 0.15)'
                e.currentTarget.style.borderColor = 'rgba(74, 158, 255, 0.5)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(74, 158, 255, 0.08)'
                e.currentTarget.style.borderColor = 'rgba(74, 158, 255, 0.25)'
              }}
            >
              <span className="flex items-center gap-2">
                <span style={{ fontSize: '16px' }}>▶</span>
                Try Demo Case
              </span>
            </button>
          </motion.div>

          {/* Scroll hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.6, duration: 0.8 }}
            className="absolute bottom-10 flex flex-col items-center gap-2 pointer-events-none"
          >
            <div style={{ color: '#3a5a7a', fontSize: '11px', letterSpacing: '0.12em' }}>
              SCROLL TO EXPLORE
            </div>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
              style={{ color: '#3a5a7a', fontSize: '14px' }}
            >
              ↓
            </motion.div>
          </motion.div>
        </motion.div>
      )}

      {/* Intake transition text */}
      {(scene === 'intake' || scene === 'parsing') && (
        <motion.div
          key="intake-hint"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute top-8 left-0 right-0 flex justify-center pointer-events-none"
          style={{ zIndex: 10 }}
        >
          <div
            className="px-5 py-2 rounded-full font-mono text-xs"
            style={{
              background: 'rgba(10, 13, 20, 0.7)',
              border: '1px solid rgba(74, 158, 255, 0.2)',
              color: '#4a9eff',
              letterSpacing: '0.1em',
            }}
          >
            {scene === 'intake' ? '✦ SECURING YOUR DOCUMENTS' : '⟳ ANALYZING BILL STRUCTURE'}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
