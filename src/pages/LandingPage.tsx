import { useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { motion, useInView, useMotionValue, useSpring, animate } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { BillStorm } from '../scene/BillStorm'
import { Environment } from '../scene/Environment'
import { AmbientParticles } from '../scene/AmbientParticles'
import { UploadZone } from '../ui/UploadZone'
import { useAppStore } from '../store/useAppStore'

const ease = [0.4, 0, 0.2, 1] as const

// Animated number counter
function Counter({ to, prefix = '', suffix = '' }: { to: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })
  const motionVal = useMotionValue(0)
  const spring = useSpring(motionVal, { stiffness: 60, damping: 18 })

  useEffect(() => {
    if (isInView) {
      animate(motionVal, to, { duration: 1.8, ease: 'easeOut' })
    }
  }, [isInView, motionVal, to])

  useEffect(() => {
    return spring.on('change', (v) => {
      if (ref.current) {
        ref.current.textContent = prefix + Math.round(v).toLocaleString() + suffix
      }
    })
  }, [spring, prefix, suffix])

  return <span ref={ref}>{prefix}0{suffix}</span>
}

const STEPS = [
  {
    num: '01',
    title: 'Upload your bill',
    body: 'Drop any PDF or image of your hospital bill, EOB, or insurance statement.',
  },
  {
    num: '02',
    title: 'AI parses every line',
    body: 'We cross-reference charges against insurance records, billing codes, and common error patterns.',
  },
  {
    num: '03',
    title: 'Get your action plan',
    body: 'Receive dispute letter templates, appeal scripts, and step-by-step next actions — ready to send.',
  },
]

