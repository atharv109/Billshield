import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'

const ease = [0.4, 0, 0.2, 1] as const

export function SummaryPanel() {
  const scene = useAppStore((s) => s.scene)
  const caseData = useAppStore((s) => s.caseData)

  const visible =
    scene === 'analysis' || scene === 'issue' || scene === 'action' || scene === 'resolution'

  if (!caseData) return null

  const plainSummary = caseData.agentOutput?.final_output?.summary?.plain_english_summary
  const whatItMeans = caseData.agentOutput?.final_output?.what_this_may_mean
  const overallScore = caseData.agentOutput?.internal_scores?.scores?.overall_case_score
  const needsReview = caseData.agentOutput?.needs_human_review

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="summary"
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.5, ease }}
          style={{
            position: 'absolute',
            top: '72px',
            left: '28px',
            zIndex: 20,
            width: '268px',
          }}
        >
          <div
            style={{
              background: '#08101a',
              border: '1px solid #1a2a45',
              borderRadius: '14px',
              padding: '20px',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: '#3a7fff',
                  boxShadow: '0 0 8px #3a7fff',
                }}
              />
              <span
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '10px',
                  color: '#3a7fff',
                  letterSpacing: '0.14em',
                }}
              >
                CASE OVERVIEW
              </span>
              {overallScore != null && (
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: '9px',
                    fontFamily: 'JetBrains Mono, monospace',
                    color: overallScore >= 70 ? '#3a7fff' : overallScore >= 50 ? '#ffaa33' : '#ff5566',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    background: 'rgba(58,127,255,0.08)',
                    border: '1px solid rgba(58,127,255,0.2)',
                  }}
                >
                  {overallScore}/100
                </span>
              )}
            </div>

            {/* Event + date */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#c8d8f0' }}>
                {caseData.eventType}
              </div>
              <div style={{ fontSize: '11px', color: '#4a6280', marginTop: '2px' }}>
                {caseData.dateOfService}
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              <StatRow label="Total billed" value={`$${caseData.totalBilled.toLocaleString()}`} color="#c8d8f0" />
              <StatRow label="Insurer paid" value={`$${caseData.insurerPaid.toLocaleString()}`} color="#8ab0e0" />
              <div style={{ height: '1px', background: '#1a2a45' }} />
              <StatRow label="Patient owes" value={`$${caseData.patientOwes.toLocaleString()}`} color="#ffffff" bold />
            </div>

            {/* Plain-English Summary */}
            {plainSummary && (
              <div
                style={{
                  marginBottom: '14px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'rgba(58, 127, 255, 0.04)',
                  border: '1px solid #1a2a45',
                  fontSize: '11px',
                  color: '#6a8ab0',
                  lineHeight: 1.6,
                }}
              >
                {plainSummary.length > 200 ? plainSummary.slice(0, 200) + '…' : plainSummary}
              </div>
            )}

            {/* What this may mean */}
            {whatItMeans && !plainSummary && (
              <div style={{ marginBottom: '14px', fontSize: '10px', color: '#4a6280', lineHeight: 1.55 }}>
                {whatItMeans.length > 160 ? whatItMeans.slice(0, 160) + '…' : whatItMeans}
              </div>
            )}

            {/* Linked docs */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '10px', color: '#4a6280', marginBottom: '8px' }}>
                {caseData.documents.length} documents linked
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {caseData.documents.map((doc) => (
                  <span
                    key={doc.id}
                    style={{
                      fontSize: '9px',
                      fontFamily: 'JetBrains Mono, monospace',
                      padding: '2px 7px',
                      borderRadius: '4px',
                      background: '#0d1826',
                      border: '1px solid #1a2a45',
                      color: '#6a8ab0',
                      letterSpacing: '0.03em',
                    }}
                  >
                    {(doc.provider ?? doc.insurer ?? 'Doc').split(' ').slice(0, 2).join(' ')}
                  </span>
                ))}
              </div>
            </div>

            {/* Human review banner */}
            {needsReview && (
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'rgba(255, 170, 51, 0.06)',
                  border: '1px solid rgba(255, 170, 51, 0.25)',
                  fontSize: '10px',
                  color: '#ffaa33',
                  marginBottom: '8px',
                }}
              >
                ⚠ Manual review recommended — confidence is limited
              </div>
            )}

            {/* Alert */}
            {scene !== 'resolution' && caseData.issues.length > 0 && (
              <div
                style={{
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: 'rgba(255, 51, 68, 0.06)',
                  border: '1px solid rgba(255, 51, 68, 0.2)',
                  fontSize: '11px',
                  color: '#ff5566',
                }}
              >
                ⚠ {caseData.issues.length} item{caseData.issues.length > 1 ? 's' : ''} may need review
              </div>
            )}

            {scene === 'resolution' && (
              <div
                style={{
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: 'rgba(58, 127, 255, 0.06)',
                  border: '1px solid rgba(58, 127, 255, 0.2)',
                  fontSize: '11px',
                  color: '#3a7fff',
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

function StatRow({ label, value, color, bold = false }: {
  label: string; value: string; color: string; bold?: boolean
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '11px', color: '#4a6280' }}>{label}</span>
      <span style={{
        fontSize: '13px',
        fontFamily: 'JetBrains Mono, monospace',
        color,
        fontWeight: bold ? 700 : 500,
      }}>
        {value}
      </span>
    </div>
  )
}
