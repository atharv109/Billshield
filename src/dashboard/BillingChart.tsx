import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const DATA = [
  { month: 'Oct', billed: 6200, savings: 800 },
  { month: 'Nov', billed: 8100, savings: 1400 },
  { month: 'Dec', billed: 5800, savings: 1100 },
  { month: 'Jan', billed: 9400, savings: 2200 },
  { month: 'Feb', billed: 7200, savings: 3100 },
  { month: 'Mar', billed: 10620, savings: 4240 },
]

const TICK_STYLE = {
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 10,
  fill: '#2a4a6a',
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#08101a',
      border: '1px solid #1a2a45',
      borderRadius: '8px',
      padding: '10px 14px',
      fontFamily: 'Inter, sans-serif',
      fontSize: '12px',
    }}>
      <div style={{ color: '#4a6280', marginBottom: '6px', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.1em' }}>
        {label}
      </div>
      {payload.map((entry: any) => (
        <div key={entry.name} style={{ color: entry.color, marginBottom: '2px' }}>
          {entry.name === 'billed' ? 'Billed' : 'Savings'}: ${entry.value.toLocaleString()}
        </div>
      ))}
    </div>
  )
}

export function BillingChart() {
  return (
    <div
      style={{
        background: '#08101a',
        border: '1px solid #1a2a45',
        borderRadius: '12px',
        padding: '20px',
        flex: 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500, color: '#c8d8f0' }}>
            Billing Overview
          </div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#2a4a6a', marginTop: '2px' }}>
            Last 6 months
          </div>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#3a7fff' }} />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#4a6280' }}>Billed</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#1a4a8a' }} />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#4a6280' }}>Savings</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={DATA} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="billedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3a7fff" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#3a7fff" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1a4a8a" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#1a4a8a" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a2a45" vertical={false} />
          <XAxis dataKey="month" tick={TICK_STYLE} axisLine={false} tickLine={false} />
          <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#2a4a7a', strokeWidth: 1 }} />
          <Area type="monotone" dataKey="billed" stroke="#3a7fff" strokeWidth={1.5} fill="url(#billedGrad)" dot={false} />
          <Area type="monotone" dataKey="savings" stroke="#1a4a8a" strokeWidth={1.5} fill="url(#savingsGrad)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
