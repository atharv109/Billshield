import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'

const STATUS_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  active:   { color: '#3a7fff', bg: '#0d1f3a', label: 'Active' },
  resolved: { color: '#8ab0d0', bg: '#0d1826', label: 'Resolved' },
  pending:  { color: '#ff3344', bg: '#2a0d14', label: 'Pending' },
}

const CASES = [
  {
    id: 'case-1',
    title: 'City General Hospital ER Visit',
    date: 'Mar 12, 2026',
    status: 'active',
    issues: 3,
    amount: '$12,840',
    docs: 4,
  },
  {
    id: 'case-2',
    title: 'Summit Orthopedics — Knee Surgery',
    date: 'Feb 28, 2026',
    status: 'resolved',
    issues: 1,
    amount: '$28,600',
    docs: 3,
  },
  {
    id: 'case-3',
    title: 'Metro Labs — Annual Bloodwork',
    date: 'Jan 15, 2026',
    status: 'pending',
    issues: 2,
    amount: '$5,880',
    docs: 2,
  },
]

export function CaseCards() {
  const navigate = useNavigate()
  const loadDemoCase = useAppStore((s) => s.loadDemoCase)

  const handleView = () => {
    loadDemoCase()
    navigate('/app')
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', fontWeight: 500, color: '#c8d8f0' }}>
            Active Cases
          </div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#2a4a6a', marginTop: '2px' }}>
            {CASES.length} cases total
          </div>
        </div>
        <button
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '12px',
            color: '#3a7fff',
            background: 'none',
            border: '1px solid #1a2a45',
            borderRadius: '7px',
            padding: '6px 12px',
            cursor: 'pointer',
            transition: 'border-color 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3a7fff' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#1a2a45' }}
        >
          View All
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
        {CASES.map((c) => {
          const st = STATUS_STYLES[c.status]
          return (
            <div
              key={c.id}
              style={{
                background: '#08101a',
                border: '1px solid #1a2a45',
                borderRadius: '12px',
                padding: '20px',
                transition: 'border-color 0.2s',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#2a4a7a' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#1a2a45' }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px', gap: '12px' }}>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 500, color: '#c8d8f0', lineHeight: 1.4 }}>
                  {c.title}
                </div>
                <div
                  style={{
                    flexShrink: 0,
                    padding: '3px 8px',
                    borderRadius: '20px',
                    background: st.bg,
                    border: `1px solid ${st.color}22`,
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '9px',
                    color: st.color,
                    letterSpacing: '0.1em',
                  }}
                >
                  {st.label.toUpperCase()}
                </div>
              </div>

              {/* Meta row */}
              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '18px', color: '#c8d8f0' }}>{c.amount}</div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#2a4a6a', marginTop: '2px' }}>billed</div>
                </div>
                <div style={{ width: '1px', background: '#1a2a45' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '18px', color: c.issues > 0 ? '#ff3344' : '#4a6280' }}>{c.issues}</div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#2a4a6a', marginTop: '2px' }}>issues</div>
                </div>
                <div style={{ width: '1px', background: '#1a2a45' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '18px', color: '#4a6280' }}>{c.docs}</div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#2a4a6a', marginTop: '2px' }}>docs</div>
                </div>
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#2a4a6a' }}>
                  {c.date}
                </div>
                <button
                  onClick={handleView}
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '12px',
                    color: '#3a7fff',
                    background: 'rgba(58,127,255,0.06)',
                    border: '1px solid #1a3a6a',
                    borderRadius: '6px',
                    padding: '5px 12px',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(58,127,255,0.12)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(58,127,255,0.06)' }}
                >
                  View →
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