const FEATURES = [
  { icon: '⚡', title: 'Error Detection', body: 'Finds duplicate charges, upcoding, and unbundling automatically.' },
  { icon: '📋', title: 'Plain English', body: 'Every medical code and term explained in language anyone can understand.' },
  { icon: '🔍', title: 'Document OCR', body: 'Reads PDFs, photos, and scans — no manual data entry required.' },
  { icon: '🔗', title: 'Insurance Cross-check', body: 'Compares your EOB against the itemized bill to catch discrepancies.' },
  { icon: '✉️', title: 'Action Templates', body: 'Dispute letters and appeal scripts pre-filled with your case details.' },
  { icon: '📊', title: 'Case Timeline', body: 'Tracks every document, action, and response in a visual timeline.' },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const loadDemoCase = useAppStore((s) => s.loadDemoCase)
  const simulateUpload = useAppStore((s) => s.simulateUpload)

  const handleDemoClick = () => {
    loadDemoCase()
    navigate('/app')
  }

  // Wrap simulateUpload to navigate after upload
  const handleUpload = (files: File[]) => {
    simulateUpload(files)
    navigate('/app')
  }

  return (
    <div style={{ background: '#050810', minHeight: '100vh', color: '#c8d8f0' }}>
      {/* ── HERO (100vh) ── */}
      <section style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
        {/* Nav bar */}
        <div
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 32px',
            zIndex: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '30px', height: '30px',
                borderRadius: '8px',
                background: '#08101a',
                border: '1px solid #1a2a45',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px',
              }}
            >
              🛡
            </div>
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px', color: '#8ab0d0', letterSpacing: '0.02em' }}>
              BillShield
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px',
                color: '#4a6280',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                letterSpacing: '0.01em',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#c8d8f0' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#4a6280' }}
            >
              Dashboard
            </button>
            <button
              onClick={handleDemoClick}
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px',
                fontWeight: 500,
                color: '#3a7fff',
                background: 'none',
                border: '1px solid #1a2a45',
                borderRadius: '8px',
                padding: '7px 16px',
                cursor: 'pointer',
                transition: 'border-color 0.2s, background 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#3a7fff'
                e.currentTarget.style.background = 'rgba(58,127,255,0.06)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#1a2a45'
                e.currentTarget.style.background = 'none'
              }}
            >
              Try Demo
            </button>
          </div>
        </div>

        {/* 3D Canvas */}
        <Canvas
          camera={{ position: [0, 0, 14], fov: 55, near: 0.1, far: 200 }}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
          dpr={[1, 1.5]}
          style={{ position: 'absolute', inset: 0 }}
        >
          <Suspense fallback={null}>
            <Environment />
            <BillStorm />
            <AmbientParticles />
            <EffectComposer>
              <Bloom intensity={0.35} luminanceThreshold={0.6} luminanceSmoothing={0.8} mipmapBlur />
              <Vignette eskil={false} offset={0.25} darkness={0.75} />
            </EffectComposer>
          </Suspense>
        </Canvas>

        {/* Hero text overlay */}
        <div
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
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5, ease }}
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
            }}
          >
            MEDICAL BILL INTELLIGENCE
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.7, ease }}
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 300,
              fontSize: 'clamp(32px, 4.5vw, 58px)',
              color: '#c8d8f0',
              lineHeight: 1.12,
              letterSpacing: '-0.025em',
              textAlign: 'center',
              maxWidth: '640px',
              margin: 0,
            }}
          >
            Medical bills shouldn't
            <br />
            <span style={{ color: '#3a7fff', fontWeight: 500 }}>feel like a trap.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.6, ease }}
            style={{
              fontFamily: 'Inter, sans-serif',
              marginTop: '20px',
              color: '#2a4a6a',
              fontSize: '15px',
              maxWidth: '440px',
              textAlign: 'center',
              lineHeight: 1.65,
            }}
          >
            Upload your bill. We'll explain what it means,
            flag what may be wrong, and help you respond.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3, duration: 0.5, ease }}
            style={{
              marginTop: '38px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              pointerEvents: 'auto',
            }}
          >
            <UploadZoneWrapper onUpload={handleUpload} />

            <div style={{ width: '1px', height: '28px', background: '#1a2a45' }} />

            <button
              onClick={handleDemoClick}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
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
        </div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.0, duration: 0.8 }}
          style={{
            position: 'absolute',
            bottom: '32px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            zIndex: 10,
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: '#1a2a3a', letterSpacing: '0.14em' }}>
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
      </section>

      {/* ── PROBLEM SECTION ── */}
      <section style={{ background: '#08101a', padding: '100px 24px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease }}
            style={{ textAlign: 'center', marginBottom: '64px' }}
          >
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#3a7fff', letterSpacing: '0.18em', marginBottom: '16px' }}>
              THE PROBLEM
            </div>
            <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 300, fontSize: 'clamp(26px, 3.5vw, 44px)', color: '#c8d8f0', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
              The medical billing system
              <br />
              <span style={{ color: '#3a7fff' }}>is broken by design.</span>
            </h2>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2px' }}>
            {[
              { value: 3700, prefix: '$', suffix: '', label: 'average billing error', sub: 'per hospital stay' },
              { value: 78, prefix: '', suffix: '%', label: 'of patients are overcharged', sub: 'according to billing audits' },
              { value: 1, prefix: '1 in ', suffix: ' bills', label: 'has a significant error', sub: 'that patients could dispute' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1, ease }}
                style={{
                  background: '#050810',
                  border: '1px solid #1a2a45',
                  borderRadius: '14px',
                  padding: '36px 32px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 300, fontSize: 'clamp(36px, 4vw, 52px)', color: '#3a7fff', letterSpacing: '-0.03em', lineHeight: 1 }}>
                  <Counter to={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                </div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#c8d8f0', marginTop: '12px', fontWeight: 500 }}>
                  {stat.label}
                </div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#2a4a6a', marginTop: '4px' }}>
                  {stat.sub}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: '100px 24px', background: '#050810' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease }}
            style={{ textAlign: 'center', marginBottom: '72px' }}
          >
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#3a7fff', letterSpacing: '0.18em', marginBottom: '16px' }}>
              HOW IT WORKS
            </div>
            <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 300, fontSize: 'clamp(24px, 3vw, 40px)', color: '#c8d8f0', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
              From chaos to clarity
              <br />
              <span style={{ color: '#3a7fff' }}>in three steps.</span>
            </h2>
          </motion.div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
            {STEPS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.12, ease }}
                style={{ display: 'flex', gap: '28px', position: 'relative', paddingBottom: i < STEPS.length - 1 ? '0' : '0' }}
              >
                {/* Step number + connector */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{
                    width: '44px', height: '44px',
                    borderRadius: '50%',
                    background: '#08101a',
                    border: '1px solid #1a2a45',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '11px',
                    color: '#3a7fff',
                    letterSpacing: '0.05em',
                    flexShrink: 0,
                    zIndex: 1,
                  }}>
                    {step.num}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div style={{ width: '1px', flexGrow: 1, minHeight: '48px', background: '#1a2a45', margin: '4px 0' }} />
                  )}
                </div>
                {/* Content */}
                <div style={{ paddingTop: '10px', paddingBottom: i < STEPS.length - 1 ? '40px' : '0' }}>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '18px', color: '#c8d8f0', marginBottom: '8px' }}>
                    {step.title}
                  </div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#4a6280', lineHeight: 1.65 }}>
                    {step.body}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section style={{ background: '#08101a', padding: '100px 24px' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease }}
            style={{ textAlign: 'center', marginBottom: '64px' }}
          >
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#3a7fff', letterSpacing: '0.18em', marginBottom: '16px' }}>
              CAPABILITIES
            </div>
            <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 300, fontSize: 'clamp(24px, 3vw, 40px)', color: '#c8d8f0', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
              Everything you need to
              <br />
              <span style={{ color: '#3a7fff' }}>fight back.</span>
            </h2>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1px' }}>
            {FEATURES.map((feat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.07, ease }}
                style={{
                  background: '#050810',
                  border: '1px solid #1a2a45',
                  borderRadius: '12px',
                  padding: '28px 24px',
                  transition: 'border-color 0.2s',
                  cursor: 'default',
                }}
                whileHover={{ borderColor: '#2a4a7a' } as any}
              >
                <div style={{ fontSize: '22px', marginBottom: '14px' }}>{feat.icon}</div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '15px', color: '#c8d8f0', marginBottom: '8px' }}>
                  {feat.title}
                </div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#4a6280', lineHeight: 1.6 }}>
                  {feat.body}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ── */}
      <section style={{ background: '#050810', padding: '120px 24px' }}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease }}
          style={{ textAlign: 'center', maxWidth: '560px', margin: '0 auto' }}
        >
          <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 300, fontSize: 'clamp(28px, 3.5vw, 46px)', color: '#c8d8f0', lineHeight: 1.2, letterSpacing: '-0.025em', marginBottom: '20px' }}>
            Ready to take
            <br />
            <span style={{ color: '#3a7fff', fontWeight: 500 }}>control of your bill?</span>
          </h2>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#2a4a6a', lineHeight: 1.65, marginBottom: '40px' }}>
            No account required. Upload your documents and let BillShield do the work.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <UploadZoneWrapper onUpload={handleUpload} />
            <div style={{ width: '1px', height: '28px', background: '#1a2a45' }} />
            <button
              onClick={handleDemoClick}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '11px 22px',
                borderRadius: '9px',
                background: '#08101a',
                border: '1px solid #1a2a45',
                color: '#6a8ab0',
                fontSize: '13px',
                fontWeight: 500,
                fontFamily: 'Inter, sans-serif',
                cursor: 'pointer',
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
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#08101a', borderTop: '1px solid #1a2a45', padding: '32px 40px' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px' }}>🛡</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', color: '#4a6280' }}>BillShield</span>
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: '#1a2a3a', letterSpacing: '0.12em' }}>
            MEDICAL BILL INTELLIGENCE · NOT LEGAL ADVICE
          </div>
        </div>
      </footer>
    </div>
  )
}

