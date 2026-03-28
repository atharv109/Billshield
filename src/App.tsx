import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { SceneRoot } from './scene/SceneRoot'
import { LandingOverlay } from './ui/LandingOverlay'
import { SummaryPanel } from './ui/SummaryPanel'
import { IssueCards } from './ui/IssueCards'
import { ActionPanel } from './ui/ActionPanel'
import { TimelineBar } from './ui/TimelineBar'
import { TopBar } from './ui/TopBar'
import { useAppStore } from './store/useAppStore'

export default function App() {
  const scene = useAppStore((s) => s.scene)

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
        background: '#0a0d14',
      }}
    >
      {/* Three.js Canvas */}
      <Canvas
        camera={{ position: [0, 0, 14], fov: 55, near: 0.1, far: 200 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        dpr={[1, 1.5]}
        style={{ position: 'absolute', inset: 0 }}
      >
        <Suspense fallback={null}>
          <SceneRoot />
          <EffectComposer>
            <Bloom
              intensity={0.4}
              luminanceThreshold={0.6}
              luminanceSmoothing={0.8}
              mipmapBlur
            />
            <Vignette eskil={false} offset={0.3} darkness={0.7} />
          </EffectComposer>
        </Suspense>
      </Canvas>

      {/* HTML Overlay Layer */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
        }}
      >
        <TopBar />
        <LandingOverlay />
        <SummaryPanel />
        <IssueCards />
        <ActionPanel />
        <TimelineBar />

        {/* Reconstruction narration */}
        {scene === 'reconstruction' && (
          <ReconstructionNarration />
        )}
      </div>
    </div>
  )
}

function ReconstructionNarration() {
  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      <div
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          color: '#4a9eff',
          fontSize: '13px',
          letterSpacing: '0.1em',
          marginBottom: '8px',
        }}
      >
        RECONSTRUCTING CASE STRUCTURE
      </div>
      <div style={{ color: '#3a5a7a', fontSize: '11px', letterSpacing: '0.06em' }}>
        Linking documents · Matching charges · Building timeline
      </div>
    </div>
  )
}
