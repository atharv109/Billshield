import { useEffect, useRef } from 'react'
import { useInView } from 'framer-motion'

interface StatCard {
  label: string
  value: number
  prefix?: string
  suffix?: string
  sub: string
  delta?: string
  deltaUp?: boolean
}

const STATS: StatCard[] = [
  { label: 'Total Billed', value: 47320, prefix: '$', suffix: '', sub: 'across all cases', delta: '+$8,200 this month', deltaUp: false },
  { label: 'Savings Found', value: 12840, prefix: '$', suffix: '', sub: 'identified via AI', delta: '+$3,400 this month', deltaUp: true },
  { label: 'Active Cases', value: 3, prefix: '', suffix: '', sub: 'in progress', delta: '1 new this week', deltaUp: true },
  { label: 'Issues Flagged', value: 14, prefix: '', suffix: '', sub: 'billing errors detected', delta: '5 high severity', deltaUp: false },
]

function AnimatedNumber({ to, prefix = '', suffix = '', inView }: { to: number; prefix?: string; suffix?: string; inView: boolean }) {
  const ref = useRef<HTMLSpanElement>(null)
  const frameRef = useRef<number>(0)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    if (!inView) return
    const duration = 1600
    const step = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp
      const elapsed = timestamp - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(eased * to)
      if (ref.current) {
        ref.current.textContent = prefix + current.toLocaleString() + suffix
      }
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step)
      }
    }
    frameRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frameRef.current)
  }, [inView, to, prefix, suffix])

  return <span ref={ref}>{prefix}0{suffix}</span>
}

export function StatsGrid() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true })

  return (
    <div
      ref={ref}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '1px',
        background: '#1a2a45',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid #1a2a45',
      }}
    >
      {STATS.map((stat, i) => (
        <div
          key={i}
          style={{
            background: '#08101a',
            padding: '24px 20px',
          }}
        >
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: '#2a4a6a', letterSpacing: '0.14em', marginBottom: '12px' }}>
            {stat.label.toUpperCase()}
          </div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 300, fontSize: '30px', color: '#c8d8f0', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '6px' }}>
            <AnimatedNumber to={stat.value} prefix={stat.prefix} suffix={stat.suffix} inView={inView} />
          </div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#2a4a6a', marginBottom: '10px' }}>
            {stat.sub}
          </div>
          {stat.delta && (
            <div style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '11px',
              color: stat.deltaUp ? '#3a7fff' : '#ff3344',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}>
              <span>{stat.deltaUp ? '↑' : '↓'}</span>
              {stat.delta}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