// Wrapper so UploadZone can trigger navigation
function UploadZoneWrapper({ onUpload }: { onUpload: (files: File[]) => void }) {
  const setSimulateUpload = useAppStore((s) => s.simulateUpload)

  // Temporarily replace simulateUpload behaviour by wrapping it
  // We call the real simulateUpload then navigate
  const handleDrop = (files: File[]) => {
    setSimulateUpload(files)
    onUpload(files)
  }

  return <UploadZoneDirect onDrop={handleDrop} />
}

// Inline drop zone (replicates UploadZone but calls custom onDrop)
import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion as m } from 'framer-motion'

function UploadZoneDirect({ onDrop }: { onDrop: (files: File[]) => void }) {
  const [dragOver, setDragOver] = useState(false)

  const handleDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) onDrop(acceptedFiles)
      setDragOver(false)
    },
    [onDrop]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    onDragEnter: () => setDragOver(true),
    onDragLeave: () => setDragOver(false),
    accept: { 'application/pdf': ['.pdf'], 'image/*': ['.jpg', '.jpeg', '.png'] },
    multiple: true,
  })

  const active = isDragActive || dragOver

  return (
    <m.div
      {...(getRootProps() as any)}
      animate={{
        borderColor: active ? '#3a7fff' : '#1a2a45',
        boxShadow: active ? '0 0 24px rgba(58,127,255,0.2)' : '0 0 0px transparent',
      }}
      transition={{ duration: 0.2 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '11px 22px',
        borderRadius: '9px',
        cursor: 'pointer',
        background: active ? 'rgba(58, 127, 255, 0.1)' : '#08101a',
        border: `1px solid ${active ? '#3a7fff' : '#1a2a45'}`,
        color: active ? '#3a7fff' : '#c8d8f0',
        fontSize: '13px',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 500,
        letterSpacing: '0.01em',
        userSelect: 'none',
        outline: 'none',
      }}
    >
      <input {...getInputProps()} />
      <span style={{ fontSize: '14px' }}>↑</span>
      <span>{active ? 'Drop files' : 'Upload Bill'}</span>
    </m.div>
  )
}
