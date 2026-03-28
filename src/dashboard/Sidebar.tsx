import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { label: 'Overview', icon: '◈', path: '/dashboard' },
  { label: 'Cases', icon: '◇', path: '/dashboard/cases' },
  { label: 'Issues', icon: '◎', path: '/dashboard/issues' },
  { label: 'Actions', icon: '◆', path: '/dashboard/actions' },
]

export function Sidebar() {
  return (
    <aside
      style={{
        width: '240px',
        flexShrink: 0,
        height: '100vh',
        background: '#08101a',
        borderRight: '1px solid #1a2a45',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        overflowY: 'auto',
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '24px 20px 20px',
          borderBottom: '1px solid #1a2a45',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <div
          style={{
            width: '28px', height: '28px',
            borderRadius: '7px',
            background: '#0d1826',
            border: '1px solid #1a2a45',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px',
          }}
        >
          🛡
        </div>
        <span
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            fontWeight: 600,
            color: '#8ab0d0',
            letterSpacing: '0.02em',
          }}
        >
          BillShield
        </span>
      </div>

      {/* Nav section */}
      <nav style={{ padding: '16px 12px', flex: 1 }}>
        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '8px',
            color: '#1a3a5a',
            letterSpacing: '0.16em',
            padding: '0 8px',
            marginBottom: '8px',
          }}
        >
          NAVIGATION
        </div>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            end={item.path === '/dashboard'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '9px 12px',
              borderRadius: '8px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
              fontWeight: isActive ? 500 : 400,
              color: isActive ? '#c8d8f0' : '#4a6280',
              textDecoration: 'none',
              background: isActive ? '#0d1826' : 'transparent',
              borderLeft: isActive ? '2px solid #3a7fff' : '2px solid transparent',
              marginBottom: '2px',
              transition: 'color 0.15s, background 0.15s',
            })}
            onMouseEnter={(e) => {
              const el = e.currentTarget
              if (!el.getAttribute('aria-current')) {
                el.style.color = '#8ab0d0'
                el.style.background = '#0a141f'
              }
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget
              if (!el.getAttribute('aria-current')) {
                el.style.color = '#4a6280'
                el.style.background = 'transparent'
              }
            }}
          >
            <span style={{ fontSize: '12px', opacity: 0.7 }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        {/* Divider */}
        <div style={{ height: '1px', background: '#1a2a45', margin: '16px 8px' }} />

        <NavLink
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '9px 12px',
            borderRadius: '8px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
            color: '#4a6280',
            textDecoration: 'none',
            borderLeft: '2px solid transparent',
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#8ab0d0' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#4a6280' }}
        >
          <span style={{ fontSize: '12px', opacity: 0.7 }}>←</span>
          Landing Page
        </NavLink>
      </nav>

      {/* User */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid #1a2a45' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '30px', height: '30px',
              borderRadius: '50%',
              background: '#0d1826',
              border: '1px solid #1a2a45',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Inter, sans-serif',
              fontSize: '11px',
              color: '#3a7fff',
              fontWeight: 600,
            }}
          >
            AM
          </div>
          <div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#c8d8f0', fontWeight: 500 }}>
              Atharv M.
            </div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#2a4a6a' }}>
              Free Plan
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
