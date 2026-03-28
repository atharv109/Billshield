import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'

export function TimelineBar() {
  const scene = useAppStore((s) => s.scene)
  const caseData = useAppStore((s) => s.caseData)
  const completedActions = useAppStore((s) => s.completedActions)

  const visible =
    scene === 'analysis' || scene === 'issue' || scene === 'action' || scene === 'resolution'

  if (!caseData) return null

  // Derive dynamic completion based on completed actions
  const events = caseData.timeline.map((event) => {
    if (event.completed) return { ...event, completed: true }
    // Mark 'Provider contacted' when first action done, 'Insurer contacted' when second
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="absolute bottom-8 left-1/2"
          style={{
            zIndex: 20,
            transform: 'translateX(-50%)',
            maxWidth: '720px',
            width: 'calc(100vw - 680px)',
            minWidth: '300px',
          }}
        >
          <div
            className="glass rounded-xl px-5 py-3"
            style={{ borderColor: 'rgba(74, 158, 255, 0.15)' }}
          >
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <span className="font-mono text-xs tracking-widest" style={{ color: '#3a6a9a' }}>
                CASE TIMELINE
              </span>
            </div>

            {/* Timeline track */}
            <div className="relative flex items-center justify-between">
              {/* Track line */}
              <div
                className="absolute left-0 right-0 h-px"
                style={{ background: 'rgba(42, 58, 92, 0.6)', top: '10px' }}
              />

              {/* Progress fill */}
              <motion.div
                className="absolute left-0 h-px"
                style={{
                  background: 'linear-gradient(90deg, #00cc88, #4a9eff)',
                  top: '10px',
                  boxShadow: '0 0 8px rgba(0, 204, 136, 0.4)',
                }}
                animate={{
                  width: lastCompleted < 0 ? '0%'
                    : `${(lastCompleted / (events.length - 1)) * 100}%`,
                }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />

              {/* Nodes */}
              {events.map((event, i) => (
                <div key={event.id} className="relative flex flex-col items-center">
                  <motion.div
                    animate={{
                      backgroundColor: event.completed ? '#00cc88' : '#1a2540',
                      boxShadow: event.completed
                        ? '0 0 8px rgba(0, 204, 136, 0.6)'
                        : 'none',
                      borderColor: event.completed ? '#00cc88' : '#2a3a5c',
                    }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: '2px solid #2a3a5c',
                      background: '#1a2540',
                      zIndex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {event.completed && (
                      <span style={{ fontSize: '9px', color: '#001a10', fontWeight: 700 }}>✓</span>
                    )}
                  </motion.div>
                  <div
                    className="mt-1.5 text-center font-mono"
                    style={{
                      fontSize: '8px',
                      color: event.completed ? '#6bcca8' : '#3a5a7a',
                      maxWidth: '60px',
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
