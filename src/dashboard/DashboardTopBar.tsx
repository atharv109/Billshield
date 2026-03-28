import { useState } from 'react'

export function DashboardTopBar({ title }: { title: string }) {
  const [search, setSearch] = useState('')

  return (
    <div
      style={{
        height: '56px',
        background: '#08101a',
        borderBottom: '1px solid #1a2a45',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '15px',
          fontWeight: 500,
          color: '#c8d8f0',
        }}
      >
        {title}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <span
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '12px',
              color: '#2a4a6a',
              pointerEvents: 'none',
            }}
          >
            ⌕
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cases..."
            style={{
              background: '#0d1826',
              border: '1px solid #1a2a45',
              borderRadius: '8px',
              padding: '6px 12px 6px 28px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '12px',
              color: '#c8d8f0',
              width: '200px',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => { e.target.style.borderColor = '#2a4a7a' }}
            onBlur={(e) => { e.target.style.borderColor = '#1a2a45' }}
          />
        </div>

        {/* Notification bell */}
        <button
          style={{
            width: '32px', height: '32px',
            borderRadius: '8px',
            background: '#0d1826',
            border: '1px solid #1a2a45',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '13px',
            color: '#4a6280',
            position: 'relative',
            transition: 'border-color 0.2s, color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#2a4a7a'
            e.currentTarget.style.color = '#c8d8f0'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#1a2a45'
            e.currentTarget.style.color = '#4a6280'
          }}
        >
          🔔
          <span
            style={{
              position: 'absolute',
              top: '6px', right: '6px',
              width: '6px', height: '6px',
              borderRadius: '50%',
              background: '#3a7fff',
            }}
          />
        </button>
      </div>
    </div>
  )
}
