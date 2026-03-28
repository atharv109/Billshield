const SEVERITY_DOT: Record<string, string> = {
  high:   '#ff3344',
  medium: '#3a7fff',
  low:    '#2a4a7a',
}

const ISSUES = [
  { id: 1, severity: 'high',   description: 'Duplicate charge for blood panel test',       confidence: 94, document: 'Hospital Bill',    action: 'Dispute' },
  { id: 2, severity: 'high',   description: 'Upcoding: Level 4 ER visit vs. Level 2',      confidence: 88, document: 'Hospital Bill',    action: 'Appeal' },
  { id: 3, severity: 'medium', description: 'Charge not covered by authorization',          confidence: 76, document: 'EOB',              action: 'Request EOB' },
  { id: 4, severity: 'medium', description: 'Balance billing for in-network provider',      confidence: 71, document: 'Radiology Bill',   action: 'Dispute' },
  { id: 5, severity: 'low',    description: 'Itemized bill not provided upon request',      confidence: 60, document: 'Hospital Bill',    action: 'Request' },
]

export function IssueTable() {
  return (
    <div
      style={{
        background: '#08101a',
        border: '1px solid #1a2a45',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #1a2a45', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500, color: '#c8d8f0' }}>
            Flagged Issues
          </div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#2a4a6a', marginTop: '2px' }}>
            {ISSUES.length} issues across all cases
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['high', 'medium', 'low'] as const).map((sev) => (
            <div key={sev} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: SEVERITY_DOT[sev] }} />
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#2a4a6a', textTransform: 'capitalize' }}>{sev}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Table head */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '24px 1fr 90px 120px 80px',
          gap: '0 16px',
          padding: '10px 20px',
          borderBottom: '1px solid #1a2a45',
        }}
      >
        {['', 'Issue', 'Confidence', 'Document', 'Action'].map((h) => (
          <div key={h} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: '#1a3a5a', letterSpacing: '0.12em' }}>
            {h.toUpperCase()}
          </div>
        ))}
      </div>

      {/* Rows */}
      {ISSUES.map((issue, i) => (
        <div
          key={issue.id}
          style={{
            display: 'grid',
            gridTemplateColumns: '24px 1fr 90px 120px 80px',
            gap: '0 16px',
            padding: '14px 20px',
            borderBottom: i < ISSUES.length - 1 ? '1px solid #0d1826' : 'none',
            alignItems: 'center',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = '#0a141f' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
        >
          {/* Severity dot */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: SEVERITY_DOT[issue.severity], flexShrink: 0 }} />
          </div>

          {/* Description */}
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#c8d8f0', lineHeight: 1.4 }}>
            {issue.description}
          </div>

          {/* Confidence bar */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ flex: 1, height: '3px', background: '#0d1826', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: `${issue.confidence}%`, height: '100%', background: '#3a7fff', borderRadius: '2px' }} />
              </div>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#4a6280', flexShrink: 0 }}>
                {issue.confidence}%
              </span>
            </div>
          </div>

          {/* Document */}
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#4a6280' }}>
            {issue.document}
          </div>

          {/* Action */}
          <div>
            <button
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '11px',
                color: '#3a7fff',
                background: 'rgba(58,127,255,0.06)',
                border: '1px solid #1a3a6a',
                borderRadius: '6px',
                padding: '4px 10px',
                cursor: 'pointer',
                transition: 'background 0.2s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(58,127,255,0.12)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(58,127,255,0.06)' }}
            >
              {issue.action}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
