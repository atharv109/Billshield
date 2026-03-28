import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'

const ease = [0.4, 0, 0.2, 1] as const

export function TimelineBar() {
  const scene = useAppStore((s) => s.scene)
  const caseData = useAppStore((s) => s.caseData)
  const completedActions = useAppStore((s) => s.completedActions)

  const visible =
    scene === 'analysis' || scene === 'issue' || scene === 'action' || scene === 'resolution'

  if (!caseData) return null

  const events = caseData.timeline.map((event) => {
    if (event.completed) return { ...event, completed: true }
    if (event.id === 'tl-5' && completedActions.length >= 1) return { ...event, completed: true }
    if (event.id === 'tl-6' && completedActions.length >= 2) return { ...event, completed: true }
    if (event.id === 'tl-7' && completedActions.length >= 3) return { ...event, completed: true }
    if (event.id === 'tl-8' && scene === 'resolution') return { ...event, completed: true }
    return event
  })

  const lastCompleted = events.filter((e) => e.completed).length - 1

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="timeline"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.5, delay: 0.2, ease }}
          style={{
            position: 'absolute',
            bottom: '28px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 20,
            maxWidth: '680px',
            width: 'calc(100vw - 680px)',
            minWidth: '320px',
          }}
        >
          <div
            style={{
              background: '#08101a',
              border: '1px solid #1a2a45',
              borderRadius: '14px',
              padding: '16px 20px',
            }}
          >
            <div
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '9px',
                color: '#1a3a5a',
                letterSpacing: '0.14em',
                marginBottom: '14px',
              }}
            >
              CASE TIMELINE
            </div>

            {/* Track */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {/* Background track */}
              <div
                style={{
                  position: 'absolute',
                  left: 0, right: 0,
                  height: '1px',
                  background: '#1a2a45',
                  top: '10px',
                }}
              />

              {/* Progress fill */}
              <motion.div
                style={{
                  position: 'absolute',
                  left: 0,
                  height: '1px',
                  background: '#3a7fff',
                  top: '10px',
                  boxShadow: '0 0 6px #3a7fff88',
                }}
                animate={{
                  width: lastCompleted < 0 ? '0%'
                    : `${(lastCompleted / (events.length - 1)) * 100}%`,
                }}
                transition={{ duration: 0.7, ease }}
              />

              {/* Nodes */}
              {events.map((event, i) => (
                <div key={event.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                  <motion.div
                    animate={{
                      backgroundColor: event.completed ? '#3a7fff' : '#0d1826',
                      borderColor: event.completed ? '#3a7fff' : '#1a2a45',
                      boxShadow: event.completed ? '0 0 8px #3a7fff88' : 'none',
                    }}
                    transition={{ duration: 0.4, delay: i * 0.04 }}
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: '2px solid #1a2a45',
                      background: '#0d1826',
                      zIndex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {event.completed && (
                      <span style={{ fontSize: '9px', color: '#fff', fontWeight: 700 }}>✓</span>
                    )}
                  </motion.div>
                  <div
                    style={{
                      marginTop: '6px',
                      fontSize: '8px',
                      fontFamily: 'JetBrains Mono, monospace',
                      color: event.completed ? '#3a7fff' : '#1a3a5a',
                      maxWidth: '62px',
                      textAlign: 'center',
                      lineHeight: 1.3,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {event.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
