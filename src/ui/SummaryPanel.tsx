import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'

export function SummaryPanel() {
  const scene = useAppStore((s) => s.scene)
  const caseData = useAppStore((s) => s.caseData)

  const visible =
    scene === 'analysis' || scene === 'issue' || scene === 'action' || scene === 'resolution'

  if (!caseData) return null

  const unresolvedIssues = caseData.issues.length

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="summary"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="absolute top-8 left-8"
          style={{ zIndex: 20, maxWidth: '280px' }}
        >
          <div
            className="glass rounded-xl p-5"
            style={{ borderColor: 'rgba(74, 158, 255, 0.2)' }}
          >
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: '#4a9eff', boxShadow: '0 0 8px #4a9eff' }}
              />
              <span
                className="font-mono text-xs tracking-widest"
                style={{ color: '#4a9eff' }}
              >
                CASE OVERVIEW
              </span>
            </div>

            {/* Event type */}
            <div className="mb-4">
              <div className="text-sm font-medium" style={{ color: '#e0eaff' }}>
                {caseData.eventType}
              </div>
              <div className="text-xs mt-0.5" style={{ color: '#6b8ab0' }}>
                {caseData.dateOfService}
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-2.5 mb-4">
              <StatRow
                label="Total billed"
                value={`$${caseData.totalBilled.toLocaleString()}`}
                valueColor="#e0eaff"
              />
              <StatRow
                label="Insurer paid"
                value={`$${caseData.insurerPaid.toLocaleString()}`}
                valueColor="#00cc88"
              />
              <div
                style={{
                  height: '1px',
                  background: 'rgba(74, 158, 255, 0.1)',
                  margin: '4px 0',
                }}
              />
              <StatRow
                label="Patient owes"
                value={`$${caseData.patientOwes.toLocaleString()}`}
                valueColor="#ffaa00"
                bold
              />
            </div>

            {/* Documents */}
            <div className="mb-3">
              <div className="text-xs mb-2" style={{ color: '#6b8ab0' }}>
                {caseData.documents.length} documents linked
              </div>
              <div className="flex flex-wrap gap-1">
                {caseData.documents.map((doc) => (
                  <DocBadge
                    key={doc.id}
                    type={doc.type}
                    label={doc.provider ?? doc.insurer ?? 'Doc'}
                  />
                ))}
              </div>
            </div>

            {/* Issues alert */}
            {unresolvedIssues > 0 && scene !== 'resolution' && (
              <div
                className="mt-3 px-3 py-2 rounded-lg text-xs"
                style={{
                  background: 'rgba(255, 68, 68, 0.08)',
                  border: '1px solid rgba(255, 68, 68, 0.25)',
                  color: '#ff8888',
                }}
              >
                ⚠ {unresolvedIssues} item{unresolvedIssues > 1 ? 's' : ''} may need review
              </div>
            )}

            {/* Resolution state */}
            {scene === 'resolution' && (
              <div
                className="mt-3 px-3 py-2 rounded-lg text-xs"
                style={{
                  background: 'rgba(0, 204, 136, 0.08)',
                  border: '1px solid rgba(0, 204, 136, 0.25)',
                  color: '#00cc88',
                }}
              >
                ✓ Case under control
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function StatRow({
  label,
  value,
  valueColor,
  bold = false,
}: {
  label: string
  value: string
  valueColor: string
  bold?: boolean
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs" style={{ color: '#6b8ab0' }}>
        {label}
      </span>
      <span
        className="text-sm font-mono"
        style={{ color: valueColor, fontWeight: bold ? 700 : 500 }}
      >
        {value}
      </span>
    </div>
  )
}

function DocBadge({ type, label }: { type: string; label: string }) {
  const colors: Record<string, string> = {
    bill: '#4a9eff',
    eob: '#00cc88',
    radiology: '#ffaa00',
    estimate: '#cc66ff',
  }
  const color = colors[type] ?? '#4a9eff'
  const shortLabel = label.split(' ').slice(0, 2).join(' ')

  return (
    <span
      className="px-2 py-0.5 rounded text-xs font-mono"
      style={{
        background: `${color}15`,
        border: `1px solid ${color}40`,
        color,
        fontSize: '9px',
      }}
    >
      {shortLabel}
    </span>
  )
}
