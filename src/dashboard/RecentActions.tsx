const ACTIONS = [
  { id: 1, title: 'Dispute letter sent', case: 'City General ER', time: '2h ago', done: true },
  { id: 2, title: 'Insurance appeal filed', case: 'Radiology Assoc.', time: '1d ago', done: true },
  { id: 3, title: 'EOB cross-reference', case: 'City General ER', time: '2d ago', done: true },
  { id: 4, title: 'Itemized bill requested', case: 'ER Physicians', time: '4d ago', done: false },
]

export function RecentActions() {
  return (
    <div
      style={{
        background: '#08101a',
        border: '1px solid #1a2a45',
        borderRadius: '12px',
        padding: '20px',
        width: '260px',
        flexShrink: 0,
      }}
    >
      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500, color: '#c8d8f0', marginBottom: '4px' }}>
        Recent Actions
      </div>
      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#2a4a6a', marginBottom: '20px' }}>
        Last 7 days
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {ACTIONS.map((action, i) => (
          <div
            key={action.id}
            style={{
              display: 'flex',
              gap: '12px',
              paddingBottom: i < ACTIONS.length - 1 ? '0' : '0',
              position: 'relative',
            }}
          >
            {/* Timeline dot + line */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <div style={{
                width: '20px', height: '20px',
                borderRadius: '50%',
                background: action.done ? '#0d1826' : '#08101a',
                border: `1px solid ${action.done ? '#3a7fff' : '#1a2a45'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '9px',
                color: action.done ? '#3a7fff' : '#2a4a6a',
                flexShrink: 0,
                marginTop: '2px',
              }}>
                {action.done ? '✓' : '○'}
              </div>
              {i < ACTIONS.length - 1 && (
                <div style={{ width: '1px', flexGrow: 1, minHeight: '28px', background: '#1a2a45', margin: '3px 0' }} />
              )}
            </div>

            {/* Content */}
            <div style={{ paddingBottom: i < ACTIONS.length - 1 ? '20px' : '0', paddingTop: '2px' }}>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#c8d8f0', fontWeight: 500, marginBottom: '2px' }}>
                {action.title}
              </div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#2a4a6a' }}>
                {action.case} · {action.time}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
